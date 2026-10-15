// utils.js: Helpers passed into every block's mount() as `api.utils`.
// DOM/SVG builders, number/angle parsing, safe expression evaluator,
// question-card layouts, renderPlane, feedbackBox, KaTeX renderMath,
// variable display (fillMathTemplate, varFormats), global variables,
// deduction helpers, i18n (t/l, locale bundles).
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
    // Escape a string for safe interpolation into an innerHTML template.
    // Use this for any author-supplied value that ends up inside an HTML
    // string rather than being assigned via textContent.
    escapeHtml(value){
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    // Sanitize an HTML string for blocks that intentionally render authored
    // markup (rich-text). Parsing happens inside a <template>, whose content
    // is inert: img/script never load or execute during sanitization. We then
    // drop active elements and any on*/javascript:/data:text\/html vectors,
    // keeping ordinary formatting (p, strong, em, ul, li, code, a, br, ...).
    sanitizeHtml(html){
      const tpl = document.createElement('template');
      tpl.innerHTML = String(html == null ? '' : html);
      const DANGER_TAGS = new Set(['script','style','iframe','object','embed','link','meta','base','form','input','button','textarea','select','svg','math']);
      const badUrl = v => /^\s*(javascript|vbscript):/i.test(v) || /^\s*data:text\/html/i.test(v);
      const walk = root => {
        Array.from(root.children || []).forEach(el => {
          if(DANGER_TAGS.has(el.tagName.toLowerCase())){ el.remove(); return; }
          Array.from(el.attributes).forEach(attr => {
            const name = attr.name.toLowerCase();
            if(name.startsWith('on')){ el.removeAttribute(attr.name); return; }
            if((name === 'href' || name === 'src' || name === 'xlink:href') && badUrl(attr.value)){ el.removeAttribute(attr.name); return; }
            if(name === 'style' && /expression\s*\(|javascript:/i.test(attr.value)){ el.removeAttribute(attr.name); }
          });
          walk(el);
        });
      };
      walk(tpl.content);
      return tpl.innerHTML;
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
      // Fraction: "a/b", whitespace allowed.
      const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
      if(frac){
        const num = Number(frac[1]);
        const den = Number(frac[2]);
        if(Number.isFinite(num) && Number.isFinite(den) && den !== 0) return num / den;
        return null;
      }
      // Mixed: "1 3/4" -> 1.75
      const mixed = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
      if(mixed){
        const sign = mixed[1] === '-' ? -1 : 1;
        const whole = Number(mixed[2]);
        const num = Number(mixed[3]);
        const den = Number(mixed[4]);
        if(Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den) && den !== 0){
          return sign * (whole + num / den);
        }
        return null;
      }
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
      } catch { return null; }
    },
    nearlyEqual(a, b, tol){ return Math.abs(a - b) <= (tol == null ? 0.05 : tol); },
    // Reduced fraction a/b, or null if not a rational within maxDenom.
    gcd(a, b){
      a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
      while(b){ const t = b; b = a % b; a = t; }
      return a || 1;
    },
    asFraction(value, maxDenom){
      if(!Number.isFinite(value)) return null;
      const limit = maxDenom || 999;
      const sign = value < 0 ? -1 : 1;
      const x = Math.abs(value);
      if(Math.abs(x - Math.round(x)) < 1e-9) return null;
      for(let den = 2; den <= limit; den++){
        const num = x * den;
        if(Math.abs(num - Math.round(num)) < 1e-9){
          const n = Math.round(num);
          const g = utils.gcd(n, den);
          return { num: sign * (n / g), den: den / g };
        }
      }
      return null;
    },
    formatNum(value){
      if(!Number.isFinite(value)) return String(value);
      if(Number.isInteger(value)) return String(value);
      const rounded = Math.round(value * 1000) / 1000;
      return String(rounded);
    },
    // Round to N decimal places. Used for score reporting (2 decimals)
    // and value display (typically 2 or 3).
    roundTo(value, decimals){
      const m = Math.pow(10, decimals);
      return Math.round(value * m) / m;
    },
    // LaTeX -> ASCII conversion for formula derivation. Handles \frac (also
    // \dfrac, \tfrac), \sqrt, \cdot, \times, \div, \pi, \left/\right. \frac
    // wraps in outer parens so fraction-division compositions evaluate
    // correctly. Arguments are read brace-balanced, so nested groups work:
    // \frac{{a}}{{b}}, \frac{\frac{a}{b}}{c}, \sqrt{\frac{a}{b}}.
    latexToAscii(str){
      function conv(s){
        let out = '', i = 0;
        while(i < s.length){
          const rest = s.slice(i);
          const mf = rest.match(/^\\[dt]?frac\s*/);
          if(mf){
            const j = i + mf[0].length;
            const g1 = s[j] === '{' ? _readBraceGroup(s, j) : null;
            if(g1){
              let k = g1.end + 1;
              while(s[k] === ' ') k++;
              const g2 = s[k] === '{' ? _readBraceGroup(s, k) : null;
              if(g2){
                out += '((' + conv(g1.content) + ')/(' + conv(g2.content) + '))';
                i = g2.end + 1;
                continue;
              }
            }
          }
          const ms = rest.match(/^\\sqrt\s*/);
          if(ms){
            const j = i + ms[0].length;
            const g = s[j] === '{' ? _readBraceGroup(s, j) : null;
            if(g){
              out += 'sqrt(' + conv(g.content) + ')';
              i = g.end + 1;
              continue;
            }
          }
          out += s[i++];
        }
        return out;
      }
      return conv(String(str || ''))
        .replace(/\\cdot/g, '*')
        .replace(/\\times/g, '*')
        .replace(/\\div/g, '/')
        .replace(/\\pi/g, 'pi')
        .replace(/\\left|\\right/g, '');
    },
    // "15/4 (= 3.75)" for non-integer rationals, plain decimal otherwise.
    formatSolution(value){
      if(!Number.isFinite(value)) return String(value);
      if(Number.isInteger(value)) return String(value);
      const frac = utils.asFraction(value);
      const dec = Math.round(value * 1000) / 1000;
      if(frac && Math.abs(frac.den) > 1){
        return frac.num + '/' + frac.den + ' (= ' + dec + ')';
      }
      return String(dec);
    },
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
    // Angle unit for a formula: unless angleUnit === 'rad', sin/cos/tan and
    // asin/acos/atan become their degree variants (sind, …) so sin(30) = 0.5.
    // Explicit sind()/sin() spellings elsewhere are left alone.
    applyAngleUnit(expr, angleUnit){
      // arcsin/arccos/arctan are aliases of asin/acos/atan.
      const s = utils.normalizeArcFns(expr);
      return angleUnit === 'rad' ? s : s.replace(/\b(asin|acos|atan|sin|cos|tan)(\s*\()/g, '$1d$2');
    },
    normalizeArcFns(expr){
      return String(expr || '').replace(/\barc(sin|cos|tan)(d?)\b/g, 'a$1$2');
    },
    // "Nur ganzzahlige Lösungen": blocks redraw their random values until
    // every computed solution is a whole number. opts: { showIf, helpKey }
    // (the help text says which solutions count in that block).
    integerAnswersSchemaField(opts){
      opts = opts || {};
      const spec = { key:'integerAnswers', label:'Nur ganzzahlige Lösungen', labelKey:'utils.integerAnswers.label', type:'boolean',
        help:'Es werden nur Aufgaben gestellt, deren Lösungen ganze Zahlen sind.', helpKey: opts.helpKey || 'utils.integerAnswers.help' };
      if(opts.showIf) spec.showIf = opts.showIf;
      return spec;
    },
    isWholeNumber(v){
      return typeof v === 'number' && Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9;
    },
    // Shared builder field for blocks with formulas (default: degrees).
    angleUnitSchemaField(showIf){
      const spec = { key:'angleUnit', label:'Winkel in Formeln', labelKey:'utils.angleUnit.label', type:'select',
        help:'Gilt für sin, cos, tan, arcsin, arccos, arctan (= asin, acos, atan). sind(), cosd() … rechnen immer in Grad.', helpKey:'utils.angleUnit.help',
        options:[
          { value:'deg', label:'Grad (°), z. B. sin(30) = 0,5',        labelKey:'utils.angleUnit.deg' },
          { value:'rad', label:'Bogenmaß (rad), z. B. sin(pi/6) = 0,5', labelKey:'utils.angleUnit.rad' }
        ] };
      if(showIf) spec.showIf = showIf;
      return spec;
    },
    safeMathExpr(expr, vars){
      const allowedFns = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','exp','log','log2','log10','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
      // Degree variants (sind(30) = 0.5, asind(0.5) = 30), passed in as __deg.
      const degFns = ['sind','cosd','tand','asind','acosd','atand'];
      let s = utils.normalizeArcFns(expr).replace(/,/g, '.');
      if(!s.trim()) return null;
      // Implicit "*": "2pi" -> "2*pi", but leave "sin(x)" alone.
      // Iterate until stable so neighbouring patterns chain ("2 pi r" -> "2*pi*r").
      let prev;
      do {
        prev = s;
        s = s.replace(/([A-Za-z0-9_)])\s+(?=[A-Za-z_(])/g, '$1*');
        s = s.replace(/(\d)([A-Za-z_])/g, '$1*$2');
        s = s.replace(/\)([A-Za-z0-9_(])/g, ')*$1');
      } while(s !== prev);
      s = s.replace(/\s+/g, '');
      s = utils.normalizePowerSyntax(s);
      const varNames = Object.keys(vars || {});
      const tokens = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for(const t of tokens){
        if(!(allowedFns.includes(t) || degFns.includes(t) || varNames.includes(t) || t === 'pi' || t === 'e' || t === 'PI' || t === 'E')) return null;
      }
      // Constants via placeholders so we don't re-match "PI" inside "(Math.PI)".
      // A variable with the same name wins: with a variable e, "6/e" divides
      // by that variable, not by Euler's number (likewise E, pi, PI).
      const constRe = names => {
        const free = names.filter(n => !varNames.includes(n));
        return free.length ? new RegExp('\\b(?:' + free.join('|') + ')\\b', 'g') : null;
      };
      const piRe = constRe(['pi', 'PI']), eRe = constRe(['e', 'E']);
      let body = s;
      if(piRe) body = body.replace(piRe, '__PI__');
      if(eRe)  body = body.replace(eRe, '__E__');
      body = body.replace(/__PI__/g, '(Math.PI)').replace(/__E__/g, '(Math.E)');
      allowedFns.forEach(fn => { body = body.replace(new RegExp('\\b' + fn + '\\b', 'g'), 'Math.' + fn); });
      degFns.forEach(fn => { body = body.replace(new RegExp('\\b' + fn + '\\b', 'g'), '__deg.' + fn); });
      const R = Math.PI / 180;
      // Snap tiny float noise so e.g. cosd(90) is exactly 0, not 6e-17.
      const clean = v => Math.abs(v) < 1e-12 ? 0 : v;
      const __deg = {
        sind: x => clean(Math.sin(x * R)), cosd: x => clean(Math.cos(x * R)), tand: x => clean(Math.tan(x * R)),
        asind: x => Math.asin(x) / R, acosd: x => Math.acos(x) / R, atand: x => Math.atan(x) / R
      };
      try {
        const fn = new Function('__deg', ...varNames, '"use strict"; return (' + body + ');');
        const r = fn(__deg, ...varNames.map(v => vars[v]));
        return Number.isFinite(r) ? r : null;
      } catch { return null; }
    },
    feedbackBox(host){
      const box = utils.el('div', {className: 'formula-box feedback-box'});
      const title = utils.el('div', {className: 'formula-title', text: utils.t('feedback.title')});
      const text = utils.el('div', {className: 'formula-text', text: utils.t('feedback.initial')});
      box.appendChild(title); box.appendChild(text);
      host.appendChild(box);
      // Messages may quote labels/solutions containing $…$ (e.g. an answer
      // prefix "$x_1 =$"), so typeset them like the rest of the block.
      const setMsg = msg => {
        text.textContent = msg;
        if(/\$|\\\(|\\\[/.test(String(msg))) utils.renderMath(text);
      };
      return {
        ok(msg){ box.classList.remove('feedback-bad'); box.classList.add('feedback-good'); setMsg(msg); },
        bad(msg){ box.classList.remove('feedback-good'); box.classList.add('feedback-bad'); setMsg(msg); },
        neutral(msg){ box.classList.remove('feedback-good','feedback-bad'); setMsg(msg); }
      };
    },
    // Standard card: text input + check/regenerate. Returns { card, qText, inp, checkBtn, newBtn, fb }.
    questionCard(host, opts){
      opts = opts || {};
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3');
      h.textContent = opts.h3 || utils.t('common.task');
      card.appendChild(h);

      const qBox = document.createElement('div');
      qBox.className = 'formula-box';
      qBox.style.marginBottom = '1rem';
      const qBoxTitle = document.createElement('div');
      qBoxTitle.className = 'formula-title';
      qBoxTitle.textContent = opts.qBoxTitle || utils.t('common.task');
      qBox.appendChild(qBoxTitle);
      const qText = document.createElement('div');
      qText.className = 'formula-text';
      qBox.appendChild(qText);
      card.appendChild(qBox);

      const grp = document.createElement('div');
      grp.className = 'control-group control-group-compact';
      const lbl = document.createElement('label');
      lbl.textContent = opts.inputLabel || utils.t('common.answer');
      grp.appendChild(lbl);
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'text-input';
      inp.placeholder = opts.inputPlaceholder || utils.t('common.answerPlaceholder');
      grp.appendChild(inp);
      card.appendChild(grp);

      const btnRow = document.createElement('div');
      btnRow.className = 'button-cluster';
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = utils.t('common.check');
      const newBtn = document.createElement('button');
      newBtn.type = 'button';
      newBtn.className = 'btn btn-secondary';
      newBtn.textContent = utils.t('common.regenerate');
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      card.appendChild(btnRow);

      const fb = utils.feedbackBox(card);
      host.appendChild(card);

      return { card, qText, inp, checkBtn, newBtn, fb };
    },
    // Card for blocks with custom answer UIs. Returns { card, qText, content, buttons, fb }.
    simpleQuestionCard(host, opts){
      opts = opts || {};
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3');
      h.textContent = opts.title || utils.t('common.task');
      card.appendChild(h);

      const hasQuestion = (opts.questionHtml != null && String(opts.questionHtml).trim() !== '') ||
                          (opts.question != null && String(opts.question).trim() !== '');
      const qBox = document.createElement('div');
      qBox.className = 'formula-box';
      qBox.style.marginBottom = '1rem';
      const qBoxTitle = document.createElement('div');
      qBoxTitle.className = 'formula-title';
      qBoxTitle.textContent = opts.qBoxTitle || utils.t('common.question');
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
    // Two builder-schema fields for the "Neu generieren" policy, shared by all
    // random-pool blocks. Each is tri-state: "" inherits the course default
    // (set in Kopfdaten), "on"/"off" override it for this block. The inherit
    // label shows the current course default so the resolved state is visible.
    // Pass an optional showIf to gate both fields (e.g. composition fillblanks).
    regenSchemaFields(showIf){
      const cd = (typeof window !== 'undefined' && window.state && window.state.course) || {};
      const opts = on => [
        { value: '',    label: utils.t('utils.regen.inherit', { state: on ? utils.t('utils.regen.on') : utils.t('utils.regen.off') }) },
        { value: 'on',  label: utils.t('utils.regen.on') },
        { value: 'off', label: utils.t('utils.regen.off') }
      ];
      const f = (key, label, on, help) => {
        const spec = { key, label, type: 'select', options: opts(on), help };
        if(showIf) spec.showIf = showIf;
        return spec;
      };
      return [
        f('lockAfterCheck', utils.t('utils.regen.lockAfterCheckLabel'), !!cd.regenLockAfterCheck,
          utils.t('utils.regen.lockAfterCheckHelp')),
        f('noRegenerate', utils.t('utils.regen.noRegenerateLabel'), !!cd.regenNoRegenerate,
          utils.t('utils.regen.noRegenerateHelp'))
      ];
    },
    // Apply the resolved "Neu generieren" policy to a block's button.
    // Per-block value wins; "" / undefined inherits the course default passed
    // in via api.regenDefaults ({ lockAfterCheck, noRegenerate }).
    //   noRegenerate   -> hide the button (first random task must be solved)
    //   lockAfterCheck -> lock the button once the task has been graded
    //                     (wraps api.reportScore so the first real check locks it)
    regenPolicy(newBtn, config, api){
      const cfg = config || {};
      const def = (api && api.regenDefaults) || {};
      const resolve = (v, courseVal) => {
        if(v === 'on' || v === true) return true;
        if(v === 'off') return false;
        return !!courseVal; // "", undefined, "inherit", false -> follow course
      };
      const noRegen = resolve(cfg.noRegenerate, def.noRegenerate);
      const lock    = resolve(cfg.lockAfterCheck, def.lockAfterCheck);
      if(newBtn && noRegen){ newBtn.style.display = 'none'; }
      if(newBtn && lock && !noRegen && api && typeof api.reportScore === 'function'){
        const orig = api.reportScore;
        api.reportScore = function(){
          const r = orig.apply(api, arguments);
          newBtn.disabled = true;
          newBtn.title = utils.t('utils.regen.lockedTitle');
          return r;
        };
      }
    },
    // Padded preview wrapper with optional icon+label tag. opts: { icon?, label?, fillHeight? }.
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
      showGrid: true, gridStep: 1, equalAspect: true,
      paths: [], lines: [], circles: [], points: [], arcs: []
    }, options || {});
    const W = opts.width, H = opts.height, P = opts.pad;
    const xRange = opts.xMax - opts.xMin;
    const yRange = opts.yMax - opts.yMin;
    let scaleX, scaleY, offX = 0, offY = 0;
    if(opts.equalAspect !== false && xRange > 0 && yRange > 0){
      const usableW = W - 2*P;
      const usableH = H - 2*P;
      const s = Math.min(usableW / xRange, usableH / yRange);
      scaleX = scaleY = s;
      offX = (usableW - s * xRange) / 2;
      offY = (usableH - s * yRange) / 2;
    } else {
      scaleX = (W - 2*P) / xRange;
      scaleY = (H - 2*P) / yRange;
    }
    const sx = (x) => P + offX + (x - opts.xMin) * scaleX;
    const sy = (y) => H - P - offY - (y - opts.yMin) * scaleY;
    host.innerHTML = '';
    const svg = utils.svg('svg', {viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%'});
    svg.appendChild(utils.svg('rect', {x:0, y:0, width:W, height:H, fill:'#ffffff'}));
    // Bounds of the letterboxed plot area (equal-aspect leaves blank margins).
    const plotLeft = P + offX, plotRight = W - P - offX;
    const plotTop = P + offY, plotBottom = H - P - offY;
    if(opts.showGrid){
      const step = opts.gridStep;
      for(let xv = Math.ceil(opts.xMin/step)*step; xv <= opts.xMax; xv += step){
        if(Math.abs(xv) < 1e-9) continue;
        const x = sx(xv);
        svg.appendChild(utils.svg('line', {x1:x, y1:plotTop, x2:x, y2:plotBottom, stroke:'#e2e8ed', 'stroke-width':1}));
        const t = utils.svg('text', {x:x, y:sy(0)+18, 'font-size':14, 'text-anchor':'middle', fill:'#5d6872'});
        t.textContent = (Math.round(xv*100)/100); svg.appendChild(t);
      }
      for(let yv = Math.ceil(opts.yMin/step)*step; yv <= opts.yMax; yv += step){
        if(Math.abs(yv) < 1e-9) continue;
        const y = sy(yv);
        svg.appendChild(utils.svg('line', {x1:plotLeft, y1:y, x2:plotRight, y2:y, stroke:'#e2e8ed', 'stroke-width':1}));
        const t = utils.svg('text', {x:sx(0)-10, y:y+5, 'font-size':14, 'text-anchor':'end', fill:'#5d6872'});
        t.textContent = (Math.round(yv*100)/100); svg.appendChild(t);
      }
    }
    svg.appendChild(utils.svg('line', {x1:plotLeft, y1:sy(0), x2:plotRight, y2:sy(0), stroke:'#003b5c', 'stroke-width':2}));
    svg.appendChild(utils.svg('line', {x1:sx(0), y1:plotTop, x2:sx(0), y2:plotBottom, stroke:'#003b5c', 'stroke-width':2}));
    const xl = utils.svg('text', {x:plotRight+6, y:sy(0)-8, 'font-size':16, fill:'#003b5c'}); xl.textContent = opts.xLabel; svg.appendChild(xl);
    const yl = utils.svg('text', {x:sx(0)+10, y:plotTop+16, 'font-size':16, fill:'#003b5c'}); yl.textContent = opts.yLabel; svg.appendChild(yl);
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

  // Auto-render LaTeX via KaTeX; queue and retry every 100 ms until KaTeX loads.
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
    } catch{}
  }
  utils.renderMath = function(root){
    if(!root) return;
    if(typeof window.renderMathInElement === 'function'){
      _runMathRenderOn(root);
      return;
    }
    _mathRetryQueue.push(root);
    if(_katexWatcher) return;
    _katexWatcher = setInterval(() => {
      if(typeof window.renderMathInElement !== 'function') return;
      clearInterval(_katexWatcher); _katexWatcher = null;
      const queue = _mathRetryQueue.splice(0);
      queue.forEach(el => { if(el.isConnected) _runMathRenderOn(el); });
    }, 100);
  };

  // ---- Variable placeholders in display text ------------------------------
  // fillMathTemplate("Seite $a = {a}$", {a: 3}) -> "Seite $a = {3}$".
  // Shared by blocks that show random variables in text (numeric input,
  // composition). Rules:
  //  - Inside $…$ the braces are kept ({a} -> {12}), so LaTeX arguments stay
  //    intact: \frac{a}{b} -> \frac{12}{16}, x^{a} -> x^{12}.
  //  - Clean fractions with a small denominator show as "3/7", otherwise a
  //    value is rounded to 2 decimals.
  //  - After an operator a negative value is wrapped: a · (-3), and inside
  //    \frac the minus is moved in front of the bar (see fracMinusOut).
  //  - Names without a variable ({x} for an unknown x) and numbered slots
  //    ({1}) are left untouched.
  function _readBraceGroup(s, i){
    let depth = 0;
    for(let k = i; k < s.length; k++){
      if(s[k] === '{') depth++;
      else if(s[k] === '}'){ depth--; if(depth === 0) return { content: s.slice(i + 1, k), end: k }; }
    }
    return null;
  }
  // Normalize the sign of a fraction so it sits in front of the bar:
  //   \frac{-3}{7} -> -\frac{3}{7}      (negative numerator)
  //   \frac{3}{-7} -> -\frac{3}{7}      (negative denominator)
  //   \frac{-3}{-7} -> \frac{3}{7}      (both negative cancel; never "--")
  // Only plain negative numbers/fractions are pulled; compound parts like
  // \frac{a-b}{c} are left untouched (the sign is not just a unary minus).
  utils.fracMinusOut = function(tex){
    let out = '', i = 0;
    while(i < tex.length){
      if(tex.startsWith('\\frac', i)){
        let j = i + 5;
        while(j < tex.length && tex[j] === ' ') j++;
        if(tex[j] === '{'){
          const num = _readBraceGroup(tex, j);
          if(num){
            let k = num.end + 1;
            while(k < tex.length && tex[k] === ' ') k++;
            if(tex[k] === '{'){
              const den = _readBraceGroup(tex, k);
              if(den){
                const NUMRE = /^-?(\d+(\.\d+)?|\d+\/\d+)$/; // signed plain number/fraction
                const numBare = num.content.replace(/[{}\s]/g, '');
                const denBare = den.content.replace(/[{}\s]/g, '');
                const numIsNum = NUMRE.test(numBare);
                const denIsNum = NUMRE.test(denBare);
                const numNeg = numIsNum && numBare[0] === '-';
                const denNeg = denIsNum && denBare[0] === '-';
                if(numNeg || denNeg){
                  const newNum = numIsNum ? numBare.replace('-', '') : num.content;
                  const newDen = denIsNum ? denBare.replace('-', '') : den.content;
                  // One side negative -> minus in front; both negative cancel
                  // to a positive fraction (avoids a leading "--").
                  const sign = (numNeg !== denNeg) ? '-' : '';
                  const frac = '\\frac{' + newNum + '}{' + newDen + '}';
                  // Wrap a negative fraction in parens when it sits next to a
                  // binary operator on EITHER side ("a + (-3/7)", "(-3/7) + a").
                  const before = out.replace(/\s+$/, '');
                  const rest = tex.slice(den.end + 1).replace(/^\s+/, '');
                  const precededByOp = /[+\-*/:·×÷^]$/.test(before) || /\\(cdot|times|div)$/.test(before);
                  const followedByOp = /^[+\-*/:·×÷^]/.test(rest) || /^\\(cdot|times|div)\b/.test(rest);
                  if(sign === '-' && (precededByOp || followedByOp)){
                    out += '\\left(-' + frac + '\\right)';
                  } else {
                    out += sign + frac;
                  }
                  i = den.end + 1;
                  continue;
                }
              }
            }
          }
        }
      }
      out += tex[i++];
    }
    return out;
  };
  // ---- Deduction for wrong answers (shared by several graded blocks) --------
  // cfg.penalizeWrong: on/off (unset -> defaultOn). cfg.penaltyPoints: points
  // per wrong answer; '' / unset = the value of one correct answer
  // (perCorrect). The total never drops below 0; unanswered items cost 0.
  utils.penaltyOn = function(cfg, defaultOn){
    return (cfg && cfg.penalizeWrong != null) ? !!cfg.penalizeWrong : !!defaultOn;
  };
  utils.penaltyPerWrong = function(cfg, perCorrect, defaultOn){
    if(!utils.penaltyOn(cfg, defaultOn)) return 0;
    const raw = cfg && cfg.penaltyPoints;
    const p = Number(raw);
    return (raw === '' || raw == null || !Number.isFinite(p)) ? perCorrect : Math.max(0, p);
  };
  // earned - wrong * penalty, clamped to [0, maxPts], rounded to 2 decimals.
  utils.scoreWithPenalty = function(earned, wrongCount, penalty, maxPts){
    const v = Math.min(maxPts, Math.max(0, earned - (wrongCount || 0) * (penalty || 0)));
    return Math.round(v * 100) / 100;
  };
  // Builder fields: on/off + amount. opts: { showIf, helpKey, help } (the
  // help text says what counts as a wrong answer in that block).
  utils.penaltySchemaFields = function(opts){
    opts = opts || {};
    const base = opts.showIf || (() => true);
    return [
      { key:'penalizeWrong', label:'Punkte für falsche Antworten abziehen', labelKey:'utils.penalty.label', type:'boolean', showIf: base,
        help: opts.help || 'Jede falsche Antwort zieht Punkte ab; die Gesamtpunktzahl fällt nie unter 0. Offen Gelassenes zählt 0.',
        helpKey: opts.helpKey || 'utils.penalty.help' },
      { key:'penaltyPoints', label:'Abzug pro falscher Antwort (Punkte)', labelKey:'utils.penalty.pointsLabel', type:'number', step:0.25, min:0,
        placeholder:'leer = so viel wie eine richtige Antwort bringt', placeholderKey:'utils.penalty.pointsPlaceholder',
        showIf: c => base(c) && utils.penaltyOn(c, opts.defaultOn),
        help:'Leer lassen: Abzug entspricht dem Wert einer richtigen Antwort.', helpKey:'utils.penalty.pointsHelp' }
    ];
  };

  // ---- Random variables: decimals + display --------------------------------
  // Block config: decimals (default 2), valueDisplay ('auto' | 'decimal' |
  // 'fraction', default 'auto'). Each variable may override both with its own
  // decimals / display ('' or missing = like the block).
  //   auto     -> clean fraction if the denominator is small (1/2, 3/7), else decimal
  //   decimal  -> always a decimal number (rounded to the variable's decimals)
  //   fraction -> always a reduced fraction (0.35 -> 7/20)
  utils.VAR_DISPLAYS = ['auto', 'decimal', 'fraction'];
  utils.varDecimals = function(v, cfg){
    const pick = x => (x === '' || x == null || !Number.isFinite(Number(x))) ? null : Number(x);
    const d = pick(v && v.decimals) ?? pick(cfg && cfg.decimals) ?? 2;
    return Math.max(0, Math.min(6, Math.round(d)));
  };
  // defaultDisplay: what "unset" means for a block (blocks that never showed
  // fractions use 'decimal' so their existing tasks stay unchanged).
  utils.varDisplay = function(v, cfg, defaultDisplay){
    const d = (v && v.display) || (cfg && cfg.valueDisplay) || defaultDisplay || 'auto';
    return utils.VAR_DISPLAYS.includes(d) ? d : 'auto';
  };
  // Round a freshly drawn value: whole number, or the variable's decimals.
  utils.roundVarValue = function(val, isInteger, v, cfg){
    if(isInteger) return Math.round(val);
    const f = Math.pow(10, utils.varDecimals(v, cfg));
    return Math.round(val * f) / f;
  };
  // { name: { decimals, display } } for fillMathTemplate.
  // Global variables not shadowed by a block variable are included.
  utils.varFormats = function(variables, cfg, defaultDisplay){
    const out = {};
    (variables || []).forEach(v => {
      if(v && v.name) out[v.name] = { decimals: utils.varDecimals(v, cfg), display: utils.varDisplay(v, cfg, defaultDisplay) };
    });
    globalVarDefs.forEach(v => {
      if(!(v.name in out)) out[v.name] = { decimals: utils.varDecimals(v, globalVarCfg), display: utils.varDisplay(v, globalVarCfg, defaultDisplay) };
    });
    return out;
  };

  // ---- Global (course-wide) variables --------------------------------------
  // Defined in the course settings with the same fields as block variables
  // (name, min, max, integer, decimals, display); course-level defaults in
  // { decimals, valueDisplay }. The runtime draws one set of values per
  // attempt and hands it in via setGlobalVarValues; every block with
  // variables sees them as extra variables. A block variable with the same
  // name wins over the global one.
  let globalVarDefs = [];
  let globalVarCfg = {};
  let globalVarValues = {};
  const VAR_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
  utils.setGlobalVarDefs = function(defs, cfg){
    globalVarDefs = (Array.isArray(defs) ? defs : []).filter(v => v && VAR_NAME_RE.test(String(v.name || '')));
    globalVarCfg = cfg || {};
  };
  utils.globalVarDefs = function(){ return globalVarDefs.slice(); };
  utils.globalVarNames = function(){ return globalVarDefs.map(v => v.name); };
  // One random set of values (uses Math.random, so the runtime can seed it).
  utils.genGlobalVarValues = function(){
    const out = {};
    globalVarDefs.forEach(v => {
      const lo = Number(v.min), hi = Number(v.max);
      const a = Number.isFinite(lo) ? lo : 1, b = Number.isFinite(hi) ? hi : 10;
      out[v.name] = utils.roundVarValue(a + Math.random() * (b - a), !!v.integer, v, globalVarCfg);
    });
    return out;
  };
  utils.setGlobalVarValues = function(values){ globalVarValues = Object.assign({}, values || {}); };
  utils.globalVarValues = function(){ return Object.assign({}, globalVarValues); };
  // A block's variables plus the global ones it does not define itself.
  // globals: optional explicit values (builder checks draw their own samples).
  utils.withGlobalVars = function(vars, localDefs, globals){
    const g = globals || globalVarValues;
    const local = new Set((localDefs || []).map(v => v && v.name).filter(Boolean));
    const out = {};
    Object.keys(g).forEach(k => { if(!local.has(k)) out[k] = g[k]; });
    return Object.assign(out, vars || {});
  };
  // Names of the global variables a block config uses: a {name} placeholder
  // in any text, or the bare name in a formula (keys containing "formula" /
  // "expr"). Variables the block defines itself shadow the global ones.
  utils.globalVarsUsedBy = function(config, defs){
    const names = (defs || globalVarDefs).map(v => v && v.name).filter(n => n && VAR_NAME_RE.test(n));
    if(!names.length || !config || typeof config !== 'object') return [];
    const local = new Set((config.variables || []).map(v => v && v.name).filter(Boolean));
    const texts = [], formulas = [];
    (function walk(o, key){
      if(typeof o === 'string'){
        texts.push(o);
        if(/formula|expr/i.test(key)) formulas.push(o);
      } else if(Array.isArray(o)){
        o.forEach(x => walk(x, key));
      } else if(o && typeof o === 'object'){
        // Localized wrappers ({de, en}) keep the key of their field.
        const isI18n = o.__i18n === true;
        Object.keys(o).forEach(k => { if(k !== 'variables') walk(o[k], isI18n ? key : k); });
      }
    })(config, '');
    const textAll = texts.join('\n'), formulaAll = formulas.join('\n');
    return names.filter(n => {
      if(local.has(n)) return false;
      if(new RegExp('\\{\\s*' + n + '\\s*\\}').test(textAll)) return true;
      return new RegExp('(^|[^A-Za-z0-9_\\\\])' + n + '(?![A-Za-z0-9_])').test(formulaAll);
    });
  };
  // A number as text per { decimals, display } (see VAR_DISPLAYS above).
  utils.formatVarValue = function(v, fmt){
    fmt = fmt || {};
    const dec = fmt.decimals != null ? fmt.decimals : 2;
    const display = fmt.display || 'auto';
    const asDecimal = x => { const f = Math.pow(10, dec); return String(Math.round(x * f) / f); };
    // Exact fraction of a value with `dec` decimals: 0.35 -> 7/20.
    const exactFraction = x => {
      const p = Math.pow(10, Math.max(dec, 1));
      const n = Math.round(x * p);
      const g = utils.gcd(Math.abs(n), p);
      return { num: n / g, den: p / g };
    };
    if(Number.isInteger(v)) return String(v);
    if(display === 'decimal') return asDecimal(v);
    // 'fraction': always; 'auto': only clean small denominators (1/2, 3/7),
    // which avoids artefacts like 43/100 from 2-decimal rounding.
    const frac = display === 'fraction' ? (utils.asFraction(v, 20) || exactFraction(v)) : utils.asFraction(v);
    if(frac && Math.abs(frac.den) > 1 && (display === 'fraction' || Math.abs(frac.den) <= 20)){
      return (frac.num < 0 ? '-' : '') + Math.abs(frac.num) + '/' + frac.den;
    }
    return asDecimal(v);
  };
  // Builder fields for the block-level defaults (shared by all blocks with
  // random variables). Variables override them via varItemFormatFields().
  // opts: { showIf, defaultDisplay, noDisplay } (noDisplay: decimals only).
  utils.varFormatSchemaFields = function(opts){
    opts = typeof opts === 'function' ? { showIf: opts } : (opts || {});
    const displayOpts = [
      { value:'auto',     label:'Automatisch (einfacher Bruch, sonst Kommazahl)', labelKey:'utils.varFormat.display.auto' },
      { value:'decimal',  label:'Immer als Kommazahl (z. B. 0.75)',              labelKey:'utils.varFormat.display.decimal' },
      { value:'fraction', label:'Immer als Bruch (z. B. 3/4)',                   labelKey:'utils.varFormat.display.fraction' }
    ];
    // The select shows its first option while the value is unset, so the
    // block's default goes first.
    const def = opts.defaultDisplay || 'auto';
    displayOpts.sort((a, b) => (b.value === def) - (a.value === def));
    const f = [
      { key:'decimals', label:'Nachkommastellen (Zufallszahlen)', labelKey:'utils.varFormat.decimals.label', type:'number', step:1, min:0, max:6,
        placeholder:'2', help:'Wie viele Nachkommastellen nicht-ganzzahlige Variablen erhalten (0–6). Einzelne Variablen können abweichen.', helpKey:'utils.varFormat.decimals.help' }
    ];
    if(!opts.noDisplay) f.push(
      { key:'valueDisplay', label:'Darstellung von Kommazahlen', labelKey:'utils.varFormat.display.label', type:'select',
        help:'Wie nicht-ganzzahlige Variablen im Text erscheinen. Einzelne Variablen können abweichen.', helpKey:'utils.varFormat.display.help',
        options: displayOpts });
    if(opts.showIf) f.forEach(x => { x.showIf = opts.showIf; });
    return f;
  };
  // Per-variable overrides (list itemSchema). isInt(item) hides them for
  // whole-number variables. opts.noDisplay: decimals only.
  utils.varItemFormatFields = function(isInt, opts){
    const notInt = item => !isInt(item);
    const f = [
      { key:'decimals', label:'Nachkommastellen (leer = wie Aufgabe)', labelKey:'utils.varFormat.item.decimals.label', type:'number', step:1, min:0, max:6, default:'', showIf: notInt }
    ];
    if(!(opts && opts.noDisplay)) f.push(
      { key:'display', label:'Darstellung', labelKey:'utils.varFormat.item.display.label', type:'select', showIf: notInt,
        options: [
          { value:'',         label:'Wie Aufgabe',        labelKey:'utils.varFormat.item.display.inherit' },
          { value:'auto',     label:'Automatisch',        labelKey:'utils.varFormat.item.display.auto' },
          { value:'decimal',  label:'Kommazahl',          labelKey:'utils.varFormat.item.display.decimal' },
          { value:'fraction', label:'Bruch',              labelKey:'utils.varFormat.item.display.fraction' }
        ] });
    return f;
  };

  // formats: optional { name: { decimals, display } } from varFormats().
  // Without it the previous behaviour applies (auto, 2 decimals).
  utils.fillMathTemplate = function(tpl, vars, formats){
    vars = vars || {};
    formats = formats || {};
    function formatValue(v, wrapNeg, name){
      let s = utils.formatVarValue(v, formats[name]);
      // After a multiplicative, divisive or power operator a negative value
      // is wrapped so the sign stays glued to the number: a · (-3/7).
      if(wrapNeg && v < 0) s = '(' + s + ')';
      return s;
    }
    // True when the placeholder follows a binary operator.
    function shouldWrap(fullStr, placeholderOffset){
      let i = placeholderOffset - 1;
      while(i >= 0 && /\s/.test(fullStr[i])) i--;
      if(i < 0) return false;
      const c = fullStr[i];
      if(/[+\-*/:·×÷^]/.test(c)) return true;
      // LaTeX multiplicative ops: \cdot \times \div end in t/s/v.
      if(/[tsv]/.test(c) && /\\(cdot|times|div)$/.test(fullStr.slice(0, i + 1))) return true;
      return false;
    }
    const tplStr = String(tpl || '');
    return tplStr.replace(/\$[^$]*\$|\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (match, plainName, offset) => {
      if(match.startsWith('$')){
        // Inside $...$ keep {} as LaTeX argument grouping. innerOffset is
        // relative to `match`, which starts at `offset` in the template.
        const filled = match.replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name, innerOffset) => {
          if(name in vars){
            const wrap = shouldWrap(tplStr, offset + innerOffset);
            return '{' + formatValue(vars[name], wrap, name) + '}';
          }
          return m;
        });
        // \frac{-3}{7} -> -\frac{3}{7}.
        return utils.fracMinusOut(filled);
      }
      if(plainName && plainName in vars){
        return formatValue(vars[plainName], shouldWrap(tplStr, offset), plainName);
      }
      return match;
    });
  };

  // Fisher-Yates in-place shuffle, returns same array.
  utils.shuffle = function(arr){
    if(!Array.isArray(arr)) return arr;
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  // ---------------------------------------------------------------------------
  // Runtime i18n. Bundles are registered by template/i18n/<code>.js files
  // (either directly, or via the __ScormI18nPending queue if this file loads
  // after them). t(key, params) reads chrome strings; l(value) resolves
  // multilingual content wrappers of shape { __i18n: true, de: '', en: '' }.
  // ---------------------------------------------------------------------------
  const _i18n = { bundles: {}, active: 'de', defaultLocale: 'de', listeners: [] };

  utils.registerLocale = function(code, bundle){
    _i18n.bundles[code] = bundle || {};
  };
  utils.availableLocales = function(){ return Object.keys(_i18n.bundles); };
  utils.localeMeta = function(code){
    const b = _i18n.bundles[code];
    return (b && b.meta) || { name: String(code).toUpperCase(), label: String(code).toUpperCase() };
  };
  utils.getLocale = function(){ return _i18n.active; };
  utils.getDefaultLocale = function(){ return _i18n.defaultLocale; };
  utils.setDefaultLocale = function(code){
    if(_i18n.bundles[code]) _i18n.defaultLocale = code;
  };
  utils.setLocale = function(code){
    if(!_i18n.bundles[code]) return false;
    if(code === _i18n.active) return true;
    _i18n.active = code;
    _i18n.listeners.forEach(fn => { try { fn(code); } catch(e){ console.error(e); } });
    return true;
  };
  utils.onLocaleChange = function(fn){
    _i18n.listeners.push(fn);
    return function(){
      const i = _i18n.listeners.indexOf(fn);
      if(i >= 0) _i18n.listeners.splice(i, 1);
    };
  };

  function _lookupI18n(key, code){
    const b = _i18n.bundles[code];
    if(!b) return null;
    const parts = String(key).split('.');
    let cur = b;
    for(let i = 0; i < parts.length; i++){
      if(cur == null) return null;
      cur = cur[parts[i]];
    }
    return typeof cur === 'string' ? cur : null;
  }
  function _interpI18n(str, params){
    return String(str).replace(/\{(\w+)\}/g, (_, name) => {
      const v = params[name];
      return v == null ? '' : String(v);
    });
  }

  utils.t = function(key, params){
    let s = _lookupI18n(key, _i18n.active);
    if(s == null) s = _lookupI18n(key, _i18n.defaultLocale);
    if(s == null){
      const codes = Object.keys(_i18n.bundles);
      if(codes.length) s = _lookupI18n(key, codes[0]);
    }
    if(s == null) s = key;
    return params ? _interpI18n(s, params) : s;
  };

  utils.isI18nField = function(v){
    return v != null && typeof v === 'object' && v.__i18n === true;
  };

  // Translate every element carrying a data-i18n* attribute inside `root`
  // (defaults to document). Mirrors the builder-side helper so the runtime
  // can re-translate the static HTML shell whenever the locale changes.
  utils.applyDataI18n = function(root){
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = utils.t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = utils.t(el.getAttribute('data-i18n-html'));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', utils.t(el.getAttribute('data-i18n-title')));
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', utils.t(el.getAttribute('data-i18n-aria')));
    });
    scope.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.setAttribute('placeholder', utils.t(el.getAttribute('data-i18n-ph')));
    });
    scope.querySelectorAll('[data-i18n-alt]').forEach(el => {
      el.setAttribute('alt', utils.t(el.getAttribute('data-i18n-alt')));
    });
  };

  // l(value, code?): resolve a multilingual content field. Plain strings pass
  // through unchanged; wrapper objects fall back through active locale,
  // default locale, then any populated locale, before returning empty.
  utils.l = function(value, code){
    if(value == null) return '';
    if(typeof value === 'string') return value;
    if(typeof value !== 'object') return String(value);
    if(!value.__i18n) return '';
    const loc = code || _i18n.active;
    const primary = value[loc];
    if(primary != null && primary !== '') return String(primary);
    const fb = value[_i18n.defaultLocale];
    if(fb != null && fb !== '') return String(fb);
    const keys = Object.keys(value);
    for(let k = 0; k < keys.length; k++){
      const key = keys[k];
      if(key === '__i18n') continue;
      if(value[key] != null && value[key] !== '') return String(value[key]);
    }
    return '';
  };

  window.BlockUtils = utils;

  // Drain bundles that raced ahead of utils.js (defensive; the standard
  // script order in template/index.html loads utils.js first).
  if(Array.isArray(window.__ScormI18nPending)){
    window.__ScormI18nPending.forEach(pair => utils.registerLocale(pair[0], pair[1]));
    window.__ScormI18nPending = null;
  }
})();
