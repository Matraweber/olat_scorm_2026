// composition-toolbar.js: Builds the top-of-canvas toolbar for the
// composition editor (tool tabs, colour pickers, z-order buttons,
// shape add-menu, etc.). Pulled out of composition.js to keep that
// file focused on state management and canvas interaction.
//
// The toolbar is rebuilt every render() call, so it's stateless beyond
// what ctx provides. All shared editor state is passed through ctx;
// the toolbar must not capture anything beyond its arguments.
(function(){
  'use strict';

  const H = window.CompositionHelpers;
  if(!H) throw new Error("composition-toolbar.js: window.CompositionHelpers not loaded.");
  const {
    SHAPE_LABELS, SHAPE_ICONS, ACTION_ICONS,
    NONE_FILL, NONE_STROKE,
    POLYGON_PRESETS, COMPOSITION_TEMPLATES,
    isNoneColor, newShape, makePolygonFromPreset,
    pickImageDataUrl, shapeDisplayName,
    slotNumbersInLabel,
    regularPolygonPoints, polygonGetPoints, polygonCentroid,
    buildSvg
  } = H;

  function buildToolbar(ctx){
    const {
      block, host,
      render, commit, commitQuiet,
      selIndices, isSelected, setSingleSelection, getSelected,
      bringForward, sendBackward, duplicateSelected, deleteSelected
    } = ctx;

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

  window.CompositionToolbar = { build: buildToolbar };
})();
