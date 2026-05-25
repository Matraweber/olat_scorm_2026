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
    transparent: '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="3.5" width="13" height="13" rx="2"/><line x1="4" y1="16" x2="16" y2="4"/></svg>',
    // Die with three pips: roll/regeneration symbol.
    dice: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2.2"/><circle cx="7" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="13" cy="13" r="1.1" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none"/></svg>'
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
      // cx/cy/r/sides stay around for "make regular" + corner count input.
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

  // Solution-slot token parser. Splits a label text into segments and
  // `{N}` / `{N*}` / `{}` placeholders. Tokens:
  //   { kind:'text',   text:'…' }
  //   { kind:'slot',   n:1 }       student input bound to slot 1
  //   { kind:'mirror', n:1 }       read-only display of slot 1's input
  //   { kind:'slot',   n:null }    legacy unnamed slot {}
  function parseSlotTokens(text){
    const out = [];
    const re = /\{(\d+)(\*)?\}|\{\}/g;
    let last = 0, m;
    while((m = re.exec(text)) !== null){
      if(m.index > last) out.push({ kind:'text', text: text.slice(last, m.index) });
      if(m[0] === '{}'){
        out.push({ kind:'slot', n: null });
      } else if(m[2] === '*'){
        out.push({ kind:'mirror', n: Number(m[1]) });
      } else {
        out.push({ kind:'slot', n: Number(m[1]) });
      }
      last = m.index + m[0].length;
    }
    if(last < text.length) out.push({ kind:'text', text: text.slice(last) });
    return out;
  }

  // Collect all slot numbers used by a label's text (input slots only;
  // mirrors are ignored).
  function slotNumbersInLabel(text){
    const out = [];
    const re = /\{(\d+)\}/g;
    let m;
    while((m = re.exec(text)) !== null){
      const n = Number(m[1]);
      if(out.indexOf(n) < 0) out.push(n);
    }
    return out.sort((a, b) => a - b);
  }

  // Pre-process a formula so authors can write {1*} as a shorthand for s1.
  // After this step the formula uses only legal identifiers and can be passed
  // to safeMathExpr.
  function expandSlotRefs(formula){
    return String(formula || '').replace(/\{(\d+)\*\}/g, 's$1');
  }

  // Format a number for display in a {N*} mirror span.
  function formatSlotValue(v){
    if(v == null || !Number.isFinite(v)) return '?';
    if(Number.isInteger(v)) return String(v);
    return String(Math.round(v * 1000) / 1000);
  }

  // Snap-to-grid for shapes dragged over a coordinate system. Returns a
  // function: (svgX, svgY, threshold) -> nearest grid intersection or null.
  function makeGridSnap(coords){
    if(!coords || coords.type !== 'coords') return null;
    const x = Number(coords.x) || 0;
    const y = Number(coords.y) || 0;
    const w = Math.max(40, Number(coords.w) || 200);
    const h = Math.max(40, Number(coords.h) || 150);
    const xMin = Number(coords.xMin ?? -5);
    const xMax = Number(coords.xMax ??  5);
    const yMin = Number(coords.yMin ?? -3);
    const yMax = Number(coords.yMax ??  3);
    const step = Math.max(0.01, Number(coords.step) || 1);
    const equalAspect = coords.equalAspect !== false;
    const xRange = (xMax - xMin) || 1;
    const yRange = (yMax - yMin) || 1;
    let effW = w, effH = h, offX = 0, offY = 0;
    if(equalAspect){
      const scale = Math.min(w / xRange, h / yRange);
      effW = xRange * scale;
      effH = yRange * scale;
      offX = (w - effW) / 2;
      offY = (h - effH) / 2;
    }
    return function snap(svgX, svgY, threshold){
      threshold = threshold == null ? 12 : threshold;
      // Reject points well outside the grid box.
      if(svgX < x + offX - threshold || svgX > x + offX + effW + threshold) return null;
      if(svgY < y + offY - threshold || svgY > y + offY + effH + threshold) return null;
      const mx = xMin + (svgX - x - offX) / effW * xRange;
      const my = yMax - (svgY - y - offY) / effH * yRange;
      const mxs = Math.round(mx / step) * step;
      const mys = Math.round(my / step) * step;
      const sx = x + offX + (mxs - xMin) / xRange * effW;
      const sy = y + offY + (yMax - mys) / yRange * effH;
      if(Math.abs(svgX - sx) <= threshold && Math.abs(svgY - sy) <= threshold){
        return { x: sx, y: sy, mathX: mxs, mathY: mys, dx: sx - svgX, dy: sy - svgY };
      }
      return null;
    };
  }

  // Implicit canvas grid: every 10 SVG pixels. Used when no coordinate
  // system is present so labels, rectangles, etc. still snap to clean values.
  function makeCanvasGridSnap(canvasWidth, canvasHeight, step){
    const gridStep = Math.max(2, Number(step) || 10);
    const w = Math.max(10, Number(canvasWidth)  || 600);
    const h = Math.max(10, Number(canvasHeight) || 360);
    return function snap(svgX, svgY, threshold){
      threshold = threshold == null ? 8 : threshold;
      if(svgX < -threshold || svgX > w + threshold) return null;
      if(svgY < -threshold || svgY > h + threshold) return null;
      const sx = Math.round(svgX / gridStep) * gridStep;
      const sy = Math.round(svgY / gridStep) * gridStep;
      if(Math.abs(svgX - sx) <= threshold && Math.abs(svgY - sy) <= threshold){
        return { x: sx, y: sy, dx: sx - svgX, dy: sy - svgY };
      }
      return null;
    };
  }

  function findCoordsForSnap(shapes, excludeSet){
    if(!Array.isArray(shapes)) return null;
    for(let i = 0; i < shapes.length; i++){
      if(excludeSet && excludeSet.has(i)) continue;
      if(shapes[i] && shapes[i].type === 'coords') return shapes[i];
    }
    return null;
  }

  // Snap candidates: points that may align with a grid intersection during a
  // drag. The closest candidate wins; the whole shape shifts so it lands on grid.
  function shapeSnapCandidates(shape){
    if(!shape) return [];
    switch(shape.type){
      case 'line': case 'arrow': {
        const x1 = shape.x1 || 0, y1 = shape.y1 || 0;
        const x2 = shape.x2 || 0, y2 = shape.y2 || 0;
        return [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
        ];
      }
      case 'circle': {
        const cx = shape.cx || 0, cy = shape.cy || 0, r = shape.r || 0;
        // Center + 4 cardinal points so the perimeter can also align.
        return [
          { x: cx, y: cy },
          { x: cx + r, y: cy }, { x: cx - r, y: cy },
          { x: cx, y: cy + r }, { x: cx, y: cy - r }
        ];
      }
      case 'ellipse': {
        const cx = shape.cx || 0, cy = shape.cy || 0;
        const rx = shape.rx || 0, ry = shape.ry || 0;
        return [
          { x: cx, y: cy },
          { x: cx + rx, y: cy }, { x: cx - rx, y: cy },
          { x: cx, y: cy + ry }, { x: cx, y: cy - ry }
        ];
      }
      case 'polygon': {
        const out = Array.isArray(shape.points)
          ? shape.points.map(p => ({ x: p[0], y: p[1] }))
          : [];
        if(shape.cx != null && shape.cy != null) out.push({ x: shape.cx, y: shape.cy });
        return out;
      }
      case 'rect': case 'image': case 'coords': {
        const x = shape.x || 0, y = shape.y || 0;
        const w = shape.w || 0, h = shape.h || 0;
        return [
          { x: x, y: y },                  // top-left
          { x: x + w, y: y },              // top-right
          { x: x, y: y + h },              // bottom-left
          { x: x + w, y: y + h },          // bottom-right
          { x: x + w / 2, y: y + h / 2 },  // center
          { x: x + w / 2, y: y },          // top-center
          { x: x + w / 2, y: y + h },      // bottom-center
          { x: x, y: y + h / 2 },          // left-center
          { x: x + w, y: y + h / 2 }       // right-center
        ];
      }
      case 'label': {
        // Labels render baseline-left, so (x, y) is the baseline anchor.
        // The visual box reaches from (x, y - fontSize) to (x + textWidth, y).
        const fs = Number(shape.fontSize) || 18;
        const charW = fs * 0.55;
        const textW = Math.max(charW, String(shape.text || ' ').length * charW);
        const x = shape.x || 0, y = shape.y || 0;
        return [
          { x: x, y: y },                       // baseline-left (the anchor)
          { x: x + textW, y: y },               // baseline-right
          { x: x, y: y - fs },                  // top-left
          { x: x + textW, y: y - fs },          // top-right
          { x: x + textW / 2, y: y - fs / 2 }   // visual center
        ];
      }
      default:
        return [];
    }
  }

  // Human-readable shape label for the picker dropdown (and any future UI
  // that needs to name a shape).
  function shapeDisplayName(shape, idx){
    if(!shape || !shape.type) return 'Form ' + (idx + 1);
    const polyByCount = { 3:'Dreieck', 4:'Viereck', 5:'Fünfeck', 6:'Sechseck', 7:'Siebeneck', 8:'Achteck' };
    switch(shape.type){
      case 'line':    return 'Linie';
      case 'arrow':   return 'Pfeil';
      case 'circle':  return 'Kreis  (r=' + (shape.r ?? '?') + ')';
      case 'ellipse': return 'Ellipse';
      case 'polygon': {
        const n = Array.isArray(shape.points) ? shape.points.length : (shape.sides || 0);
        return polyByCount[n] || (n + '-Eck');
      }
      case 'rect':    return 'Rechteck';
      case 'label':   return 'Beschriftung „' + String(shape.text || '').slice(0, 20) + '"';
      case 'coords':  return 'Koordinatensystem';
      case 'image':   return shape.src ? 'Bild' : 'Bild  (leer)';
      default:        return shape.type;
    }
  }

  // Polygon picker presets. Points are designed for 600×360; the add
  // handler translates them to the current canvas center.
  const POLYGON_PRESETS = [
    {
      id: 'right',
      label: 'Rechtwinklig',
      hint: '90° unten links',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="3,17 17,17 3,4"/></svg>',
      points: [[150, 280], [450, 280], [150, 100]]
    },
    {
      id: 'isosceles',
      label: 'Gleichschenklig',
      hint: 'Spitze oben',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="10,3 17,16 3,16"/></svg>',
      points: [[300, 100], [180, 280], [420, 280]]
    },
    {
      id: 'equilateral',
      label: 'Gleichseitig',
      hint: 'alle Seiten gleich',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="10,3.5 16.5,15 3.5,15"/></svg>',
      regular: 3, r: 90
    },
    {
      id: 'scalene',
      label: 'Unregelmäßig',
      hint: 'beliebig anpassbar',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="4,15 17,12 11,4"/></svg>',
      points: [[160, 270], [450, 240], [320, 110]]
    },
    {
      id: 'square',
      label: 'Quadrat',
      hint: '4 gleiche Seiten',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="4" width="12" height="12"/></svg>',
      points: [[200, 100], [400, 100], [400, 300], [200, 300]]
    },
    {
      id: 'pentagon',
      label: 'Fünfeck',
      hint: 'regelmäßig',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="10,3 17,8 14,16 6,16 3,8"/></svg>',
      regular: 5, r: 90
    },
    {
      id: 'hexagon',
      label: 'Sechseck',
      hint: 'regelmäßig',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="6,3.5 14,3.5 18,10 14,16.5 6,16.5 2,10"/></svg>',
      regular: 6, r: 90
    }
  ];
  function makePolygonFromPreset(preset, cx, cy){
    const sx = cx - 300; // template coords are for cx=300, cy=190
    const sy = cy - 190;
    const base = { type:'polygon', color:'#003b5c', fill:'#a1d884', strokeWidth:3, dash:'solid' };
    if(preset.regular){
      base.sides = preset.regular;
      base.cx = cx; base.cy = cy; base.r = preset.r;
      base.points = regularPolygonPoints(cx, cy, preset.r, preset.regular);
    } else {
      const pts = preset.points.map(p => [p[0] + sx, p[1] + sy]);
      base.sides = pts.length;
      base.cx = cx; base.cy = cy;
      base.points = pts;
    }
    return base;
  }

  // Built-in templates: shapes + variables + gradingMode + formula.
  const COMPOSITION_TEMPLATES = [
    {
      id: 'tpl-rect-area',
      label: 'Rechteck-Fläche',
      description: 'A = a · b',
      canvasWidth: 600, canvasHeight: 360,
      gradingMode: 'fillblanks',
      variables: [
        { name:'a', min:2, max:12, integer:true },
        { name:'b', min:2, max:8,  integer:true }
      ],
      shapes: [
        { type:'rect',  x:150, y:100, w:300, h:160, color:'#003b5c', fill:'#a1d884', strokeWidth:3, dash:'solid' },
        { type:'label', x:285, y:90,  text:'a = {a}', color:'#003b5c', fontSize:22, fontWeight:'700' },
        { type:'label', x:465, y:188, text:'b = {b}', color:'#003b5c', fontSize:22, fontWeight:'700' },
        { type:'label', x:230, y:195, text:'A = {}',  color:'#003b5c', fontSize:24, fontWeight:'700', formula:'a*b' }
      ]
    },
    {
      id: 'tpl-triangle-area',
      label: 'Dreieck-Fläche',
      description: 'A = (a · h) / 2',
      canvasWidth: 600, canvasHeight: 360,
      gradingMode: 'fillblanks',
      variables: [
        { name:'a', min:4, max:14, integer:true },
        { name:'h', min:3, max:10, integer:true }
      ],
      shapes: [
        { type:'polygon', sides:3, points:[[120, 280],[480, 280],[300, 100]],
          color:'#003b5c', fill:'#a1d884', strokeWidth:3, dash:'solid' },
        { type:'line',  x1:300, y1:280, x2:300, y2:100, color:'#5d6872', strokeWidth:1.5, dash:'dashed' },
        { type:'label', x:285, y:303, text:'a = {a}', color:'#003b5c', fontSize:22, fontWeight:'700' },
        { type:'label', x:310, y:195, text:'h = {h}', color:'#003b5c', fontSize:22, fontWeight:'700' },
        { type:'label', x:330, y:240, text:'A = {}',  color:'#003b5c', fontSize:22, fontWeight:'700', formula:'a*h/2' }
      ]
    },
    {
      id: 'tpl-pythagoras',
      label: 'Pythagoras',
      description: 'c = √(a² + b²)',
      canvasWidth: 600, canvasHeight: 360,
      gradingMode: 'fillblanks',
      variables: [
        { name:'a', min:3, max:9, integer:true },
        { name:'b', min:3, max:9, integer:true }
      ],
      shapes: [
        { type:'polygon', sides:3, points:[[150, 280],[450, 280],[150, 100]],
          color:'#003b5c', fill:'#eef5f8', strokeWidth:3, dash:'solid' },
        { type:'rect', x:150, y:264, w:16, h:16, color:'#5d6872', fill:'transparent', strokeWidth:1.5, dash:'solid' },
        { type:'label', x:120, y:200, text:'a = {a}', color:'#003b5c', fontSize:22, fontWeight:'700' },
        { type:'label', x:280, y:305, text:'b = {b}', color:'#003b5c', fontSize:22, fontWeight:'700' },
        { type:'label', x:300, y:180, text:'c = {}',  color:'#003b5c', fontSize:22, fontWeight:'700', formula:'sqrt(a*a + b*b)' }
      ]
    },
    {
      id: 'tpl-circle-area',
      label: 'Kreis-Fläche',
      description: 'A = π · r²',
      canvasWidth: 600, canvasHeight: 360,
      gradingMode: 'fillblanks',
      variables: [
        { name:'r', min:2, max:9, integer:true }
      ],
      shapes: [
        { type:'circle', cx:240, cy:200, r:100, color:'#003b5c', fill:'#a1d884', strokeWidth:3, dash:'solid' },
        { type:'arrow',  x1:240, y1:200, x2:340, y2:200, color:'#003b5c', strokeWidth:2.5, dash:'solid' },
        { type:'label',  x:255, y:192, text:'r = {r}', color:'#003b5c', fontSize:20, fontWeight:'700' },
        { type:'label',  x:380, y:215, text:'A = {}',  color:'#003b5c', fontSize:22, fontWeight:'700', formula:'pi*r*r' }
      ]
    },
    {
      id: 'tpl-multi-step-pyth',
      label: 'Mehrstufig: Pythagoras  (Lösung als Variable)',
      description: '{1} und {2}, dabei nutzt {2} die Antwort {1*}',
      canvasWidth: 640, canvasHeight: 380,
      gradingMode: 'fillblanks',
      variables: [
        { name:'a', min:3, max:9, integer:true },
        { name:'b', min:3, max:9, integer:true }
      ],
      shapes: [
        // Triangle (the picture). Bottom-left at (200, 290), bottom-right at
        // (470, 290), top at (200, 110). The 'a' label sits left of the
        // vertical side; 'b' under the horizontal side.
        { type:'polygon', sides:3, points:[[200, 290],[470, 290],[200, 110]],
          color:'#003b5c', fill:'#eef5f8', strokeWidth:3, dash:'solid' },
        { type:'rect', x:200, y:274, w:16, h:16, color:'#5d6872', fill:'transparent', strokeWidth:1.5, dash:'solid' },
        { type:'label', x:130, y:210, text:'a = {a}', color:'#003b5c', fontSize:20, fontWeight:'700' },
        { type:'label', x:300, y:320, text:'b = {b}', color:'#003b5c', fontSize:20, fontWeight:'700' },
        { type:'label', x:340, y:200, text:'c = ?', color:'#0f567d', fontSize:20, fontWeight:'700' },
        // Step 1: enter c² in slot {1}
        { type:'label', x:60, y:50, text:'1. Schritt:  c² = a² + b² = {1}',
          color:'#003b5c', fontSize:17, fontWeight:'700',
          formulas: { 1: { formula:'a*a + b*b', tolerance:0.01 } } },
        // Step 2: enter c in slot {2}, using the previous answer {1*} = student's c²
        { type:'label', x:60, y:80, text:'2. Schritt:  c = √{1*}  = {2}',
          color:'#003b5c', fontSize:17, fontWeight:'700',
          formulas: { 2: { formula:'sqrt({1*})', tolerance:0.01 } } }
      ]
    }
  ];

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

    // Equal aspect (default): one math unit takes the same number of SVG pixels
    // on both axes, so a 1x1 grid cell renders as a square. Letterbox the
    // unused space on the shorter side.
    const equalAspect = shape.equalAspect !== false;
    const xRange = (xMax - xMin) || 1;
    const yRange = (yMax - yMin) || 1;
    let effW = w, effH = h, offX = 0, offY = 0;
    if(equalAspect){
      const scale = Math.min(w / xRange, h / yRange);
      effW = xRange * scale;
      effH = yRange * scale;
      offX = (w - effW) / 2;
      offY = (h - effH) / 2;
    }
    const toSvgX = dx => x + offX + (dx - xMin) / xRange * effW;
    const toSvgY = dy => y + offY + (yMax - dy) / yRange * effH;
    const innerLeft   = x + offX;
    const innerTop    = y + offY;
    const innerRight  = x + offX + effW;
    const innerBottom = y + offY + effH;

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
        ln.setAttribute('x1', sx); ln.setAttribute('y1', innerTop);
        ln.setAttribute('x2', sx); ln.setAttribute('y2', innerBottom);
        ln.setAttribute('stroke', gridColor); ln.setAttribute('stroke-width', 1);
        g.appendChild(ln);
      }
      for(let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step){
        if(Math.abs(v) < 1e-9) continue;
        const sy = toSvgY(v);
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', innerLeft); ln.setAttribute('y1', sy);
        ln.setAttribute('x2', innerRight); ln.setAttribute('y2', sy);
        ln.setAttribute('stroke', gridColor); ln.setAttribute('stroke-width', 1);
        g.appendChild(ln);
      }
    }
    // Axes (draw only the portions visible inside [xMin..xMax], [yMin..yMax]).
    if(yMin <= 0 && yMax >= 0){
      const sy = toSvgY(0);
      const ax = document.createElementNS(NS, 'line');
      ax.setAttribute('x1', innerLeft); ax.setAttribute('y1', sy);
      ax.setAttribute('x2', innerRight); ax.setAttribute('y2', sy);
      ax.setAttribute('stroke', axisColor); ax.setAttribute('stroke-width', 1.6);
      g.appendChild(ax);
    }
    if(xMin <= 0 && xMax >= 0){
      const sx = toSvgX(0);
      const ax = document.createElementNS(NS, 'line');
      ax.setAttribute('x1', sx); ax.setAttribute('y1', innerTop);
      ax.setAttribute('x2', sx); ax.setAttribute('y2', innerBottom);
      ax.setAttribute('stroke', axisColor); ax.setAttribute('stroke-width', 1.6);
      g.appendChild(ax);
    }
    if(shape.showLabels !== false){
      const baseY = (yMin <= 0 && yMax >= 0) ? toSvgY(0) + 12 : innerBottom - 4;
      const baseX = (xMin <= 0 && xMax >= 0) ? toSvgX(0) - 6 : innerLeft - 4;
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
    svg.style.background = config.background || '#ffffff';
    svg.style.border = '1px solid var(--line, #d8e0e6)';
    svg.style.borderRadius = '8px';
    // SVG always fills the container width; aspectRatio keeps proportions.
    // svgPoint() uses getScreenCTM so drag and snap-hit-tests work at any zoom.
    svg.style.width = '100%';
    svg.style.aspectRatio = w + ' / ' + h;
    if(opts && opts.fullHeight){ svg.style.height = h + 'px'; svg.style.maxHeight = 'none'; svg.style.aspectRatio = ''; }
    // capViewport: only in runtime/preview, never in the builder canvas.
    if(opts && opts.capViewport){
      // Cap to viewport minus SCORM chrome (~420 px), minimum 240 px.
      svg.style.maxHeight = 'max(240px, calc(100vh - 420px))';
      svg.style.aspectRatio = w + ' / ' + h;
    }
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
        let rows = (block.config.variables || []).map(v => Object.assign({}, v));

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

        // Snap-to-grid: a coords system on the canvas wins (real math units).
        // Otherwise fall back to the implicit canvas pixel grid so labels and
        // shapes still align cleanly. Hold Alt during drag to bypass.
        const excludeSet = new Set(draggedIndices);
        const snapCoords = findCoordsForSnap(block.config.shapes, excludeSet);
        const snapFn = snapCoords
          ? makeGridSnap(snapCoords)
          : makeCanvasGridSnap(block.config.canvasWidth, block.config.canvasHeight, 10);
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

        // Compute snap correction for the primary shape's anchor points so
        // the closest grid-aligned vertex pulls the whole shape into position.
        function computeSnapAdjust(dx, dy){
          if(!snapFn) return null;
          const primary = block.config.shapes[idx];
          if(!primary || primary.type === 'coords') return null;
          const origPrimary = snapshots.find(s => s.i === idx)?.original;
          if(!origPrimary) return null;
          const candidates = shapeSnapCandidates(origPrimary).map(c => ({ x: c.x + dx, y: c.y + dy }));
          let best = null;
          for(const c of candidates){
            const s = snapFn(c.x, c.y, 12);
            if(s && (!best || (s.dx*s.dx + s.dy*s.dy) < (best.dx*best.dx + best.dy*best.dy))){
              best = s;
            }
          }
          return best;
        }

        function showSnapIndicator(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const g = document.createElementNS(NS, 'g');
          g.setAttribute('data-snap-indicator', '1');
          g.style.pointerEvents = 'none';
          const ring = document.createElementNS(NS, 'circle');
          ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
          ring.setAttribute('r', 7);
          ring.setAttribute('fill', 'rgba(132,191,102,0.25)');
          ring.setAttribute('stroke', '#84bf66');
          ring.setAttribute('stroke-width', '1.5');
          g.appendChild(ring);
          const dot = document.createElementNS(NS, 'circle');
          dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
          dot.setAttribute('r', 2);
          dot.setAttribute('fill', '#84bf66');
          g.appendChild(dot);
          svg.appendChild(g);
          snapIndicator = g;
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
        const snapCoords = findCoordsForSnap(block.config.shapes, excludeSet);
        const snapFn = snapCoords ? makeGridSnap(snapCoords) : makeCanvasGridSnap(block.config.canvasWidth, block.config.canvasHeight, 10);
        let snapIndicator = null;
        function showEndpointSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const g = document.createElementNS(NS, 'g');
          g.setAttribute('data-snap-indicator', '1');
          g.style.pointerEvents = 'none';
          const ring = document.createElementNS(NS, 'circle');
          ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
          ring.setAttribute('r', 7);
          ring.setAttribute('fill', 'rgba(132,191,102,0.25)');
          ring.setAttribute('stroke', '#84bf66');
          ring.setAttribute('stroke-width', '1.5');
          g.appendChild(ring);
          svg.appendChild(g);
          snapIndicator = g;
        }
        let moved = false;
        function onMove(ev){
          let p = svgPoint(svg, ev.clientX, ev.clientY);
          moved = true;
          let snapped = null;
          if(snapFn && !ev.altKey){
            snapped = snapFn(p.x, p.y, 12);
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
        const snapCoords = findCoordsForSnap(block.config.shapes, excludeSet);
        const snapFn = snapCoords ? makeGridSnap(snapCoords) : makeCanvasGridSnap(block.config.canvasWidth, block.config.canvasHeight, 10);
        let snapIndicator = null;
        function showRadiusSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const g = document.createElementNS(NS, 'g');
          g.setAttribute('data-snap-indicator', '1');
          g.style.pointerEvents = 'none';
          const ring = document.createElementNS(NS, 'circle');
          ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
          ring.setAttribute('r', 7);
          ring.setAttribute('fill', 'rgba(132,191,102,0.25)');
          ring.setAttribute('stroke', '#84bf66');
          ring.setAttribute('stroke-width', '1.5');
          g.appendChild(ring);
          svg.appendChild(g);
          snapIndicator = g;
        }
        let moved = false;
        function onMove(ev){
          let p = svgPoint(svg, ev.clientX, ev.clientY);
          let snapped = null;
          if(snapFn && !ev.altKey){
            snapped = snapFn(p.x, p.y, 12);
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
        // Snap to grid (vertex mode only; uniform-scale keeps free movement).
        const excludeSet = new Set([idx]);
        const snapCoords = findCoordsForSnap(block.config.shapes, excludeSet);
        const snapFn = uniform
          ? null
          : (snapCoords ? makeGridSnap(snapCoords) : makeCanvasGridSnap(block.config.canvasWidth, block.config.canvasHeight, 10));
        let snapIndicator = null;
        function showVertexSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const g = document.createElementNS(NS, 'g');
          g.setAttribute('data-snap-indicator', '1');
          g.style.pointerEvents = 'none';
          const ring = document.createElementNS(NS, 'circle');
          ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
          ring.setAttribute('r', 7);
          ring.setAttribute('fill', 'rgba(132,191,102,0.25)');
          ring.setAttribute('stroke', '#84bf66');
          ring.setAttribute('stroke-width', '1.5');
          g.appendChild(ring);
          svg.appendChild(g);
          snapIndicator = g;
        }
        // rAF-coalesced updates: at most one change per repaint.
        let pendingPoint = null, rafScheduled = false, pendingAlt = false;
        function applyUpdate(){
          rafScheduled = false;
          if(!pendingPoint) return;
          let p = pendingPoint; pendingPoint = null;
          let snapped = null;
          if(snapFn && !pendingAlt){
            snapped = snapFn(p.x, p.y, 12);
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
        // Snap the bottom-right corner to the grid while resizing.
        const excludeSet = new Set([idx]);
        const snapCoords = findCoordsForSnap(block.config.shapes, excludeSet);
        const snapFn = snapCoords ? makeGridSnap(snapCoords) : makeCanvasGridSnap(block.config.canvasWidth, block.config.canvasHeight, 10);
        let snapIndicator = null;
        function showResizeSnap(p){
          if(snapIndicator){ snapIndicator.remove(); snapIndicator = null; }
          if(!p) return;
          const g = document.createElementNS(NS, 'g');
          g.setAttribute('data-snap-indicator', '1');
          g.style.pointerEvents = 'none';
          const ring = document.createElementNS(NS, 'circle');
          ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
          ring.setAttribute('r', 7);
          ring.setAttribute('fill', 'rgba(132,191,102,0.25)');
          ring.setAttribute('stroke', '#84bf66');
          ring.setAttribute('stroke-width', '1.5');
          g.appendChild(ring);
          svg.appendChild(g);
          snapIndicator = g;
        }
        function onMove(ev){
          let p = svgPoint(svg, ev.clientX, ev.clientY);
          let snapped = null;
          if(snapFn && !ev.altKey){
            snapped = snapFn(p.x, p.y, 12);
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
    let renderedSvgHost = document.createElement('div');
    ui.content.appendChild(renderedSvgHost);

    const genVars       = () => compGenVars(variables);
    const fillTemplate  = compFillTemplate;
    function evalFormula(expr, vars){
      if(!expr) return null;
      try {
        const r = u.safeMathExpr(expandSlotRefs(expr), vars);
        if(typeof r === 'number' && Number.isFinite(r)) return r;
      } catch(e){}
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
      let correctCount = 0;
      currentBlanks.forEach(b => {
        const given = String(b.input.value || '').trim();
        let ok = false;
        if(b.expected.value != null){
          const gotNum = u.parseNum(given);
          const tol = b.expected.tolerance != null ? b.expected.tolerance : 0.01;
          if(gotNum != null && u.nearlyEqual(gotNum, b.expected.value, tol)) ok = true;
        } else {
          ok = given.toLowerCase() === b.expected.asString.toLowerCase() && b.expected.asString !== '';
        }
        b.input.disabled = true;
        b.input.classList.add(ok ? 'comp-blank-ok' : 'comp-blank-bad');
        if(!ok && b.expected.asString){
          b.input.title = 'Lösung: ' + b.expected.asString;
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
