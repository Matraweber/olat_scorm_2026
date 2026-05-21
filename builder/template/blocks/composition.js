(function(){
  'use strict';

  // Module-scope clipboard, shared across composition blocks so Ctrl+C in
  // one and Ctrl+V in another works.
  let _compClipboard = null;

  const NS = 'http://www.w3.org/2000/svg';
  const DASH = { solid: '', dashed: '10 5', dotted: '2 4' };
  const SHAPE_LABELS = {
    line:'Linie', arrow:'Pfeil', circle:'Kreis', ellipse:'Ellipse', polygon:'Polygon',
    rect:'Rechteck', label:'Beschriftung', coords:'Koordinatensystem', image:'Bild'
  };
  // Inline SVG icons for toolbar shape buttons.
  const SHAPE_ICONS = {
    line:    '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="16" x2="17" y2="4"/></svg>',
    arrow:   '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="10" x2="15" y2="10"/><polyline points="11,6 17,10 11,14"/></svg>',
    circle:  '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="6"/></svg>',
    ellipse: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="10" cy="10" rx="8" ry="5"/></svg>',
    polygon: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="10,3 17,16 3,16"/></svg>',
    rect:    '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="12" height="10" rx="1"/></svg>',
    label:   '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><text x="3" y="15" font-size="14" font-family="Verdana, sans-serif" font-weight="700">T</text></svg>',
    coords:  '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17 L4 3 M2 5 L4 3 L6 5"/><path d="M4 17 L18 17 M16 15 L18 17 L16 19"/></svg>',
    image:   '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="14" height="12" rx="1"/><circle cx="8" cy="9" r="1.3" fill="currentColor" stroke="none"/><path d="M3 14 L8 10 L13 14 L17 11"/></svg>'
  };

  // Action-button icons (z-order, duplicate, delete) in the right toolbar
  // group when a shape is selected.
  const ACTION_ICONS = {
    forward:   '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="7" width="10" height="10" rx="1" fill="#fff"/><rect x="7" y="3" width="10" height="10" rx="1" fill="currentColor" fill-opacity="0.15"/></svg>',
    backward:  '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="7" y="3" width="10" height="10" rx="1" fill="#fff"/><rect x="3" y="7" width="10" height="10" rx="1" fill="currentColor" fill-opacity="0.15"/></svg>',
    duplicate: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="11" height="11" rx="1"/><rect x="6" y="6" width="11" height="11" rx="1" fill="#fff"/></svg>',
    delete:    '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 6h10M8 6V4h4v2M6 6l1 11h6l1-11" stroke-linecap="round"/></svg>',
    // Crossed-out square: transparent/no-fill toggle.
    transparent: '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="3.5" width="13" height="13" rx="2"/><line x1="4" y1="16" x2="16" y2="4"/></svg>'
  };

  // 'none' (fill) / 'transparent' (stroke): SVG/CSS sentinels for no paint.
  const NONE_FILL = 'none';
  const NONE_STROKE = 'transparent';
  function isNoneColor(v){ return v === 'none' || v === 'transparent' || v === '' || v == null; }

  // Shape factory used by the toolbar add-buttons and the right-pane
  // action handler.
  const SHAPE_DEFAULTS = {
    line:    () => ({ type:'line',    x1: 80, y1: 80, x2: 260, y2: 80,  color:'#003b5c', strokeWidth: 3, dash:'solid' }),
    arrow:   () => ({ type:'arrow',   x1: 80, y1: 80, x2: 260, y2: 80,  color:'#003b5c', strokeWidth: 3, dash:'solid' }),
    circle:  () => ({ type:'circle',  cx:140, cy:140, r: 60,            color:'#003b5c', fill:'#a1d884', strokeWidth: 3, dash:'solid' }),
    ellipse: () => ({ type:'ellipse', cx:160, cy:140, rx: 90, ry: 50,   color:'#003b5c', fill:'#a1d884', strokeWidth: 3, dash:'solid' }),
    polygon: () => {
      // Start as a regular 3-gon already in editable representation.
      // cx/cy/r/sides stay around for "Regulär machen" + Ecken input.
      const cx = 160, cy = 140, r = 70, sides = 3;
      return { type:'polygon', cx, cy, r, sides,
               points: regularPolygonPoints(cx, cy, r, sides),
               color:'#003b5c', fill:'#a1d884', strokeWidth: 3, dash:'solid' };
    },
    rect:    () => ({ type:'rect',    x: 80, y: 80, w:220, h:120,       color:'#003b5c', fill:'#eef5f8', strokeWidth: 3, dash:'solid' }),
    label:   () => ({ type:'label',   x: 80, y:120, text:'Beschriftung',color:'#003b5c', fontSize:24, fontWeight:'700' }),
    coords:  () => ({ type:'coords',  x: 60, y: 60, w:320, h:220,
                      xMin:-5, xMax:5, yMin:-3, yMax:3, step:1,
                      showGrid:true, showLabels:true, color:'#003b5c' }),
    image:   () => ({ type:'image',   x: 80, y: 80, w:240, h:160, src:'' })
  };
  function newShape(type){
    const factory = SHAPE_DEFAULTS[type];
    return factory ? factory() : { type };
  }

  // Pick an image via hidden <input type=file>, return its data URL.
  // Resolves with null on cancel.
  function pickImageDataUrl(){
    return new Promise(resolve => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.style.position = 'absolute'; inp.style.left = '-9999px';
      document.body.appendChild(inp);
      let resolved = false;
      const cleanup = () => {
        if(resolved) return;
        resolved = true;
        if(inp.parentNode) inp.parentNode.removeChild(inp);
      };
      inp.addEventListener('change', () => {
        const file = inp.files && inp.files[0];
        if(!file){ cleanup(); resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => { cleanup(); resolve(reader.result); };
        reader.onerror = () => { cleanup(); resolve(null); };
        reader.readAsDataURL(file);
      });
      // Cancel-via-OS-dialog: no `change` fires but the window regains focus.
      window.addEventListener('focus', function onFocus(){
        window.removeEventListener('focus', onFocus);
        setTimeout(() => { if(!inp.files || !inp.files[0]){ cleanup(); resolve(null); } }, 250);
      });
      inp.click();
    });
  }

  function shapeSummary(item){
    if(!item || !item.type) return 'leer';
    const name = SHAPE_LABELS[item.type] || item.type;
    if(item.type === 'label')  return name + ': "' + String(item.text || '').slice(0, 30) + '"';
    if(item.type === 'circle') return name + '  (r=' + (item.r ?? '?') + ')';
    if(item.type === 'ellipse') return name + '  (' + (item.rx ?? '?') + '×' + (item.ry ?? '?') + ')';
    if(item.type === 'polygon') return name + '  (' + (item.sides ?? 3) + ' Ecken)';
    if(item.type === 'rect' || item.type === 'image' || item.type === 'coords')
      return name + '  (' + (item.w ?? '?') + '×' + (item.h ?? '?') + ')';
    return name;
  }

  // Regular n-gon vertices, starting at top (angle -π/2), clockwise.
  function regularPolygonPoints(cx, cy, r, sides){
    const n = Math.max(3, Math.round(Number(sides) || 3));
    const radius = Math.max(1, Number(r) || 10);
    const pts = [];
    for(let i = 0; i < n; i++){
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
    }
    return pts;
  }
  // Return polygon vertices. Free-form uses shape.points; legacy regular
  // polygons compute from cx/cy/r/sides.
  function polygonGetPoints(shape){
    if(Array.isArray(shape.points) && shape.points.length >= 3){
      return shape.points.map(p => Array.isArray(p) ? [Number(p[0]) || 0, Number(p[1]) || 0] : [0, 0]);
    }
    return regularPolygonPoints(
      Number(shape.cx) || 0,
      Number(shape.cy) || 0,
      Number(shape.r)  || 10,
      Number(shape.sides) || 3
    );
  }
  function polygonPointsAttr(shape){
    return polygonGetPoints(shape).map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');
  }
  // Centroid: fixed point for uniform scaling.
  function polygonCentroid(shape){
    const pts = polygonGetPoints(shape);
    let sx = 0, sy = 0;
    pts.forEach(p => { sx += p[0]; sy += p[1]; });
    return { x: sx / pts.length, y: sy / pts.length };
  }

  // Pure SVG render, shared by runtime mount, builder editor, and preview.
  function buildArrowhead(color, id){
    const m = document.createElementNS(NS, 'marker');
    m.setAttribute('id', id);
    m.setAttribute('viewBox', '0 0 10 10');
    m.setAttribute('refX', '9'); m.setAttribute('refY', '5');
    m.setAttribute('markerWidth', '6'); m.setAttribute('markerHeight', '6');
    m.setAttribute('orient', 'auto-start-reverse');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    p.setAttribute('fill', color);
    m.appendChild(p);
    return m;
  }
  // Cartesian coordinate system as an SVG <g>, positioned at (shape.x,
  // shape.y) so moving the whole system is just two attribute changes.
  function renderCoords(shape){
    const g = document.createElementNS(NS, 'g');
    const x = Number(shape.x) || 0;
    const y = Number(shape.y) || 0;
    const w = Math.max(40, Number(shape.w) || 200);
    const h = Math.max(40, Number(shape.h) || 150);
    const xMin = Number(shape.xMin ?? -5);
    const xMax = Number(shape.xMax ??  5);
    const yMin = Number(shape.yMin ?? -3);
    const yMax = Number(shape.yMax ??  3);
    const step = Math.max(0.01, Number(shape.step) || 1);
    const axisColor  = shape.color || '#003b5c';
    const gridColor  = '#d8e0e6';
    const labelColor = '#5d6872';
    const toSvgX = dx => x + (dx - xMin) / (xMax - xMin) * w;
    const toSvgY = dy => y + (yMax - dy) / (yMax - yMin) * h;

    // Invisible hit-rect so the whole area is draggable, not just the axes.
    const hit = document.createElementNS(NS, 'rect');
    hit.setAttribute('x', x); hit.setAttribute('y', y);
    hit.setAttribute('width', w); hit.setAttribute('height', h);
    hit.setAttribute('fill', 'transparent');
    g.appendChild(hit);

    if(shape.showGrid !== false){
      for(let v = Math.ceil(xMin / step) * step; v <= xMax + 1e-9; v += step){
        if(Math.abs(v) < 1e-9) continue;
        const sx = toSvgX(v);
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', sx); ln.setAttribute('y1', y);
        ln.setAttribute('x2', sx); ln.setAttribute('y2', y + h);
        ln.setAttribute('stroke', gridColor); ln.setAttribute('stroke-width', 1);
        g.appendChild(ln);
      }
      for(let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step){
        if(Math.abs(v) < 1e-9) continue;
        const sy = toSvgY(v);
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x); ln.setAttribute('y1', sy);
        ln.setAttribute('x2', x + w); ln.setAttribute('y2', sy);
        ln.setAttribute('stroke', gridColor); ln.setAttribute('stroke-width', 1);
        g.appendChild(ln);
      }
    }
    // Axes (draw only the portions visible inside [xMin..xMax], [yMin..yMax]).
    if(yMin <= 0 && yMax >= 0){
      const sy = toSvgY(0);
      const ax = document.createElementNS(NS, 'line');
      ax.setAttribute('x1', x); ax.setAttribute('y1', sy);
      ax.setAttribute('x2', x + w); ax.setAttribute('y2', sy);
      ax.setAttribute('stroke', axisColor); ax.setAttribute('stroke-width', 1.6);
      g.appendChild(ax);
    }
    if(xMin <= 0 && xMax >= 0){
      const sx = toSvgX(0);
      const ax = document.createElementNS(NS, 'line');
      ax.setAttribute('x1', sx); ax.setAttribute('y1', y);
      ax.setAttribute('x2', sx); ax.setAttribute('y2', y + h);
      ax.setAttribute('stroke', axisColor); ax.setAttribute('stroke-width', 1.6);
      g.appendChild(ax);
    }
    if(shape.showLabels !== false){
      const baseY = (yMin <= 0 && yMax >= 0) ? toSvgY(0) + 12 : y + h - 4;
      const baseX = (xMin <= 0 && xMax >= 0) ? toSvgX(0) - 6 : x - 4;
      for(let v = Math.ceil(xMin / step) * step; v <= xMax + 1e-9; v += step){
        if(Math.abs(v) < 1e-9) continue;
        const tx = document.createElementNS(NS, 'text');
        tx.setAttribute('x', toSvgX(v)); tx.setAttribute('y', baseY);
        tx.setAttribute('font-size', '11'); tx.setAttribute('font-family', 'Verdana, sans-serif');
        tx.setAttribute('fill', labelColor); tx.setAttribute('text-anchor', 'middle');
        tx.textContent = Number(v.toFixed(2));
        g.appendChild(tx);
      }
      for(let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step){
        if(Math.abs(v) < 1e-9) continue;
        const tx = document.createElementNS(NS, 'text');
        tx.setAttribute('x', baseX); tx.setAttribute('y', toSvgY(v) + 4);
        tx.setAttribute('font-size', '11'); tx.setAttribute('font-family', 'Verdana, sans-serif');
        tx.setAttribute('fill', labelColor); tx.setAttribute('text-anchor', 'end');
        tx.textContent = Number(v.toFixed(2));
        g.appendChild(tx);
      }
    }
    return g;
  }

  // Placeholder for an image shape with no src yet.
  function placeholderImage(){
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">' +
      '<rect width="240" height="160" fill="#f5f8fa" stroke="#d8e0e6" stroke-dasharray="6 4"/>' +
      '<text x="120" y="86" text-anchor="middle" font-family="Verdana,sans-serif" font-size="13" fill="#5d6872">Bild auswählen…</text>' +
      '</svg>'
    );
  }

  function renderShape(shape, defs, idx, idPrefix){
    if(!shape || !shape.type) return null;
    const color = shape.color || '#003b5c';
    const sw = Number(shape.strokeWidth) || 2;
    const dashAttr = DASH[shape.dash || 'solid'] || '';
    let el = null;
    if(shape.type === 'line' || shape.type === 'arrow'){
      el = document.createElementNS(NS, 'line');
      el.setAttribute('x1', shape.x1 ?? 0); el.setAttribute('y1', shape.y1 ?? 0);
      el.setAttribute('x2', shape.x2 ?? 100); el.setAttribute('y2', shape.y2 ?? 0);
      el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
      el.setAttribute('stroke-linecap', 'round');
      if(dashAttr) el.setAttribute('stroke-dasharray', dashAttr);
      if(shape.type === 'arrow'){
        const mid = (idPrefix || 'arr') + '-' + idx;
        defs.appendChild(buildArrowhead(color, mid));
        el.setAttribute('marker-end', 'url(#' + mid + ')');
      }
    } else if(shape.type === 'circle'){
      el = document.createElementNS(NS, 'circle');
      el.setAttribute('cx', shape.cx ?? 50); el.setAttribute('cy', shape.cy ?? 50);
      el.setAttribute('r',  shape.r  ?? 30);
      el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
      el.setAttribute('fill', shape.fill || 'none');
      if(dashAttr) el.setAttribute('stroke-dasharray', dashAttr);
    } else if(shape.type === 'ellipse'){
      el = document.createElementNS(NS, 'ellipse');
      el.setAttribute('cx', shape.cx ?? 100); el.setAttribute('cy', shape.cy ?? 80);
      el.setAttribute('rx', shape.rx ?? 60);  el.setAttribute('ry', shape.ry ?? 40);
      el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
      el.setAttribute('fill', shape.fill || 'none');
      if(dashAttr) el.setAttribute('stroke-dasharray', dashAttr);
    } else if(shape.type === 'polygon'){
      el = document.createElementNS(NS, 'polygon');
      el.setAttribute('points', polygonPointsAttr(shape));
      el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
      el.setAttribute('stroke-linejoin', 'round');
      el.setAttribute('fill', shape.fill || 'none');
      if(dashAttr) el.setAttribute('stroke-dasharray', dashAttr);
    } else if(shape.type === 'rect'){
      el = document.createElementNS(NS, 'rect');
      el.setAttribute('x', shape.x ?? 0); el.setAttribute('y', shape.y ?? 0);
      el.setAttribute('width',  shape.w ?? 100); el.setAttribute('height', shape.h ?? 60);
      el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
      el.setAttribute('fill', shape.fill || 'none');
      if(dashAttr) el.setAttribute('stroke-dasharray', dashAttr);
    } else if(shape.type === 'label'){
      el = document.createElementNS(NS, 'text');
      el.setAttribute('x', shape.x ?? 10); el.setAttribute('y', shape.y ?? 30);
      el.setAttribute('fill', color);
      el.setAttribute('font-size', shape.fontSize || 18);
      el.setAttribute('font-weight', shape.fontWeight || '400');
      el.setAttribute('font-family', 'Verdana, Arial, sans-serif');
      el.textContent = shape.text || '';
    } else if(shape.type === 'coords'){
      el = renderCoords(shape);
    } else if(shape.type === 'image'){
      el = document.createElementNS(NS, 'image');
      el.setAttribute('x', shape.x ?? 0); el.setAttribute('y', shape.y ?? 0);
      el.setAttribute('width',  shape.w ?? 100); el.setAttribute('height', shape.h ?? 80);
      // Set both href and xlink:href for older SVG parsers.
      if(shape.src){
        el.setAttribute('href', shape.src);
        el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', shape.src);
      } else {
        // Placeholder so empty shapes stay selectable.
        el.setAttribute('href', placeholderImage());
      }
      el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
    return el;
  }
  function buildSvg(config, opts){
    const w = Math.max(100, Number(config.canvasWidth)  || 600);
    const h = Math.max(100, Number(config.canvasHeight) || 400);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', '100%');
    svg.style.display = 'block';
    svg.style.maxWidth = w + 'px';
    svg.style.background = config.background || '#ffffff';
    svg.style.border = '1px solid var(--line, #d8e0e6)';
    svg.style.borderRadius = '8px';
    if(opts && opts.fullHeight){ svg.style.height = h + 'px'; svg.style.maxHeight = 'none'; }
    const defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    (config.shapes || []).forEach((s, i) => {
      const node = renderShape(s, defs, i, (opts && opts.idPrefix) || 'arr');
      if(node){
        node.setAttribute('data-shape-idx', String(i));
        if(opts && opts.interactive){ node.style.cursor = 'move'; }
        svg.appendChild(node);
      }
    });
    return svg;
  }

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
    function addToSelection(idx){
      if(isSelected(idx)) return;
      const a = selIndices().slice(); a.push(idx);
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

    // Defer the right-pane refresh (rebuilds the whole config form) to the
    // next frame so the editor paints immediately. Rapid commits collapse
    // into one refresh + one history snapshot.
    let _refreshHandle = null;
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
    function selectShape(idx){
      setSingleSelection(idx);
      render();
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

      // Tool-mode: Move / Select
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
          block.config.shapes.push(newShape(type));
          setSingleSelection(block.config.shapes.length - 1);
          commit();
        });
        addGroup.appendChild(btn);
      });
      bar.appendChild(addGroup);

      // Style controls (active only when a shape is selected).
      const styleGroup = document.createElement('div');
      styleGroup.className = 'comp-tool-group comp-style-group';
      if(!sel) styleGroup.classList.add('comp-tool-group-disabled');

      // Color picker + Transparent toggle. The toggle stores 'none' (fill)
      // or 'transparent' (stroke); clicking restores the previous color.
      function mkColorControl(label, currentValue, noneValue, restoreDefault, onSet, opts){
        const lbl = document.createElement('span');
        lbl.className = 'comp-tool-label';
        lbl.textContent = label;
        styleGroup.appendChild(lbl);

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
        mkColorControl(
          label,
          sel ? sel.color : '#003b5c',
          NONE_STROKE,
          '#003b5c',
          (v) => { if(sel) sel.color = v; },
          { disabled: !sel, allowTransparent: allowTrans }
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

      // Polygon-only: Ecken input + Regulär button. Changing Ecken
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

      // Label: text + font size
      if(sel && sel.type === 'label'){
        const textLbl = document.createElement('span');
        textLbl.className = 'comp-tool-label';
        textLbl.textContent = 'Text';
        styleGroup.appendChild(textLbl);
        const ti = document.createElement('input');
        ti.type = 'text';
        ti.className = 'comp-tool-text';
        ti.value = sel.text || '';
        ti.placeholder = 'Beschriftung';
        ti.addEventListener('input', () => { sel.text = ti.value; commit(); });
        styleGroup.appendChild(ti);

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

      // Image: "Bild ersetzen" via the file picker.
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
        const gradeLbl = document.createElement('span');
        gradeLbl.className = 'comp-tool-label';
        gradeLbl.textContent = 'Bewertung';
        styleGroup.appendChild(gradeLbl);
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
          mkToggle('blank', 'Lücke',
            () => sel.blank, v => { sel.blank = v; if(!v) delete sel.correctText; });
          if(sel.blank){
            const sol = document.createElement('input');
            sol.type = 'text';
            sol.className = 'comp-tool-text';
            sol.placeholder = 'Loesung...';
            sol.value = sel.correctText || '';
            sol.title = 'Erwartete Eingabe (statisch)';
            sol.addEventListener('input', () => { sel.correctText = sol.value; commit(); });
            styleGroup.appendChild(sol);
            // Optional formula: evaluated against variables - "a*b" etc.
            const fml = document.createElement('input');
            fml.type = 'text';
            fml.className = 'comp-tool-text';
            fml.placeholder = 'Formel (z. B. a*b)';
            fml.value = sel.formula || '';
            fml.title = 'Formel mit Variablen; ueberschreibt statische Loesung';
            fml.addEventListener('input', () => { sel.formula = fml.value; commit(); });
            styleGroup.appendChild(fml);
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

      bar.appendChild(styleGroup);

      // Right action group: z-order, duplicate, delete.
      const rightGroup = document.createElement('div');
      rightGroup.className = 'comp-tool-group';
      if(sel){
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
      }
      bar.appendChild(rightGroup);

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

      const svg = buildSvg(block.config, { interactive: true, idPrefix: 'comp-edit-' + (block.id || 'b') });
      svg.classList.add('comp-canvas');
      svg.style.cursor = block._compTool === 'select' ? 'crosshair' : 'default';

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

    function attachShapeHandlers(node, idx, svg){
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
        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
          const dx = p.x - start.x, dy = p.y - start.y;
          if(!moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)){ moved = true; }
          if(!moved) return;
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
          // Faint outline rect so the line still reads as selected.
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
        let moved = false;
        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
          moved = true;
          if(which === 'p1'){ shape.x1 = Math.round(p.x); shape.y1 = Math.round(p.y); }
          else              { shape.x2 = Math.round(p.x); shape.y2 = Math.round(p.y); }
          updateShapeNode(node, shape, idx);
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
    function attachRadiusDrag(handle, idx, svg){
      handle.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const shape = block.config.shapes[idx];
        const node = svg.querySelector('[data-shape-idx="' + idx + '"]');
        let moved = false;
        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
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
    // In-place bbox + vertex-handle update for active vertex drags.
    // updateSelectionOverlay would rebuild N+1 nodes/listeners per frame
    // and visibly stutter; this just mutates attributes.
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
        // rAF-coalesced updates: at most one change per repaint.
        let pendingPoint = null, rafScheduled = false;
        function applyUpdate(){
          rafScheduled = false;
          if(!pendingPoint) return;
          const p = pendingPoint; pendingPoint = null;
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
          if(!rafScheduled){
            rafScheduled = true;
            requestAnimationFrame(applyUpdate);
          }
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(rafScheduled){ applyUpdate(); } // flush tail
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
        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
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
    // Scale polygon vertices around the centroid by `ratio`.
    function scalePolygonUniform(shape, ratio){
      if(!shape || shape.type !== 'polygon') return;
      const pts = polygonGetPoints(shape);
      const c = polygonCentroid(shape);
      shape.points = pts.map(p => [c.x + (p[0] - c.x) * ratio, c.y + (p[1] - c.y) * ratio]);
      shape.r = Math.max(2, (Number(shape.r) || 0) * ratio);
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

    // Keyboard shortcuts (capture phase, so main.js's bubble-phase block
    // shortcuts don't fire when this editor handles them):
    //   Arrows / Shift+Arrows  nudge 1 / 10 px (needs selection)
    //   Delete / Backspace     remove selected
    //   Ctrl/Cmd + D           duplicate, + C copy, + V paste, + A select all
    //   Ctrl/Cmd + Z / Y       undo / redo
    //   V / S                  switch tool (move / select)
    //   Escape                 deselect
    function onKeyDown(e){
      // Don't steal keys while the user types in form fields.
      const ae = document.activeElement;
      if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
      // Only fire when focus is on this editor or body.
      if(!host.contains(ae) && ae !== document.body) return;

      const key = e.key;
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+V works without a selection (pure paste).
      if(mod && (key === 'v' || key === 'V')){
        if(!_compClipboard) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        pasteFromClipboard();
        return;
      }
      // Tool-mode hotkeys: V = move, S = select.
      if(!mod && (key === 'v' || key === 'V') && block._compTool !== 'move'){
        e.preventDefault(); e.stopImmediatePropagation();
        block._compTool = 'move'; render(); return;
      }
      if(!mod && (key === 's' || key === 'S') && block._compTool !== 'select'){
        e.preventDefault(); e.stopImmediatePropagation();
        block._compTool = 'select'; render(); return;
      }

      // Composition-level undo/redo. Only stop propagation if there was
      // something to undo/redo, otherwise main.js's block-level handler runs.
      if(mod && (key === 'z' || key === 'Z')){
        const did = e.shiftKey ? redoComposition() : undoComposition();
        if(did){ e.preventDefault(); e.stopImmediatePropagation(); }
        return;
      }
      if(mod && (key === 'y' || key === 'Y')){
        if(redoComposition()){ e.preventDefault(); e.stopImmediatePropagation(); }
        return;
      }

      // Handle Ctrl+A and Delete even with zero shapes, otherwise they'd
      // bubble to main.js and act on the outer block card.
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
    const svg = buildSvg(config, Object.assign({ idPrefix }, opts || {}));
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

  // Mode: acknowledge - SVG + "Verstanden" button.
  function runAcknowledge(ui, config, api, maxPoints){
    appendSvg(ui.content, config, 'comp-ack-' + (api?.blockId || ''));
    const btn = document.createElement('button');
    btn.className = 'primary';
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

  // Mode: click - clicking a shape marked isCorrect awards points
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
    checkBtn.type = 'button'; checkBtn.className = 'primary';
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

  // Mode: fillblanks - label shapes with blank=true become inputs.
  function runFillBlanks(ui, config, api, maxPoints){
    const u = window.BlockUtils;
    const variables = Array.isArray(config.variables) ? config.variables : [];
    let currentVars = {};
    let renderedSvgHost = document.createElement('div');
    ui.content.appendChild(renderedSvgHost);

    function genVars(){
      const vars = {};
      variables.forEach(v => {
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
    function fillTemplate(str, vars){
      return String(str || '').replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name) => {
        if(name in vars){
          const v = vars[name];
          return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
        }
        return m;
      });
    }
    function evalFormula(expr, vars){
      if(!expr) return null;
      try {
        const r = u.safeMathExpr(String(expr), vars);
        if(typeof r === 'number' && Number.isFinite(r)) return r;
      } catch(e){}
      return null;
    }
    // Resolve a blank's expected answer: if `formula` is set, evaluate it
    // with the current variables; otherwise use `correctText` (static fallback).
    function expectedFor(sh, vars){
      if(sh.formula && String(sh.formula).trim()){
        const v = evalFormula(sh.formula, vars);
        if(v != null) return { value: v, asString: Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000) };
      }
      const txt = String(sh.correctText || sh.text || '').trim();
      const filled = fillTemplate(txt, vars);
      const asNum = u.parseNum(filled);
      return { value: asNum, asString: filled };
    }

    function render(){
      renderedSvgHost.innerHTML = '';
      // Substitute variables into every label's text BEFORE rendering.
      const shapes = (config.shapes || []).map(sh => {
        if(sh.type !== 'label') return sh;
        return Object.assign({}, sh, { text: fillTemplate(sh.text, currentVars) });
      });
      const renderConfig = Object.assign({}, config, { shapes });
      const svg = appendSvg(renderedSvgHost, renderConfig, 'comp-blanks-' + (api?.blockId || ''));
      const blanks = [];
      shapes.forEach((sh, idx) => {
        if(sh.type !== 'label' || !sh.blank) return;
        const textNode = svg.querySelector('text[data-shape-idx="' + idx + '"]');
        if(!textNode) return;
        const fs = sh.fontSize || 18;
        const exp = expectedFor(sh, currentVars);
        const expectedStr = exp.asString || '';
        const w = Math.max(80, expectedStr.length * fs * 0.55 + 24);
        const h = fs + 12;
        const fo = document.createElementNS(NS, 'foreignObject');
        fo.setAttribute('x', sh.x - 2);
        fo.setAttribute('y', sh.y - fs);
        fo.setAttribute('width', w);
        fo.setAttribute('height', h);
        fo.setAttribute('data-shape-idx', String(idx));
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'comp-blank-input';
        inp.style.cssText = 'width:100%; height:' + h + 'px; box-sizing:border-box; ' +
          'font:' + (sh.fontWeight || 400) + ' ' + (fs - 2) + 'px Verdana,Arial,sans-serif; ' +
          'padding:0 0.4rem; border:1px solid #84bf66; border-radius:4px; background:#fff; color:#003b5c;';
        inp.placeholder = '...';
        fo.appendChild(inp);
        textNode.replaceWith(fo);
        blanks.push({ idx, input: inp, expected: exp, formula: sh.formula, tolerance: Number(sh.tolerance) || 0.01 });
      });
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
    checkBtn.type = 'button'; checkBtn.className = 'primary';
    checkBtn.textContent = 'Pruefen';
    checkBtn.addEventListener('click', () => {
      if(checked) return;
      if(currentBlanks.length === 0){ ui.fb.neutral('Keine Luecken definiert.'); api.reportScore(0); return; }
      checked = true;
      checkBtn.disabled = true;
      let correctCount = 0;
      currentBlanks.forEach(b => {
        const given = String(b.input.value || '').trim();
        let ok = false;
        if(b.expected.value != null){
          const gotNum = u.parseNum(given);
          if(gotNum != null && u.nearlyEqual(gotNum, b.expected.value, b.tolerance)) ok = true;
        } else {
          ok = given.toLowerCase() === b.expected.asString.toLowerCase() && b.expected.asString !== '';
        }
        b.input.disabled = true;
        b.input.classList.add(ok ? 'comp-blank-ok' : 'comp-blank-bad');
        if(!ok && b.expected.asString){
          b.input.title = 'Loesung: ' + b.expected.asString;
        }
        if(ok) correctCount++;
      });
      const pts = Math.round((correctCount / currentBlanks.length) * maxPoints * 100) / 100;
      api.reportScore(pts);
      const msg = correctCount + ' / ' + currentBlanks.length + ' Luecken korrekt -> ' + pts + ' / ' + maxPoints + ' Punkte.';
      if(correctCount === currentBlanks.length) ui.fb.ok(msg);
      else if(correctCount > 0)                 ui.fb.neutral(msg);
      else                                      ui.fb.bad(msg);
    });
    ui.buttons.appendChild(checkBtn);

    if(variables.length > 0){
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'secondary';
      newBtn.textContent = 'Neu generieren';
      newBtn.addEventListener('click', regenerate);
      ui.buttons.appendChild(newBtn);
    }
    return {};
  }

  // Mode: hotspot - draggable markers must land in their target zones.
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
    checkBtn.type = 'button'; checkBtn.className = 'primary';
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
        // Bewertung. 'none' | 'acknowledge' | 'click' | 'fillblanks' | 'hotspot'.
        // Per-shape flags (set via in-canvas toolbar):
        //   isCorrect       - click: clicking this shape scores
        //   blank           - fillblanks (label): render as input
        //   correctText     - fillblanks: expected answer
        //   isTarget        - hotspot: target zone
        //   isMarker        - hotspot: draggable marker
        //   markerTargetIdx - hotspot: shapes[] idx of marker's correct target
        gradingMode: 'none',
        maxPoints: 1,
        prompt: '',
        // For 'click' mode: penalize wrong clicks?
        penalizeWrong: false,
        // Variables for fillblanks: each label text + blank formula can reference
        // {name} placeholders. Regenerated on each "Neu generieren" click.
        variables: [],
        shapes: []
      };
    },
    previewConfig(){
      // Welcome-page demo content.
      return {
        blockTitle: '', canvasWidth: 600, canvasHeight: 360, background: '#ffffff',
        gradingMode: 'none', maxPoints: 1, prompt: '', penalizeWrong: false,
        shapes: [
          { type:'rect',  x: 60, y: 80, w:480, h:200, color:'#003b5c', fill:'#eef5f8', strokeWidth: 2, dash:'solid' },
          { type:'label', x:100, y:160, text:'Beispiel-Komposition', color:'#003b5c', fontSize:28, fontWeight:'700' },
          { type:'arrow', x1:120, y1:230, x2:480, y2:230, color:'#84bf66', strokeWidth: 3, dash:'solid' }
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
            { value:'click',       label:'Klick auf richtige Form(en)' },
            { value:'fillblanks',  label:'Lückentext (Labels als Eingabe)' },
            { value:'hotspot',     label:'Hotspot (Marker in Zielzonen ziehen)' }
          ],
          help: 'Bei Klick/Lücke/Hotspot Formen direkt auf der Canvas markieren (Toolbar unten zeigt Bewertungs-Schalter, sobald eine Form ausgewählt ist).'
        },
        { key:'prompt',    label:'Aufgabentext (optional)', type:'textarea', rows:2, showIf: isGraded,
          help:'Wird oberhalb der Komposition angezeigt.' },
        { key:'maxPoints', label:'Maximalpunkte', type:'number', min:1, max:100, step:1, showIf: isGraded },
        { key:'penalizeWrong', label:'Falsche Klicks abziehen', type:'boolean',
          showIf: c => c.gradingMode === 'click',
          help:'Klick auf eine NICHT als korrekt markierte Form zieht Punkte ab.' },
        { type:'section', label:'Variablen', key:'_sec_vars',
          showIf: c => c.gradingMode === 'fillblanks' },
        { key:'variables', label:'Zufallsvariablen', type:'list', itemLabel:'Variable',
          showIf: c => c.gradingMode === 'fillblanks',
          help:'Variablen koennen in Label-Texten als {name} verwendet und in Luecken-Formeln referenziert werden. Bei jedem "Neu generieren" werden sie neu gezogen.',
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
            // Bewertungs-Flags (relevant je nach Modus)
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

    // Runtime: dispatch on config.gradingMode (none / acknowledge / click /
    // fillblanks / hotspot).
    mount(host, config, api){
      const mode = config.gradingMode || 'none';
      if(mode === 'none') return mountStatic(host, config, api);
      return mountGraded(host, config, api, mode);
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
