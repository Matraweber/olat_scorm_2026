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
  if(!window.CompositionToolbarPopovers) throw new Error("composition-toolbar.js: window.CompositionToolbarPopovers not loaded. Ensure composition-toolbar-popovers.js is loaded first.");
  const {
    shapeLabel, SHAPE_ICONS, ACTION_ICONS,
    NONE_FILL, NONE_STROKE,
    isNoneColor, newShape,
    pickImageDataUrl,
    slotNumbersInLabel,
    regularPolygonPoints, polygonGetPoints, polygonCentroid
  } = H;
  // Short helper: prefer window.BlockUtils.t but return the key on fallback.
  function _t(key, params){
    const u = window.BlockUtils;
    return (u && typeof u.t === 'function') ? u.t(key, params) : key;
  }

  function buildToolbar(ctx){
    const {
      block, host,
      render, commit, commitQuiet,
      selIndices, setSingleSelection, getSelected,
      bringForward, sendBackward, duplicateSelected, deleteSelected
    } = ctx;

      const sel = getSelected();
      // Popover-opener functions (template picker, polygon presets, etc.)
      // live in a sibling file for size reasons. The factory closes over
      // ctx, so popover-internals don't need ctx threaded as arguments.
      const pops = window.CompositionToolbarPopovers(ctx);
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
      mkToolBtn('move',  _t('block.composition.toolbar.tool.move'),
        '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M10 2 L13 5 L11 5 L11 9 L15 9 L15 7 L18 10 L15 13 L15 11 L11 11 L11 15 L13 15 L10 18 L7 15 L9 15 L9 11 L5 11 L5 13 L2 10 L5 7 L5 9 L9 9 L9 5 L7 5 Z"/></svg>');
      mkToolBtn('select', _t('block.composition.toolbar.tool.select'),
        '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="1" stroke-dasharray="3 2"/><path d="M9 9 L13 13 M11 13 L13 13 L13 11" fill="currentColor"/></svg>');
      bar.appendChild(toolGroup);
    
      // Template picker: mini previews of all built-in compositions.
      const tplGroup = document.createElement('div');
      tplGroup.className = 'comp-tool-group';
      const tplBtn = document.createElement('button');
      tplBtn.type = 'button';
      tplBtn.className = 'comp-tool-btn-text comp-tool-template';
      tplBtn.title = _t('block.composition.toolbar.template.title');
      tplBtn.textContent = _t('block.composition.toolbar.template.label');
      tplBtn.addEventListener('click', e => {
        e.stopPropagation();
        pops.openTemplatePicker(tplBtn);
      });
      tplGroup.appendChild(tplBtn);
      bar.appendChild(tplGroup);
    
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

      // Add-shape buttons
      const addGroup = document.createElement('div');
      addGroup.className = 'comp-tool-group';
      ['line','arrow','circle','ellipse','polygon','rect','label','coords','image'].forEach(type => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'comp-tool-btn';
        btn.title = _t('block.composition.toolbar.addShape', { name: shapeLabel(type) });
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
            pops.openPolygonPicker(btn);
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
        'none':        _t('block.composition.toolbar.mode.none'),
        'acknowledge': _t('block.composition.toolbar.mode.acknowledge'),
        'fillblanks':  _t('block.composition.toolbar.mode.fillblanks')
      };
      // Mode chip opens an inline dropdown.
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'comp-mode-chip comp-mode-chip-button';
      chip.title = _t('block.composition.toolbar.mode.chipTitle');
      chip.innerHTML = '<strong>' + (modeLabels[_gradingMode] || _gradingMode) + '</strong> <span class="comp-mode-chip-caret">▾</span>';
      chip.setAttribute('aria-label', _t('block.composition.toolbar.mode.aria', { name: modeLabels[_gradingMode] || _gradingMode }));
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
        addVarBtn.title = _t('block.composition.toolbar.addVariable.title');
        addVarBtn.textContent = _t('block.composition.toolbar.addVariable.label');
        addVarBtn.addEventListener('click', e => {
          e.stopPropagation();
          pops.openVariableDialog(addVarBtn);
        });
      } else {
        const key = existingVars.length === 1
          ? 'block.composition.toolbar.editVariables.titleSingular'
          : 'block.composition.toolbar.editVariables.titlePlural';
        addVarBtn.title = _t(key, { count: existingVars.length });
        addVarBtn.textContent = _t('block.composition.toolbar.editVariables.label', { count: existingVars.length });
        addVarBtn.addEventListener('click', e => {
          e.stopPropagation();
          pops.openVariableTable(addVarBtn);
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
        const shapesTitleKey = shapes.length === 1
          ? 'block.composition.toolbar.shapes.titleSingular'
          : 'block.composition.toolbar.shapes.titlePlural';
        shapesBtn.title = _t(shapesTitleKey, { count: shapes.length });
        shapesBtn.textContent = _t('block.composition.toolbar.shapes.label', { count: shapes.length });
        shapesBtn.addEventListener('click', e => {
          e.stopPropagation();
          pops.openShapePicker(shapesBtn);
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
          noBtn.title = transparent
            ? _t('block.composition.toolbar.transparent.activeTitle')
            : _t('block.composition.toolbar.transparent.setTitle');
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
        const label = (sel && sel.type === 'label') ? _t('block.composition.toolbar.color.text')
                    : (sel && sel.type === 'coords') ? _t('block.composition.toolbar.color.axis')
                    : _t('block.composition.toolbar.color.stroke');
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
          _t('block.composition.toolbar.color.fill'),
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
        sLbl.textContent = _t('block.composition.toolbar.polygon.cornersLabel');
        styleGroup.appendChild(sLbl);
        const sInp = document.createElement('input');
        sInp.type = 'number'; sInp.min = '3'; sInp.max = '20'; sInp.step = '1';
        sInp.className = 'comp-tool-num';
        sInp.value = sel.sides ?? 3;
        sInp.title = _t('block.composition.toolbar.polygon.cornersTitle');
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
        regBtn.textContent = _t('block.composition.toolbar.polygon.regularLabel');
        regBtn.title = _t('block.composition.toolbar.polygon.regularTitle');
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
        swLbl.textContent = _t('block.composition.toolbar.strokeWidthLabel');
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
        dashSel.title = _t('block.composition.toolbar.dash.title');
        [
          ['solid',  _t('block.composition.toolbar.dash.solid')],
          ['dashed', _t('block.composition.toolbar.dash.dashed')],
          ['dotted', _t('block.composition.toolbar.dash.dotted')]
        ].forEach(([v, lbl]) => {
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
        ti.placeholder = _t('block.composition.toolbar.label.textPlaceholder');
        ti.title = _t('block.composition.toolbar.label.textTitle');
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
        insertBtn.title = _t('block.composition.toolbar.insert.title');
        insertBtn.textContent = _t('block.composition.toolbar.insert.label');
        insertBtn.addEventListener('click', e => {
          e.stopPropagation();
          document.querySelectorAll('.comp-insert-popover').forEach(n => n.remove());
          const pop = document.createElement('div');
          pop.className = 'comp-insert-popover';
          pop.addEventListener('click', ev => ev.stopPropagation());
          // Solution fields: numbered slots {N} and answer-mirrors {N*}.
          const hSol = document.createElement('div'); hSol.className = 'comp-insert-head'; hSol.textContent = _t('block.composition.popover.insert.solutionsHead');
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
          newSlotBtn.title = _t('block.composition.popover.insert.newSlotTitle', { slot: nextSlot });
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
            mirBtn.title = _t('block.composition.popover.insert.mirrorTitle', { slot: n });
            mirBtn.addEventListener('click', () => { tiInsertAtCaret('{' + n + '*}'); pop.remove(); });
            solRow.appendChild(mirBtn);
          });
          pop.appendChild(solRow);
    
          // Help line so professors discover the feature.
          const hint = document.createElement('div');
          hint.style.cssText = 'font-size:0.72rem; color:#5d6872; padding:0.3rem 0.5rem 0.4rem; line-height:1.35;';
          hint.innerHTML = _t('block.composition.popover.insert.hint');
          pop.appendChild(hint);
          if(definedVars.length > 0){
            const h = document.createElement('div'); h.className = 'comp-insert-head'; h.textContent = _t('block.composition.popover.insert.variablesHead');
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
          const h2 = document.createElement('div'); h2.className = 'comp-insert-head'; h2.textContent = _t('block.composition.popover.insert.symbolsHead');
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
        fs.title = _t('block.composition.toolbar.label.fontSizeTitle');
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
        mkToggle('showGrid',   _t('block.composition.toolbar.coords.showGrid'),   true);
        mkToggle('showLabels', _t('block.composition.toolbar.coords.showLabels'), true);
    
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
          inp.title = _t('block.composition.toolbar.coords.rangeTitle', { name: label });
          inp.addEventListener('input', () => {
            const v = parseFloat(inp.value);
            if(!isNaN(v)){ sel[key] = v; commit(); }
          });
          styleGroup.appendChild(inp);
        };
        mkRange('xMin', _t('block.composition.toolbar.coords.xMin'), -5);
        mkRange('xMax', _t('block.composition.toolbar.coords.xMax'),  5);
        mkRange('yMin', _t('block.composition.toolbar.coords.yMin'), -3);
        mkRange('yMax', _t('block.composition.toolbar.coords.yMax'),  3);
    
        const stepLbl = document.createElement('span');
        stepLbl.className = 'comp-tool-label';
        stepLbl.textContent = _t('block.composition.toolbar.coords.step');
        styleGroup.appendChild(stepLbl);
        const stepInp = document.createElement('input');
        stepInp.type = 'number';
        stepInp.className = 'comp-tool-num';
        stepInp.step = '0.5'; stepInp.min = '0.01';
        stepInp.value = sel.step != null ? sel.step : 1;
        stepInp.title = _t('block.composition.toolbar.coords.stepTitle');
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
        replace.textContent = _t('block.composition.toolbar.image.replace');
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
          mkToggle('isCorrect', _t('block.composition.toolbar.grading.isCorrect'),
            () => sel.isCorrect, v => { sel.isCorrect = v; });
        }
        if(gMode === 'fillblanks' && sel.type === 'label'){
          // Formula popover only shows once the label has {}/{N} or legacy blank=true.
          const hasInline = !!(sel.text && (sel.text.indexOf('{}') >= 0 || slotNumbersInLabel(sel.text).length > 0));
          if(hasInline || sel.blank){
            const bewBtn = document.createElement('button');
            bewBtn.type = 'button';
            bewBtn.className = 'comp-tool-btn-text comp-tool-template';
            bewBtn.title = _t('block.composition.toolbar.grading.formulaTitle');
            bewBtn.textContent = _t('block.composition.toolbar.grading.formulaLabel');
            bewBtn.addEventListener('click', e => {
              e.stopPropagation();
              pops.openBewertungPopover(bewBtn, sel);
            });
            styleGroup.appendChild(bewBtn);
          }
        }
        if(gMode === 'hotspot'){
          mkToggle('isTarget', _t('block.composition.toolbar.grading.isTarget'),
            () => sel.isTarget, v => { sel.isTarget = v; if(v) sel.isMarker = false; });
          mkToggle('isMarker', _t('block.composition.toolbar.grading.isMarker'),
            () => sel.isMarker, v => { sel.isMarker = v; if(v) sel.isTarget = false; });
          if(sel.isMarker){
            // Pick the target's shapes-array idx.
            const targetOpts = (block.config.shapes || [])
              .map((s, i) => s.isTarget ? { idx: i, label: _t('block.composition.toolbar.grading.targetOption', { idx: i, name: shapeLabel(s.type) }) } : null)
              .filter(Boolean);
            const dd = document.createElement('select');
            dd.className = 'comp-tool-select';
            dd.title = _t('block.composition.toolbar.grading.targetTitle');
            const none = document.createElement('option');
            none.value = ''; none.textContent = _t('block.composition.toolbar.grading.targetChoose');
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
        mkActionBtn(_t('block.composition.toolbar.action.forward'),   ACTION_ICONS.forward,   () => bringForward());
        mkActionBtn(_t('block.composition.toolbar.action.backward'),  ACTION_ICONS.backward,  () => sendBackward());
        mkActionBtn(_t('block.composition.toolbar.action.duplicate'), ACTION_ICONS.duplicate, () => duplicateSelected());
        mkActionBtn(_t('block.composition.toolbar.action.delete'),    ACTION_ICONS.delete,    () => deleteSelected(), true);
        bar.appendChild(rightGroup);
      }
    
      return bar;
  }

  window.CompositionToolbar = { build: buildToolbar };
})();
