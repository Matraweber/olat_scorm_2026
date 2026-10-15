// composition-helpers.js: pure helpers used by composition.js.
// Constants, shape factory, snap algorithms, polygon math, SVG rendering.
// Loaded BEFORE composition.js by both the builder and the SCORM runtime.
(function(){
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const DASH = { solid: '', dashed: '10 5', dotted: '2 4' };
  // Human-readable shape name. Resolved via i18n at call time so language
  // switches take effect without a page reload.
  function shapeLabel(type){
    const u = window.BlockUtils;
    if(u && typeof u.t === 'function'){
      return u.t('block.composition.shape.' + type);
    }
    return type;
  }
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
    image:   '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="14" height="12" rx="1"/><circle cx="8" cy="9" r="1.3" fill="currentColor" stroke="none"/><path d="M3 14 L8 10 L13 14 L17 11"/></svg>',
    // Yes/no answer field: input box with a check mark.
    yesno:   '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="16" height="10" rx="2"/><path d="M6 10 L8.5 12.5 L13.5 7.5"/></svg>'
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
    label:   () => {
      const u = window.BlockUtils;
      const text = (u && typeof u.t === 'function') ? u.t('block.composition.shape.label') : 'Beschriftung';
      return { type:'label', x: 80, y:120, text, color:'#003b5c', fontSize:24, fontWeight:'400' };
    },
    coords:  () => ({ type:'coords',  x: 60, y: 60, w:320, h:220,
                      xMin:-5, xMax:5, yMin:-3, yMax:3, step:1,
                      showGrid:true, showLabels:true, color:'#003b5c' }),
    image:   () => ({ type:'image',   x: 80, y: 80, w:240, h:160, src:'' }),
    // Ja/Nein answer field (fill-in-the-blanks mode): correct = 'yes' | 'no'.
    yesno:   () => ({ type:'yesno',   x: 80, y: 80, w:140, h: 40, correct:'yes', points: 1, color:'#c6d1d8' })
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

  // ---- Label rich text ----------------------------------------------------
  // Labels accept a small HTML subset: <b>/<strong>, <i>/<em>, <u>, <s>,
  // <sub>, <sup>, <br> and color via <span style="color:…">. Labels stay real
  // SVG <text> (rendered as <tspan>s), so dragging, hit-testing, snapping and
  // {var}/{N} placeholders keep working. Unknown tags are unwrapped to their
  // text; nothing from the markup except these formats reaches the DOM.
  // Plain labels (no recognised tag/entity) render exactly as before, so a
  // math label like "x<y" is not misread as HTML.
  const LABEL_HTML_RE = /<\/?(b|strong|i|em|u|s|sub|sup|br|span)\b[^>]*>|&(?:[a-z]+|#\d+);/i;
  function labelHasHtml(text){ return LABEL_HTML_RE.test(String(text || '')); }
  // -> array of lines, each an array of runs {text, bold, italic, underline,
  //    strike, shift:'sub'|'sup', color}.
  function parseLabelLines(text){
    const str = String(text || '');
    if(!labelHasHtml(str)) return [[{ text: str }]];
    const tpl = document.createElement('template');
    tpl.innerHTML = str; // inert: template content never runs scripts
    const lines = [[]];
    (function walk(node, fmt){
      node.childNodes.forEach(ch => {
        if(ch.nodeType === 3){
          if(ch.nodeValue) lines[lines.length - 1].push(Object.assign({ text: ch.nodeValue }, fmt));
          return;
        }
        if(ch.nodeType !== 1) return;
        const tag = ch.tagName.toLowerCase();
        if(tag === 'br'){ lines.push([]); return; }
        const f = Object.assign({}, fmt);
        if(tag === 'b' || tag === 'strong') f.bold = true;
        else if(tag === 'i' || tag === 'em') f.italic = true;
        else if(tag === 'u') f.underline = true;
        else if(tag === 's' || tag === 'strike' || tag === 'del') f.strike = true;
        else if(tag === 'sub') f.shift = 'sub';
        else if(tag === 'sup') f.shift = 'sup';
        if(ch.style && ch.style.color) f.color = ch.style.color;
        walk(ch, f);
      });
    })(tpl.content, {});
    return lines;
  }
  // KaTeX in labels: $…$, $$…$$, \(…\) or \[…\]. SVG <text> cannot hold
  // KaTeX output, so such labels render as an HTML box in a <foreignObject>
  // (see renderMathLabel); everything else stays SVG text.
  const LABEL_MATH_RE = /\$[^$]+\$|\\\(|\\\[/;
  function labelHasMath(text){ return LABEL_MATH_RE.test(String(text || '')); }
  // The math box's top edge sits this many font sizes above the baseline
  // anchor (x, y), so it lines up with where SVG text would be.
  const MATH_LABEL_TOP = 1.15;
  function mathLabelY(shape){
    return (shape.y ?? 30) - (Number(shape.fontSize) || 18) * MATH_LABEL_TOP;
  }
  // Ja/Nein answer field as drawn on the canvas (builder + non-graded views).
  function yesNoPlaceholder(){
    const u = window.BlockUtils;
    return (u && typeof u.t === 'function') ? u.t('block.composition.yesno.placeholder') : 'Ja/Nein';
  }
  function renderYesNoBox(shape){
    const x = shape.x ?? 0, y = shape.y ?? 0;
    const w = Math.max(40, shape.w ?? 140), h = Math.max(20, shape.h ?? 40);
    const g = document.createElementNS(NS, 'g');
    const box = document.createElementNS(NS, 'rect');
    box.setAttribute('x', x); box.setAttribute('y', y);
    box.setAttribute('width', w); box.setAttribute('height', h);
    box.setAttribute('rx', Math.min(8, h / 4));
    box.setAttribute('fill', '#ffffff');
    box.setAttribute('stroke', shape.color || '#c6d1d8');
    box.setAttribute('stroke-width', 1.5);
    g.appendChild(box);
    const tx = document.createElementNS(NS, 'text');
    const fs = Math.max(10, Math.min(20, h * 0.45));
    tx.setAttribute('x', x + 10); tx.setAttribute('y', y + h / 2 + fs * 0.35);
    tx.setAttribute('font-size', fs);
    tx.setAttribute('font-family', 'Verdana, Arial, sans-serif');
    tx.setAttribute('fill', '#8a959e');
    tx.textContent = yesNoPlaceholder();
    g.appendChild(tx);
    return g;
  }
  function renderMathLabel(shape, color, text){
    const m = labelMetrics(shape);
    const fs = m.fs;
    const fo = document.createElementNS(NS, 'foreignObject');
    fo.setAttribute('x', shape.x ?? 10);
    fo.setAttribute('y', mathLabelY(shape));
    // Generous box (rendered math is often wider/taller than the estimate);
    // only the inline-block content takes pointer events, not the empty area.
    fo.setAttribute('width', Math.max(80, m.w * 1.6 + 40));
    fo.setAttribute('height', m.h + fs * 1.2);
    fo.style.overflow = 'visible';
    fo.style.pointerEvents = 'none';
    const div = document.createElement('div');
    div.className = 'comp-math-label';
    div.style.cssText = 'display:inline-block; white-space:nowrap; pointer-events:auto; ' +
      'font:' + (shape.fontWeight || '400') + ' ' + fs + 'px Verdana, Arial, sans-serif; ' +
      'line-height:1.25; color:' + color + ';';
    div.appendChild(labelHtmlFragment(text != null ? text : shape.text));
    fo.appendChild(div);
    const u = window.BlockUtils;
    if(u && u.renderMath){
      // Typeset now if KaTeX is ready; otherwise once the node is in the DOM.
      if(typeof window.renderMathInElement === 'function') u.renderMath(div);
      else setTimeout(() => u.renderMath(div), 0);
    }
    return fo;
  }
  function labelPlainText(text){
    return parseLabelLines(text).map(l => l.map(r => r.text).join('')).join(' ');
  }
  // Estimated box (SVG has no cheap text measuring before render):
  // w = widest line, h = first-line font size + extra lines.
  function labelMetrics(shape){
    const fs = Number(shape && shape.fontSize) || 18;
    const charW = fs * 0.55;
    const lines = parseLabelLines(shape && shape.text);
    let w = 0;
    // In $…$ math, LaTeX commands/braces are much wider in source than
    // rendered: count \frac etc. as one character and drop {}^_$.
    const visible = s => labelHasMath(s)
      ? s.replace(/\\[A-Za-z]+/g, 'x').replace(/[{}^_$]|\\[()[\]]/g, '')
      : s;
    lines.forEach(runs => {
      let lw = 0;
      runs.forEach(r => { lw += visible(r.text).length * charW * (r.shift ? 0.7 : 1); });
      if(lw > w) w = lw;
    });
    const lineH = fs * 1.25;
    return { fs, w, h: fs + (lines.length - 1) * lineH, lineH, lines: lines.length };
  }
  // Fill an SVG <text> element with the label's (possibly formatted) text.
  function fillLabelText(el, shape, text){
    const str = text != null ? String(text) : String((shape && shape.text) || '');
    while(el.firstChild) el.removeChild(el.firstChild);
    if(!labelHasHtml(str)){ el.textContent = str; return; }
    const fs = Number(shape && shape.fontSize) || 18;
    const lineH = fs * 1.25;
    const x = (shape && shape.x != null) ? shape.x : 10;
    let shift = 0;
    parseLabelLines(str).forEach((runs, li) => {
      // Empty lines still need a node to advance the baseline.
      if(runs.length === 0) runs = [{ text: ' ' }];
      runs.forEach((r, ri) => {
        const ts = document.createElementNS(NS, 'tspan');
        // Sub/sup via dy (baseline-shift is unreliable across browsers).
        const target = r.shift === 'sup' ? -fs * 0.35 : r.shift === 'sub' ? fs * 0.2 : 0;
        let dy = target - shift;
        if(ri === 0 && li > 0){ ts.setAttribute('x', x); dy += lineH; }
        if(dy) ts.setAttribute('dy', Math.round(dy * 100) / 100);
        shift = target;
        if(r.shift) ts.setAttribute('font-size', Math.round(fs * 0.7 * 100) / 100);
        if(r.bold) ts.setAttribute('font-weight', '700');
        if(r.italic) ts.setAttribute('font-style', 'italic');
        const deco = [r.underline && 'underline', r.strike && 'line-through'].filter(Boolean).join(' ');
        if(deco) ts.setAttribute('text-decoration', deco);
        if(r.color) ts.setAttribute('fill', r.color);
        ts.textContent = r.text;
        el.appendChild(ts);
      });
    });
  }
  // Same subset as safe HTML for the fill-in-the-blanks foreignObject.
  // Elements with data-cslot (slot/mirror placeholders) are kept as empty
  // markers for the caller to replace with inputs.
  function labelHtmlFragment(html){
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    const frag = document.createDocumentFragment();
    const MAP = { b:'b', strong:'b', i:'i', em:'i', u:'u', s:'s', strike:'s', del:'s', sub:'sub', sup:'sup', span:'span' };
    (function walk(src, dst){
      src.childNodes.forEach(ch => {
        if(ch.nodeType === 3){ dst.appendChild(document.createTextNode(ch.nodeValue)); return; }
        if(ch.nodeType !== 1) return;
        const tag = ch.tagName.toLowerCase();
        if(tag === 'br'){ dst.appendChild(document.createElement('br')); return; }
        if(ch.hasAttribute('data-cslot')){
          const m = document.createElement('span');
          m.setAttribute('data-cslot', ch.getAttribute('data-cslot'));
          dst.appendChild(m);
          return;
        }
        let out = dst;
        if(MAP[tag]){
          out = document.createElement(MAP[tag]);
          if(ch.style && ch.style.color) out.style.color = ch.style.color;
          dst.appendChild(out);
        }
        walk(ch, out);
      });
    })(tpl.content, frag);
    return frag;
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

  // Formula ready for safeMathExpr: slot refs expanded and, unless the block
  // works in radians (config.angleUnit === 'rad'), sin/cos/tan/asin/acos/atan
  // switched to their degree variants (sind, …) so sin(30) = 0.5 and
  // asin(0.5) = 30. Explicit sind()/sin() spellings are left alone.
  function prepareFormula(formula, angleUnit){
    return window.BlockUtils.applyAngleUnit(expandSlotRefs(formula), angleUnit);
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

  // Combined snap stack used by every drag handler: element-to-element
  // alignment wins (most predictable, draws guide lines), grid as fallback.
  // Returns null only when both layers are empty.
  function makeCompositionSnap(shapes, excludeSet, canvasW, canvasH){
    const el = makeElementSnap(shapes, excludeSet);
    const coords = findCoordsForSnap(shapes, excludeSet);
    const grid = coords
      ? makeGridSnap(coords)
      : makeCanvasGridSnap(canvasW, canvasH, 10);
    if(!el && !grid) return null;
    return function(svgX, svgY, threshold){
      if(el){
        const r = el(svgX, svgY, threshold == null ? 8 : threshold);
        if(r) return r;
      }
      if(grid){
        return grid(svgX, svgY, threshold == null ? 12 : threshold);
      }
      return null;
    };
  }

  // Shared snap-indicator rendering: a small green ring on the locked point
  // plus full-canvas guide lines when element alignment is active.
  function buildSnapIndicator(p, canvasW, canvasH){
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('data-snap-indicator', '1');
    g.style.pointerEvents = 'none';
    if(p && p.vGuide){
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', p.vGuide.x); l.setAttribute('y1', 0);
      l.setAttribute('x2', p.vGuide.x); l.setAttribute('y2', canvasH);
      l.setAttribute('stroke', '#1565ff');
      l.setAttribute('stroke-width', '1');
      l.setAttribute('stroke-dasharray', '4 3');
      l.setAttribute('opacity', '0.85');
      g.appendChild(l);
    }
    if(p && p.hGuide){
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', 0); l.setAttribute('y1', p.hGuide.y);
      l.setAttribute('x2', canvasW); l.setAttribute('y2', p.hGuide.y);
      l.setAttribute('stroke', '#1565ff');
      l.setAttribute('stroke-width', '1');
      l.setAttribute('stroke-dasharray', '4 3');
      l.setAttribute('opacity', '0.85');
      g.appendChild(l);
    }
    if(p){
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
      ring.setAttribute('r', 7);
      ring.setAttribute('fill', 'rgba(132,191,102,0.25)');
      ring.setAttribute('stroke', '#84bf66');
      ring.setAttribute('stroke-width', '1.5');
      g.appendChild(ring);
    }
    return g;
  }

  // Element-to-element alignment snap. Returns a function that, given a point,
  // returns the nearest x-aligned and/or y-aligned anchor from other shapes
  // along with the reference points needed to draw a guide line.
  function makeElementSnap(shapes, excludeSet){
    if(!Array.isArray(shapes)) return null;
    const xCands = []; // { x, y, idx } for vertical alignment
    const yCands = []; // { x, y, idx } for horizontal alignment
    for(let i = 0; i < shapes.length; i++){
      if(excludeSet && excludeSet.has(i)) continue;
      const sh = shapes[i];
      if(!sh) continue;
      const pts = shapeSnapCandidates(sh);
      for(const p of pts){
        if(!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        xCands.push({ x: p.x, y: p.y, idx: i });
        yCands.push({ x: p.x, y: p.y, idx: i });
      }
    }
    if(!xCands.length && !yCands.length) return null;
    return function snap(svgX, svgY, threshold){
      threshold = threshold == null ? 8 : threshold;
      let bestX = null, bestXd = threshold + 1;
      for(const c of xCands){
        const d = Math.abs(svgX - c.x);
        if(d <= threshold && d < bestXd){ bestX = c; bestXd = d; }
      }
      let bestY = null, bestYd = threshold + 1;
      for(const c of yCands){
        const d = Math.abs(svgY - c.y);
        if(d <= threshold && d < bestYd){ bestY = c; bestYd = d; }
      }
      if(!bestX && !bestY) return null;
      const newX = bestX ? bestX.x : svgX;
      const newY = bestY ? bestY.y : svgY;
      return {
        x: newX, y: newY,
        dx: newX - svgX, dy: newY - svgY,
        // Guide line endpoints from the moving point to the reference shape.
        vGuide: bestX ? { x: newX, fromY: bestX.y, toY: svgY } : null,
        hGuide: bestY ? { y: newY, fromX: bestY.x, toX: svgX } : null
      };
    };
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
      case 'rect': case 'image': case 'coords': case 'yesno': {
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
        // Multi-line labels (<br>) extend below the first baseline.
        const m = labelMetrics(shape);
        const fs = m.fs;
        const textW = Math.max(fs * 0.55, m.w);
        const x = shape.x || 0, y = shape.y || 0;
        const bottom = y + (m.h - fs);
        return [
          { x: x, y: y },                       // baseline-left (the anchor)
          { x: x + textW, y: y },               // baseline-right
          { x: x, y: y - fs },                  // top-left
          { x: x + textW, y: y - fs },          // top-right
          { x: x + textW / 2, y: (y - fs + bottom) / 2 } // visual center
        ];
      }
      default:
        return [];
    }
  }

  // Human-readable shape label for the picker dropdown (and any future UI
  // that needs to name a shape).
  function shapeDisplayName(shape, idx){
    const u = window.BlockUtils;
    const t = (u && typeof u.t === 'function') ? u.t : (k => k);
    if(!shape || !shape.type) return t('block.composition.display.fallback', { n: idx + 1 });
    switch(shape.type){
      case 'line':    return t('block.composition.shape.line');
      case 'arrow':   return t('block.composition.shape.arrow');
      case 'circle':  return t('block.composition.shape.circle') + '  (r=' + (shape.r ?? '?') + ')';
      case 'ellipse': return t('block.composition.shape.ellipse');
      case 'polygon': {
        const n = Array.isArray(shape.points) ? shape.points.length : (shape.sides || 0);
        const byCount = t('block.composition.polygonByCount.' + n);
        if(byCount !== 'block.composition.polygonByCount.' + n) return byCount;
        return t('block.composition.polygonByCount.generic', { n: n });
      }
      case 'rect':    return t('block.composition.shape.rect');
      case 'label':   return t('block.composition.display.label', { text: labelPlainText(shape.text).slice(0, 20) });
      case 'coords':  return t('block.composition.shape.coords');
      case 'image':   return shape.src ? t('block.composition.shape.image') : t('block.composition.display.imageEmpty');
      case 'yesno':   return t('block.composition.display.yesno', { answer: t(shape.correct === 'no' ? 'block.composition.yesno.no' : 'block.composition.yesno.yes'), pts: shape.points ?? 1 });
      default:        return shape.type;
    }
  }

  // Polygon picker presets. Points are designed for 600×360; the add
  // handler translates them to the current canvas center. Labels/hints
  // are pulled from i18n on read so language switches take effect.
  const POLYGON_PRESETS_RAW = [
    {
      id: 'right',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="3,17 17,17 3,4"/></svg>',
      points: [[150, 280], [450, 280], [150, 100]]
    },
    {
      id: 'isosceles',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="10,3 17,16 3,16"/></svg>',
      points: [[300, 100], [180, 280], [420, 280]]
    },
    {
      id: 'equilateral',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="10,3.5 16.5,15 3.5,15"/></svg>',
      regular: 3, r: 90
    },
    {
      id: 'scalene',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="4,15 17,12 11,4"/></svg>',
      points: [[160, 270], [450, 240], [320, 110]]
    },
    {
      id: 'square',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="4" width="12" height="12"/></svg>',
      points: [[200, 100], [400, 100], [400, 300], [200, 300]]
    },
    {
      id: 'pentagon',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="10,3 17,8 14,16 6,16 3,8"/></svg>',
      regular: 5, r: 90
    },
    {
      id: 'hexagon',
      icon: '<svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="6,3.5 14,3.5 18,10 14,16.5 6,16.5 2,10"/></svg>',
      regular: 6, r: 90
    }
  ];
  // Proxy-like accessor: reading POLYGON_PRESETS returns fresh objects with
  // translated label/hint each time (Object.defineProperty on the array's
  // length isn't needed since consumers iterate via forEach / map).
  const POLYGON_PRESETS = POLYGON_PRESETS_RAW.map(preset => Object.defineProperties(
    Object.assign({}, preset),
    {
      label: { enumerable: true, get(){
        const u = window.BlockUtils;
        return (u && typeof u.t === 'function') ? u.t('block.composition.polygonPreset.' + preset.id + '.label') : preset.id;
      }},
      hint: { enumerable: true, get(){
        const u = window.BlockUtils;
        return (u && typeof u.t === 'function') ? u.t('block.composition.polygonPreset.' + preset.id + '.hint') : '';
      }}
    }
  ));
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
  // label/description resolved via i18n on read (see accessor wrapper below).
  // Shape text is authored content: the label formulas ("1. Schritt: ...")
  // stay in German because they carry math that a bilingual author edits
  // freely after inserting the template.
  const COMPOSITION_TEMPLATES_RAW = [
    {
      id: 'tpl-rect-area',
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
        // Step 1: enter c² in slot {1}. Sum of two integer squares -> integer
        // answer, so a tight tolerance is fine here.
        { type:'label', x:60, y:50, text:'1. Schritt:  c² = a² + b² = {1}',
          color:'#003b5c', fontSize:17, fontWeight:'700',
          formulas: { 1: { formula:'a*a + b*b', tolerance:0.01 } } },
        // Step 2: enter c in slot {2}. {1*} mirrors the student's c² answer
        // and the formula resolves it to s1 at grading time. For most a, b
        // the square root is irrational, so the tolerance allows one decimal
        // place of rounding.
        { type:'label', x:60, y:80, text:'2. Schritt:  c = √{1*}  = {2}  (auf 2 Nachkommastellen runden)',
          color:'#003b5c', fontSize:15, fontWeight:'700',
          formulas: { 2: { formula:'sqrt({1*})', tolerance:0.05 } } }
      ]
    }
  ];
  // Read-time i18n: label/description look up the current locale so a
  // language switch updates the picker without rebuilding the array.
  const COMPOSITION_TEMPLATES = COMPOSITION_TEMPLATES_RAW.map(tpl => Object.defineProperties(
    Object.assign({}, tpl),
    {
      label: { enumerable: true, get(){
        const u = window.BlockUtils;
        return (u && typeof u.t === 'function') ? u.t('block.composition.template.' + tpl.id + '.label') : tpl.id;
      }},
      description: { enumerable: true, get(){
        const u = window.BlockUtils;
        return (u && typeof u.t === 'function') ? u.t('block.composition.template.' + tpl.id + '.description') : '';
      }}
    }
  ));

  // Pick an image via hidden <input type=file>, return its data URL.
  // Resolves with null on cancel.
  // Cancel is detected via the input's `cancel` event. Do not infer it from
  // the window regaining focus: on Windows focus returns before `change`
  // delivers the file, which used to resolve null and drop the picked image.
  function pickImageDataUrl(){
    return new Promise(resolve => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.style.position = 'absolute'; inp.style.left = '-9999px';
      document.body.appendChild(inp);
      let done = false;
      const finish = (value) => {
        if(done) return;
        done = true;
        if(inp.parentNode) inp.parentNode.removeChild(inp);
        resolve(value);
      };
      inp.addEventListener('change', () => {
        const file = inp.files && inp.files[0];
        if(!file){ finish(null); return; }
        const reader = new FileReader();
        // In the builder, shrink big photos first (js/image-shrink.js).
        reader.onload = () => {
          const shrink = window.ScormBuilderShrinkImage;
          if(typeof shrink === 'function') shrink(reader.result).then(finish, () => finish(reader.result));
          else finish(reader.result);
        };
        reader.onerror = () => finish(null);
        reader.readAsDataURL(file);
      });
      inp.addEventListener('cancel', () => finish(null));
      inp.click();
    });
  }

  function shapeSummary(item){
    const u = window.BlockUtils;
    const t = (u && typeof u.t === 'function') ? u.t : (k => k);
    if(!item || !item.type) return t('block.composition.summary.empty');
    const name = shapeLabel(item.type);
    if(item.type === 'label')  return name + ': "' + labelPlainText(item.text).slice(0, 30) + '"';
    if(item.type === 'circle') return name + '  (r=' + (item.r ?? '?') + ')';
    if(item.type === 'ellipse') return name + '  (' + (item.rx ?? '?') + '×' + (item.ry ?? '?') + ')';
    if(item.type === 'polygon') return name + '  (' + (item.sides ?? 3) + ' ' + t('block.composition.summary.cornersSuffix') + ')';
    if(item.type === 'rect' || item.type === 'image' || item.type === 'coords' || item.type === 'yesno')
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
    const u = window.BlockUtils;
    const label = (u && typeof u.t === 'function') ? u.t('block.composition.canvas.imagePlaceholder') : 'Bild auswählen…';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">' +
      '<rect width="240" height="160" fill="#f5f8fa" stroke="#d8e0e6" stroke-dasharray="6 4"/>' +
      '<text x="120" y="86" text-anchor="middle" font-family="Verdana,sans-serif" font-size="13" fill="#5d6872">' + label + '</text>' +
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
    } else if(shape.type === 'label' && labelHasMath(shape.text)){
      el = renderMathLabel(shape, color);
    } else if(shape.type === 'label'){
      el = document.createElementNS(NS, 'text');
      el.setAttribute('x', shape.x ?? 10); el.setAttribute('y', shape.y ?? 30);
      el.setAttribute('fill', color);
      el.setAttribute('font-size', shape.fontSize || 18);
      el.setAttribute('font-weight', shape.fontWeight || '400');
      el.setAttribute('font-family', 'Verdana, Arial, sans-serif');
      fillLabelText(el, shape);
    } else if(shape.type === 'coords'){
      el = renderCoords(shape);
    } else if(shape.type === 'yesno'){
      // Looks like the runtime input: rounded box + grey "Ja/Nein" placeholder.
      // In fill-in-the-blanks mode the runtime swaps it for a real input.
      el = renderYesNoBox(shape);
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
    // capViewport: runtime/preview only. Cap width and height by the same
    // viewport ceiling so the aspect ratio stays correct on wide cards.
    // Reservation of 200 px leaves room for the SCORM header / nav while
    // giving the figure most of the viewport so it stays readable.
    if(opts && opts.capViewport){
      const aspect = w / h;
      const maxH = 'max(420px, calc(100vh - 200px))';
      svg.style.width  = 'min(100%, calc(' + maxH + ' * ' + aspect + '))';
      svg.style.maxHeight = maxH;
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

  // Exposed: only the symbols composition.js destructures directly.
  // DASH, SHAPE_DEFAULTS, makeGridSnap, makeCanvasGridSnap, findCoordsForSnap,
  // makeElementSnap, buildArrowhead, renderCoords, placeholderImage are used
  // only inside this file via closure and stay private.
  window.CompositionHelpers = {
    NS, shapeLabel, SHAPE_ICONS, ACTION_ICONS,
    NONE_FILL, NONE_STROKE,
    POLYGON_PRESETS, COMPOSITION_TEMPLATES,
    isNoneColor, newShape,
    parseSlotTokens, slotNumbersInLabel, expandSlotRefs, prepareFormula, formatSlotValue,
    labelHasHtml, labelHasMath, mathLabelY, renderMathLabel, yesNoPlaceholder, labelPlainText, labelMetrics, fillLabelText, labelHtmlFragment,
    makeCompositionSnap, buildSnapIndicator, shapeSnapCandidates,
    shapeDisplayName, makePolygonFromPreset,
    pickImageDataUrl, shapeSummary,
    regularPolygonPoints, polygonGetPoints, polygonPointsAttr, polygonCentroid,
    renderShape, buildSvg
  };
})();
