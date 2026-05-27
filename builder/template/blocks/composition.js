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
    NS, SHAPE_LABELS, SHAPE_ICONS, ACTION_ICONS,
    NONE_FILL, NONE_STROKE,
    POLYGON_PRESETS, COMPOSITION_TEMPLATES,
    isNoneColor, newShape,
    parseSlotTokens, slotNumbersInLabel, expandSlotRefs, formatSlotValue,
    makeCompositionSnap, buildSnapIndicator, shapeSnapCandidates,
    shapeDisplayName, makePolygonFromPreset,
    pickImageDataUrl, shapeSummary,
    regularPolygonPoints, polygonGetPoints, polygonPointsAttr, polygonCentroid,
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
      wrap.appendChild(buildToolbar());
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

    function buildToolbar(){
      const sel = getSelected();
      const bar = document.createElement('div');
      bar.className = 'comp-toolbar';

      const toolGroup = document.createElement('div');
      toolGroup.className = 'comp-tool-group';
      function mkToolBtn(toolKey, title, iconHtml){
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'comp-tool-btn' + (block._compTool === toolKey ? ' comp-tool-btn-active' : '');
        b.title = title;
        b.innerHTML = iconHtml;
        b.addEventListener('click', e => {
          e.stopPropagation();
          if(block._compTool === toolKey) return;
          block._compTool = toolKey;
          render();
        });
        toolGroup.appendChild(b);
      }
      mkToolBtn('move',  'Verschieben-Werkzeug (V)',
        '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M10 2 L13 5 L11 5 L11 9 L15 9 L15 7 L18 10 L15 13 L15 11 L11 11 L11 15 L13 15 L10 18 L7 15 L9 15 L9 11 L5 11 L5 13 L2 10 L5 7 L5 9 L9 9 L9 5 L7 5 Z"/></svg>');
      mkToolBtn('select','Auswahl-Werkzeug (S): Rahmen aufziehen für Mehrfachauswahl',
        '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="1" stroke-dasharray="3 2"/><path d="M9 9 L13 13 M11 13 L13 13 L13 11" fill="currentColor"/></svg>');
      bar.appendChild(toolGroup);

      // Template picker: mini previews of all built-in compositions.
      const tplGroup = document.createElement('div');
      tplGroup.className = 'comp-tool-group';
      const tplBtn = document.createElement('button');
      tplBtn.type = 'button';
      tplBtn.className = 'comp-tool-btn-text comp-tool-template';
      tplBtn.title = 'Vorlage einfügen (Rechteck, Dreieck, Pythagoras, Kreis)';
      tplBtn.textContent = 'Vorlage…';
      tplBtn.addEventListener('click', e => {
        e.stopPropagation();
        openTemplatePicker(tplBtn);
      });
      tplGroup.appendChild(tplBtn);
      bar.appendChild(tplGroup);

      // Formula popover: per-slot formulas (one row per {N} placeholder) or the
      // legacy single formula for {} / blank:true.
      function openBewertungPopover(anchorEl, sel){
        document.querySelectorAll('.comp-bew-popover').forEach(n => n.remove());
        const pop = document.createElement('div');
        pop.className = 'comp-bew-popover';
        pop.addEventListener('click', ev => ev.stopPropagation());

        const labelText = sel.text || '';
        const numberedSlots = slotNumbersInLabel(labelText);
        const hasLegacy    = labelText.indexOf('{}') >= 0;
        const hasInlineBlank = hasLegacy || numberedSlots.length > 0;

        // Blank-toggle only in legacy cases (no {} or {N} in text).
        if(!hasInlineBlank){
          const luWrap = document.createElement('label');
          luWrap.className = 'comp-bew-row';
          const luCb = document.createElement('input');
          luCb.type = 'checkbox'; luCb.checked = !!sel.blank;
          luCb.addEventListener('change', () => {
            sel.blank = luCb.checked;
            if(!sel.blank) delete sel.correctText;
            render();
            renderBewBody();
          });
          luWrap.appendChild(luCb);
          const luText = document.createElement('span');
          luText.innerHTML = '<strong>Lücke</strong>: Label wird zur Antwort-Eingabe';
          luWrap.appendChild(luText);
          pop.appendChild(luWrap);
        }

        const body = document.createElement('div');
        body.className = 'comp-bew-body';
        pop.appendChild(body);

        function mkFormulaField(currentFormula, currentTolerance, onChange, slotN){
          const fmlWrap = document.createElement('div');
          fmlWrap.className = 'comp-bew-field';
          const fmlLbl = document.createElement('label');
          fmlLbl.textContent = slotN != null ? ('Formel für {' + slotN + '}') : 'Formel (mit Variablen)';
          fmlWrap.appendChild(fmlLbl);
          const fml = document.createElement('input');
          fml.type = 'text';
          fml.placeholder = 'z. B. a*b · sqrt(a*a+b*b) · sqrt({1*})';
          fml.value = currentFormula || '';
          fml.title = 'Formel · Schüler-Antworten als {1*}, {2*} … oder s1, s2 …';
          fml.addEventListener('input', () => { onChange(fml.value); commitQuiet(); });
          fmlWrap.appendChild(fml);

          function insertAtCaret(snippet, caretOffset){
            const start = fml.selectionStart ?? fml.value.length;
            const end   = fml.selectionEnd   ?? fml.value.length;
            const next  = fml.value.slice(0, start) + snippet + fml.value.slice(end);
            fml.value = next;
            onChange(next);
            fml.focus();
            const c = start + (caretOffset != null ? caretOffset : snippet.length);
            fml.setSelectionRange(c, c);
            commitQuiet();
          }
          const helpRow = document.createElement('div');
          helpRow.className = 'comp-bew-helprow';
          [
            { label:'√',   ins:'sqrt()',  caret:5, title:'Wurzel' },
            { label:'π',   ins:'pi',      title:'Kreiszahl π' },
            { label:'x²',  ins:'^2',      title:'Quadrieren' }
          ].forEach(b => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'comp-formula-btn';
            btn.title = b.title;
            btn.textContent = b.label;
            btn.addEventListener('click', ev => { ev.stopPropagation(); insertAtCaret(b.ins, b.caret); });
            helpRow.appendChild(btn);
          });
          const defVars = (block.config.variables || []).filter(v => v && v.name);
          if(defVars.length){
            const sel2 = document.createElement('select');
            sel2.className = 'comp-formula-btn';
            sel2.title = 'Variable in die Formel einfügen';
            sel2.innerHTML = '<option value="">Variable…</option>' +
              defVars.map(v => '<option value="' + v.name + '">' + v.name + '</option>').join('');
            sel2.addEventListener('change', () => {
              const v = sel2.value;
              sel2.value = '';
              if(v) insertAtCaret(v);
            });
            helpRow.appendChild(sel2);
          }
          // Insert other slots' answer variables {N*}.
          const otherSlots = numberedSlots.filter(n => slotN == null || n !== slotN);
          if(otherSlots.length){
            const slotSel = document.createElement('select');
            slotSel.className = 'comp-formula-btn';
            slotSel.title = 'Schüler-Antwort eines anderen Slots in die Formel einfügen';
            slotSel.innerHTML = '<option value="">Antwort {N*}…</option>' +
              otherSlots.map(n => '<option value="{' + n + '*}">{' + n + '*}</option>').join('');
            slotSel.addEventListener('change', () => {
              const v = slotSel.value;
              slotSel.value = '';
              if(v) insertAtCaret(v);
            });
            helpRow.appendChild(slotSel);
          }
          fmlWrap.appendChild(helpRow);
          return fmlWrap;
        }

        function renderBewBody(){
          body.innerHTML = '';
          const isBlank = hasInlineBlank || !!sel.blank;
          if(!isBlank) return;

          if(numberedSlots.length > 0){
            // Multi-slot mode: one formula field per {N}.
            const hint = document.createElement('div');
            hint.style.cssText = 'font-size:0.78rem; color:#5d6872; line-height:1.35; padding:0 0 0.4rem;';
            hint.innerHTML = numberedSlots.length === 1
              ? 'Slot <strong>{' + numberedSlots[0] + '}</strong>: Formel für die erwartete Antwort.'
              : 'Pro Slot eine Formel. Nutze <code>{N*}</code> oder <code>s<i>N</i></code>, um die Antwort aus einem früheren Slot weiterzunutzen.';
            body.appendChild(hint);
            sel.formulas = sel.formulas || {};
            numberedSlots.forEach(n => {
              const entry = sel.formulas[n] || {};
              const fieldWrap = mkFormulaField(
                entry.formula || (n === numberedSlots[0] ? (sel.formula || '') : ''),
                entry.tolerance,
                v => {
                  sel.formulas = sel.formulas || {};
                  sel.formulas[n] = Object.assign({}, sel.formulas[n] || {}, { formula: v });
                  // Mirror the first slot into the legacy sel.formula for back-compat.
                  if(n === numberedSlots[0]) sel.formula = v;
                },
                n
              );
              body.appendChild(fieldWrap);
            });
          } else {
            // Legacy single-formula path.
            const hasFormula = !!(sel.formula && String(sel.formula).trim());
            const solWrap = document.createElement('div');
            solWrap.className = 'comp-bew-field';
            if(hasFormula) solWrap.style.display = 'none';
            const solLbl = document.createElement('label');
            solLbl.textContent = 'Lösung (statisch)';
            solWrap.appendChild(solLbl);
            const sol = document.createElement('input');
            sol.type = 'text';
            sol.placeholder = 'z. B. 42 oder "Wasser"';
            sol.value = sel.correctText || '';
            sol.title = 'Erwartete Antwort ohne Berechnung. Wird ignoriert sobald eine Formel gesetzt ist.';
            sol.addEventListener('input', () => { sel.correctText = sol.value; commitQuiet(); });
            solWrap.appendChild(sol);
            body.appendChild(solWrap);

            const fmlWrap = mkFormulaField(
              sel.formula,
              sel.tolerance,
              v => {
                sel.formula = v;
                solWrap.style.display = v.trim() ? 'none' : '';
              },
              null
            );
            body.appendChild(fmlWrap);
          }
        }
        renderBewBody();

        const r = anchorEl.getBoundingClientRect();
        pop.style.left = Math.max(8, r.left) + 'px';
        pop.style.top  = (r.bottom + 4) + 'px';
        document.body.appendChild(pop);

        const onDoc = ev => {
          if(!pop.contains(ev.target) && ev.target !== anchorEl){
            pop.remove();
            document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        const onKey = ev => {
          if(ev.key === 'Escape'){
            pop.remove();
            document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        setTimeout(() => {
          document.addEventListener('click', onDoc, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      }

      // Smart-placement helpers: bounding box per shape type.
      function shapeBounds(s){
        if(!s) return null;
        if(s.type === 'rect' || s.type === 'image' || s.type === 'coords'){
          return { x:s.x, y:s.y, w:s.w, h:s.h };
        }
        if(s.type === 'circle'){
          return { x:s.cx - s.r, y:s.cy - s.r, w:2*s.r, h:2*s.r };
        }
        if(s.type === 'ellipse'){
          return { x:s.cx - s.rx, y:s.cy - s.ry, w:2*s.rx, h:2*s.ry };
        }
        if(s.type === 'polygon' && Array.isArray(s.points)){
          let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
          s.points.forEach(p => {
            mnx = Math.min(mnx, p[0]); mny = Math.min(mny, p[1]);
            mxx = Math.max(mxx, p[0]); mxy = Math.max(mxy, p[1]);
          });
          return { x: mnx, y: mny, w: mxx - mnx, h: mxy - mny };
        }
        if(s.type === 'line' || s.type === 'arrow'){
          const mnx = Math.min(s.x1, s.x2), mny = Math.min(s.y1, s.y2);
          return { x: mnx, y: mny, w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) };
        }
        if(s.type === 'label'){
          // Approximate label bounding box (text width unknown).
          return { x:s.x, y:s.y - (s.fontSize || 18), w: 80, h: (s.fontSize || 18) + 4 };
        }
        return null;
      }

      // Polygon picker: 7 presets (triangle variants, square, 5/6-gon).
      function openPolygonPicker(anchorEl){
        document.querySelectorAll('.comp-poly-popover').forEach(n => n.remove());
        const pop = document.createElement('div');
        pop.className = 'comp-poly-popover';
        pop.addEventListener('click', e => e.stopPropagation());

        const head = document.createElement('div');
        head.className = 'comp-tpl-popover-head';
        head.innerHTML = '<strong>Polygon einfügen</strong><span style="font-size:0.78rem;color:#5d6872;">Voreinstellung wählen</span>';
        pop.appendChild(head);

        const grid = document.createElement('div');
        grid.className = 'comp-poly-grid';
        POLYGON_PRESETS.forEach(preset => {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'comp-poly-card';
          card.title = preset.label + ': ' + preset.hint;
          card.innerHTML =
            '<div class="comp-poly-card-icon">' + preset.icon + '</div>' +
            '<div class="comp-poly-card-label">' + preset.label + '</div>' +
            '<div class="comp-poly-card-hint">' + preset.hint + '</div>';
          card.addEventListener('click', () => {
            const cw = Math.max(100, Number(block.config.canvasWidth)  || 600);
            const ch = Math.max(100, Number(block.config.canvasHeight) || 360);
            const cx = Math.round(cw / 2), cy = Math.round(ch / 2);
            const shape = makePolygonFromPreset(preset, cx, cy);
            block.config.shapes.push(shape);
            setSingleSelection(block.config.shapes.length - 1);
            pop.remove();
            commit();
          });
          grid.appendChild(card);
        });
        pop.appendChild(grid);

        const r = anchorEl.getBoundingClientRect();
        pop.style.left = Math.max(8, r.left) + 'px';
        pop.style.top  = (r.bottom + 6) + 'px';
        document.body.appendChild(pop);

        const onDoc = e => {
          if(!pop.contains(e.target) && e.target !== anchorEl){
            pop.remove();
            document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        const onKey = e => {
          if(e.key === 'Escape'){
            pop.remove();
            document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        setTimeout(() => {
          document.addEventListener('click', onDoc, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      }

      // Table editor: edit all variables at once.
      function openVariableTable(anchorEl){
        document.querySelectorAll('.comp-var-dialog').forEach(n => n.remove());
        const pop = document.createElement('div');
        pop.className = 'comp-var-dialog comp-var-table';
        pop.addEventListener('click', e => e.stopPropagation());

        const head = document.createElement('div');
        head.className = 'comp-var-dialog-head';
        head.innerHTML = '<strong>Variablen</strong>' +
          '<span style="font-size:0.78rem;color:#5d6872;">Tabelle bearbeiten</span>';
        pop.appendChild(head);

        // Working copy, only persisted on OK.
        const rows = (block.config.variables || []).map(v => Object.assign({}, v));

        const table = document.createElement('table');
        table.className = 'comp-var-tbl';
        pop.appendChild(table);

        function nextFreeName(){
          const used = new Set(rows.map(r => r.name));
          for(const c of 'abcdefghijklmnopqrstuvwxyz'){ if(!used.has(c)) return c; }
          return 'v' + (rows.length + 1);
        }

        function render(){
          table.innerHTML =
            '<thead><tr>' +
              '<th style="width:60px;">Name</th>' +
              '<th>Min</th>' +
              '<th>Max</th>' +
              '<th style="width:60px;">Ganz</th>' +
              '<th style="width:28px;"></th>' +
            '</tr></thead>';
          const tb = document.createElement('tbody');
          rows.forEach((row, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML =
              '<td><input data-k="name" type="text" value="' + (row.name || '') + '"/></td>' +
              '<td><input data-k="min"  type="number" value="' + (row.min ?? '') + '"/></td>' +
              '<td><input data-k="max"  type="number" value="' + (row.max ?? '') + '"/></td>' +
              '<td style="text-align:center;"><input data-k="integer" type="checkbox"' + (row.integer !== false ? ' checked' : '') + '/></td>' +
              '<td><button data-act="del" class="icon-btn danger" title="Variable entfernen">✕</button></td>';
            tr.querySelector('[data-k="name"]').addEventListener('input', e => row.name = e.target.value.trim());
            tr.querySelector('[data-k="min"]').addEventListener('input', e => row.min = Number(e.target.value));
            tr.querySelector('[data-k="max"]').addEventListener('input', e => row.max = Number(e.target.value));
            tr.querySelector('[data-k="integer"]').addEventListener('change', e => row.integer = e.target.checked);
            tr.querySelector('[data-act="del"]').addEventListener('click', () => {
              rows.splice(idx, 1); render();
            });
            tb.appendChild(tr);
          });
          table.appendChild(tb);
        }
        render();

        const addRow = document.createElement('button');
        addRow.type = 'button';
        addRow.className = 'comp-tool-btn-text';
        addRow.textContent = '+ Variable';
        addRow.style.cssText = 'margin-top:0.5rem;width:100%;';
        addRow.addEventListener('click', () => {
          rows.push({ name: nextFreeName(), min: 1, max: 10, integer: true });
          render();
        });
        pop.appendChild(addRow);

        const actions = document.createElement('div');
        actions.className = 'comp-var-dialog-actions';
        actions.innerHTML =
          '<button class="comp-tool-btn-text" data-act="cancel" type="button">Abbrechen</button>' +
          '<button class="comp-tool-btn-text comp-tool-template" data-act="ok" type="button">Speichern</button>';
        pop.appendChild(actions);

        const r = anchorEl.getBoundingClientRect();
        pop.style.left = Math.max(8, r.right - 420) + 'px';
        pop.style.top  = (r.bottom + 4) + 'px';
        document.body.appendChild(pop);

        function close(){
          pop.remove();
          document.removeEventListener('click', onDoc, true);
          document.removeEventListener('keydown', onKey, true);
        }
        function save(){
          // Validate: unique non-empty names, finite min/max with min ≤ max.
          const seen = new Set();
          for(const r of rows){
            if(!r.name){ alert('Jede Variable braucht einen Namen.'); return; }
            if(!/^[a-zA-Z_]\w*$/.test(r.name)){ alert('Ungültiger Name: ' + r.name); return; }
            if(seen.has(r.name)){ alert('Doppelter Name: ' + r.name); return; }
            seen.add(r.name);
            if(!isFinite(r.min) || !isFinite(r.max) || r.min > r.max){
              alert('Bereich ungültig bei ' + r.name + ' (Min ≤ Max).');
              return;
            }
          }
          block.config.variables = rows;
          close();
          commit();
        }
        actions.querySelector('[data-act="cancel"]').addEventListener('click', close);
        actions.querySelector('[data-act="ok"]').addEventListener('click', save);
        const onDoc = e => { if(!pop.contains(e.target) && e.target !== anchorEl) close(); };
        const onKey = e => {
          if(e.key === 'Escape') close();
          else if(e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
        };
        setTimeout(() => {
          document.addEventListener('click', onDoc, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      }

      // Quick shape-picker dropdown: lists every shape with its type and a
// short label so the author can re-select a previously-added shape without
// having to find it on the canvas.
      function openShapePicker(anchorEl){
        document.querySelectorAll('.comp-shape-picker').forEach(n => n.remove());
        const pop = document.createElement('div');
        pop.className = 'comp-var-dialog comp-shape-picker';
        pop.addEventListener('click', e => e.stopPropagation());

        const head = document.createElement('div');
        head.className = 'comp-var-dialog-head';
        head.innerHTML = '<strong>Formen</strong>' +
          '<span style="font-size:0.78rem;color:#5d6872;">zum Auswählen klicken</span>';
        pop.appendChild(head);

        const list = document.createElement('div');
        list.style.cssText = 'display:flex; flex-direction:column; gap:2px; max-height:340px; overflow:auto;';
        (block.config.shapes || []).forEach((s, idx) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'comp-shape-picker-row';
          if(isSelected(idx)) row.classList.add('is-selected');
          const icoSpan = document.createElement('span');
          icoSpan.className = 'comp-shape-picker-ico';
          // Store the shape's color on a custom property so CSS can apply it
          // by default and switch to white on hover via currentColor.
          icoSpan.style.color = s.color || '#003b5c';
          icoSpan.innerHTML = SHAPE_ICONS[s.type] || '';
          row.appendChild(icoSpan);
          const txt = document.createElement('span');
          txt.className = 'comp-shape-picker-label';
          txt.textContent = shapeDisplayName(s, idx);
          row.appendChild(txt);
          row.addEventListener('click', () => {
            setSingleSelection(idx);
            close();
            render();
          });
          list.appendChild(row);
        });
        pop.appendChild(list);

        const r = anchorEl.getBoundingClientRect();
        pop.style.left = Math.max(8, r.left) + 'px';
        pop.style.top  = (r.bottom + 4) + 'px';
        pop.style.minWidth = '240px';
        document.body.appendChild(pop);

        function close(){
          pop.remove();
          document.removeEventListener('click', onDoc, true);
          document.removeEventListener('keydown', onKey, true);
        }
        const onDoc = e => { if(!pop.contains(e.target) && e.target !== anchorEl) close(); };
        const onKey = e => { if(e.key === 'Escape') close(); };
        setTimeout(() => {
          document.addEventListener('click', onDoc, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      }

      // Inline mini-form to add a random variable. Avoids the round-trip
      // through the config-pane's deeply-nested variables list.
      function openVariableDialog(anchorEl){
        document.querySelectorAll('.comp-var-dialog').forEach(n => n.remove());
        const pop = document.createElement('div');
        pop.className = 'comp-var-dialog';
        pop.addEventListener('click', e => e.stopPropagation());

        // Suggest the next free single-letter name (a, b, c, …).
        const used = new Set((block.config.variables || []).map(v => v.name).filter(Boolean));
        let suggested = 'a';
        for(const c of 'abcdefghijklmnopqrstuvwxyz'){ if(!used.has(c)){ suggested = c; break; } }

        pop.innerHTML =
          '<div class="comp-var-dialog-head"><strong>Neue Variable</strong>' +
          '<span style="font-size:0.78rem;color:#5d6872;">Im Label-Text als {Name} verwenden</span></div>' +
          '<div class="comp-var-dialog-row"><label>Name</label><input data-k="name" type="text" maxlength="20" placeholder="a" value="' + suggested + '"/></div>' +
          '<div class="comp-var-dialog-row"><label>Min</label><input data-k="min" type="number" value="1"/></div>' +
          '<div class="comp-var-dialog-row"><label>Max</label><input data-k="max" type="number" value="10"/></div>' +
          '<div class="comp-var-dialog-row"><label></label><label class="comp-var-dialog-check"><input data-k="integer" type="checkbox" checked/> Nur Ganzzahlen</label></div>' +
          '<div class="comp-var-dialog-actions">' +
          '<button class="comp-tool-btn-text" data-act="cancel" type="button">Abbrechen</button>' +
          '<button class="comp-tool-btn-text comp-tool-template" data-act="ok" type="button">Hinzufügen</button>' +
          '</div>';

        const r = anchorEl.getBoundingClientRect();
        pop.style.left = Math.max(8, r.right - 280) + 'px';
        pop.style.top  = (r.bottom + 4) + 'px';
        document.body.appendChild(pop);
        pop.querySelector('[data-k="name"]').focus();

        function close(){
          pop.remove();
          document.removeEventListener('click', onDoc, true);
          document.removeEventListener('keydown', onKey, true);
        }
        function save(){
          const name    = pop.querySelector('[data-k="name"]').value.trim();
          const min     = parseFloat(pop.querySelector('[data-k="min"]').value);
          const max     = parseFloat(pop.querySelector('[data-k="max"]').value);
          const integer = pop.querySelector('[data-k="integer"]').checked;
          if(!name){ pop.querySelector('[data-k="name"]').focus(); return; }
          if(!/^[a-zA-Z_]\w*$/.test(name)){
            alert('Variable-Name muss mit Buchstaben/Unterstrich beginnen.'); return;
          }
          if(used.has(name)){
            alert('Variable „' + name + '" gibt es schon.'); return;
          }
          if(!isFinite(min) || !isFinite(max) || min > max){
            alert('Bereich ungültig (Min ≤ Max).'); return;
          }
          block.config.variables = Array.isArray(block.config.variables) ? block.config.variables : [];
          block.config.variables.push({ name, min, max, integer });
          close();
          commit();
        }
        pop.querySelector('[data-act="cancel"]').addEventListener('click', close);
        pop.querySelector('[data-act="ok"]').addEventListener('click', save);
        pop.addEventListener('keydown', e => {
          if(e.key === 'Enter'){ save(); }
          else if(e.key === 'Escape'){ close(); }
        });
        const onDoc = e => { if(!pop.contains(e.target) && e.target !== anchorEl) close(); };
        const onKey = e => { if(e.key === 'Escape') close(); };
        setTimeout(() => {
          document.addEventListener('click', onDoc, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      }

      // Apply a template. Append shifts shapes by +30 px and renames variables on collision.
      function applyTemplate(tpl, mode){
        const newShapes = JSON.parse(JSON.stringify(tpl.shapes));
        const newVars   = JSON.parse(JSON.stringify(tpl.variables || []));
        if(mode === 'replace' || !(block.config.shapes || []).length){
          block.config.shapes      = newShapes;
          block.config.variables   = newVars;
          block.config.gradingMode = tpl.gradingMode || 'none';
          if(tpl.canvasWidth)  block.config.canvasWidth  = tpl.canvasWidth;
          if(tpl.canvasHeight) block.config.canvasHeight = tpl.canvasHeight;
        } else {
          const existingNames = new Set((block.config.variables || []).map(v => v.name));
          const renameMap = {};
          newVars.forEach(v => {
            if(!existingNames.has(v.name)){ existingNames.add(v.name); return; }
            let i = 2; let candidate;
            do { candidate = v.name + i; i++; } while(existingNames.has(candidate));
            renameMap[v.name] = candidate;
            v.name = candidate;
            existingNames.add(candidate);
          });
          // Rewrite shapes' label text + formula to use new names.
          newShapes.forEach(s => {
            if(s.type === 'label'){
              s.x = (s.x || 0) + 30;
              s.y = (s.y || 0) + 30;
              if(s.text){
                s.text = String(s.text).replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g,
                  (m, n) => renameMap[n] ? '{' + renameMap[n] + '}' : m);
              }
              if(s.formula){
                Object.entries(renameMap).forEach(([oldN, newN]) => {
                  s.formula = s.formula.replace(new RegExp('\\b' + oldN + '\\b', 'g'), newN);
                });
              }
            } else if(s.x != null){
              s.x = s.x + 30;
              s.y = (s.y || 0) + 30;
            } else if(s.x1 != null){
              s.x1 += 30; s.y1 += 30; s.x2 += 30; s.y2 += 30;
            } else if(s.cx != null){
              s.cx += 30; s.cy += 30;
              if(Array.isArray(s.points)){
                s.points = s.points.map(p => [p[0] + 30, p[1] + 30]);
              }
            }
          });
          block.config.shapes    = (block.config.shapes || []).concat(newShapes);
          block.config.variables = (block.config.variables || []).concat(newVars);
          // Keep existing gradingMode unless still 'none'; in that case promote.
          if(!block.config.gradingMode || block.config.gradingMode === 'none'){
            block.config.gradingMode = tpl.gradingMode || 'none';
          }
        }
        block._compSelected = -1; block._compSelection = [];
      }

      function showInsertModeChooser(pickerPop, tpl){
        // Replace the picker grid content with a clear choice screen.
        pickerPop.querySelector('.comp-tpl-grid')?.remove();
        const choose = document.createElement('div');
        choose.className = 'comp-tpl-choose';
        choose.innerHTML =
          '<div style="margin-bottom:0.6rem;color:#5d6872;font-size:0.85rem;">' +
          'Diese Komposition enthält schon Formen. Wie soll <strong>' + tpl.label + '</strong> eingefügt werden?</div>' +
          '<div class="comp-tpl-choose-actions">' +
          '<button class="comp-tool-btn-text" data-act="cancel">Abbrechen</button>' +
          '<button class="comp-tool-btn-text" data-act="append">Hinzufügen</button>' +
          '<button class="comp-tool-btn-text comp-tool-template" data-act="replace">Ersetzen</button>' +
          '</div>' +
          '<div style="font-size:0.74rem;color:#5d6872;margin-top:0.5rem;">' +
          '<strong>Hinzufügen</strong> behält bestehende Formen + Variablen (umbenannt bei Namenskonflikt). ' +
          '<strong>Ersetzen</strong> verwirft alles bisherige.</div>';
        pickerPop.appendChild(choose);
        choose.querySelector('[data-act="cancel"]').addEventListener('click', () => { pickerPop.remove(); });
        choose.querySelector('[data-act="append"]').addEventListener('click', () => {
          applyTemplate(tpl, 'append'); pickerPop.remove(); commit();
        });
        choose.querySelector('[data-act="replace"]').addEventListener('click', () => {
          applyTemplate(tpl, 'replace'); pickerPop.remove(); commit();
        });
      }

      function openTemplatePicker(anchorEl){
        // Close any previously-open picker
        document.querySelectorAll('.comp-tpl-popover').forEach(n => n.remove());

        const pop = document.createElement('div');
        pop.className = 'comp-tpl-popover';
        pop.addEventListener('click', e => e.stopPropagation());

        const head = document.createElement('div');
        head.className = 'comp-tpl-popover-head';
        head.innerHTML = '<strong>Vorlage einfügen</strong><span style="font-size:0.78rem;color:#5d6872;">Ersetzt die aktuelle Komposition</span>';
        pop.appendChild(head);

        const grid = document.createElement('div');
        grid.className = 'comp-tpl-grid';
        COMPOSITION_TEMPLATES.forEach(tpl => {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'comp-tpl-card';
          card.title = tpl.label + ': ' + tpl.description;

          // Mini-SVG preview using the template's shapes at a thumbnail scale.
          const previewSvg = buildSvg({
            canvasWidth: tpl.canvasWidth || 600,
            canvasHeight: tpl.canvasHeight || 360,
            background: '#ffffff',
            shapes: tpl.shapes
          }, { idPrefix: 'tpl-' + tpl.id });
          previewSvg.style.width = '100%';
          previewSvg.style.height = '90px';
          previewSvg.style.maxWidth = '100%';
          previewSvg.style.aspectRatio = (tpl.canvasWidth || 600) + ' / ' + (tpl.canvasHeight || 360);
          previewSvg.style.border = '1px solid var(--line, #d8e0e6)';
          previewSvg.style.borderRadius = '6px';
          previewSvg.style.background = '#fff';
          previewSvg.style.pointerEvents = 'none';
          card.appendChild(previewSvg);

          const cap = document.createElement('div');
          cap.className = 'comp-tpl-cap';
          cap.innerHTML = '<div class="comp-tpl-cap-name">' + tpl.label + '</div>' +
                          '<div class="comp-tpl-cap-desc">' + tpl.description + '</div>';
          card.appendChild(cap);

          card.addEventListener('click', () => {
            const hasContent = (block.config.shapes || []).length > 0;
            if(hasContent){
              // Three-way dialog: Replace/Append/Cancel. Append merges + renames on collision.
              showInsertModeChooser(pop, tpl);
            } else {
              applyTemplate(tpl, 'replace');
              pop.remove();
              // commit() re-renders the editor + pushes the new config to the
              // canvas. Without it the editor stays stuck on the empty state
              // until the user nudges something else.
              commit();
            }
          });
          grid.appendChild(card);
        });
        pop.appendChild(grid);

        // Position right below the trigger button.
        const r = anchorEl.getBoundingClientRect();
        pop.style.left = Math.max(8, r.left) + 'px';
        pop.style.top  = (r.bottom + 6) + 'px';
        document.body.appendChild(pop);

        // Dismiss on outside-click + Escape.
        const onDoc = e => {
          if(!pop.contains(e.target) && e.target !== anchorEl){
            pop.remove(); document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        const onKey = e => {
          if(e.key === 'Escape'){
            pop.remove(); document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        setTimeout(() => {
          document.addEventListener('click', onDoc, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      }

      // Add-shape buttons
      const addGroup = document.createElement('div');
      addGroup.className = 'comp-tool-group';
      ['line','arrow','circle','ellipse','polygon','rect','label','coords','image'].forEach(type => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'comp-tool-btn';
        btn.title = SHAPE_LABELS[type] + ' hinzufügen';
        btn.innerHTML = SHAPE_ICONS[type];
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if(type === 'image'){
            // Only add the shape after the file picker resolves.
            pickImageDataUrl().then(src => {
              if(!src) return;
              const shape = newShape('image');
              shape.src = src;
              block.config.shapes.push(shape);
              setSingleSelection(block.config.shapes.length - 1);
              commit();
            });
            return;
          }
          if(type === 'polygon'){
            // Open polygon-preset picker instead of adding a default 3-gon.
            openPolygonPicker(btn);
            return;
          }
          const shape = newShape(type);
          // Smart-place: next to the selected shape's bounding box; otherwise staggered by count.
          const cw = Math.max(100, Number(block.config.canvasWidth)  || 600);
          const ch = Math.max(100, Number(block.config.canvasHeight) || 360);
          const cx = Math.round(cw / 2), cy = Math.round(ch / 2);
          const selShape = getSelected();
          const existingCount = (block.config.shapes || []).length;
          const stagger = existingCount * 24;
          if(type === 'label'){
            shape.text = '';
            if(selShape){
              const bb = shapeBounds(selShape);
              if(bb){ shape.x = Math.min(cw - 60, bb.x + bb.w + 12); shape.y = bb.y + 12; }
              else  { shape.x = cx - 40 + stagger; shape.y = cy + stagger; }
            } else {
              shape.x = cx - 40 + (stagger % 200);
              shape.y = cy - 40 + Math.floor(stagger / 200) * 40;
            }
          } else if(type === 'rect'){
            shape.x = cx - (shape.w || 220) / 2; shape.y = cy - (shape.h || 120) / 2;
          } else if(type === 'circle' || type === 'ellipse'){
            shape.cx = cx; shape.cy = cy;
          } else if(type === 'line' || type === 'arrow'){
            shape.x1 = cx - 80; shape.y1 = cy; shape.x2 = cx + 80; shape.y2 = cy;
          } else if(type === 'polygon'){
            shape.points = regularPolygonPoints(cx, cy, 70, shape.sides || 3);
            shape.cx = cx; shape.cy = cy;
          } else if(type === 'coords'){
            shape.x = cx - (shape.w || 320) / 2; shape.y = cy - (shape.h || 220) / 2;
          }
          block.config.shapes.push(shape);
          setSingleSelection(block.config.shapes.length - 1);
          // Auto-focus the label's text input.
          if(type === 'label') block._compFocusLabelText = true;
          commit();
        });
        addGroup.appendChild(btn);
      });
      bar.appendChild(addGroup);

      // Clickable mode chip. Only three modes; click/hotspot belong in other blocks.
      const modeBadge = document.createElement('div');
      modeBadge.className = 'comp-tool-group comp-mode-badge';
      const _gradingMode = block.config.gradingMode || 'none';
      const modeLabels = {
        'none':        'Nur Anzeige',
        'acknowledge': 'Verstanden-Button',
        'fillblanks':  'Mit Lösung'
      };
      // Mode chip opens an inline dropdown.
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'comp-mode-chip comp-mode-chip-button';
      chip.title = 'Bewertungsart wechseln';
      chip.innerHTML = '<strong>' + (modeLabels[_gradingMode] || _gradingMode) + '</strong> <span class="comp-mode-chip-caret">▾</span>';
      chip.setAttribute('aria-label', 'Bewertungsmodus: ' + (modeLabels[_gradingMode] || _gradingMode));
      chip.addEventListener('click', e => {
        e.stopPropagation();
        document.querySelectorAll('.comp-mode-menu').forEach(n => n.remove());
        const menu = document.createElement('div');
        menu.className = 'comp-mode-menu';
        Object.entries(modeLabels).forEach(([key, label]) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'comp-mode-menu-item' + (key === _gradingMode ? ' is-active' : '');
          item.textContent = label;
          item.addEventListener('click', ev => {
            ev.stopPropagation();
            block.config.gradingMode = key;
            menu.remove();
            commit();
          });
          menu.appendChild(item);
        });
        const r = chip.getBoundingClientRect();
        menu.style.left = r.left + 'px';
        menu.style.top  = (r.bottom + 4) + 'px';
        document.body.appendChild(menu);
        const onDoc = ev => {
          if(!menu.contains(ev.target) && ev.target !== chip){
            menu.remove();
            document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        const onKey = ev => {
          if(ev.key === 'Escape'){
            menu.remove();
            document.removeEventListener('click', onDoc, true);
            document.removeEventListener('keydown', onKey, true);
          }
        };
        setTimeout(() => {
          document.addEventListener('click', onDoc, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      });
      modeBadge.appendChild(chip);

      // Add variable / open variables table editor.
      const existingVars = (block.config.variables || []).filter(v => v && v.name);
      const addVarBtn = document.createElement('button');
      addVarBtn.type = 'button';
      addVarBtn.className = 'comp-tool-btn-text';
      if(existingVars.length === 0){
        addVarBtn.title = 'Neue Zufallsvariable anlegen (Name, Min, Max)';
        addVarBtn.textContent = '+ Variable';
        addVarBtn.addEventListener('click', e => {
          e.stopPropagation();
          openVariableDialog(addVarBtn);
        });
      } else {
        addVarBtn.title = existingVars.length + ' Variable' + (existingVars.length === 1 ? '' : 'n') + ' definiert. Klicken zum Bearbeiten.';
        addVarBtn.textContent = 'Variablen (' + existingVars.length + ')';
        addVarBtn.addEventListener('click', e => {
          e.stopPropagation();
          openVariableTable(addVarBtn);
        });
      }
      modeBadge.appendChild(addVarBtn);

      // Shape picker: lists all shapes for quick selection (e.g. to resize an
      // existing triangle without having to click it on the canvas).
      const shapes = block.config.shapes || [];
      if(shapes.length > 0){
        const shapesBtn = document.createElement('button');
        shapesBtn.type = 'button';
        shapesBtn.className = 'comp-tool-btn-text';
        shapesBtn.title = shapes.length + ' Form' + (shapes.length === 1 ? '' : 'en') + ' in dieser Komposition. Klicken zum Auswählen.';
        shapesBtn.textContent = 'Formen (' + shapes.length + ')';
        shapesBtn.addEventListener('click', e => {
          e.stopPropagation();
          openShapePicker(shapesBtn);
        });
        modeBadge.appendChild(shapesBtn);
      }

      bar.appendChild(modeBadge);

      // Style controls (active only when a shape is selected).
      const styleGroup = document.createElement('div');
      styleGroup.className = 'comp-tool-group comp-style-group';
      if(!sel) styleGroup.classList.add('comp-tool-group-disabled');

      // Color picker + Transparent toggle. The toggle stores 'none' (fill)
      // or 'transparent' (stroke); clicking restores the previous color.
      function mkColorControl(label, currentValue, noneValue, restoreDefault, onSet, opts){
        if(!(opts && opts.hideLabel)){
          const lbl = document.createElement('span');
          lbl.className = 'comp-tool-label';
          lbl.textContent = label;
          styleGroup.appendChild(lbl);
        }

        const wrap = document.createElement('span');
        wrap.className = 'comp-color-wrap';

        const transparent = isNoneColor(currentValue);
        const inp = document.createElement('input');
        inp.type = 'color';
        inp.className = 'comp-tool-color';
        inp.value = transparent ? '#ffffff' : (currentValue || '#003b5c');
        inp.disabled = transparent || (opts && opts.disabled);
        inp.title = label;
        inp.addEventListener('input', () => { onSet(inp.value); commit(); });
        wrap.appendChild(inp);

        if(opts && opts.allowTransparent){
          const noBtn = document.createElement('button');
          noBtn.type = 'button';
          noBtn.className = 'comp-tool-btn comp-tool-btn-sm' + (transparent ? ' comp-tool-btn-active' : '');
          noBtn.title = transparent ? 'Transparent aktiv. Klicken für Farbe' : 'Auf transparent setzen';
          noBtn.innerHTML = ACTION_ICONS.transparent;
          noBtn.addEventListener('click', e => {
            e.stopPropagation();
            onSet(transparent ? (restoreDefault || '#84bf66') : noneValue);
            commit();
          });
          wrap.appendChild(noBtn);
        }
        styleGroup.appendChild(wrap);
      }

      // Stroke / axis / text colour. Images have no colour control.
      if(!sel || sel.type !== 'image'){
        const label = (sel && sel.type === 'label') ? 'Text'
                    : (sel && sel.type === 'coords') ? 'Achse'
                    : 'Linie';
        // Transparent doesn't make sense for labels (would hide the text)
        // or coords (would hide the axes).
        const allowTrans = !!sel && sel.type !== 'label' && sel.type !== 'coords';
        // Labels: color swatch without text label.
        const hideLabel = !!(sel && sel.type === 'label');
        mkColorControl(
          label,
          sel ? sel.color : '#003b5c',
          NONE_STROKE,
          '#003b5c',
          (v) => { if(sel) sel.color = v; },
          { disabled: !sel, allowTransparent: allowTrans, hideLabel }
        );
      }

      // Fill colour, only for filled shapes.
      if(sel && (sel.type === 'circle' || sel.type === 'ellipse' || sel.type === 'polygon' || sel.type === 'rect')){
        mkColorControl(
          'Füllung',
          sel.fill,
          NONE_FILL,
          '#a1d884',
          (v) => { sel.fill = v; },
          { allowTransparent: true }
        );
      }

      // Polygon-only: corner count input + "regular" button. Changing corner count
      // regenerates as a regular n-gon at the current centroid + r.
      if(sel && sel.type === 'polygon'){
        const sLbl = document.createElement('span');
        sLbl.className = 'comp-tool-label';
        sLbl.textContent = 'Ecken';
        styleGroup.appendChild(sLbl);
        const sInp = document.createElement('input');
        sInp.type = 'number'; sInp.min = '3'; sInp.max = '20'; sInp.step = '1';
        sInp.className = 'comp-tool-num';
        sInp.value = sel.sides ?? 3;
        sInp.title = 'Anzahl Ecken (regeneriert als regulär)';
        sInp.addEventListener('input', () => {
          const v = parseInt(sInp.value, 10);
          if(!isNaN(v) && v >= 3 && v <= 20){
            const c = polygonCentroid(sel);
            sel.sides = v;
            sel.cx = c.x; sel.cy = c.y;
            sel.points = regularPolygonPoints(c.x, c.y, sel.r || 50, v);
            commit();
          }
        });
        styleGroup.appendChild(sInp);

        // Snap a deformed polygon back to a regular n-gon (same centroid).
        const regBtn = document.createElement('button');
        regBtn.type = 'button';
        regBtn.className = 'comp-tool-btn-text';
        regBtn.textContent = 'Regulär';
        regBtn.title = 'Polygon zu reguläre Form zurücksetzen';
        regBtn.addEventListener('click', e => {
          e.stopPropagation();
          const c = polygonCentroid(sel);
          const pts = polygonGetPoints(sel);
          // Average vertex distance hugs the current size better than sel.r.
          let avg = 0; pts.forEach(p => { avg += Math.hypot(p[0]-c.x, p[1]-c.y); });
          const r = Math.max(10, avg / pts.length);
          sel.r = r; sel.cx = c.x; sel.cy = c.y;
          sel.points = regularPolygonPoints(c.x, c.y, r, sel.sides || 3);
          commit();
        });
        styleGroup.appendChild(regBtn);
      }

      // Stroke width + dash for outlined shapes.
      if(sel && (sel.type === 'line' || sel.type === 'arrow' || sel.type === 'circle' || sel.type === 'ellipse' || sel.type === 'polygon' || sel.type === 'rect')){
        const swLbl = document.createElement('span');
        swLbl.className = 'comp-tool-label';
        swLbl.textContent = 'Stärke';
        styleGroup.appendChild(swLbl);
        const sw = document.createElement('input');
        sw.type = 'number'; sw.min = '1'; sw.max = '20'; sw.step = '1';
        sw.className = 'comp-tool-num';
        sw.value = sel.strokeWidth ?? 2;
        sw.addEventListener('input', () => {
          const v = parseInt(sw.value, 10);
          if(!isNaN(v) && v >= 1){ sel.strokeWidth = v; commit(); }
        });
        styleGroup.appendChild(sw);

        const dashSel = document.createElement('select');
        dashSel.className = 'comp-tool-select';
        dashSel.title = 'Linienstil';
        [['solid','─ durchgezogen'], ['dashed','┄ gestrichelt'], ['dotted','┈ gepunktet']].forEach(([v, lbl]) => {
          const o = document.createElement('option'); o.value = v; o.textContent = lbl;
          dashSel.appendChild(o);
        });
        dashSel.value = sel.dash || 'solid';
        dashSel.addEventListener('change', () => { sel.dash = dashSel.value; commit(); });
        styleGroup.appendChild(dashSel);
      }

      // Label: text + (optional) Variable picker + font size
      if(sel && sel.type === 'label'){
        const ti = document.createElement('input');
        ti.type = 'text';
        ti.className = 'comp-tool-text';
        ti.value = sel.text || '';
        ti.placeholder = 'z. B. a oder {a}';
        ti.title = 'Text-Inhalt des Labels';
        // commitQuiet while typing (otherwise the input loses focus). Update
        // the SVG text node manually. Full commit() on blur.
        function selectedShapeIdx(){
          const a = selIndices();
          return a.length === 1 ? a[0] : -1;
        }
        ti.addEventListener('input', () => {
          sel.text = ti.value;
          const idx = selectedShapeIdx();
          if(idx >= 0){
            const svgText = host.querySelector('svg.comp-canvas text[data-shape-idx="' + idx + '"]');
            if(svgText){
              // Apply rolled-var substitution if the author has rolled values.
              const rolled = block._compRolledVars;
              let display = ti.value;
              if(rolled && Object.keys(rolled).length){
                display = display.replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, n) => {
                  if(n in rolled){
                    const v = rolled[n];
                    return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
                  }
                  return m;
                });
              }
              svgText.textContent = display;
            }
          }
          commitQuiet();
        });
        ti.addEventListener('blur', () => { commit(); });
        styleGroup.appendChild(ti);
        // Auto-focus the text field when the just-added label is selected.
        if(block._compFocusLabelText){
          block._compFocusLabelText = false;
          setTimeout(() => { ti.focus(); ti.select(); }, 30);
        }

        // Helper to insert a snippet at the current caret position.
        function tiInsertAtCaret(snippet){
          const start = ti.selectionStart ?? ti.value.length;
          const end   = ti.selectionEnd   ?? ti.value.length;
          const next  = ti.value.slice(0, start) + snippet + ti.value.slice(end);
          ti.value = next;
          sel.text = next;
          ti.focus();
          const caret = start + snippet.length;
          ti.setSelectionRange(caret, caret);
          commit();
        }
        // "Insert ▾" dropdown with variables + special characters.
        const definedVars = (block.config.variables || []).filter(v => v && v.name);
        const insertBtn = document.createElement('button');
        insertBtn.type = 'button';
        insertBtn.className = 'comp-tool-btn-text';
        insertBtn.title = 'Variable oder Sonderzeichen einfügen';
        insertBtn.textContent = 'Einfügen ▾';
        insertBtn.addEventListener('click', e => {
          e.stopPropagation();
          document.querySelectorAll('.comp-insert-popover').forEach(n => n.remove());
          const pop = document.createElement('div');
          pop.className = 'comp-insert-popover';
          pop.addEventListener('click', ev => ev.stopPropagation());
          // Solution fields: numbered slots {N} and answer-mirrors {N*}.
          const hSol = document.createElement('div'); hSol.className = 'comp-insert-head'; hSol.textContent = 'Lösungsfelder';
          pop.appendChild(hSol);
          // Discover which slot numbers are already used across all labels.
          const usedSlots = new Set();
          (block.config.shapes || []).forEach(sh => {
            if(sh.type === 'label' && sh.text){
              slotNumbersInLabel(sh.text).forEach(n => usedSlots.add(n));
            }
          });
          let nextSlot = 1;
          while(usedSlots.has(nextSlot)) nextSlot++;

          const solRow = document.createElement('div'); solRow.className = 'comp-insert-row';
          const newSlotBtn = document.createElement('button');
          newSlotBtn.type = 'button'; newSlotBtn.className = 'comp-insert-cell comp-insert-cell-var';
          newSlotBtn.textContent = '{' + nextSlot + '}';
          newSlotBtn.title = 'Neues Antwort-Eingabefeld (Slot ' + nextSlot + ')';
          newSlotBtn.addEventListener('click', () => {
            tiInsertAtCaret('{' + nextSlot + '}');
            if((block.config.gradingMode || 'none') !== 'fillblanks'){
              block.config.gradingMode = 'fillblanks';
            }
            pop.remove();
            commit();
          });
          solRow.appendChild(newSlotBtn);

          // Mirror buttons for existing slots: insert {N*} to display the answer.
          Array.from(usedSlots).sort((a,b)=>a-b).forEach(n => {
            const mirBtn = document.createElement('button');
            mirBtn.type = 'button'; mirBtn.className = 'comp-insert-cell';
            mirBtn.textContent = '{' + n + '*}';
            mirBtn.title = 'Spiegelung: zeigt die Schüler-Antwort aus Slot ' + n + ' an (auch nutzbar in Formeln)';
            mirBtn.addEventListener('click', () => { tiInsertAtCaret('{' + n + '*}'); pop.remove(); });
            solRow.appendChild(mirBtn);
          });
          pop.appendChild(solRow);

          // Help line so professors discover the feature.
          const hint = document.createElement('div');
          hint.style.cssText = 'font-size:0.72rem; color:#5d6872; padding:0.3rem 0.5rem 0.4rem; line-height:1.35;';
          hint.innerHTML = '<strong>{N}</strong>: Antwortfeld · <strong>{N*}</strong>: Schüler-Antwort weiternutzen (im Text oder in einer Formel)';
          pop.appendChild(hint);
          if(definedVars.length > 0){
            const h = document.createElement('div'); h.className = 'comp-insert-head'; h.textContent = 'Variablen';
            pop.appendChild(h);
            const row = document.createElement('div'); row.className = 'comp-insert-row';
            definedVars.forEach(v => {
              const b = document.createElement('button');
              b.type = 'button'; b.className = 'comp-insert-cell comp-insert-cell-var';
              b.textContent = '{' + v.name + '}';
              b.addEventListener('click', () => { tiInsertAtCaret('{' + v.name + '}'); pop.remove(); });
              row.appendChild(b);
            });
            pop.appendChild(row);
          }
          const h2 = document.createElement('div'); h2.className = 'comp-insert-head'; h2.textContent = 'Sonderzeichen';
          pop.appendChild(h2);
          const SYMS = [
            'α','β','γ','δ','ε','ζ','η','θ','λ','μ','ν','π','ρ','σ','τ','φ','ψ','ω',
            'Δ','Σ','Π','Ω','Φ','Ψ','Θ','Λ',
            '²','³','⁰','¹','⁴','⁵','⁶','ⁿ',
            '√','∞','≈','≠','≤','≥','±','·','×','÷','∂','∫','∑','°',
            '→','←','↑','↓','↔'
          ];
          const symRow = document.createElement('div');
          symRow.className = 'comp-insert-row comp-insert-row-sym';
          SYMS.forEach(s => {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'comp-insert-cell';
            b.textContent = s;
            b.addEventListener('click', () => { tiInsertAtCaret(s); pop.remove(); });
            symRow.appendChild(b);
          });
          pop.appendChild(symRow);
          const r = insertBtn.getBoundingClientRect();
          pop.style.left = Math.max(8, r.left) + 'px';
          pop.style.top  = (r.bottom + 4) + 'px';
          document.body.appendChild(pop);
          const onDoc = ev => {
            if(!pop.contains(ev.target) && ev.target !== insertBtn){
              pop.remove();
              document.removeEventListener('click', onDoc, true);
              document.removeEventListener('keydown', onKey, true);
            }
          };
          const onKey = ev => {
            if(ev.key === 'Escape'){
              pop.remove();
              document.removeEventListener('click', onDoc, true);
              document.removeEventListener('keydown', onKey, true);
            }
          };
          setTimeout(() => {
            document.addEventListener('click', onDoc, true);
            document.addEventListener('keydown', onKey, true);
          }, 0);
        });
        styleGroup.appendChild(insertBtn);

        const fs = document.createElement('input');
        fs.type = 'number'; fs.min = '8'; fs.max = '96'; fs.step = '1';
        fs.className = 'comp-tool-num';
        fs.value = sel.fontSize ?? 18;
        fs.title = 'Schriftgröße';
        fs.addEventListener('input', () => {
          const v = parseInt(fs.value, 10);
          if(!isNaN(v) && v >= 8){ sel.fontSize = v; commit(); }
        });
        styleGroup.appendChild(fs);

        // Mode auto-switches to fillblanks once {} appears in the text
        // (see insert popover). No separate toggle needed.
      }

      // Coordinate system: grid/labels toggles + axis-range editing.
      if(sel && sel.type === 'coords'){
        const mkToggle = (key, label, defaultOn) => {
          const wrap = document.createElement('label');
          wrap.className = 'comp-tool-toggle';
          wrap.title = label;
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = sel[key] !== false && (sel[key] != null ? !!sel[key] : !!defaultOn);
          cb.addEventListener('change', () => { sel[key] = cb.checked; commit(); });
          wrap.appendChild(cb);
          wrap.appendChild(document.createTextNode(' ' + label));
          styleGroup.appendChild(wrap);
        };
        mkToggle('showGrid',   'Gitter',   true);
        mkToggle('showLabels', 'Achsen­beschriftung', true);

        const mkRange = (key, label, fallback) => {
          const lbl = document.createElement('span');
          lbl.className = 'comp-tool-label';
          lbl.textContent = label;
          styleGroup.appendChild(lbl);
          const inp = document.createElement('input');
          inp.type = 'number';
          inp.className = 'comp-tool-num';
          inp.step = '0.5';
          inp.value = sel[key] != null ? sel[key] : fallback;
          inp.title = 'Achsenbereich ' + label;
          inp.addEventListener('input', () => {
            const v = parseFloat(inp.value);
            if(!isNaN(v)){ sel[key] = v; commit(); }
          });
          styleGroup.appendChild(inp);
        };
        mkRange('xMin', 'x min', -5);
        mkRange('xMax', 'x max',  5);
        mkRange('yMin', 'y min', -3);
        mkRange('yMax', 'y max',  3);

        const stepLbl = document.createElement('span');
        stepLbl.className = 'comp-tool-label';
        stepLbl.textContent = 'Schritt';
        styleGroup.appendChild(stepLbl);
        const stepInp = document.createElement('input');
        stepInp.type = 'number';
        stepInp.className = 'comp-tool-num';
        stepInp.step = '0.5'; stepInp.min = '0.01';
        stepInp.value = sel.step != null ? sel.step : 1;
        stepInp.title = 'Abstand zwischen Gitter/Beschriftung';
        stepInp.addEventListener('input', () => {
          const v = parseFloat(stepInp.value);
          if(!isNaN(v) && v > 0){ sel.step = v; commit(); }
        });
        styleGroup.appendChild(stepInp);
      }

      if(sel && sel.type === 'image'){
        const replace = document.createElement('button');
        replace.type = 'button';
        replace.className = 'comp-tool-btn-text';
        replace.textContent = 'Bild ersetzen…';
        replace.addEventListener('click', e => {
          e.stopPropagation();
          pickImageDataUrl().then(src => { if(src){ sel.src = src; commit(); } });
        });
        styleGroup.appendChild(replace);
      }

      // Per-shape grading toggles for the active mode.
      const gMode = block.config.gradingMode || 'none';
      if(sel && gMode !== 'none'){
        function mkToggle(key, title, getVal, setVal){
          const wrap = document.createElement('label');
          wrap.className = 'comp-tool-toggle';
          wrap.title = title;
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!getVal();
          cb.addEventListener('change', () => { setVal(cb.checked); commit(); });
          wrap.appendChild(cb);
          wrap.appendChild(document.createTextNode(' ' + title));
          styleGroup.appendChild(wrap);
        }
        if(gMode === 'click'){
          mkToggle('isCorrect', 'Korrekt',
            () => sel.isCorrect, v => { sel.isCorrect = v; });
        }
        if(gMode === 'fillblanks' && sel.type === 'label'){
          // Formula popover only shows once the label has {}/{N} or legacy blank=true.
          const hasInline = !!(sel.text && (sel.text.indexOf('{}') >= 0 || slotNumbersInLabel(sel.text).length > 0));
          if(hasInline || sel.blank){
            const bewBtn = document.createElement('button');
            bewBtn.type = 'button';
            bewBtn.className = 'comp-tool-btn-text comp-tool-template';
            bewBtn.title = 'Formel und Toleranz für das Antwortfeld konfigurieren';
            bewBtn.textContent = 'Formel ▾';
            bewBtn.addEventListener('click', e => {
              e.stopPropagation();
              openBewertungPopover(bewBtn, sel);
            });
            styleGroup.appendChild(bewBtn);
          }
        }
        if(gMode === 'hotspot'){
          mkToggle('isTarget', 'Zielzone',
            () => sel.isTarget, v => { sel.isTarget = v; if(v) sel.isMarker = false; });
          mkToggle('isMarker', 'Marker',
            () => sel.isMarker, v => { sel.isMarker = v; if(v) sel.isTarget = false; });
          if(sel.isMarker){
            // Pick the target's shapes-array idx.
            const targetOpts = (block.config.shapes || [])
              .map((s, i) => s.isTarget ? { idx: i, label: 'Ziel #' + i + ' (' + (SHAPE_LABELS[s.type] || s.type) + ')' } : null)
              .filter(Boolean);
            const dd = document.createElement('select');
            dd.className = 'comp-tool-select';
            dd.title = 'Korrekte Zielzone';
            const none = document.createElement('option');
            none.value = ''; none.textContent = '(Ziel wählen)';
            dd.appendChild(none);
            targetOpts.forEach(o => {
              const opt = document.createElement('option');
              opt.value = String(o.idx); opt.textContent = o.label;
              dd.appendChild(opt);
            });
            if(sel.markerTargetIdx != null) dd.value = String(sel.markerTargetIdx);
            dd.addEventListener('change', () => {
              sel.markerTargetIdx = dd.value === '' ? null : parseInt(dd.value, 10);
              commit();
            });
            styleGroup.appendChild(dd);
          }
        }
      }

      // Style/action row only when a shape is selected.
      if(sel) bar.appendChild(styleGroup);

      // Right action group: z-order, duplicate, delete. Only when a shape is selected.
      if(sel){
        const rightGroup = document.createElement('div');
        rightGroup.className = 'comp-tool-group';
        const mkActionBtn = (title, html, handler, danger) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'comp-tool-btn' + (danger ? ' comp-tool-danger' : '');
          b.title = title;
          b.innerHTML = html;
          b.addEventListener('click', e => { e.stopPropagation(); handler(); });
          rightGroup.appendChild(b);
        };
        mkActionBtn('Nach vorne',  ACTION_ICONS.forward,   () => bringForward());
        mkActionBtn('Nach hinten', ACTION_ICONS.backward,  () => sendBackward());
        mkActionBtn('Duplizieren', ACTION_ICONS.duplicate, () => duplicateSelected());
        mkActionBtn('Form löschen', ACTION_ICONS.delete, () => deleteSelected(), true);
        bar.appendChild(rightGroup);
      }

      return bar;
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

  // Runtime mount helpers (SCORM player)

  // Roll variable values (shared across all modes).
  function compGenVars(variables){
    const vars = {};
    (variables || []).forEach(v => {
      if(!v || !v.name) return;
      const lo = Number(v.min); const hi = Number(v.max);
      const a = isNaN(lo) ? 1 : lo;
      const b = isNaN(hi) ? 10 : hi;
      let val = a + Math.random() * (b - a);
      if(v.integer !== false) val = Math.round(val);
      else val = Math.round(val * 100) / 100;
      vars[v.name] = val;
    });
    return vars;
  }
  function compFillTemplate(str, vars){
    return String(str || '').replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name) => {
      if(name in vars){
        const v = vars[name];
        return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
      }
      return m;
    });
  }
  function compApplyVarsToShapes(shapes, vars){
    return (shapes || []).map(sh => {
      if(sh.type !== 'label') return sh;
      return Object.assign({}, sh, { text: compFillTemplate(sh.text, vars) });
    });
  }

  // Wrap an SVG inside the standard SCORM card.
  function makeRuntimeCard(host, config){
    const u = window.BlockUtils;
    const opts = {
      title: config.blockTitle || 'Komposition',
      qBoxTitle: 'Aufgabe'
    };
    if(config.prompt && String(config.prompt).trim()){
      opts.question = config.prompt;
    }
    const ui = u.simpleQuestionCard(host, opts);
    return ui;
  }
  function appendSvg(parentEl, config, idPrefix, opts){
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; justify-content:center; padding:0.4rem 0;';
    // Runtime mount path: cap by viewport so preview/SCORM never scrolls.
    const merged = Object.assign({ idPrefix, capViewport: true }, opts || {});
    const svg = buildSvg(config, merged);
    wrap.appendChild(svg);
    parentEl.appendChild(wrap);
    return svg;
  }

  // Mode: static (no grading)
  function mountStatic(host, config, api){
    const card = document.createElement('section');
    card.className = 'section-card block-question';
    const h3 = document.createElement('h3');
    h3.textContent = config.blockTitle || 'Komposition';
    card.appendChild(h3);
    appendSvg(card, config, 'arr-' + (api.blockId || 'r'));
    host.appendChild(card);
    return {};
  }

  // Mode dispatcher; graded modes share the standard question card.
  function mountGraded(host, config, api, mode){
    const ui = makeRuntimeCard(host, config);
    const maxPoints = Math.max(1, Number(config.maxPoints) || 1);
    api.initScore(maxPoints);
    if(mode === 'acknowledge') return runAcknowledge(ui, config, api, maxPoints);
    if(mode === 'click')       return runClick(ui, config, api, maxPoints);
    if(mode === 'fillblanks')  return runFillBlanks(ui, config, api, maxPoints);
    if(mode === 'hotspot')     return runHotspot(ui, config, api, maxPoints);
    return {};
  }

  // Mode: acknowledge. SVG + "Verstanden"-Button.
  function runAcknowledge(ui, config, api, maxPoints){
    appendSvg(ui.content, config, 'comp-ack-' + (api?.blockId || ''));
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.type = 'button';
    btn.textContent = 'Verstanden (' + maxPoints + ' Pkt.)';
    let done = false;
    btn.addEventListener('click', () => {
      if(done) return;
      done = true;
      btn.disabled = true;
      ui.fb.ok('Bestätigt. ' + maxPoints + ' / ' + maxPoints + ' Punkte.');
      api.reportScore(maxPoints);
    });
    ui.buttons.appendChild(btn);
    return {};
  }

  // Mode: click. Clicking a shape marked isCorrect awards points
  function runClick(ui, config, api, maxPoints){
    const svg = appendSvg(ui.content, config, 'comp-click-' + (api?.blockId || ''));
    const shapes = config.shapes || [];
    const correctCount = shapes.filter(s => s.isCorrect).length;
    const penalize     = !!config.penalizeWrong;
    let foundCorrect = 0;
    let wrongClicks  = 0;
    let locked = false;

    function recomputeScore(){
      if(correctCount === 0){ api.reportScore(0); return; }
      const ratio = penalize
        ? Math.max(0, (foundCorrect - wrongClicks) / correctCount)
        : (foundCorrect / correctCount);
      api.reportScore(Math.round(ratio * maxPoints * 100) / 100);
    }
    function markShape(node, kind){
      node.classList.add('comp-graded-' + kind);
      node.style.cursor = 'default';
    }
    // Click each shape: green = correct, red = wrong.
    svg.querySelectorAll('[data-shape-idx]').forEach(node => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        if(locked) return;
        const idx = parseInt(node.getAttribute('data-shape-idx'), 10);
        const sh = shapes[idx];
        if(!sh || node.classList.contains('comp-graded-correct') || node.classList.contains('comp-graded-wrong')) return;
        if(sh.isCorrect){ foundCorrect++; markShape(node, 'correct'); }
        else            { wrongClicks++;  markShape(node, 'wrong'); }
        recomputeScore();
        if(foundCorrect === correctCount){ ui.fb.ok('Alle richtigen Formen gefunden!'); }
      });
    });

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'Abschließen';
    checkBtn.addEventListener('click', () => {
      if(locked) return;
      locked = true;
      checkBtn.disabled = true;
      // Reveal correct shapes the learner missed.
      svg.querySelectorAll('[data-shape-idx]').forEach(node => {
        const idx = parseInt(node.getAttribute('data-shape-idx'), 10);
        const sh = shapes[idx];
        if(sh && sh.isCorrect && !node.classList.contains('comp-graded-correct')){
          node.classList.add('comp-graded-missed');
        }
        node.style.cursor = 'default';
      });
      const pts = correctCount === 0 ? 0
                : penalize ? Math.max(0, Math.round((foundCorrect - wrongClicks) / correctCount * maxPoints * 100) / 100)
                           : Math.round((foundCorrect / correctCount) * maxPoints * 100) / 100;
      api.reportScore(pts);
      const msg = foundCorrect + ' / ' + correctCount + ' richtige Formen'
                + (wrongClicks ? ', ' + wrongClicks + ' falsch' : '')
                + ' → ' + pts + ' / ' + maxPoints + ' Punkte.';
      if(pts >= maxPoints)    ui.fb.ok(msg);
      else if(pts > 0)        ui.fb.neutral(msg);
      else                    ui.fb.bad(msg);
    });
    ui.buttons.appendChild(checkBtn);
    return {};
  }

  // Mode: fillblanks. Label shapes with {} / {N} placeholders become inputs.
  // {N*} renders as a read-only mirror of slot N's expected value, so authors
  // can build multi-step problems where step 2 references step 1's solution.
  function runFillBlanks(ui, config, api, maxPoints){
    const u = window.BlockUtils;
    const variables = Array.isArray(config.variables) ? config.variables : [];
    let currentVars = {};
    const renderedSvgHost = document.createElement('div');
    ui.content.appendChild(renderedSvgHost);

    const genVars       = () => compGenVars(variables);
    const fillTemplate  = compFillTemplate;
    function evalFormula(expr, vars){
      if(!expr) return null;
      try {
        const r = u.safeMathExpr(expandSlotRefs(expr), vars);
        if(typeof r === 'number' && Number.isFinite(r)) return r;
      } catch{}
      return null;
    }
    // Pre-compute expected values for every input slot in slot-number order,
    // so a slot's formula can reference earlier slots via {1*}/s1. Returns
    // { 1: {value, asString, tolerance, formula}, 2: ... } and `slotVars`
    // (the s1, s2, ... map suitable for safeMathExpr).
    function computeSlotExpected(){
      const shapes = config.shapes || [];
      const usedSlots = new Set();
      shapes.forEach(sh => {
        if(sh.type !== 'label' || !sh.text) return;
        slotNumbersInLabel(sh.text).forEach(n => usedSlots.add(n));
        // Legacy {} counts as the first unnamed slot.
        if(sh.text.indexOf('{}') >= 0) usedSlots.add(0);
      });
      const slotOrder = Array.from(usedSlots).sort((a, b) => a - b);
      const results = {};
      const slotVars = {};
      // Block-level tolerance as default; slot-specific tolerance still wins.
      const defaultTolerance = Number(config.tolerance);
      const blockTolerance = Number.isFinite(defaultTolerance) && defaultTolerance >= 0
        ? defaultTolerance : 0.01;
      // For each slot, find the label(s) that own it and look up its formula.
      slotOrder.forEach(n => {
        let formula = null, tolerance = blockTolerance, ownerLabel = null;
        for(const sh of shapes){
          if(sh.type !== 'label') continue;
          // Numbered slot: look in sh.formulas[n] first.
          if(n > 0 && sh.formulas && sh.formulas[n] && sh.formulas[n].formula){
            formula = sh.formulas[n].formula;
            tolerance = Number(sh.formulas[n].tolerance) || tolerance;
            ownerLabel = sh; break;
          }
          // Legacy: a label that has {N} (or {} for n=0) AND a sh.formula.
          const hasNumbered = n > 0 && slotNumbersInLabel(sh.text || '').indexOf(n) >= 0;
          const hasLegacy   = n === 0 && (sh.text || '').indexOf('{}') >= 0;
          if((hasNumbered || hasLegacy) && sh.formula && String(sh.formula).trim()){
            formula = sh.formula;
            tolerance = Number(sh.tolerance) || tolerance;
            ownerLabel = sh; break;
          }
        }
        const allVars = Object.assign({}, currentVars, slotVars);
        let value = formula ? evalFormula(formula, allVars) : null;
        // Static fallback: if no formula but label has correctText.
        if(value == null && ownerLabel && ownerLabel.correctText){
          const filled = fillTemplate(String(ownerLabel.correctText), allVars);
          const asNum = u.parseNum(filled);
          if(asNum != null) value = asNum;
        }
        const asString = value == null ? '' : formatSlotValue(value);
        results[n] = { value, asString, tolerance, formula };
        if(n > 0 && value != null) slotVars['s' + n] = value;
      });
      return { results, slotVars };
    }

    function render(){
      renderedSvgHost.innerHTML = '';
      // Substitute named variables {name} (numbered {N} placeholders are kept).
      const shapes = (config.shapes || []).map(sh => {
        if(sh.type !== 'label') return sh;
        return Object.assign({}, sh, { text: fillTemplate(sh.text, currentVars) });
      });
      const renderConfig = Object.assign({}, config, { shapes });
      const svg = appendSvg(renderedSvgHost, renderConfig, 'comp-blanks-' + (api?.blockId || ''));
      const slotInfo = computeSlotExpected();
      const blanks = [];
      // Mirror spans grouped by the slot they display, so we can refresh them
      // when the matching input changes.
      const mirrorsBySlot = {};

      shapes.forEach((sh, idx) => {
        if(sh.type !== 'label') return;
        const text = sh.text || '';
        const tokens = parseSlotTokens(text);
        const hasInline = tokens.some(t => t.kind === 'slot' || t.kind === 'mirror');
        if(!sh.blank && !hasInline) return;
        const textNode = svg.querySelector('text[data-shape-idx="' + idx + '"]');
        if(!textNode) return;
        const fs = sh.fontSize || 18;
        const fontWeight = sh.fontWeight || 400;
        const color = sh.color || '#003b5c';

        function makeInput(width){
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'comp-blank-input';
          inp.style.cssText = 'min-width:' + width + 'px; width:' + width + 'px; height:' + (fs + 12) + 'px; box-sizing:border-box; ' +
            'font:' + fontWeight + ' ' + (fs - 2) + 'px Verdana,Arial,sans-serif; ' +
            'padding:0 0.4rem; border:1px solid var(--line, #d8e0e6); border-radius:6px; background:#fff; color:#003b5c;';
          inp.placeholder = '?';
          return inp;
        }

        if(hasInline){
          // Mixed text + slots + mirrors. Build a flow layout with a foreignObject.
          const charW = fs * 0.55;
          // Width estimate: text segments + per-slot input + per-mirror span.
          let estW = 12;
          tokens.forEach(t => {
            if(t.kind === 'text') estW += t.text.length * charW;
            else if(t.kind === 'slot'){
              const n = t.n == null ? 0 : t.n;
              const expectedStr = (slotInfo.results[n] && slotInfo.results[n].asString) || '';
              estW += Math.max(60, expectedStr.length * fs * 0.55 + 20);
            } else if(t.kind === 'mirror'){
              estW += Math.max(40, 4 * charW + 8);
            }
          });

          const fo = document.createElementNS(NS, 'foreignObject');
          fo.setAttribute('x', sh.x - 2);
          fo.setAttribute('y', sh.y - fs);
          fo.setAttribute('width', estW);
          fo.setAttribute('height', fs + 16);
          fo.setAttribute('data-shape-idx', String(idx));

          const wrap = document.createElement('div');
          wrap.style.cssText = 'display:flex; align-items:center; gap:3px; height:' + (fs + 12) + 'px; ' +
            'font:' + fontWeight + ' ' + fs + 'px Verdana,Arial,sans-serif; color:' + color + '; white-space:nowrap;';

          tokens.forEach(t => {
            if(t.kind === 'text'){
              if(t.text){
                const s = document.createElement('span');
                s.textContent = t.text;
                wrap.appendChild(s);
              }
            } else if(t.kind === 'slot'){
              const n = t.n == null ? 0 : t.n;
              const exp = slotInfo.results[n] || { value:null, asString:'', tolerance:0.01, formula:null };
              const expectedStr = exp.asString || '';
              const inputW = Math.max(60, expectedStr.length * fs * 0.55 + 20);
              const inp = makeInput(inputW);
              wrap.appendChild(inp);
              blanks.push({ slotN: n, idx, input: inp, expected: exp });
            } else if(t.kind === 'mirror'){
              const n = t.n;
              const span = document.createElement('span');
              span.className = 'comp-mirror';
              span.style.cssText = 'display:inline-block; min-width:1.5em; padding:0 0.25rem; ' +
                'border-bottom:1px dashed #84bf66; color:#0f567d; font-style:italic;';
              span.textContent = '?';
              wrap.appendChild(span);
              (mirrorsBySlot[n] = mirrorsBySlot[n] || []).push(span);
            }
          });
          fo.appendChild(wrap);
          textNode.replaceWith(fo);
        } else if(sh.blank){
          // Legacy blank:true with no inline placeholder. Replace whole label.
          const exp = slotInfo.results[0] || { value:null, asString:'', tolerance:0.01, formula:null };
          const expectedStr = exp.asString || '';
          const inputW = Math.max(60, expectedStr.length * fs * 0.55 + 20);
          const fo = document.createElementNS(NS, 'foreignObject');
          fo.setAttribute('x', sh.x - 2);
          fo.setAttribute('y', sh.y - fs);
          fo.setAttribute('width', inputW + 8);
          fo.setAttribute('height', fs + 12);
          fo.setAttribute('data-shape-idx', String(idx));
          const inp = makeInput(inputW);
          inp.style.width = '100%';
          fo.appendChild(inp);
          textNode.replaceWith(fo);
          blanks.push({ slotN: 0, idx, input: inp, expected: exp });
        }
      });

      // Mirror spans show the student's actual entered value (live update).
      function updateMirrorsForSlot(slotN){
        const spans = mirrorsBySlot[slotN];
        if(!spans) return;
        const matching = blanks.filter(b => b.slotN === slotN);
        const val = matching.length ? matching[0].input.value : '';
        const trimmed = String(val || '').trim();
        spans.forEach(s => { s.textContent = trimmed === '' ? '?' : trimmed; });
      }
      blanks.forEach(b => {
        b.input.addEventListener('input', () => updateMirrorsForSlot(b.slotN));
      });
      // Initial fill in case prior values exist (regenerate path).
      Object.keys(mirrorsBySlot).forEach(n => updateMirrorsForSlot(Number(n)));

      return blanks;
    }

    function regenerate(){
      currentVars = genVars();
      const blanks = render();
      checkBtn.disabled = false;
      checked = false;
      currentBlanks = blanks;
      u.renderMath(renderedSvgHost);
      ui.fb.neutral('Neue Werte generiert.');
    }

    let currentBlanks = [];
    let checked = false;
    currentVars = genVars();
    currentBlanks = render();

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'Prüfen';
    checkBtn.addEventListener('click', () => {
      if(checked) return;
      if(currentBlanks.length === 0){ ui.fb.neutral('Keine Luecken definiert.'); api.reportScore(0); return; }
      checked = true;
      checkBtn.disabled = true;
      // Collect what the student actually typed in each numbered slot. Used
      // for follow-through grading: a later slot whose formula references
      // {N*} is re-evaluated against the student's slot N, not the correct
      // one, so a propagated mistake still earns half points.
      const studentSlotValues = {};
      currentBlanks.forEach(b => {
        if(b.slotN > 0){
          const g = u.parseNum(b.input.value);
          if(g != null) studentSlotValues['s' + b.slotN] = g;
        }
      });
      let scoreSum = 0;
      let strictCount = 0;
      let partialCount = 0;
      currentBlanks.forEach(b => {
        const given = String(b.input.value || '').trim();
        const tol = b.expected.tolerance != null ? b.expected.tolerance : 0.01;
        let mark = 'wrong';
        if(b.expected.value != null){
          const gotNum = u.parseNum(given);
          if(gotNum != null && u.nearlyEqual(gotNum, b.expected.value, tol)){
            mark = 'correct';
          } else if(gotNum != null && b.expected.formula){
            // Re-evaluate the slot's formula with the student's earlier
            // answers. If their value is consistent (Folgefehler), give half.
            const ftVars = Object.assign({}, currentVars, studentSlotValues);
            const ftVal = evalFormula(b.expected.formula, ftVars);
            if(ftVal != null && u.nearlyEqual(gotNum, ftVal, tol)){
              mark = 'partial';
            }
          }
        } else if(given.toLowerCase() === b.expected.asString.toLowerCase() && b.expected.asString !== ''){
          mark = 'correct';
        }
        b.input.disabled = true;
        b.input.classList.add(
          mark === 'correct' ? 'comp-blank-ok'
            : mark === 'partial' ? 'comp-blank-partial'
              : 'comp-blank-bad');
        if(mark !== 'correct' && b.expected.asString){
          b.input.title = 'Lösung: ' + b.expected.asString;
        }
        if(mark === 'correct'){ scoreSum += 1; strictCount++; }
        else if(mark === 'partial'){ scoreSum += 0.5; partialCount++; }
      });
      const pts = Math.round((scoreSum / currentBlanks.length) * maxPoints * 100) / 100;
      api.reportScore(pts);
      const fullCount = strictCount;
      let msg = fullCount + ' / ' + currentBlanks.length + ' Luecken korrekt';
      if(partialCount > 0) msg += ', ' + partialCount + ' Folgefehler (halbe Punkte)';
      msg += ' -> ' + pts + ' / ' + maxPoints + ' Punkte.';
      if(fullCount === currentBlanks.length) ui.fb.ok(msg);
      else if(scoreSum > 0)                  ui.fb.neutral(msg);
      else                                   ui.fb.bad(msg);
    });
    ui.buttons.appendChild(checkBtn);

    if(variables.length > 0){
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = 'Neu generieren';
      newBtn.addEventListener('click', regenerate);
      ui.buttons.appendChild(newBtn);
    }
    return {};
  }

  // Mode: hotspot. Draggable markers must land in their target zones.
  function runHotspot(ui, config, api, maxPoints){
    const svg = appendSvg(ui.content, config, 'comp-hot-' + (api?.blockId || ''));
    const shapes = config.shapes || [];
    const targets = [];
    const markers = [];
    shapes.forEach((sh, idx) => {
      if(sh.isTarget) targets.push({ idx, shape: sh });
      else if(sh.isMarker) markers.push({ idx, shape: sh, node: svg.querySelector('[data-shape-idx="' + idx + '"]') });
    });

    // Dashed outline so learners see where to drop.
    targets.forEach(t => {
      const n = svg.querySelector('[data-shape-idx="' + t.idx + '"]');
      if(n){ n.classList.add('comp-target-zone'); n.style.pointerEvents = 'none'; }
    });

    function shapeCenter(sh){
      if(sh.type === 'line' || sh.type === 'arrow'){
        return { x: (sh.x1 + sh.x2)/2, y: (sh.y1 + sh.y2)/2 };
      }
      if(sh.type === 'circle' || sh.type === 'ellipse' || sh.type === 'polygon'){
        return { x: sh.cx, y: sh.cy };
      }
      return { x: (sh.x || 0) + (sh.w || 0)/2, y: (sh.y || 0) + (sh.h || 0)/2 };
    }
    function pointInTarget(pt, target){
      const t = target.shape;
      if(t.type === 'rect' || t.type === 'image' || t.type === 'coords'){
        return pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h;
      }
      if(t.type === 'circle'){
        const dx = pt.x - t.cx, dy = pt.y - t.cy;
        return Math.sqrt(dx*dx + dy*dy) <= t.r;
      }
      if(t.type === 'ellipse'){
        const dx = (pt.x - t.cx) / t.rx, dy = (pt.y - t.cy) / t.ry;
        return dx*dx + dy*dy <= 1;
      }
      // Polygon/label/line/arrow: approximate with a radius.
      const c = shapeCenter(t);
      const r = (t.r || Math.max(t.rx || 50, t.ry || 50));
      const dx = pt.x - c.x, dy = pt.y - c.y;
      return Math.sqrt(dx*dx + dy*dy) <= r;
    }
    function svgPoint(svg, cx, cy){
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const scale = vb.width / r.width;
      return { x: (cx - r.left) * scale, y: (cy - r.top) * scale };
    }
    function moveShapeTo(sh, dx, dy){
      if(sh.type === 'line' || sh.type === 'arrow'){
        sh.x1 += dx; sh.y1 += dy; sh.x2 += dx; sh.y2 += dy;
      } else if(sh.type === 'circle' || sh.type === 'ellipse' || sh.type === 'polygon'){
        sh.cx += dx; sh.cy += dy;
      } else {
        sh.x += dx; sh.y += dy;
      }
    }
    function refreshMarkerNode(m){
      const def = svg.querySelector('defs');
      const fresh = renderShape(m.shape, def, m.idx, 'comp-hot-' + (api?.blockId || ''));
      if(!fresh) return;
      fresh.setAttribute('data-shape-idx', String(m.idx));
      fresh.classList.add('comp-marker');
      fresh.style.cursor = 'grab';
      m.node.replaceWith(fresh);
      m.node = fresh;
      attachDrag(m);
    }
    function attachDrag(m){
      m.node.addEventListener('mousedown', e => {
        if(locked) return;
        e.preventDefault();
        const start = svgPoint(svg, e.clientX, e.clientY);
        const startShape = JSON.parse(JSON.stringify(m.shape));
        let moved = false;
        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
          const dx = p.x - start.x, dy = p.y - start.y;
          if(!moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) moved = true;
          if(!moved) return;
          // Rebuild from startShape + delta to avoid cumulative drift.
          Object.assign(m.shape, JSON.parse(JSON.stringify(startShape)));
          moveShapeTo(m.shape, dx, dy);
          refreshMarkerNode(m);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
    markers.forEach(m => {
      if(!m.node) return;
      m.node.classList.add('comp-marker');
      m.node.style.cursor = 'grab';
      attachDrag(m);
    });

    let locked = false;
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'Prüfen';
    checkBtn.addEventListener('click', () => {
      if(locked) return;
      locked = true;
      checkBtn.disabled = true;
      if(markers.length === 0){ ui.fb.neutral('Keine Marker definiert.'); api.reportScore(0); return; }
      let correctCount = 0;
      markers.forEach(m => {
        const targetIdx = Number(m.shape.markerTargetIdx);
        const wantTarget = targets.find(t => t.idx === targetIdx);
        const ok = wantTarget && pointInTarget(shapeCenter(m.shape), wantTarget);
        m.node.classList.add(ok ? 'comp-graded-correct' : 'comp-graded-wrong');
        m.node.style.cursor = 'default';
        if(ok) correctCount++;
      });
      const pts = Math.round((correctCount / markers.length) * maxPoints * 100) / 100;
      api.reportScore(pts);
      const msg = correctCount + ' / ' + markers.length + ' Marker korrekt → ' + pts + ' / ' + maxPoints + ' Punkte.';
      if(correctCount === markers.length) ui.fb.ok(msg);
      else if(correctCount > 0)           ui.fb.neutral(msg);
      else                                ui.fb.bad(msg);
    });
    ui.buttons.appendChild(checkBtn);
    return {};
  }

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
