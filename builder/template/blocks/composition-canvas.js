// composition-canvas.js: SVG-based editor canvas for the composition
// block. Holds drag/resize/vertex-edit handlers, rubberband selection,
// inline label editing, and the canvas build itself. Pulled out of
// composition.js so that file can focus on state management.
//
// Stateless beyond ctx: composition.js calls CompositionCanvas.create
// once per builder mount, passing the selection / commit / render API.
// The factory closes over ctx and returns the entry points composition.js
// still needs (buildCanvas for the render loop; offsetShape + paste for
// keyboard shortcuts).
(function(){
  'use strict';

  const H = window.CompositionHelpers;
  if(!H) throw new Error("composition-canvas.js: window.CompositionHelpers not loaded.");
  const {
    NS,
    makeCompositionSnap, buildSnapIndicator, shapeSnapCandidates, labelMetrics, mathLabelY,
    polygonGetPoints, polygonPointsAttr, polygonCentroid,
    renderShape, buildSvg
  } = H;

  function createCanvasHandlers(ctx){
    const {
      block, host,
      render, commit,
      selIndices, isSelected,
      setSelection, setSingleSelection, toggleInSelection, clearSelection
    } = ctx;

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
        const m = labelMetrics(shape);
        return {
          x: shape.x - 2, y: shape.y - m.fs,
          w: Math.max(40, m.w) + 4,
          h: m.h + 4
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
        // Same display rules as the runtime (utils.fillMathTemplate).
        const sub = txt => window.BlockUtils.fillMathTemplate(String(txt || ''), rolled,
          window.BlockUtils.varFormats(block.config.variables, block.config));
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
        const u = window.BlockUtils;
        const hint = document.createElement('div');
        hint.className = 'comp-empty-hint';
        hint.innerHTML =
          '<div class="comp-empty-hint-arrow">↑</div>' +
          '<div class="comp-empty-hint-title">' + u.t('block.composition.canvas.empty.title') + '</div>' +
          '<div class="comp-empty-hint-body">' + u.t('block.composition.canvas.empty.body') + '</div>';
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
    
    // Inline edit (double-click): multi-line text field with a live preview
    // below it, in a foreignObject in place of the label. Line breaks are
    // real lines while editing and stored as <br>. Enter/blur saves,
    // Shift+Enter adds a line, Esc cancels.
    const toEditText = t => String(t || '').replace(/<br\s*\/?>/gi, '\n');
    const fromEditText = v => String(v || '').replace(/\r?\n/g, '<br>');
    let _measureCtx = null;
    function measureTextWidth(text, font){
      if(!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d');
      _measureCtx.font = font;
      return _measureCtx.measureText(text).width;
    }
    // Label text as the preview shows it: variables with sample values
    // (block + global), answer fields {1} / {} / {1*} as small boxes.
    function previewSource(text){
      const U = window.BlockUtils;
      const local = {};
      (block.config.variables || []).forEach(v => {
        if(!v || !v.name) return;
        const lo = Number(v.min), hi = Number(v.max);
        const a = Number.isFinite(lo) ? lo : 1, b = Number.isFinite(hi) ? hi : 10;
        local[v.name] = U.roundVarValue((a + b) / 2, v.integer !== false, v, block.config);
      });
      const vars = U.withGlobalVars ? U.withGlobalVars(local, block.config.variables) : local;
      // Answer fields first and only outside math ($…$ etc.): after the
      // variables are filled in, {a} inside a formula would look like {5}.
      const slots = String(text || '').split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/)
        .map((part, i) => i % 2 ? part : part.replace(/\{(\d+)(\*)?\}|\{\}/g, (m, n, star) =>
          '<span data-cslot="' + (n ? n + (star ? '*' : '') : '?') + '"></span>'))
        .join('');
      return U.fillMathTemplate(slots, vars, U.varFormats(block.config.variables, block.config));
    }
    function startInlineLabelEdit(node, idx, svg){
      const shape = block.config.shapes[idx];
      if(!shape || shape.type !== 'label') return;
      const U = window.BlockUtils;
      const fs = shape.fontSize || 18;
      const weight = shape.fontWeight || 400;
      const color = shape.color || '#003b5c';
      const font = weight + ' ' + (fs - 1) + 'px Verdana, Arial, sans-serif';
      const lineH = Math.round(fs * 1.3);
      const canvasW = Math.max(100, Number(block.config && block.config.canvasWidth) || 600);
      const maxW = Math.max(160, canvasW - (shape.x || 0) - 8);

      const fo = document.createElementNS(NS, 'foreignObject');
      fo.setAttribute('x', shape.x - 4);
      fo.setAttribute('y', (shape.y || 0) - fs - 2);
      fo.setAttribute('width', maxW);
      fo.style.overflow = 'visible';
      const wrap = document.createElement('div');
      wrap.className = 'comp-inline-edit';
      wrap.style.cssText = 'display:inline-flex; flex-direction:column; gap:4px; max-width:' + maxW + 'px;';

      const ta = document.createElement('textarea');
      ta.value = toEditText(shape.text);
      ta.rows = 1;
      ta.spellcheck = false;
      ta.placeholder = U.t('block.composition.canvas.labelInputPlaceholder');
      ta.style.cssText = 'display:block; box-sizing:border-box; resize:none; overflow:hidden; margin:0; ' +
        'font:' + font + '; line-height:' + lineH + 'px; ' +
        'padding:0.1rem 0.4rem; border:2px solid var(--primary, #003b5c); border-radius:4px; ' +
        'background:#fff; color:' + color + '; outline:none; white-space:pre;';
      wrap.appendChild(ta);

      // Live preview: same rendering as the canvas/runtime (HTML subset + KaTeX).
      const pv = document.createElement('div');
      pv.className = 'comp-inline-preview';
      pv.style.cssText = 'box-sizing:border-box; padding:0.3rem 0.5rem 0.4rem; border:1px dashed #9fb3c0; ' +
        'border-radius:4px; background:#f7fafc; pointer-events:none;';
      const pvHead = document.createElement('div');
      pvHead.textContent = U.t('block.composition.canvas.previewHead');
      pvHead.style.cssText = 'font:600 10px Verdana, Arial, sans-serif; color:#6b7785; margin-bottom:2px; white-space:nowrap;';
      const pvBody = document.createElement('div');
      pvBody.style.cssText = 'font:' + weight + ' ' + fs + 'px Verdana, Arial, sans-serif; line-height:1.25; color:' + color + '; white-space:nowrap;';
      pv.appendChild(pvHead);
      pv.appendChild(pvBody);
      wrap.appendChild(pv);
      fo.appendChild(wrap);

      function layout(){
        const lines = ta.value.split('\n');
        let w = 0;
        lines.forEach(l => { w = Math.max(w, measureTextWidth(l || ' ', font)); });
        ta.style.width = Math.min(maxW, Math.max(140, Math.ceil(w) + 28)) + 'px';
        ta.style.height = (lines.length * lineH + 8) + 'px';
        fo.setAttribute('height', Math.ceil(wrap.getBoundingClientRect().height / svgScale()) + 8);
      }
      // foreignObject sizes are in SVG units; the canvas may be scaled.
      function svgScale(){
        const r = svg.getBoundingClientRect();
        const vb = svg.viewBox && svg.viewBox.baseVal;
        return (vb && vb.width && r.width) ? r.width / vb.width : 1;
      }
      let pvTimer = 0;
      function updatePreview(){
        pvTimer = 0;
        pvBody.innerHTML = '';
        const src = fromEditText(ta.value);
        if(!src.trim()){
          pvBody.textContent = '–';
        } else {
          pvBody.appendChild(H.labelHtmlFragment(previewSource(src)));
          pvBody.querySelectorAll('[data-cslot]').forEach(m => {
            m.textContent = m.getAttribute('data-cslot').replace('?', '');
            m.style.cssText = 'display:inline-block; min-width:2.2em; padding:0 0.3em; margin:0 0.1em; border:1.5px solid #9fb3c0; ' +
              'border-radius:3px; background:#fff; color:#6b7785; font-size:0.75em; text-align:center; vertical-align:middle;';
          });
          if(U.renderMath) U.renderMath(pvBody);
        }
        layout();
      }
      const schedulePreview = () => { if(!pvTimer) pvTimer = setTimeout(updatePreview, 120); };

      // Hide the SVG text node and insert the editor in its place.
      node.style.display = 'none';
      node.parentNode.insertBefore(fo, node);
      updatePreview();
      ta.focus();
      ta.select();

      let done = false;
      function save(){
        if(done) return; done = true;
        clearTimeout(pvTimer);
        const v = fromEditText(ta.value);
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
        clearTimeout(pvTimer);
        fo.remove();
        node.style.display = '';
      }
      ta.addEventListener('input', () => { layout(); schedulePreview(); });
      ta.addEventListener('blur', save);
      ta.addEventListener('keydown', e => {
        // Shift+Enter: new line (textarea default); Enter alone saves.
        if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); save(); }
        else if(e.key === 'Escape'){ e.preventDefault(); cancel(); }
        else if(e.key === 'Enter') setTimeout(() => { layout(); schedulePreview(); }, 0);
        e.stopPropagation(); // don't bubble into composition's keydown
      });
      ta.addEventListener('mousedown', e => e.stopPropagation());
      ta.addEventListener('click', e => e.stopPropagation());
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
      } else if(shape.type === 'label' && node.tagName.toLowerCase() === 'foreignobject'){
        // KaTeX label: an HTML box whose y is its top edge, not the baseline.
        node.setAttribute('x', shape.x); node.setAttribute('y', mathLabelY(shape));
      } else if(shape.type === 'rect' || shape.type === 'label' || shape.type === 'image'){
        node.setAttribute('x', shape.x); node.setAttribute('y', shape.y);
        // Multi-line labels: continuation lines carry their own x.
        if(shape.type === 'label') node.querySelectorAll('tspan[x]').forEach(ts => ts.setAttribute('x', shape.x));
        if(shape.type === 'rect' || shape.type === 'image'){
          node.setAttribute('width',  shape.w);
          node.setAttribute('height', shape.h);
        }
      } else if(shape.type === 'coords' || shape.type === 'yesno'){
        // Coords / Ja-Nein fields are groups; cheapest update is replacing the node.
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
      else if(shape.type === 'rect' || shape.type === 'image' || shape.type === 'coords' || shape.type === 'yesno'){
        bx = shape.x; by = shape.y; bw = shape.w; bh = shape.h;
      }
      else if(shape.type === 'label'){
        const m = labelMetrics(shape);
        bx = shape.x - 2; by = shape.y - m.fs; bw = Math.max(40, m.w) + 4; bh = m.h + 4;
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
      if(shape.type === 'rect' || shape.type === 'image' || shape.type === 'coords' || shape.type === 'yesno'){
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
          } else if(shape.type === 'coords' || shape.type === 'yesno'){
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
      if(!window.__compClipboard) return false;
      const items = Array.isArray(window.__compClipboard) ? window.__compClipboard : [window.__compClipboard];
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
    

    return { buildCanvas, offsetShape, pasteFromClipboard };
  }

  window.CompositionCanvas = { create: createCanvasHandlers };
})();
