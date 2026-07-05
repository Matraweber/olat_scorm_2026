(function(){
  'use strict';

  // Cross-IIFE clipboard, shared across composition blocks so Ctrl+C in
  // one and Ctrl+V in another works. Lives on window because the canvas
  // handlers (which call pasteFromClipboard) are in a separate file.

  // Pure helpers (constants, shape factory, snap, polygon, SVG rendering)
  // live in composition-helpers.js. Loading order is enforced via
  // BLOCK_FILES in builder/js/canvas.js.
  const H = window.CompositionHelpers;
  if(!H) throw new Error('composition.js: window.CompositionHelpers not loaded. Ensure composition-helpers.js is loaded first.');
  const { newShape, shapeSummary, buildSvg } = H;

  // In-canvas editor: toolbar on top, SVG below. Click to select, drag to
  // move, line/arrow endpoints draggable individually.
  function builderMount(host, block, api){
    if(!block.config) block.config = {};
    if(!Array.isArray(block.config.shapes)) block.config.shapes = [];
    // _compSelection: number[] (canonical multi-select indices)
    // _compSelected:  number   (primary, -1 if 0 or 2+ selected)
    if(!Array.isArray(block._compSelection)){
      // Migrate legacy single-selection.
      block._compSelection = (typeof block._compSelected === 'number' && block._compSelected >= 0)
        ? [block._compSelected] : [];
    }
    if(block._compSelected == null) block._compSelected = -1;
    if(!block._compTool) block._compTool = 'move'; // 'move' | 'select'

    function selIndices(){ return Array.isArray(block._compSelection) ? block._compSelection : []; }
    function syncPrimary(){
      const a = selIndices();
      block._compSelected = a.length === 1 ? a[0] : -1;
    }
    function isSelected(idx){ return selIndices().indexOf(idx) >= 0; }
    function clearSelection(){ block._compSelection = []; block._compSelected = -1; }
    function setSingleSelection(idx){
      if(idx == null || idx < 0){ clearSelection(); return; }
      block._compSelection = [idx]; block._compSelected = idx;
    }
    function setSelection(arr){
      block._compSelection = Array.isArray(arr) ? arr.slice() : [];
      syncPrimary();
    }
    function toggleInSelection(idx){
      const a = selIndices().slice();
      const i = a.indexOf(idx);
      if(i < 0) a.push(idx); else a.splice(i, 1);
      block._compSelection = a; syncPrimary();
    }
    // Composition-level undo/redo. History lives on the block so it survives
    // editor re-mounts. One snapshot per interaction thanks to the debounce.
    const HISTORY_MAX = 80;
    if(!block._compHistory){
      block._compHistory = {
        stack: [JSON.parse(JSON.stringify(block.config))],
        pointer: 0,
        pending: false
      };
    }
    let _historyTimer = null;
    function snapshotHistory(){
      const h = block._compHistory;
      h.stack = h.stack.slice(0, h.pointer + 1);
      const snap = JSON.parse(JSON.stringify(block.config));
      // Skip identical-to-top so a series of commits at the same end state
      // doesn't pile up no-op entries.
      const top = h.stack[h.pointer];
      if(top && JSON.stringify(top) === JSON.stringify(snap)) return;
      h.stack.push(snap);
      if(h.stack.length > HISTORY_MAX) h.stack.shift();
      h.pointer = h.stack.length - 1;
    }
    function applySnapshot(snap){
      // Mutate block.config in place to keep the reference stable.
      Object.keys(block.config).forEach(k => { delete block.config[k]; });
      Object.assign(block.config, JSON.parse(JSON.stringify(snap)));
    }
    function flushPendingSnapshot(){
      if(_historyTimer){ clearTimeout(_historyTimer); _historyTimer = null; snapshotHistory(); }
    }
    function undoComposition(){
      // Flush before checking pointer, otherwise an immediate undo right
      // after a change would fall through to the global handler.
      flushPendingSnapshot();
      const h = block._compHistory;
      if(h.pointer <= 0) return false;
      h.pointer--;
      applySnapshot(h.stack[h.pointer]);
      clearSelection();
      render();
      api.requestConfigRefresh();
      return true;
    }
    function redoComposition(){
      flushPendingSnapshot();
      const h = block._compHistory;
      if(h.pointer >= h.stack.length - 1) return false;
      h.pointer++;
      applySnapshot(h.stack[h.pointer]);
      clearSelection();
      render();
      api.requestConfigRefresh();
      return true;
    }

    // Right-pane refresh on next frame: coalesce rapid commits into one snapshot.
    let _refreshHandle = null;
    // Commit without re-render (input keeps focus).
    function commitQuiet(){
      if(_refreshHandle){ cancelAnimationFrame(_refreshHandle); }
      _refreshHandle = requestAnimationFrame(() => {
        _refreshHandle = null;
        api.requestConfigRefresh();
      });
      if(_historyTimer) clearTimeout(_historyTimer);
      _historyTimer = setTimeout(() => {
        _historyTimer = null;
        snapshotHistory();
      }, 250);
    }
    function commit(){
      render();
      if(_refreshHandle){ cancelAnimationFrame(_refreshHandle); }
      _refreshHandle = requestAnimationFrame(() => {
        _refreshHandle = null;
        api.requestConfigRefresh();
      });
      // 250 ms idle = one history snapshot, so held arrows / drag-resize
      // collapse into a single undoable step.
      if(_historyTimer) clearTimeout(_historyTimer);
      _historyTimer = setTimeout(() => {
        _historyTimer = null;
        snapshotHistory();
      }, 250);
    }
    function getSelected(){
      // Single-shape only; used by toolbar style controls.
      const a = selIndices();
      if(a.length !== 1) return null;
      const i = a[0];
      return (i >= 0 && i < block.config.shapes.length) ? block.config.shapes[i] : null;
    }
    function getSelectedShapes(){
      return selIndices()
        .filter(i => i >= 0 && i < block.config.shapes.length)
        .map(i => block.config.shapes[i]);
    }

    function render(){
      host.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'comp-editor';
      // Stop the card-level drag from firing inside the editor; the user
      // drags the block by its header.
      wrap.addEventListener('mousedown', e => e.stopPropagation());
      // Toolbar implementation lives in composition-toolbar.js. All shared
      // editor state is passed through ctx so the toolbar file stays
      // closure-free and easy to reason about on its own.
      wrap.appendChild(window.CompositionToolbar.build({
        block, host,
        render, commit, commitQuiet,
        selIndices, isSelected, setSingleSelection, getSelected,
        bringForward, sendBackward, duplicateSelected, deleteSelected
      }));
      wrap.appendChild(buildCanvas());
      const hint = document.createElement('div');
      hint.className = 'comp-hint';
      const _nSel = selIndices().length;
      const _t = api.utils.t;
      hint.textContent = _nSel >= 2
        ? _t('block.composition.canvas.hint.multi', { count: _nSel })
        : _nSel === 1
          ? _t('block.composition.canvas.hint.single')
          : (block._compTool === 'select'
              ? _t('block.composition.canvas.hint.selectTool')
              : _t('block.composition.canvas.hint.idle'));
      wrap.appendChild(hint);
      host.appendChild(wrap);
    }

    // Z-order ops require exactly one selected shape.
    function bringForward(){
      const i = block._compSelected;
      const arr = block.config.shapes;
      if(i < 0 || i >= arr.length - 1) return;
      const tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp;
      setSingleSelection(i + 1);
      commit();
    }
    function sendBackward(){
      const i = block._compSelected;
      const arr = block.config.shapes;
      if(i <= 0) return;
      const tmp = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = tmp;
      setSingleSelection(i - 1);
      commit();
    }
    // Deep-clone selected shapes, offset by 16 px, select the clones.
    function duplicateSelected(){
      const sels = selIndices();
      if(sels.length === 0) return;
      const newIdxs = [];
      sels.forEach(i => {
        const src = block.config.shapes[i];
        if(!src) return;
        const clone = offsetShape(JSON.parse(JSON.stringify(src)), 16, 16);
        block.config.shapes.push(clone);
        newIdxs.push(block.config.shapes.length - 1);
      });
      setSelection(newIdxs);
      commit();
    }
    // Splice in reverse index order so the remaining indices stay valid.
    function deleteSelected(){
      const sels = selIndices().slice().sort((a, b) => b - a);
      if(sels.length === 0) return;
      sels.forEach(i => { block.config.shapes.splice(i, 1); });
      clearSelection();
      commit();
    }

    // Bounding-box helpers for rubber-band selection.
    // Canvas (SVG editor, drag/resize handlers, paste, rubberband) lives
    // in composition-canvas.js. The factory captures the shared editor
    // state once; composition.js keeps the entry points it still calls.
    const _canvasHandlers = window.CompositionCanvas.create({
      block, host,
      render, commit,
      selIndices, isSelected,
      setSelection, setSingleSelection, toggleInSelection, clearSelection
    });
    const { buildCanvas, offsetShape, pasteFromClipboard } = _canvasHandlers;
    // Shortcuts (Capture-Phase): Arrows nudge, Del/Backspace remove,
    // Ctrl+D/C/V/A/Z/Y, V/S Tool-Switch, Esc deselect.
    function onKeyDown(e){
      const ae = document.activeElement;
      if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
      if(!host.contains(ae) && ae !== document.body) return;

      const key = e.key;
      const mod = e.ctrlKey || e.metaKey;

      if(mod && (key === 'v' || key === 'V')){
        if(!window.__compClipboard) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        pasteFromClipboard();
        return;
      }
      if(!mod && (key === 'v' || key === 'V') && block._compTool !== 'move'){
        e.preventDefault(); e.stopImmediatePropagation();
        block._compTool = 'move'; render(); return;
      }
      if(!mod && (key === 's' || key === 'S') && block._compTool !== 'select'){
        e.preventDefault(); e.stopImmediatePropagation();
        block._compTool = 'select'; render(); return;
      }

      // Only stop propagation if there was actually something to undo/redo.
      if(mod && (key === 'z' || key === 'Z')){
        const did = e.shiftKey ? redoComposition() : undoComposition();
        if(did){ e.preventDefault(); e.stopImmediatePropagation(); }
        return;
      }
      if(mod && (key === 'y' || key === 'Y')){
        if(redoComposition()){ e.preventDefault(); e.stopImmediatePropagation(); }
        return;
      }

      // Consume Ctrl+A/Delete even without shapes, otherwise main.js acts on the card.
      const sels = selIndices();
      if(mod && (key === 'a' || key === 'A')){
        e.preventDefault();
        e.stopImmediatePropagation();
        setSelection((block.config.shapes || []).map((_, i) => i));
        render();
        return;
      }
      if(key === 'Delete' || key === 'Backspace'){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(sels.length > 0) deleteSelected();
        return;
      }

      // Remaining shortcuts require at least one selected shape.
      if(sels.length === 0) return;

      if(mod && (key === 'c' || key === 'C')){
        e.preventDefault();
        e.stopImmediatePropagation();
        const shapes = getSelectedShapes();
        // Store as array so paste handles single + multi uniformly.
        window.__compClipboard = shapes.map(s => JSON.parse(JSON.stringify(s)));
        return;
      }
      if(mod && (key === 'd' || key === 'D')){
        e.preventDefault();
        e.stopImmediatePropagation();
        duplicateSelected();
        return;
      }
      const isArrow = key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown';
      if(isArrow){
        e.preventDefault();
        e.stopImmediatePropagation();
        const step = e.shiftKey ? 10 : 1;
        const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
        const dy = key === 'ArrowUp'   ? -step : key === 'ArrowDown'  ? step : 0;
        getSelectedShapes().forEach(s => offsetShape(s, dx, dy));
        commit();
        return;
      }
      if(key === 'Escape'){
        e.preventDefault();
        e.stopImmediatePropagation();
        clearSelection();
        render();
      }
    }
    // Capture phase, and stored on the block (not host) because a task-pane
    // re-render swaps out the host node and would orphan the listener.
    if(block._compKeyHandler){
      document.removeEventListener('keydown', block._compKeyHandler, true);
    }
    document.addEventListener('keydown', onKeyDown, true);
    block._compKeyHandler = onKeyDown;

    render();
  }

  // Runtime mount handlers (mountStatic, mountGraded, compGenVars,
  // compApplyVarsToShapes) live in composition-runtime.js. Loaded BEFORE
  // composition.js via BLOCK_FILES in canvas.js.
  const R = window.CompositionRuntime;
  if(!R) throw new Error('composition.js: window.CompositionRuntime not loaded. Ensure composition-runtime.js is loaded first.');
  const { compGenVars, compApplyVarsToShapes, mountStatic, mountGraded } = R;
  // Block registration
  Blocks.register('composition', {
    label: 'Komposition',
    labelKey: 'block.composition.label',
    description: 'Skizze aus Linien, Kreisen, Pfeilen und Beschriftungen. Optional als Aufgabe bewertbar.',
    descKey: 'block.composition.description',
    category: 'Visualisierung',
    categoryKey: 'block.category.visualization',
    icon: '◧',
    // graded:true means the block can award points; behavior depends on
    // config.gradingMode below.
    graded: true,

    newShape, // for the right-pane "+ Form" toolbox

    defaultConfig(locale = 'de'){
      return {
        blockTitle: '',
        canvasWidth: 600,
        canvasHeight: 360,
        background: '#ffffff',
        // gradingMode: none | acknowledge | click | fillblanks | hotspot.
        // Per-shape flags by mode: isCorrect, blank+correctText, isTarget/isMarker+markerTargetIdx.
        gradingMode: 'none',
        maxPoints: 1,
        tolerance: 0.01,
        prompt: '',
        penalizeWrong: false,
        variables: [],
        shapes: []
      };
    },
    previewConfig(){
      // Welcome demo: rectangle with labels (static preview).
      return {
        blockTitle: '', canvasWidth: 600, canvasHeight: 320, background: '#ffffff',
        gradingMode: 'none', maxPoints: 1, prompt: '', penalizeWrong: false,
        shapes: [
          { type:'rect',  x:150, y:80, w:300, h:160, color:'#003b5c', fill:'#a1d884', strokeWidth: 3, dash:'solid' },
          { type:'label', x:285, y:70,  text:'a = 5', color:'#003b5c', fontSize:22, fontWeight:'700' },
          { type:'label', x:465, y:168, text:'b = 3', color:'#003b5c', fontSize:22, fontWeight:'700' },
          { type:'label', x:230, y:175, text:'A = 15', color:'#003b5c', fontSize:24, fontWeight:'700' }
        ]
      };
    },

    builderSchema(){
      const isGraded = c => c.gradingMode && c.gradingMode !== 'none';
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.composition.field.blockTitle.label', type:'text', placeholder:'Komposition', placeholderKey:'block.composition.field.blockTitle.placeholder' },
        { type:'section', label:'Zeichenfläche', labelKey:'block.composition.field._sec_canvas.label', key:'_sec_canvas' },
        { key:'canvasWidth',  label:'Breite (px)', labelKey:'block.composition.field.canvasWidth.label', type:'number', step:10, min:100, max:1400 },
        { key:'canvasHeight', label:'Höhe (px)',   labelKey:'block.composition.field.canvasHeight.label', type:'number', step:10, min:100, max:1400 },
        { key:'background',   label:'Hintergrund', labelKey:'block.composition.field.background.label', type:'color' },
        { type:'section', label:'Bewertung', labelKey:'block.composition.field._sec_grading.label', key:'_sec_grading' },
        { key:'gradingMode', label:'Bewertungsart', labelKey:'block.composition.field.gradingMode.label', type:'select', options:[
            { value:'none',        label:'Keine (nur Anzeige)',         labelKey:'block.composition.field.gradingMode.option.none' },
            { value:'acknowledge', label:'„Verstanden"-Button',         labelKey:'block.composition.field.gradingMode.option.acknowledge' },
            { value:'fillblanks',  label:'Mit Lösung (Eingabefelder)',  labelKey:'block.composition.field.gradingMode.option.fillblanks' },
            { value:'click',       label:'Klick-Aufgabe (richtige Formen anklicken)', labelKey:'block.composition.field.gradingMode.option.click' },
            { value:'hotspot',     label:'Hotspot-Aufgabe (Bereiche markieren)',      labelKey:'block.composition.field.gradingMode.option.hotspot' }
          ],
          help: 'Bei „Mit Lösung" können Labels Eingabefelder enthalten: schreiben Sie {} in den Text, dort erscheint das Antwortfeld. {a} wird zu einer Variable.',
          helpKey: 'block.composition.field.gradingMode.help'
        },
        { key:'prompt',    label:'Aufgabentext (optional)', labelKey:'block.composition.field.prompt.label', type:'textarea', rows:2, showIf: isGraded,
          help:'Wird oberhalb der Komposition angezeigt.', helpKey:'block.composition.field.prompt.help' },
        { key:'maxPoints', label:'Maximalpunkte', labelKey:'block.composition.field.maxPoints.label', type:'number', min:1, max:100, step:1, showIf: isGraded },
        ...window.BlockUtils.regenSchemaFields(c => c.gradingMode === 'fillblanks'),
        { key:'tolerance', label:'Toleranz', labelKey:'block.composition.field.tolerance.label', type:'number', step:'any', min:0,
          showIf: c => c.gradingMode === 'fillblanks',
          help:'Zulässige Abweichung der Antwort vom berechneten Wert. 0.01 bedeutet ±0,01. Wird auf alle Lösungsfelder angewendet, die keine eigene Toleranz haben.',
          helpKey:'block.composition.field.tolerance.help' },
        { key:'penalizeWrong', label:'Falsche Klicks abziehen', labelKey:'block.composition.field.penalizeWrong.label', type:'boolean',
          showIf: c => c.gradingMode === 'click',
          help:'Klick auf eine NICHT als korrekt markierte Form zieht Punkte ab.',
          helpKey:'block.composition.field.penalizeWrong.help' },
        { type:'section', label:'Zufallsvariablen', labelKey:'block.composition.field._sec_vars.label', key:'_sec_vars' },
        { key:'variables', label:'Variablen', labelKey:'block.composition.field.variables.label', type:'list', itemLabel:'Variable', itemLabelKey:'block.composition.field.variables.itemLabel',
          help:'In jedem Label kann {name} als Platzhalter genutzt werden. Bei jedem "Neu generieren"-Klick (erscheint sobald mindestens eine Variable definiert ist) werden alle Variablen im angegebenen Bereich neu gezogen. Im Lückentext-Modus können Lücken zusätzlich eine Formel referenzieren, die mit den aktuellen Werten ausgewertet wird.',
          helpKey:'block.composition.field.variables.help',
          itemSummary: item => (item.name || '?') + ' = [' + (item.min ?? '?') + '..' + (item.max ?? '?') + ']',
          itemSchema: [
            { key:'name',    label:'Name', labelKey:'block.composition.field.variables.item.name.label', type:'text', placeholder:'z. B. a', placeholderKey:'block.composition.field.variables.item.name.placeholder' },
            { key:'min',     label:'Min',  labelKey:'block.composition.field.variables.item.min.label',  type:'number', step:1 },
            { key:'max',     label:'Max',  labelKey:'block.composition.field.variables.item.max.label',  type:'number', step:1 },
            { key:'integer', label:'Ganzzahlig', labelKey:'block.composition.field.variables.item.integer.label', type:'boolean', default:true }
          ]},
        // Advanced manual editing; day-to-day work happens on the canvas.
        { type:'section', label:'Formen (erweitert)', labelKey:'block.composition.field._sec_shapes.label', key:'_sec_shapes' },
        { key:'shapes', label:'Formen', labelKey:'block.composition.field.shapes.label', type:'list', itemLabel:'Form', itemLabelKey:'block.composition.field.shapes.itemLabel',
          help:'Tipp: Formen lassen sich auch direkt auf der Canvas verschieben und in der Werkzeugleiste oberhalb der Canvas anpassen.',
          helpKey:'block.composition.field.shapes.help',
          itemSummary: shapeSummary,
          itemSchema: [
            { key:'type', label:'Typ', labelKey:'block.composition.field.shapes.item.type.label', type:'select', options:[
              {value:'line',    label:'Linie',              labelKey:'block.composition.shape.line'},
              {value:'arrow',   label:'Pfeil',              labelKey:'block.composition.shape.arrow'},
              {value:'circle',  label:'Kreis',              labelKey:'block.composition.shape.circle'},
              {value:'ellipse', label:'Ellipse',            labelKey:'block.composition.shape.ellipse'},
              {value:'polygon', label:'Polygon',            labelKey:'block.composition.shape.polygon'},
              {value:'rect',    label:'Rechteck',           labelKey:'block.composition.shape.rect'},
              {value:'label',   label:'Beschriftung',       labelKey:'block.composition.shape.label'},
              {value:'coords',  label:'Koordinatensystem',  labelKey:'block.composition.shape.coords'},
              {value:'image',   label:'Bild',               labelKey:'block.composition.shape.image'}
            ]},
            { key:'text', label:'Text', labelKey:'block.composition.field.shapes.item.text.label', type:'text', fullWidth:true, showIf: s => s.type === 'label' },
            { key:'sides', label:'Ecken', labelKey:'block.composition.field.shapes.item.sides.label', type:'number', min:3, max:20, step:1, showIf: s => s.type === 'polygon' },
            { key:'color', label:'Linienfarbe', labelKey:'block.composition.field.shapes.item.color.label', type:'color' },
            { key:'fill',  label:'Füllfarbe',   labelKey:'block.composition.field.shapes.item.fill.label',  type:'color', showIf: s => s.type === 'circle' || s.type === 'ellipse' || s.type === 'polygon' || s.type === 'rect' },
            // Grading flags (relevant per mode)
            { key:'isCorrect',   label:'Richtige Antwort (Klick-Modus)', labelKey:'block.composition.field.shapes.item.isCorrect.label', type:'boolean' },
            { key:'blank',       label:'Als Lücke (Label-Modus)', labelKey:'block.composition.field.shapes.item.blank.label', type:'boolean', showIf: s => s.type === 'label' },
            { key:'correctText', label:'Lösung (Lücke)', labelKey:'block.composition.field.shapes.item.correctText.label', type:'text', showIf: s => s.type === 'label' && s.blank },
            { key:'isTarget',    label:'Zielzone (Hotspot-Modus)', labelKey:'block.composition.field.shapes.item.isTarget.label', type:'boolean' },
            { key:'isMarker',    label:'Beweglicher Marker (Hotspot-Modus)', labelKey:'block.composition.field.shapes.item.isMarker.label', type:'boolean' },
            { key:'markerTargetIdx', label:'Index der korrekten Zielzone', labelKey:'block.composition.field.shapes.item.markerTargetIdx.label', type:'number', min:0, step:1, showIf: s => s.isMarker }
          ]
        }
      ];
    },

    builderMount,

    // Mount dispatcher by gradingMode. With variables: re-mount on "Neu generieren".
    mount(host, config, api){
      const mode = config.gradingMode || 'none';
      const variables = Array.isArray(config.variables) ? config.variables : [];
      // fillblanks manages variables itself (label -> input).
      if(mode === 'fillblanks') return mountGraded(host, config, api, mode);
      if(variables.length === 0){
        if(mode === 'none') return mountStatic(host, config, api);
        return mountGraded(host, config, api, mode);
      }
      // Variables exist + non-fillblanks mode → wrap with regenerate.
      let currentVars = compGenVars(variables);
      function doMount(){
        host.innerHTML = '';
        const substituted = Object.assign({}, config, {
          shapes: compApplyVarsToShapes(config.shapes, currentVars)
        });
        if(mode === 'none') mountStatic(host, substituted, api);
        else mountGraded(host, substituted, api, mode);
        // Append "Neu generieren" to ui.buttons; static mode has no row, so create one.
        let buttonsRow = host.querySelector('.scorm-buttons, .qcard-buttons');
        if(!buttonsRow){
          buttonsRow = document.createElement('div');
          buttonsRow.className = 'scorm-buttons';
          buttonsRow.style.cssText = 'margin-top:0.6rem; display:flex; gap:0.5rem; justify-content:flex-end;';
          (host.querySelector('.section-card, .block-question, section') || host).appendChild(buttonsRow);
        }
        const regenBtn = document.createElement('button');
        regenBtn.type = 'button';
        regenBtn.className = 'btn btn-secondary';
        regenBtn.textContent = api.utils.t('common.regenerate');
        regenBtn.addEventListener('click', () => {
          currentVars = compGenVars(variables);
          doMount();
        });
        buttonsRow.appendChild(regenBtn);
      }
      doMount();
      return {};
    },

    preview(host, config){
      const u = window.BlockUtils;
      const wrap = u.tagPreview(host, { icon:'◧', label: u.t('block.composition.label') });
      const inner = document.createElement('div');
      inner.style.cssText = 'display:flex; justify-content:center; margin-top:0.3rem;';
      const svg = buildSvg(config, { idPrefix: 'prev' });
      svg.style.maxWidth = '100%'; svg.style.maxHeight = '320px';
      inner.appendChild(svg);
      wrap.appendChild(inner);
      const meta = document.createElement('div');
      meta.style.cssText = 'font-size:0.74rem; color:#5d6872; margin-top:0.3rem;';
      const count = (config.shapes || []).length;
      const shapeWord = count === 1
        ? u.t('block.composition.preview.shapeSingular')
        : u.t('block.composition.preview.shapePlural');
      meta.textContent = count + ' ' + shapeWord + ' · ' +
        (config.canvasWidth || 600) + '×' + (config.canvasHeight || 360) + ' px';
      wrap.appendChild(meta);
    }
  });
})();
