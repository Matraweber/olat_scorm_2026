// composition-toolbar-popovers.js: The "open X" popover functions for the
// composition editor's toolbar (formula picker, polygon presets, variable
// table, shape picker, variable dialog, template picker). Each is a factory
// returning popover-openers that close over the toolbar's ctx.
//
// Extracted from composition-toolbar.js to keep that file's main-toolbar
// build flow readable. Loaded before composition-toolbar.js; the toolbar
// reads window.CompositionToolbarPopovers(ctx) on each render.
(function(){
  'use strict';

  const H = window.CompositionHelpers;
  if(!H) throw new Error('composition-toolbar-popovers.js: window.CompositionHelpers not loaded.');
  const {
    SHAPE_ICONS,
    POLYGON_PRESETS, COMPOSITION_TEMPLATES,
    makePolygonFromPreset,
    shapeDisplayName,
    slotNumbersInLabel,
    buildSvg
  } = H;
  // Resolve i18n via BlockUtils; fall back to the key so a missing bundle
  // still shows something recognisable during dev.
  function _t(key, params){
    const u = window.BlockUtils;
    return (u && typeof u.t === 'function') ? u.t(key, params) : key;
  }

  window.CompositionToolbarPopovers = function(ctx){
    const {
      block, render, commit, commitQuiet,
      isSelected, setSingleSelection
    } = ctx;

    // Bewertung (formula picker per slot or legacy single-formula)
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
        luText.innerHTML = _t('block.composition.popover.grading.blankToggle');
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
        fmlLbl.textContent = slotN != null
          ? _t('block.composition.popover.grading.formulaForSlot', { slot: '{' + slotN + '}' })
          : _t('block.composition.popover.grading.formulaGeneric');
        fmlWrap.appendChild(fmlLbl);
        const fml = document.createElement('input');
        fml.type = 'text';
        fml.placeholder = _t('block.composition.popover.grading.formulaPlaceholder');
        fml.value = currentFormula || '';
        fml.title = _t('block.composition.popover.grading.formulaTitle');
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
          { label:'√',   ins:'sqrt()',  caret:5, title: _t('block.composition.popover.grading.helpSqrt') },
          { label:'π',   ins:'pi',      title: _t('block.composition.popover.grading.helpPi') },
          { label:'x²',  ins:'^2',      title: _t('block.composition.popover.grading.helpSquare') }
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
          sel2.title = _t('block.composition.popover.grading.varsSelectTitle');
          sel2.innerHTML = '<option value="">' + _t('block.composition.popover.grading.varsSelectPlaceholder') + '</option>' +
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
          slotSel.title = _t('block.composition.popover.grading.slotSelectTitle');
          slotSel.innerHTML = '<option value="">' + _t('block.composition.popover.grading.slotSelectPlaceholder') + '</option>' +
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
            ? _t('block.composition.popover.grading.multiSlotHintOne', { slot: '{' + numberedSlots[0] + '}' })
            : _t('block.composition.popover.grading.multiSlotHintMany');
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
          solLbl.textContent = _t('block.composition.popover.grading.staticLabel');
          solWrap.appendChild(solLbl);
          const sol = document.createElement('input');
          sol.type = 'text';
          sol.placeholder = _t('block.composition.popover.grading.staticPlaceholder');
          sol.value = sel.correctText || '';
          sol.title = _t('block.composition.popover.grading.staticTitle');
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

    // Polygon preset picker
    function openPolygonPicker(anchorEl){
      document.querySelectorAll('.comp-poly-popover').forEach(n => n.remove());
      const pop = document.createElement('div');
      pop.className = 'comp-poly-popover';
      pop.addEventListener('click', e => e.stopPropagation());

      const head = document.createElement('div');
      head.className = 'comp-tpl-popover-head';
      head.innerHTML = '<strong>' + _t('block.composition.popover.polygon.title') + '</strong>' +
        '<span style="font-size:0.78rem;color:#5d6872;">' + _t('block.composition.popover.polygon.subtitle') + '</span>';
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

    // Variable table (edit all variables at once)
    function openVariableTable(anchorEl){
      document.querySelectorAll('.comp-var-dialog').forEach(n => n.remove());
      const pop = document.createElement('div');
      pop.className = 'comp-var-dialog comp-var-table';
      pop.addEventListener('click', e => e.stopPropagation());

      const head = document.createElement('div');
      head.className = 'comp-var-dialog-head';
      head.innerHTML = '<strong>' + _t('block.composition.popover.varTable.title') + '</strong>' +
        '<span style="font-size:0.78rem;color:#5d6872;">' + _t('block.composition.popover.varTable.subtitle') + '</span>';
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

      function renderRows(){
        table.innerHTML =
          '<thead><tr>' +
            '<th style="width:60px;">' + _t('block.composition.popover.varTable.colName') + '</th>' +
            '<th>' + _t('block.composition.popover.varTable.colMin') + '</th>' +
            '<th>' + _t('block.composition.popover.varTable.colMax') + '</th>' +
            '<th style="width:60px;">' + _t('block.composition.popover.varTable.colInteger') + '</th>' +
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
            '<td><button data-act="del" class="icon-btn danger" title="' + _t('block.composition.popover.varTable.removeTitle') + '">✕</button></td>';
          tr.querySelector('[data-k="name"]').addEventListener('input', e => row.name = e.target.value.trim());
          tr.querySelector('[data-k="min"]').addEventListener('input', e => row.min = Number(e.target.value));
          tr.querySelector('[data-k="max"]').addEventListener('input', e => row.max = Number(e.target.value));
          tr.querySelector('[data-k="integer"]').addEventListener('change', e => row.integer = e.target.checked);
          tr.querySelector('[data-act="del"]').addEventListener('click', () => {
            rows.splice(idx, 1); renderRows();
          });
          tb.appendChild(tr);
        });
        table.appendChild(tb);
      }
      renderRows();

      const addRow = document.createElement('button');
      addRow.type = 'button';
      addRow.className = 'comp-tool-btn-text';
      addRow.textContent = _t('block.composition.popover.varTable.addRow');
      addRow.style.cssText = 'margin-top:0.5rem;width:100%;';
      addRow.addEventListener('click', () => {
        rows.push({ name: nextFreeName(), min: 1, max: 10, integer: true });
        renderRows();
      });
      pop.appendChild(addRow);

      const actions = document.createElement('div');
      actions.className = 'comp-var-dialog-actions';
      actions.innerHTML =
        '<button class="comp-tool-btn-text" data-act="cancel" type="button">' + _t('block.composition.popover.varTable.cancel') + '</button>' +
        '<button class="comp-tool-btn-text comp-tool-template" data-act="ok" type="button">' + _t('block.composition.popover.varTable.save') + '</button>';
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
          if(!r.name){ alert(_t('block.composition.popover.varTable.validate.needName')); return; }
          if(!/^[a-zA-Z_]\w*$/.test(r.name)){ alert(_t('block.composition.popover.varTable.validate.invalidName', { name: r.name })); return; }
          if(seen.has(r.name)){ alert(_t('block.composition.popover.varTable.validate.duplicateName', { name: r.name })); return; }
          seen.add(r.name);
          if(!isFinite(r.min) || !isFinite(r.max) || r.min > r.max){
            alert(_t('block.composition.popover.varTable.validate.rangeInvalid', { name: r.name }));
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

    // Quick shape picker (list of shapes for selection)
    function openShapePicker(anchorEl){
      document.querySelectorAll('.comp-shape-picker').forEach(n => n.remove());
      const pop = document.createElement('div');
      pop.className = 'comp-var-dialog comp-shape-picker';
      pop.addEventListener('click', e => e.stopPropagation());

      const head = document.createElement('div');
      head.className = 'comp-var-dialog-head';
      head.innerHTML = '<strong>' + _t('block.composition.popover.shapes.title') + '</strong>' +
        '<span style="font-size:0.78rem;color:#5d6872;">' + _t('block.composition.popover.shapes.subtitle') + '</span>';
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

    // Add-variable mini-form
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
        '<div class="comp-var-dialog-head"><strong>' + _t('block.composition.popover.varAdd.title') + '</strong>' +
        '<span style="font-size:0.78rem;color:#5d6872;">' + _t('block.composition.popover.varAdd.subtitle') + '</span></div>' +
        '<div class="comp-var-dialog-row"><label>' + _t('block.composition.popover.varAdd.name') + '</label><input data-k="name" type="text" maxlength="20" placeholder="a" value="' + suggested + '"/></div>' +
        '<div class="comp-var-dialog-row"><label>' + _t('block.composition.popover.varAdd.min') + '</label><input data-k="min" type="number" value="1"/></div>' +
        '<div class="comp-var-dialog-row"><label>' + _t('block.composition.popover.varAdd.max') + '</label><input data-k="max" type="number" value="10"/></div>' +
        '<div class="comp-var-dialog-row"><label></label><label class="comp-var-dialog-check"><input data-k="integer" type="checkbox" checked/> ' + _t('block.composition.popover.varAdd.integerOnly') + '</label></div>' +
        '<div class="comp-var-dialog-actions">' +
        '<button class="comp-tool-btn-text" data-act="cancel" type="button">' + _t('block.composition.popover.varAdd.cancel') + '</button>' +
        '<button class="comp-tool-btn-text comp-tool-template" data-act="ok" type="button">' + _t('block.composition.popover.varAdd.add') + '</button>' +
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
          alert(_t('block.composition.popover.varAdd.validate.startWithLetter')); return;
        }
        if(used.has(name)){
          alert(_t('block.composition.popover.varAdd.validate.exists', { name })); return;
        }
        if(!isFinite(min) || !isFinite(max) || min > max){
          alert(_t('block.composition.popover.varAdd.validate.rangeInvalid')); return;
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

    // Template helpers
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
        _t('block.composition.popover.templateChooser.question', { name: tpl.label }) + '</div>' +
        '<div class="comp-tpl-choose-actions">' +
        '<button class="comp-tool-btn-text" data-act="cancel">' + _t('block.composition.popover.templateChooser.cancel') + '</button>' +
        '<button class="comp-tool-btn-text" data-act="append">' + _t('block.composition.popover.templateChooser.append') + '</button>' +
        '<button class="comp-tool-btn-text comp-tool-template" data-act="replace">' + _t('block.composition.popover.templateChooser.replace') + '</button>' +
        '</div>' +
        '<div style="font-size:0.74rem;color:#5d6872;margin-top:0.5rem;">' +
        _t('block.composition.popover.templateChooser.explain') + '</div>';
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
      head.innerHTML = '<strong>' + _t('block.composition.popover.template.title') + '</strong>' +
        '<span style="font-size:0.78rem;color:#5d6872;">' + _t('block.composition.popover.template.subtitle') + '</span>';
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

    return {
      openBewertungPopover,
      openPolygonPicker,
      openVariableTable,
      openShapePicker,
      openVariableDialog,
      openTemplatePicker
    };
  };
})();
