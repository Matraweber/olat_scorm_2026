// ============================================================================
// utils.js: Shared helpers passed into every block's mount() as `api.utils`.
// Provides: DOM/SVG element builders, number/angle parsing, a safe math-
// expression evaluator, two ready-made question-card layouts (questionCard /
// simpleQuestionCard), a coordinate-plane renderer (renderPlane), a feedback
// box, and the KaTeX auto-render bootstrap (utils.renderMath).
//
// Block modules use these so each block stays small and visually consistent
// with the rest of the runtime.
// ============================================================================
(function(){
  'use strict';
  if(window.BlockUtils) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const utils = {
    SVG_NS,
    svg(name, attrs){
      const el = document.createElementNS(SVG_NS, name);
      if(attrs) Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, String(v)));
      return el;
    },
    el(tag, opts){
      const e = document.createElement(tag);
      if(!opts) return e;
      if(opts.className) e.className = opts.className;
      if(opts.id) e.id = opts.id;
      if(opts.text != null) e.textContent = opts.text;
      if(opts.html != null) e.innerHTML = opts.html;
      if(opts.attrs) Object.entries(opts.attrs).forEach(([k,v]) => e.setAttribute(k, String(v)));
      if(opts.style) Object.assign(e.style, opts.style);
      if(opts.children) opts.children.forEach(c => c && e.appendChild(c));
      return e;
    },
    sanitizeZero(value, eps){
      eps = eps == null ? 5e-3 : eps;
      return Math.abs(value) < eps ? 0 : value;
    },
    fmt(num, digits){
      digits = digits == null ? 2 : digits;
      const clean = utils.sanitizeZero(Number(num), 0.5 * Math.pow(10, -digits));
      return clean.toFixed(digits);
    },
    parseNum(value){
      const s = String(value == null ? '' : value).trim().replace(',', '.');
      if(!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    },
    parseAngle(value){
      const s0 = String(value == null ? '' : value).trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
      if(!s0) return null;
      const s = s0
        .replace(/π/g, 'pi')
        .replace(/([0-9)])pi/g, '$1*pi')
        .replace(/pi(?=[0-9(])/g, 'pi*')
        .replace(/\)(?=[0-9a-z])/g, ')*');
      if(!/^[0-9pi+\-*/().]+$/i.test(s)) return null;
      const jsExpr = s.replace(/pi/g, '(' + Math.PI + ')');
      try {
        const result = Function('"use strict"; return (' + jsExpr + ');')();
        return Number.isFinite(result) ? result : null;
      } catch(e) { return null; }
    },
    nearlyEqual(a, b, tol){ return Math.abs(a - b) <= (tol == null ? 0.05 : tol); },
    normalizeAngle(phi){
      let x = phi;
      while(x <= -Math.PI) x += 2 * Math.PI;
      while(x > Math.PI) x -= 2 * Math.PI;
      return utils.sanitizeZero(x, 1e-9);
    },
    angleEqual(a, b, tol){ return Math.abs(utils.normalizeAngle(a - b)) <= (tol == null ? 0.06 : tol); },
    normalizePowerSyntax(expr){
      return String(expr || '').replace(/\^/g, '**').replace(/(^|[+\-*/(,])-([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?)\*\*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?)/g, '$1-($2**$3)');
    },
    pickDifferent(list, current, isSame){
      const arr = Array.isArray(list) ? list.filter(Boolean) : [];
      if(!arr.length) return null;
      if(arr.length === 1 || current == null) return arr[Math.floor(Math.random() * arr.length)];
      const same = typeof isSame === 'function' ? isSame : (item, cur) => item === cur;
      const candidates = arr.filter(item => !same(item, current));
      const source = candidates.length ? candidates : arr;
      return source[Math.floor(Math.random() * source.length)];
    },
    safeMathExpr(expr, vars){
      const allowedFns = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','exp','log','log2','log10','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
      let s = String(expr || '').replace(/\s+/g, '').replace(/,/g, '.');
      if(!s) return null;
      s = utils.normalizePowerSyntax(s);
      const varNames = Object.keys(vars || {});
      const tokens = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for(const t of tokens){
        if(!(allowedFns.includes(t) || varNames.includes(t) || t === 'pi' || t === 'e' || t === 'PI' || t === 'E')) return null;
      }
      let body = s.replace(/\bpi\b/g, '(Math.PI)').replace(/\bPI\b/g, '(Math.PI)')
                  .replace(/\be\b/g, '(Math.E)').replace(/\bE\b/g, '(Math.E)');
      allowedFns.forEach(fn => { body = body.replace(new RegExp('\\b' + fn + '\\b', 'g'), 'Math.' + fn); });
      try {
        const fn = new Function(...varNames, '"use strict"; return (' + body + ');');
        const r = fn(...varNames.map(v => vars[v]));
        return Number.isFinite(r) ? r : null;
      } catch(e) { return null; }
    },
    feedbackBox(host){
      const box = utils.el('div', {className: 'formula-box feedback-box'});
      const title = utils.el('div', {className: 'formula-title', text: 'Rückmeldung'});
      const text = utils.el('div', {className: 'formula-text', text: 'Noch keine Korrektur durchgeführt.'});
      box.appendChild(title); box.appendChild(text);
      host.appendChild(box);
      return {
        ok(msg){ box.classList.remove('feedback-bad'); box.classList.add('feedback-good'); text.textContent = msg; },
        bad(msg){ box.classList.remove('feedback-good'); box.classList.add('feedback-bad'); text.textContent = msg; },
        neutral(msg){ box.classList.remove('feedback-good','feedback-bad'); text.textContent = msg; }
      };
    },
    /**
     * Standard question card layout used by numeric-input, number-base, and
     * other "ask a question, accept a single text answer, check, regenerate"
     * style blocks.
     *
     * opts: {
     *   h3?: string              // section heading (default 'Aufgabe')
     *   qBoxTitle?: string       // title of the formula-box (default 'Aufgabe')
     *   inputLabel?: string      // label for the answer input (default 'Antwort')
     *   inputPlaceholder?: string // placeholder for the answer input
     * }
     *
     * Returns: { card, qText, inp, checkBtn, newBtn, fb }
     *  - qText: the element to set the question text into
     *  - inp:   the answer <input>
     *  - checkBtn / newBtn: buttons (attach onclick handlers yourself)
     *  - fb:    feedbackBox API { ok, bad, neutral }
     *
     * The card is appended to `host` automatically.
     */
    questionCard(host, opts){
      opts = opts || {};
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3');
      h.textContent = opts.h3 || 'Aufgabe';
      card.appendChild(h);

      const qBox = document.createElement('div');
      qBox.className = 'formula-box';
      qBox.style.marginBottom = '1rem';
      const qBoxTitle = document.createElement('div');
      qBoxTitle.className = 'formula-title';
      qBoxTitle.textContent = opts.qBoxTitle || 'Aufgabe';
      qBox.appendChild(qBoxTitle);
      const qText = document.createElement('div');
      qText.className = 'formula-text';
      qBox.appendChild(qText);
      card.appendChild(qBox);

      const grp = document.createElement('div');
      grp.className = 'control-group control-group-compact';
      const lbl = document.createElement('label');
      lbl.textContent = opts.inputLabel || 'Antwort';
      grp.appendChild(lbl);
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'text-input';
      inp.placeholder = opts.inputPlaceholder || 'Antwort eingeben';
      grp.appendChild(inp);
      card.appendChild(grp);

      const btnRow = document.createElement('div');
      btnRow.className = 'button-cluster';
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Korrektur';
      const newBtn = document.createElement('button');
      newBtn.type = 'button';
      newBtn.className = 'btn btn-secondary';
      newBtn.textContent = 'Neu generieren';
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      card.appendChild(btnRow);

      const fb = utils.feedbackBox(card);
      host.appendChild(card);

      return { card, qText, inp, checkBtn, newBtn, fb };
    },
    /**
     * Simpler question-card layout used by blocks where the answer area is
     * not a single text input (multiple-choice, sort-list, text-input, hotzone).
     * Layout matches questionCard / numeric-input visually: section-card > h3 >
     * formula-box (Frage label + question text) > content > button-cluster > feedback.
     *
     * opts: {
     *   title?: string         // h3 text (block-level title; default 'Aufgabe')
     *   qBoxTitle?: string     // formula-box title (default 'Frage')
     *   question?: string      // textual question; rendered into formula-text
     *   questionHtml?: string  // HTML question; rendered into formula-text (overrides question)
     * }
     * Returns: { card, qText, content, buttons, fb }
     *   qText:   the formula-text div (caller can update later)
     *   content: empty <div> placeholder where caller appends block-specific UI
     *   buttons: <div class="button-cluster"> for caller to append <button>s
     *   fb:      feedbackBox API
     */
    simpleQuestionCard(host, opts){
      opts = opts || {};
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3');
      h.textContent = opts.title || 'Aufgabe';
      card.appendChild(h);

      // Wrap the question in a formula-box for visual consistency with numeric-input/questionCard
      const hasQuestion = (opts.questionHtml != null && String(opts.questionHtml).trim() !== '') ||
                          (opts.question != null && String(opts.question).trim() !== '');
      const qBox = document.createElement('div');
      qBox.className = 'formula-box';
      qBox.style.marginBottom = '1rem';
      const qBoxTitle = document.createElement('div');
      qBoxTitle.className = 'formula-title';
      qBoxTitle.textContent = opts.qBoxTitle || 'Frage';
      qBox.appendChild(qBoxTitle);
      const qText = document.createElement('div');
      qText.className = 'formula-text';
      if(opts.questionHtml != null) qText.innerHTML = opts.questionHtml;
      else if(opts.question != null) qText.textContent = opts.question;
      qBox.appendChild(qText);
      if(hasQuestion) card.appendChild(qBox);

      const content = document.createElement('div');
      content.className = 'block-content';
      card.appendChild(content);
      const buttons = document.createElement('div');
      buttons.className = 'button-cluster';
      card.appendChild(buttons);
      const fb = utils.feedbackBox(card);
      host.appendChild(card);
      return { card, qText, content, buttons, fb };
    },
    /**
     * Standard preview wrapper used in the builder canvas: a small padded div
     * with an optional green tag (icon + label) at the top. Caller appends
     * block-specific content to the returned wrap.
     *
     * opts: {
     *   icon?: string        // short icon string, e.g. '#', '↕', '⇄'
     *   label?: string       // label text after the icon
     *   fillHeight?: boolean // set height:100%; overflow:hidden on wrap
     * }
     * Returns: the wrap element (also the body: caller appends content to it).
     */
    tagPreview(host, opts){
      opts = opts || {};
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.55rem 0.75rem; font-size:0.85rem;' +
        (opts.fillHeight ? ' height:100%; overflow:hidden;' : '');
      if(opts.icon || opts.label){
        const tag = document.createElement('div');
        tag.textContent = [opts.icon, opts.label].filter(Boolean).join('  ');
        tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.4rem;';
        wrap.appendChild(tag);
      }
      host.appendChild(wrap);
      return wrap;
    }
  };

  utils.renderPlane = function(host, options){
    const opts = Object.assign({
      width: 640, height: 640, pad: 54,
      xMin: -5.5, xMax: 5.5, yMin: -5.5, yMax: 5.5,
      xLabel: 'x', yLabel: 'y',
      showGrid: true, gridStep: 1,
      paths: [], lines: [], circles: [], points: [], arcs: []
    }, options || {});
    const W = opts.width, H = opts.height, P = opts.pad;
    const sx = (x) => P + ((x - opts.xMin)/(opts.xMax - opts.xMin)) * (W - 2*P);
    const sy = (y) => H - P - ((y - opts.yMin)/(opts.yMax - opts.yMin)) * (H - 2*P);
    host.innerHTML = '';
    const svg = utils.svg('svg', {viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%'});
    svg.appendChild(utils.svg('rect', {x:0, y:0, width:W, height:H, fill:'#ffffff'}));
    if(opts.showGrid){
      const step = opts.gridStep;
      for(let xv = Math.ceil(opts.xMin/step)*step; xv <= opts.xMax; xv += step){
        if(Math.abs(xv) < 1e-9) continue;
        const x = sx(xv);
        svg.appendChild(utils.svg('line', {x1:x, y1:P, x2:x, y2:H-P, stroke:'#e2e8ed', 'stroke-width':1}));
        const t = utils.svg('text', {x:x, y:sy(0)+18, 'font-size':14, 'text-anchor':'middle', fill:'#5d6872'});
        t.textContent = (Math.round(xv*100)/100); svg.appendChild(t);
      }
      for(let yv = Math.ceil(opts.yMin/step)*step; yv <= opts.yMax; yv += step){
        if(Math.abs(yv) < 1e-9) continue;
        const y = sy(yv);
        svg.appendChild(utils.svg('line', {x1:P, y1:y, x2:W-P, y2:y, stroke:'#e2e8ed', 'stroke-width':1}));
        const t = utils.svg('text', {x:sx(0)-10, y:y+5, 'font-size':14, 'text-anchor':'end', fill:'#5d6872'});
        t.textContent = (Math.round(yv*100)/100); svg.appendChild(t);
      }
    }
    svg.appendChild(utils.svg('line', {x1:P, y1:sy(0), x2:W-P, y2:sy(0), stroke:'#003b5c', 'stroke-width':2}));
    svg.appendChild(utils.svg('line', {x1:sx(0), y1:P, x2:sx(0), y2:H-P, stroke:'#003b5c', 'stroke-width':2}));
    const xl = utils.svg('text', {x:W-P+6, y:sy(0)-8, 'font-size':16, fill:'#003b5c'}); xl.textContent = opts.xLabel; svg.appendChild(xl);
    const yl = utils.svg('text', {x:sx(0)+10, y:P+16, 'font-size':16, fill:'#003b5c'}); yl.textContent = opts.yLabel; svg.appendChild(yl);
    (opts.paths || []).forEach(p => {
      if(!p.points || !p.points.length) return;
      const d = p.points.map((pt,i) => (i===0?'M':'L') + sx(pt[0]) + ' ' + sy(pt[1])).join(' ');
      const path = utils.svg('path', {d, stroke: p.stroke || '#1565ff', fill:'none', 'stroke-width': p.strokeWidth || 3});
      if(p.dash) path.setAttribute('stroke-dasharray', p.dash);
      svg.appendChild(path);
    });
    (opts.circles || []).forEach(c => {
      const radiusPx = Math.abs(sx(c.cx + c.r) - sx(c.cx));
      const el = utils.svg('circle', {cx: sx(c.cx), cy: sy(c.cy), r: radiusPx, fill: c.fill || 'none', stroke: c.stroke || '#888', 'stroke-width': c.strokeWidth || 2});
      if(c.dash) el.setAttribute('stroke-dasharray', c.dash);
      svg.appendChild(el);
    });
    (opts.lines || []).forEach(l => {
      const el = utils.svg('line', {x1:sx(l.x1), y1:sy(l.y1), x2:sx(l.x2), y2:sy(l.y2), stroke: l.stroke || '#1565ff', 'stroke-width': l.strokeWidth || 3});
      if(l.dash) el.setAttribute('stroke-dasharray', l.dash);
      svg.appendChild(el);
    });
    (opts.arcs || []).forEach(a => {
      const cx = a.cx == null ? 0 : Number(a.cx);
      const cy = a.cy == null ? 0 : Number(a.cy);
      const r = Math.abs(Number(a.r) || 0);
      const start = Number(a.start) || 0;
      const end = Number(a.end) || 0;
      if(!r || Math.abs(end - start) < 1e-6) return;
      const steps = Math.max(12, Math.ceil(Math.abs(end - start) / (Math.PI / 36)));
      const pts = [];
      for(let i = 0; i <= steps; i++){
        const t = start + (end - start) * (i / steps);
        pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
      }
      const d = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + sx(pt[0]) + ' ' + sy(pt[1])).join(' ');
      const path = utils.svg('path', {d, stroke: a.stroke || '#d4a72a', fill:'none', 'stroke-width': a.strokeWidth || 3, 'stroke-linecap':'round'});
      if(a.dash) path.setAttribute('stroke-dasharray', a.dash);
      svg.appendChild(path);
      if(a.label){
        const mid = start + (end - start) / 2;
        const labelR = r + (a.labelOffset == null ? 0.28 : Number(a.labelOffset));
        const t = utils.svg('text', {x:sx(cx + labelR * Math.cos(mid)), y:sy(cy + labelR * Math.sin(mid)), 'font-size':a.labelSize || 16, fill:a.labelColor || '#8a6a00', 'font-weight':'700', 'text-anchor':'middle', 'dominant-baseline':'middle'});
        t.textContent = a.label; svg.appendChild(t);
      }
    });
    (opts.points || []).forEach(p => {
      svg.appendChild(utils.svg('circle', {cx:sx(p.x), cy:sy(p.y), r: p.size || 7, fill: p.color || '#1565ff'}));
      if(p.label){
        const t = utils.svg('text', {x:sx(p.x)+10, y:sy(p.y)-10, 'font-size':16, fill:'#003b5c', 'font-weight':'700'});
        t.textContent = p.label; svg.appendChild(t);
      }
    });
    host.appendChild(svg);
  };

  // Auto-render LaTeX math inside an element using KaTeX (loaded via <script> in index.html).
  // Recognised delimiters: $...$, $$...$$, \(...\), \[...\]. No-op if KaTeX isn't loaded yet
  // (will be re-rendered once it does load: see retryQueue below).
  const _mathRetryQueue = [];
  let _katexWatcher = null;
  function _runMathRenderOn(root){
    try {
      window.renderMathInElement(root, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '\\[', right: '\\]', display: true},
          {left: '$',  right: '$',  display: false},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false,
        ignoredTags: ['script','noscript','style','textarea','pre','code']
      });
    } catch(e){ /* swallow render errors */ }
  }
  utils.renderMath = function(root){
    if(!root) return;
    if(typeof window.renderMathInElement === 'function'){
      _runMathRenderOn(root);
      return;
    }
    // KaTeX not loaded yet: queue and re-attempt every 100ms until it arrives.
    _mathRetryQueue.push(root);
    if(_katexWatcher) return;
    _katexWatcher = setInterval(() => {
      if(typeof window.renderMathInElement !== 'function') return;
      clearInterval(_katexWatcher); _katexWatcher = null;
      const queue = _mathRetryQueue.splice(0);
      queue.forEach(el => { if(el.isConnected) _runMathRenderOn(el); });
    }, 100);
  };

  // Random helpers
  // Fisher-Yates in-place shuffle. Returns the same array reference for
  // chaining. Used by block runtimes to randomise answer order.
  utils.shuffle = function(arr){
    if(!Array.isArray(arr)) return arr;
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  window.BlockUtils = utils;
})();
