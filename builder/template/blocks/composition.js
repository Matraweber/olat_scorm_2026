(function(){
  'use strict';

  // Module-scope clipboard, shared across composition blocks so Ctrl+C in
  // one and Ctrl+V in another works.
  let _compClipboard = null;

  // Pure helpers (constants, shape factory, snap, polygon, SVG rendering)
  // live in composition-helpers.js. Loading order is enforced via
  // BLOCK_FILES in builder/js/canvas.js.
  const H = window.CompositionHelpers;
  if(!H) throw new Error('composition.js: window.CompositionHelpers not loaded. Ensure composition-helpers.js is loaded first.');
  const {
    NS, newShape,
    makeCompositionSnap, buildSnapIndicator, shapeSnapCandidates,
    shapeSummary,
    polygonGetPoints, polygonPointsAttr, polygonCentroid,
    renderShape, buildSvg
  } = H;

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
      hint.textContent = _nSel >= 2
        ? _nSel + ' Formen ausgewählt. Ziehen verschiebt alle • Pfeiltasten nudgen (⇧ +10 px) • ⌘/Ctrl + D / C / V • ⌫ löscht • Esc hebt auf.'
        : _nSel === 1
          ? 'Form ausgewählt. Ziehen verschiebt sie • Pfeiltasten verschieben pixelweise (⇧ +10 px) • ⌘/Ctrl + Z / ⇧Z rückgängig / wiederherstellen • ⌘/Ctrl + D dupliziert • ⌘/Ctrl + C / V kopiert / fügt ein • ⌫ löscht • Esc hebt die Auswahl auf.'
          : (block._compTool === 'select'
              ? 'Auswahl-Werkzeug aktiv: Mit der Maus einen Rahmen aufziehen, um mehrere Formen zu markieren.'
              : 'Auf eine Form klicken oder einen Rahmen aufziehen für Mehrfachauswahl. Werkzeuge oben links.');
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
    function shapeBBox(shape){
      if(!shape) return null;
      if(shape.type === 'line' || shape.type === 'arrow'){
        const x = Math.min(shape.x1, shape.x2), y = Math.min(shape.y1, shape.y2);
        return { x, y, w: Math.abs(shape.x2 - shape.x1), h: Math.abs(shape.y2 - shape.y1) };
      }
      if(shape.type === 'circle'){
        return { x: shape.cx - shape.r, y: shape.cy - shape.r, w: 2 * shape.r, h: 2 * shape.r };
      }
      if(shape.type === 'ellipse'){
        return { x: shape.cx - shape.rx, y: shape.cy - shape.ry, w: 2 * shape.rx, h: 2 * shape.ry };
      }
      if(shape.type === 'polygon'){
        const pts = polygonGetPoints(shape);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        pts.forEach(p => {
          if(p[0] < minX) minX = p[0]; if(p[1] < minY) minY = p[1];
          if(p[0] > maxX) maxX = p[0]; if(p[1] > maxY) maxY = p[1];
        });
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
      if(shape.type === 'label'){
        const fs = shape.fontSize || 18;
        return {
          x: shape.x - 2, y: shape.y - fs,
          w: Math.max(40, (shape.text || '').length * fs * 0.55) + 4,
          h: fs + 4
        };
      }
      return { x: shape.x || 0, y: shape.y || 0, w: shape.w || 100, h: shape.h || 60 };
    }
    function bboxIntersects(a, b){
      return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
    }

    // Rubber-band (marquee) selection. Replaces selection unless `additive`.
    function startRubberband(svg, start, additive){
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('data-rubberband', '1');
      rect.setAttribute('fill', 'rgba(15, 109, 173, 0.08)');
      rect.setAttribute('stroke', '#0f6dad');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('stroke-dasharray', '5 3');
      rect.style.pointerEvents = 'none';
      svg.appendChild(rect);
      const baseSelection = additive ? selIndices().slice() : [];
      let moved = false;
      function onMove(ev){
        const p = svgPoint(svg, ev.clientX, ev.clientY);
        const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y);
        const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
        if(!moved && (w > 2 || h > 2)) moved = true;
        rect.setAttribute('x', x); rect.setAttribute('y', y);
        rect.setAttribute('width', w); rect.setAttribute('height', h);
        // Preview the selection candidates each move.
        if(moved){
          const marquee = { x, y, w, h };
          const hits = [];
          (block.config.shapes || []).forEach((s, i) => {
            const bb = shapeBBox(s);
            if(bb && bboxIntersects(marquee, bb)) hits.push(i);
          });
          const merged = additive
            ? Array.from(new Set(baseSelection.concat(hits)))
            : hits;
          setSelection(merged);
          // Update overlays without full re-render so the marquee stays on top.
          svg.querySelectorAll('[data-selection-overlay="1"]').forEach(o => o.remove());
          selIndices().forEach(i => drawSelection(svg, i));
        }
      }
      function onUp(){
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        rect.remove();
        if(moved){
          commit();
        } else if(!additive){
          // Tap on empty area: deselect.
          clearSelection();
          render();
        }
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }

    function buildCanvas(){
      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'comp-canvas-wrap';
      canvasWrap.style.position = 'relative';

      // Roll values into labels for the editor preview (do not mutate config.shapes).
      const rolled = block._compRolledVars;
      let renderConfig = block.config;
      if(rolled && Object.keys(rolled).length){
        const sub = txt => String(txt || '').replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, n) => {
          if(n in rolled){
            const v = rolled[n];
            return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
          }
          return m;
        });
        renderConfig = Object.assign({}, block.config, {
          shapes: (block.config.shapes || []).map(s =>
            s.type === 'label' ? Object.assign({}, s, { text: sub(s.text) }) : s
          )
        });
      }
      const svg = buildSvg(renderConfig, { interactive: true, builder: true, idPrefix: 'comp-edit-' + (block.id || 'b') });
      svg.classList.add('comp-canvas');
      svg.style.cursor = block._compTool === 'select' ? 'crosshair' : 'default';

      // Empty-state hint.
      if(!(block.config.shapes || []).length){
        const hint = document.createElement('div');
        hint.className = 'comp-empty-hint';
        hint.innerHTML =
          '<div class="comp-empty-hint-arrow">↑</div>' +
          '<div class="comp-empty-hint-title">Komposition ist leer</div>' +
          '<div class="comp-empty-hint-body">Klicken Sie oben auf <strong>Vorlage…</strong>, um mit einem fertigen Beispiel (Rechteck, Pythagoras, Kreis, Dreieck) zu starten, oder wählen Sie ein Form-Werkzeug.</div>';
        // Position absolute via CSS .comp-empty-hint; deferred until SVG is in DOM.
        canvasWrap.appendChild(hint);
      }

      // Mousedown on empty SVG starts a rubber-band; Shift = additive.
      svg.addEventListener('mousedown', e => {
        if(e.target !== svg) return;
        e.preventDefault();
        // Blur external inputs so keyboard shortcuts reach this editor.
        const ae = document.activeElement;
        if(ae && !host.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)){
          ae.blur();
        }
        startRubberband(svg, svgPoint(svg, e.clientX, e.clientY), e.shiftKey);
      });

      Array.from(svg.querySelectorAll('[data-shape-idx]')).forEach(node => {
        const idx = parseInt(node.getAttribute('data-shape-idx'), 10);
        attachShapeHandlers(node, idx, svg);
        if(isSelected(idx)){
          drawSelection(svg, idx);
        }
      });

      canvasWrap.appendChild(svg);
      return canvasWrap;
    }

    function svgPoint(svg, clientX, clientY){
      // Client coords -> SVG viewBox coords.
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const scale = vb.width / rect.width;
      return {
        x: (clientX - rect.left) * scale,
        y: (clientY - rect.top)  * scale
      };
    }

    // Inline edit: foreignObject + input instead of text; Enter/blur saves, ESC cancels.
    function startInlineLabelEdit(node, idx, svg){
      const shape = block.config.shapes[idx];
      if(!shape || shape.type !== 'label') return;
      const NS = 'http://www.w3.org/2000/svg';
      const fs = shape.fontSize || 18;
      const fo = document.createElementNS(NS, 'foreignObject');
      fo.setAttribute('x', shape.x - 4);
      fo.setAttribute('y', (shape.y || 0) - fs - 2);
      fo.setAttribute('height', fs + 12);
      // Resize the foreign-object so the input grows with the text, capped to
      // the available SVG width so it never spills out of the canvas.
      function resizeForeignObject(value){
        const charW = fs * 0.6;
        const padding = 6;
        const ideal = Math.max(120, (String(value || '').length + padding) * charW);
        const canvasW = Math.max(100, Number(block.config && block.config.canvasWidth) || 600);
        const maxW = Math.max(120, canvasW - (shape.x || 0) - 8);
        fo.setAttribute('width', Math.min(ideal, maxW));
      }
      resizeForeignObject(shape.text || '');
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = shape.text || '';
      inp.placeholder = 'z. B. a oder {a}';
      inp.style.cssText = 'width:100%; height:' + (fs + 8) + 'px; box-sizing:border-box; ' +
        'font:' + (shape.fontWeight || 700) + ' ' + (fs - 1) + 'px Verdana, Arial, sans-serif; ' +
        'padding:0.1rem 0.4rem; border:2px solid var(--primary, #003b5c); border-radius:4px; ' +
        'background:#fff; color:#003b5c; outline:none;';
      fo.appendChild(inp);
      // Hide the SVG text node and insert the foreignObject in its place.
      node.style.display = 'none';
      node.parentNode.insertBefore(fo, node);
      inp.focus();
      inp.select();

      let done = false;
      function save(){
        if(done) return; done = true;
        const v = inp.value;
        if(v !== (shape.text || '')){
          shape.text = v;
          commit();
        } else {
          // No change: restore the SVG without a re-render.
          fo.remove();
          node.style.display = '';
        }
      }
      function cancel(){
        if(done) return; done = true;
        fo.remove();
        node.style.display = '';
      }
      inp.addEventListener('input', () => resizeForeignObject(inp.value));
      inp.addEventListener('blur', save);
      inp.addEventListener('keydown', e => {
        if(e.key === 'Enter'){ e.preventDefault(); save(); }
        else if(e.key === 'Escape'){ e.preventDefault(); cancel(); }
        e.stopPropagation(); // don't bubble into composition's keydown
      });
      inp.addEventListener('mousedown', e => e.stopPropagation());
      inp.addEventListener('click', e => e.stopPropagation());
    }

    function attachShapeHandlers(node, idx, svg){
      // Double-click on a label opens inline edit mode.
      node.addEventListener('dblclick', e => {
        const shape = block.config.shapes[idx];
        if(!shape || shape.type !== 'label') return;
        e.stopPropagation();
        e.preventDefault();
        startInlineLabelEdit(node, idx, svg);
      });
      node.addEventListener('mousedown', e => {

        e.stopPropagation();
        e.preventDefault();

        const shape = block.config.shapes[idx];
        if(!shape) return;

        // Blur external inputs so keyboard shortcuts reach this editor.
        const ae = document.activeElement;
        if(ae && !host.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)){
          ae.blur();
        }

        // Select tool: mousedown on a shape starts a rubber-band.
        if(block._compTool === 'select'){
          startRubberband(svg, svgPoint(svg, e.clientX, e.clientY), e.shiftKey);
          return;
        }

        // Move tool, shift-click: toggle selection (no drag).
        if(e.shiftKey){
          toggleInSelection(idx);
          render();
          return;
        }

        const wasSelected = isSelected(idx);
        if(!wasSelected){
          setSingleSelection(idx);
          svg.querySelectorAll('[data-selection-overlay="1"]').forEach(o => o.remove());
          drawSelection(svg, idx);
        }

        // Drag every selected shape together. Snapshot originals so deltas
        // apply to the original coords (no cumulative drift).
        const draggedIndices = selIndices();
        const snapshots = draggedIndices.map(i => ({
          i, original: JSON.parse(JSON.stringify(block.config.shapes[i]))
        }));
        const start = svgPoint(svg, e.clientX, e.clientY);
        let moved = false;

        // Snap stack: element alignment first (so dragging a label onto
        // another label's edge produces a visible guide line), then grid as
        // a secondary fallback. Works regardless of whether a coordinate
        // system is present. Hold Alt to bypass all snapping.
        const excludeSet = new Set(draggedIndices);
        const snapFn = makeCompositionSnap(
          block.config.shapes, excludeSet,
          block.config.canvasWidth, block.config.canvasHeight);
        let snapIndicator = null;

        function applyDelta(shape, original, dx, dy){
          if(shape.type === 'line' || shape.type === 'arrow'){
            shape.x1 = Math.round(original.x1 + dx); shape.y1 = Math.round(original.y1 + dy);
            shape.x2 = Math.round(original.x2 + dx); shape.y2 = Math.round(original.y2 + dy);
          } else if(shape.type === 'circle' || shape.type === 'ellipse'){
            shape.cx = Math.round(original.cx + dx); shape.cy = Math.round(original.cy + dy);
          } else if(shape.type === 'polygon'){
            shape.cx = Math.round((original.cx || 0) + dx);
            shape.cy = Math.round((original.cy || 0) + dy);
            if(Array.isArray(original.points)){
              shape.points = original.points.map(p => [p[0] + dx, p[1] + dy]);
            }
          } else {
            shape.x = Math.round((original.x || 0) + dx);
            shape.y = Math.round((original.y || 0) + dy);
          }
        }

        // Compute snap correction by checking each anchor point of the
        // primary shape against the combined snap stack. Closest hit wins.
        function computeSnapAdjust(dx, dy){
          if(!snapFn) return null;
          const primary = block.config.shapes[idx];
          if(!primary || primary.type === 'coords') return null;
          const origPrimary = snapshots.find(s => s.i === idx)?.original;
          if(!origPrimary) return null;
          const candidates = shapeSnapCandidates(origPrimary).map(c => ({ x: c.x + dx, y: c.y + dy }));
          let best = null;
          for(const c of candidates){
            const s = snapFn(c.x, c.y);
            if(s && (!best || (s.dx*s.dx + s.dy*s.dy) < (best.dx*best.dx + best.dy*best.dy))){
              best = s;
            }
          }
          return best;
        }

        function showSnapIndicator(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const cw = Number(block.config.canvasWidth)  || 600;
          const ch = Number(block.config.canvasHeight) || 360;
          snapIndicator = buildSnapIndicator(p, cw, ch);
          svg.appendChild(snapIndicator);
        }

        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
          let dx = p.x - start.x, dy = p.y - start.y;
          if(!moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)){ moved = true; }
          if(!moved) return;
          // Snap adjust unless Alt is held (free-drag override).
          let snapHit = null;
          if(!ev.altKey){
            snapHit = computeSnapAdjust(dx, dy);
            if(snapHit){ dx += snapHit.dx; dy += snapHit.dy; }
          }
          showSnapIndicator(snapHit);
          snapshots.forEach(snap => {
            const sh = block.config.shapes[snap.i];
            if(!sh) return;
            applyDelta(sh, snap.original, dx, dy);
            const n = svg.querySelector('[data-shape-idx="' + snap.i + '"]');
            if(n) updateShapeNode(n, sh, snap.i, svg);
            updateSelectionOverlay(svg, snap.i);
          });
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(moved){
            commit();
          } else if(!wasSelected){
            // Tap on an unselected shape: re-render to update toolbar.
            render();
          }
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    function updateShapeNode(node, shape, idx, svg){
      if(shape.type === 'line' || shape.type === 'arrow'){
        node.setAttribute('x1', shape.x1); node.setAttribute('y1', shape.y1);
        node.setAttribute('x2', shape.x2); node.setAttribute('y2', shape.y2);
      } else if(shape.type === 'circle'){
        node.setAttribute('cx', shape.cx); node.setAttribute('cy', shape.cy);
      } else if(shape.type === 'ellipse'){
        node.setAttribute('cx', shape.cx); node.setAttribute('cy', shape.cy);
        node.setAttribute('rx', shape.rx); node.setAttribute('ry', shape.ry);
      } else if(shape.type === 'polygon'){
        node.setAttribute('points', polygonPointsAttr(shape));
      } else if(shape.type === 'rect' || shape.type === 'label' || shape.type === 'image'){
        node.setAttribute('x', shape.x); node.setAttribute('y', shape.y);
        if(shape.type === 'rect' || shape.type === 'image'){
          node.setAttribute('width',  shape.w);
          node.setAttribute('height', shape.h);
        }
      } else if(shape.type === 'coords'){
        // Coords is a group; cheapest update is replacing the whole node.
        replaceShapeNode(svg, idx);
      }
    }

    // Re-render a single shape in place, preserving z-order position.
    function replaceShapeNode(svg, idx){
      const old = svg.querySelector('[data-shape-idx="' + idx + '"]');
      if(!old) return null;
      const defs = svg.querySelector('defs') || (function(){
        const d = document.createElementNS(NS, 'defs'); svg.insertBefore(d, svg.firstChild); return d;
      })();
      const fresh = renderShape(block.config.shapes[idx], defs, idx, 'comp-edit-' + (block.id || 'b'));
      if(!fresh) return null;
      fresh.setAttribute('data-shape-idx', String(idx));
      fresh.style.cursor = 'move';
      old.replaceWith(fresh);
      attachShapeHandlers(fresh, idx, svg);
      return fresh;
    }

    function drawSelection(svg, idx){
      const shape = block.config.shapes[idx];
      if(!shape) return;
      const overlay = document.createElementNS(NS, 'g');
      overlay.setAttribute('data-selection-overlay', '1');
      overlay.setAttribute('data-sel-idx', String(idx));
      svg.appendChild(overlay);
      paintSelection(overlay, shape, svg, idx);
    }
    function updateSelectionOverlay(svg, idx){
      const existing = svg.querySelector('[data-selection-overlay="1"][data-sel-idx="' + idx + '"]');
      if(!existing) return;
      const shape = block.config.shapes[idx];
      existing.innerHTML = '';
      paintSelection(existing, shape, svg, idx);
    }
    function paintSelection(overlay, shape, svg, idx){
      // Dashed outline + endpoint handles. Multi-select skips the handles.
      const color = '#0f6dad';
      const single = selIndices().length === 1;
      if(shape.type === 'line' || shape.type === 'arrow'){
        if(!single) {
          // Faint outline rect for multi-select.
          const x = Math.min(shape.x1, shape.x2), y = Math.min(shape.y1, shape.y2);
          const w = Math.abs(shape.x2 - shape.x1), h = Math.abs(shape.y2 - shape.y1);
          const rect = document.createElementNS(NS, 'rect');
          rect.setAttribute('x', x - 4); rect.setAttribute('y', y - 4);
          rect.setAttribute('width', w + 8); rect.setAttribute('height', h + 8);
          rect.setAttribute('fill', 'none'); rect.setAttribute('stroke', color);
          rect.setAttribute('stroke-width', 1.2); rect.setAttribute('stroke-dasharray', '4 3');
          rect.style.pointerEvents = 'none';
          overlay.appendChild(rect);
          return;
        }
        const dot1 = document.createElementNS(NS, 'circle');
        dot1.setAttribute('cx', shape.x1); dot1.setAttribute('cy', shape.y1);
        dot1.setAttribute('r', 6); dot1.setAttribute('fill', '#fff'); dot1.setAttribute('stroke', color); dot1.setAttribute('stroke-width', 2);
        dot1.style.cursor = 'grab';
        attachEndpointDrag(dot1, idx, svg, 'p1');
        overlay.appendChild(dot1);
        const dot2 = document.createElementNS(NS, 'circle');
        dot2.setAttribute('cx', shape.x2); dot2.setAttribute('cy', shape.y2);
        dot2.setAttribute('r', 6); dot2.setAttribute('fill', '#fff'); dot2.setAttribute('stroke', color); dot2.setAttribute('stroke-width', 2);
        dot2.style.cursor = 'grab';
        attachEndpointDrag(dot2, idx, svg, 'p2');
        overlay.appendChild(dot2);
        return;
      }
      let bx, by, bw, bh;
      if(shape.type === 'circle'){ bx = shape.cx - shape.r; by = shape.cy - shape.r; bw = shape.r * 2; bh = shape.r * 2; }
      else if(shape.type === 'ellipse'){ bx = shape.cx - shape.rx; by = shape.cy - shape.ry; bw = shape.rx * 2; bh = shape.ry * 2; }
      else if(shape.type === 'polygon'){
        // Real bbox from vertices so the outline wraps deformed shapes too.
        const pts = polygonGetPoints(shape);
        let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
        pts.forEach(p => {
          if(p[0] < minX) minX = p[0]; if(p[1] < minY) minY = p[1];
          if(p[0] > maxX) maxX = p[0]; if(p[1] > maxY) maxY = p[1];
        });
        bx = minX; by = minY; bw = maxX - minX; bh = maxY - minY;
      }
      else if(shape.type === 'rect' || shape.type === 'image' || shape.type === 'coords'){
        bx = shape.x; by = shape.y; bw = shape.w; bh = shape.h;
      }
      else if(shape.type === 'label'){
        const fs = shape.fontSize || 18;
        const textW = Math.max(40, (shape.text || '').length * fs * 0.55);
        bx = shape.x - 2; by = shape.y - fs; bw = textW + 4; bh = fs + 4;
      } else return;
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('data-overlay-bbox', '1'); // for in-place drag update
      rect.setAttribute('x', bx - 4); rect.setAttribute('y', by - 4);
      rect.setAttribute('width', bw + 8); rect.setAttribute('height', bh + 8);
      rect.setAttribute('fill', 'none'); rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', 1.5); rect.setAttribute('stroke-dasharray', '4 3');
      rect.style.pointerEvents = 'none';
      overlay.appendChild(rect);
      // Multi-select: no resize/vertex handles.
      if(!single) return;
      if(shape.type === 'circle'){
        const r = document.createElementNS(NS, 'circle');
        r.setAttribute('cx', shape.cx + shape.r); r.setAttribute('cy', shape.cy);
        r.setAttribute('r', 6); r.setAttribute('fill', '#fff'); r.setAttribute('stroke', color); r.setAttribute('stroke-width', 2);
        r.style.cursor = 'ew-resize';
        attachRadiusDrag(r, idx, svg);
        overlay.appendChild(r);
      }
      if(shape.type === 'ellipse'){
        // Bottom-right handle scales rx (horizontal) and ry (vertical) together.
        const h = document.createElementNS(NS, 'circle');
        h.setAttribute('cx', shape.cx + shape.rx); h.setAttribute('cy', shape.cy + shape.ry);
        h.setAttribute('r', 6); h.setAttribute('fill', '#fff'); h.setAttribute('stroke', color); h.setAttribute('stroke-width', 2);
        h.style.cursor = 'nwse-resize';
        attachEllipseRadiusDrag(h, idx, svg);
        overlay.appendChild(h);
      }
      if(shape.type === 'polygon'){
        // One handle per vertex. Ctrl/Cmd + drag = uniform scale around centroid.
        const pts = polygonGetPoints(shape);
        pts.forEach((p, vi) => {
          const h = document.createElementNS(NS, 'circle');
          h.setAttribute('cx', p[0]); h.setAttribute('cy', p[1]);
          h.setAttribute('r', 5); h.setAttribute('fill', '#fff');
          h.setAttribute('stroke', color); h.setAttribute('stroke-width', 2);
          h.style.cursor = 'crosshair';
          h.setAttribute('data-vertex-idx', String(vi));
          attachPolygonVertexDrag(h, idx, svg, vi);
          overlay.appendChild(h);
        });
      }
      if(shape.type === 'rect' || shape.type === 'image' || shape.type === 'coords'){
        const h = document.createElementNS(NS, 'circle');
        h.setAttribute('cx', shape.x + shape.w); h.setAttribute('cy', shape.y + shape.h);
        h.setAttribute('r', 6); h.setAttribute('fill', '#fff'); h.setAttribute('stroke', color); h.setAttribute('stroke-width', 2);
        h.style.cursor = 'nwse-resize';
        attachRectCornerDrag(h, idx, svg);
        overlay.appendChild(h);
      }
    }
    function attachEndpointDrag(dot, idx, svg, which){
      dot.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const shape = block.config.shapes[idx];
        const node = svg.querySelector('[data-shape-idx="' + idx + '"]');
        const excludeSet = new Set([idx]);
        const snapFn = makeCompositionSnap(
          block.config.shapes, excludeSet,
          block.config.canvasWidth, block.config.canvasHeight);
        let snapIndicator = null;
        function showEndpointSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const cw = Number(block.config.canvasWidth)  || 600;
          const ch = Number(block.config.canvasHeight) || 360;
          snapIndicator = buildSnapIndicator(p, cw, ch);
          svg.appendChild(snapIndicator);
        }
        let moved = false;
        function onMove(ev){
          let p = svgPoint(svg, ev.clientX, ev.clientY);
          moved = true;
          let snapped = null;
          if(snapFn && !ev.altKey){
            snapped = snapFn(p.x, p.y);
            if(snapped) p = { x: snapped.x, y: snapped.y };
          }
          showEndpointSnap(snapped);
          if(which === 'p1'){ shape.x1 = Math.round(p.x); shape.y1 = Math.round(p.y); }
          else              { shape.x2 = Math.round(p.x); shape.y2 = Math.round(p.y); }
          updateShapeNode(node, shape, idx);
          updateSelectionOverlay(svg, idx);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(moved) commit();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
    function attachRadiusDrag(handle, idx, svg){
      handle.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const shape = block.config.shapes[idx];
        const node = svg.querySelector('[data-shape-idx="' + idx + '"]');
        const excludeSet = new Set([idx]);
        const snapFn = makeCompositionSnap(
          block.config.shapes, excludeSet,
          block.config.canvasWidth, block.config.canvasHeight);
        let snapIndicator = null;
        function showRadiusSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const cw = Number(block.config.canvasWidth)  || 600;
          const ch = Number(block.config.canvasHeight) || 360;
          snapIndicator = buildSnapIndicator(p, cw, ch);
          svg.appendChild(snapIndicator);
        }
        let moved = false;
        function onMove(ev){
          let p = svgPoint(svg, ev.clientX, ev.clientY);
          let snapped = null;
          if(snapFn && !ev.altKey){
            snapped = snapFn(p.x, p.y);
            if(snapped) p = { x: snapped.x, y: snapped.y };
          }
          showRadiusSnap(snapped);
          const r = Math.max(4, Math.round(Math.abs(p.x - shape.cx)));
          shape.r = r;
          moved = true;
          updateShapeNode(node, shape, idx);
          node.setAttribute('r', r);
          updateSelectionOverlay(svg, idx);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(moved) commit();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
    function attachEllipseRadiusDrag(handle, idx, svg){
      handle.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const shape = block.config.shapes[idx];
        const node = svg.querySelector('[data-shape-idx="' + idx + '"]');
        const startRx = shape.rx || 1, startRy = shape.ry || 1;
        const ratioAspect = startRy / startRx;
        const uniform = e.ctrlKey || e.metaKey;
        let moved = false;
        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
          const rx = Math.max(4, Math.round(Math.abs(p.x - shape.cx)));
          if(uniform){
            shape.rx = rx;
            shape.ry = Math.max(4, Math.round(rx * ratioAspect));
          } else {
            shape.rx = rx;
            shape.ry = Math.max(4, Math.round(Math.abs(p.y - shape.cy)));
          }
          moved = true;
          updateShapeNode(node, shape, idx, svg);
          updateSelectionOverlay(svg, idx);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(moved) commit();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
    // Vertex drag: mutate attributes only, don't rebuild everything (would stutter).
    function updatePolygonOverlayLive(svg, idx){
      const overlay = svg.querySelector('[data-selection-overlay="1"][data-sel-idx="' + idx + '"]');
      if(!overlay) return;
      const shape = block.config.shapes[idx];
      if(!shape) return;
      const pts = polygonGetPoints(shape);

      let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
      pts.forEach(p => {
        if(p[0] < minX) minX = p[0]; if(p[1] < minY) minY = p[1];
        if(p[0] > maxX) maxX = p[0]; if(p[1] > maxY) maxY = p[1];
      });
      const bbox = overlay.querySelector('[data-overlay-bbox="1"]');
      if(bbox){
        bbox.setAttribute('x', minX - 4); bbox.setAttribute('y', minY - 4);
        bbox.setAttribute('width', (maxX - minX) + 8);
        bbox.setAttribute('height', (maxY - minY) + 8);
      }
      // Move each vertex handle. Skip if the handle is gone (vertex count change).
      overlay.querySelectorAll('[data-vertex-idx]').forEach(h => {
        const vi = parseInt(h.getAttribute('data-vertex-idx'), 10);
        const p = pts[vi];
        if(p){ h.setAttribute('cx', p[0]); h.setAttribute('cy', p[1]); }
      });
    }

    // Drag a polygon vertex. Ctrl/Cmd: uniform scale around centroid.
    function attachPolygonVertexDrag(handle, idx, svg, vertexIdx){
      handle.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const shape = block.config.shapes[idx];
        const node = svg.querySelector('[data-shape-idx="' + idx + '"]');
        if(!Array.isArray(shape.points) || shape.points.length === 0){
          shape.points = polygonGetPoints(shape);
        }
        const startPoints = shape.points.map(p => p.slice());
        const startCentroid = polygonCentroid(shape);
        const startPt = startPoints[vertexIdx];
        const startDist = Math.hypot(startPt[0] - startCentroid.x, startPt[1] - startCentroid.y) || 1;
        const uniform = e.ctrlKey || e.metaKey;
        let moved = false;
        // Snap to other shapes / grid. Uniform-scale (Ctrl/Cmd) skips snap
        // because scale ratios shouldn't be quantized to pixel grids.
        const excludeSet = new Set([idx]);
        const snapFn = uniform
          ? null
          : makeCompositionSnap(
              block.config.shapes, excludeSet,
              block.config.canvasWidth, block.config.canvasHeight);
        let snapIndicator = null;
        function showVertexSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const cw = Number(block.config.canvasWidth)  || 600;
          const ch = Number(block.config.canvasHeight) || 360;
          snapIndicator = buildSnapIndicator(p, cw, ch);
          svg.appendChild(snapIndicator);
        }
        // rAF-coalesced updates: at most one change per repaint.
        let pendingPoint = null, rafScheduled = false, pendingAlt = false;
        function applyUpdate(){
          rafScheduled = false;
          if(!pendingPoint) return;
          let p = pendingPoint; pendingPoint = null;
          let snapped = null;
          if(snapFn && !pendingAlt){
            snapped = snapFn(p.x, p.y);
            if(snapped) p = { x: snapped.x, y: snapped.y };
          }
          showVertexSnap(snapped);
          if(uniform){
            const dist = Math.hypot(p.x - startCentroid.x, p.y - startCentroid.y);
            const ratio = Math.max(0.1, dist / startDist);
            // Mutate shape.points in place to avoid per-frame allocation.
            const out = shape.points;
            for(let i = 0; i < startPoints.length; i++){
              out[i] = [
                startCentroid.x + (startPoints[i][0] - startCentroid.x) * ratio,
                startCentroid.y + (startPoints[i][1] - startCentroid.y) * ratio
              ];
            }
            shape.r = Math.max(2, (Number(shape.r) || startDist) * ratio);
          } else {
            shape.points[vertexIdx] = [Math.round(p.x), Math.round(p.y)];
          }
          node.setAttribute('points', polygonPointsAttr(shape));
          updatePolygonOverlayLive(svg, idx);
        }
        function onMove(ev){
          moved = true;
          pendingPoint = svgPoint(svg, ev.clientX, ev.clientY);
          pendingAlt = ev.altKey;
          if(!rafScheduled){
            rafScheduled = true;
            requestAnimationFrame(applyUpdate);
          }
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(rafScheduled){ applyUpdate(); } // flush tail
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(moved) commit();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
    function attachRectCornerDrag(handle, idx, svg){
      handle.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const shape = block.config.shapes[idx];
        let node = svg.querySelector('[data-shape-idx="' + idx + '"]');
        const startW = shape.w || 1, startH = shape.h || 1;
        const aspect = startH / startW;
        const uniform = e.ctrlKey || e.metaKey;
        let moved = false;
        // Snap the bottom-right corner to other elements or the grid.
        const excludeSet = new Set([idx]);
        const snapFn = makeCompositionSnap(
          block.config.shapes, excludeSet,
          block.config.canvasWidth, block.config.canvasHeight);
        let snapIndicator = null;
        function showResizeSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const cw = Number(block.config.canvasWidth)  || 600;
          const ch = Number(block.config.canvasHeight) || 360;
          snapIndicator = buildSnapIndicator(p, cw, ch);
          svg.appendChild(snapIndicator);
        }
        function onMove(ev){
          let p = svgPoint(svg, ev.clientX, ev.clientY);
          let snapped = null;
          if(snapFn && !ev.altKey){
            snapped = snapFn(p.x, p.y);
            if(snapped) p = { x: snapped.x, y: snapped.y };
          }
          showResizeSnap(snapped);
          const w = Math.max(4, Math.round(p.x - shape.x));
          if(uniform){
            shape.w = w;
            shape.h = Math.max(4, Math.round(w * aspect));
          } else {
            shape.w = w;
            shape.h = Math.max(4, Math.round(p.y - shape.y));
          }
          moved = true;
          if(shape.type === 'rect' || shape.type === 'image'){
            node.setAttribute('width',  shape.w);
            node.setAttribute('height', shape.h);
          } else if(shape.type === 'coords'){
            // Resizing a coordinate system requires regenerating its grid.
            node = replaceShapeNode(svg, idx) || node;
          }
          updateSelectionOverlay(svg, idx);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(moved) commit();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    // Translate a shape by (dx, dy), handling every position scheme.
    // Used by arrow-key nudges and paste offsets.
    function offsetShape(shape, dx, dy){
      if(!shape) return shape;
      if(shape.type === 'line' || shape.type === 'arrow'){
        shape.x1 = (shape.x1 || 0) + dx; shape.y1 = (shape.y1 || 0) + dy;
        shape.x2 = (shape.x2 || 0) + dx; shape.y2 = (shape.y2 || 0) + dy;
      } else if(shape.type === 'circle' || shape.type === 'ellipse'){
        shape.cx = (shape.cx || 0) + dx; shape.cy = (shape.cy || 0) + dy;
      } else if(shape.type === 'polygon'){
        shape.cx = (shape.cx || 0) + dx; shape.cy = (shape.cy || 0) + dy;
        if(Array.isArray(shape.points)){
          shape.points = shape.points.map(p => [p[0] + dx, p[1] + dy]);
        }
      } else {
        shape.x = (shape.x || 0) + dx; shape.y = (shape.y || 0) + dy;
      }
      return shape;
    }
    // Paste from clipboard at +16/+16 offset and select the pasted shapes.
    // Clipboard holds either a single shape (legacy) or an array.
    function pasteFromClipboard(){
      if(!_compClipboard) return false;
      const items = Array.isArray(_compClipboard) ? _compClipboard : [_compClipboard];
      if(items.length === 0) return false;
      const newIdxs = [];
      items.forEach(it => {
        const clone = offsetShape(JSON.parse(JSON.stringify(it)), 16, 16);
        block.config.shapes.push(clone);
        newIdxs.push(block.config.shapes.length - 1);
      });
      setSelection(newIdxs);
      commit();
      return true;
    }

    // Shortcuts (Capture-Phase): Arrows nudge, Del/Backspace remove,
    // Ctrl+D/C/V/A/Z/Y, V/S Tool-Switch, Esc deselect.
    function onKeyDown(e){
      const ae = document.activeElement;
      if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
      if(!host.contains(ae) && ae !== document.body) return;

      const key = e.key;
      const mod = e.ctrlKey || e.metaKey;

      if(mod && (key === 'v' || key === 'V')){
        if(!_compClipboard) return;
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
        _compClipboard = shapes.map(s => JSON.parse(JSON.stringify(s)));
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
    description: 'Skizze aus Linien, Kreisen, Pfeilen und Beschriftungen. Optional als Aufgabe bewertbar.',
    category: 'Visualisierung',
    icon: '◧',
    // graded:true means the block can award points; behavior depends on
    // config.gradingMode below.
    graded: true,

    newShape, // for the right-pane "+ Form" toolbox

    defaultConfig(){
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
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Komposition' },
        { type:'section', label:'Zeichenfläche', key:'_sec_canvas' },
        { key:'canvasWidth',  label:'Breite (px)', type:'number', step:10, min:100, max:1400 },
        { key:'canvasHeight', label:'Höhe (px)',   type:'number', step:10, min:100, max:1400 },
        { key:'background',   label:'Hintergrund', type:'color' },
        { type:'section', label:'Bewertung', key:'_sec_grading' },
        { key:'gradingMode', label:'Bewertungsart', type:'select', options:[
            { value:'none',        label:'Keine (nur Anzeige)' },
            { value:'acknowledge', label:'„Verstanden"-Button' },
            { value:'fillblanks',  label:'Mit Lösung (Eingabefelder)' }
          ],
          help: 'Bei „Mit Lösung" können Labels Eingabefelder enthalten: schreiben Sie {} in den Text, dort erscheint das Antwortfeld. {a} wird zu einer Variable.'
        },
        { key:'prompt',    label:'Aufgabentext (optional)', type:'textarea', rows:2, showIf: isGraded,
          help:'Wird oberhalb der Komposition angezeigt.' },
        { key:'maxPoints', label:'Maximalpunkte', type:'number', min:1, max:100, step:1, showIf: isGraded },
        { key:'tolerance', label:'Toleranz', type:'number', step:'any', min:0,
          showIf: c => c.gradingMode === 'fillblanks',
          help:'Zulässige Abweichung der Antwort vom berechneten Wert. 0.01 bedeutet ±0,01. Wird auf alle Lösungsfelder angewendet, die keine eigene Toleranz haben.' },
        { key:'penalizeWrong', label:'Falsche Klicks abziehen', type:'boolean',
          showIf: c => c.gradingMode === 'click',
          help:'Klick auf eine NICHT als korrekt markierte Form zieht Punkte ab.' },
        { type:'section', label:'Zufallsvariablen', key:'_sec_vars' },
        { key:'variables', label:'Variablen', type:'list', itemLabel:'Variable',
          help:'In jedem Label kann {name} als Platzhalter genutzt werden. Bei jedem "Neu generieren"-Klick (erscheint sobald mindestens eine Variable definiert ist) werden alle Variablen im angegebenen Bereich neu gezogen. Im Lückentext-Modus können Lücken zusätzlich eine Formel referenzieren, die mit den aktuellen Werten ausgewertet wird.',
          itemSummary: item => (item.name || '?') + ' = [' + (item.min ?? '?') + '..' + (item.max ?? '?') + ']',
          itemSchema: [
            { key:'name',    label:'Name', type:'text', placeholder:'z. B. a' },
            { key:'min',     label:'Min',  type:'number', step:1 },
            { key:'max',     label:'Max',  type:'number', step:1 },
            { key:'integer', label:'Ganzzahlig', type:'boolean', default:true }
          ]},
        // Advanced manual editing; day-to-day work happens on the canvas.
        { type:'section', label:'Formen (erweitert)', key:'_sec_shapes' },
        { key:'shapes', label:'Formen', type:'list', itemLabel:'Form',
          help:'Tipp: Formen lassen sich auch direkt auf der Canvas verschieben und in der Werkzeugleiste oberhalb der Canvas anpassen.',
          itemSummary: shapeSummary,
          itemSchema: [
            { key:'type', label:'Typ', type:'select', options:[
              {value:'line',label:'Linie'},{value:'arrow',label:'Pfeil'},
              {value:'circle',label:'Kreis'},{value:'ellipse',label:'Ellipse'},
              {value:'polygon',label:'Polygon'},{value:'rect',label:'Rechteck'},
              {value:'label',label:'Beschriftung'},{value:'coords',label:'Koordinatensystem'},
              {value:'image',label:'Bild'}
            ]},
            { key:'text', label:'Text', type:'text', fullWidth:true, showIf: s => s.type === 'label' },
            { key:'sides', label:'Ecken', type:'number', min:3, max:20, step:1, showIf: s => s.type === 'polygon' },
            { key:'color', label:'Linienfarbe', type:'color' },
            { key:'fill',  label:'Füllfarbe',   type:'color', showIf: s => s.type === 'circle' || s.type === 'ellipse' || s.type === 'polygon' || s.type === 'rect' },
            // Grading flags (relevant per mode)
            { key:'isCorrect',   label:'Richtige Antwort (Klick-Modus)', type:'boolean' },
            { key:'blank',       label:'Als Lücke (Label-Modus)', type:'boolean', showIf: s => s.type === 'label' },
            { key:'correctText', label:'Lösung (Lücke)', type:'text', showIf: s => s.type === 'label' && s.blank },
            { key:'isTarget',    label:'Zielzone (Hotspot-Modus)', type:'boolean' },
            { key:'isMarker',    label:'Beweglicher Marker (Hotspot-Modus)', type:'boolean' },
            { key:'markerTargetIdx', label:'Index der korrekten Zielzone', type:'number', min:0, step:1, showIf: s => s.isMarker }
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
        regenBtn.textContent = 'Neu generieren';
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
      const wrap = u.tagPreview(host, { icon:'◧', label:'Komposition' });
      const inner = document.createElement('div');
      inner.style.cssText = 'display:flex; justify-content:center; margin-top:0.3rem;';
      const svg = buildSvg(config, { idPrefix: 'prev' });
      svg.style.maxWidth = '100%'; svg.style.maxHeight = '320px';
      inner.appendChild(svg);
      wrap.appendChild(inner);
      const meta = document.createElement('div');
      meta.style.cssText = 'font-size:0.74rem; color:#5d6872; margin-top:0.3rem;';
      const count = (config.shapes || []).length;
      meta.textContent = count + ' Form' + (count === 1 ? '' : 'en') + ' · ' +
        (config.canvasWidth || 600) + '×' + (config.canvasHeight || 360) + ' px';
      wrap.appendChild(meta);
    }
  });
})();
