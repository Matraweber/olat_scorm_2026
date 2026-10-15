(function(){
  'use strict';

  // Complex {re, im}. Uses ?? not ||, otherwise NaN/Infinity get swallowed.
  function mk(re, im){ return { re: re ?? 0, im: im ?? 0 }; }
  const C = {
    fromReal: r => mk(r, 0),
    i:        () => mk(0, 1),
    add:      (a, b) => mk(a.re + b.re, a.im + b.im),
    sub:      (a, b) => mk(a.re - b.re, a.im - b.im),
    neg:      a => mk(-a.re, -a.im),
    mul:      (a, b) => mk(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re),
    div(a, b){
      const d = b.re*b.re + b.im*b.im;
      if(!d || !isFinite(d)) return mk(NaN, NaN);
      return mk((a.re*b.re + a.im*b.im)/d, (a.im*b.re - a.re*b.im)/d);
    },
    abs:  a => mk(Math.hypot(a.re, a.im), 0),
    re:   a => mk(a.re, 0),
    im:   a => mk(a.im, 0),
    conj: a => mk(a.re, -a.im),
    arg:  a => mk(Math.atan2(a.im, a.re), 0),
    exp(a){
      const m = Math.exp(a.re);
      return mk(m * Math.cos(a.im), m * Math.sin(a.im));
    },
    sqrt(a){
      const r = Math.hypot(a.re, a.im);
      if(r === 0) return mk(0, 0);
      const w = Math.sqrt((r + a.re) / 2);
      const u = Math.sqrt((r - a.re) / 2) * (a.im < 0 ? -1 : 1);
      return mk(w, u);
    },
    pow(a, b){
      // Integer real exponent: repeated multiplication for exact results.
      if(b.im === 0 && Number.isInteger(b.re)){
        if(b.re === 0) return mk(1, 0);
        const neg = b.re < 0;
        let exp = Math.abs(b.re);
        let result = mk(1, 0), base = mk(a.re, a.im);
        while(exp > 0){
          if(exp & 1) result = C.mul(result, base);
          base = C.mul(base, base);
          exp = exp >>> 1;
        }
        return neg ? C.div(mk(1, 0), result) : result;
      }
      // General case: a^b = exp(b * ln(a)). Principal branch of ln.
      if(a.re === 0 && a.im === 0){
        if(b.re > 0) return mk(0, 0);
        return mk(NaN, NaN);
      }
      const r = Math.hypot(a.re, a.im);
      const theta = Math.atan2(a.im, a.re);
      const lnA = mk(Math.log(r), theta);
      return C.exp(C.mul(b, lnA));
    },
    isFinite: a => Number.isFinite(a.re) && Number.isFinite(a.im),
    equals(a, b, tol){
      return Math.hypot(a.re - b.re, a.im - b.im) < (tol || 1e-9);
    }
  };

  // User input -> Complex. Accepts "3+4i", "-i", "1/2+3/4i".
  function parseComplex(input){
    let s = String(input == null ? '' : input).trim();
    if(!s) return null;
    s = s.replace(/,/g, '.').replace(/\s+/g, '').replace(/\*/g, '');
    if(!s) return null;
    if(s[0] !== '+' && s[0] !== '-') s = '+' + s;
    let re = 0, im = 0;
    let p = 0;
    while(p < s.length){
      if(s[p] !== '+' && s[p] !== '-') return null;
      const sign = s[p] === '-' ? -1 : 1;
      p++;
      let numStr = '';
      while(p < s.length && /[\d.]/.test(s[p])){ numStr += s[p++]; }
      // Optional fraction: a / b
      if(p < s.length && s[p] === '/'){
        p++;
        let denStr = '';
        while(p < s.length && /[\d.]/.test(s[p])){ denStr += s[p++]; }
        if(!denStr) return null;
        if(numStr === '') numStr = '1';
        const n = parseFloat(numStr), d = parseFloat(denStr);
        if(!isFinite(n) || !isFinite(d) || d === 0) return null;
        numStr = String(n / d);
      }
      const isI = p < s.length && (s[p] === 'i' || s[p] === 'I');
      if(isI) p++;
      let num;
      if(numStr === '' || numStr === '.'){
        if(!isI) return null;
        num = 1;
      } else {
        num = parseFloat(numStr);
        if(!isFinite(num)) return null;
      }
      if(isI) im += sign * num;
      else    re += sign * num;
    }
    return mk(re, im);
  }

  // Parser for complex-number formulas. Functions: re/im/abs/conj/arg/sqrt/exp/sin/cos/ln.
  // Constants: i, pi, e. Real-valued variables are promoted automatically.
  function evalComplexExpr(expr, vars){
    const s = String(expr || '').replace(/\s+/g, '');
    if(!s) return null;
    let pos = 0;
    const peek = () => s[pos];
    const eat  = c => { if(s[pos] !== c) throw new Error('expected ' + c); pos++; };

    function parseExpr(){
      let left = parseTerm();
      while(peek() === '+' || peek() === '-'){
        const op = s[pos++];
        const right = parseTerm();
        left = op === '+' ? C.add(left, right) : C.sub(left, right);
      }
      return left;
    }
    function isImplicitMul(){
      const cur = s[pos];
      if(!cur) return false;
      if(cur !== '(' && !/[a-zA-Z]/.test(cur)) return false;
      const prev = s[pos - 1];
      return !!prev && /[\d.i)]/.test(prev);
    }
    function parseTerm(){
      let left = parsePow();
      while(true){
        const p = peek();
        if(p === '*' || p === '/'){
          pos++;
          const right = parsePow();
          left = p === '*' ? C.mul(left, right) : C.div(left, right);
        } else if(isImplicitMul()){
          const right = parsePow();
          left = C.mul(left, right);
        } else break;
      }
      return left;
    }
    function parsePow(){
      let base = parseUnary();
      if(peek() === '^'){
        pos++;
        const exp = parseUnary();
        base = C.pow(base, exp);
      }
      return base;
    }
    function parseUnary(){
      if(peek() === '-'){ pos++; return C.neg(parseUnary()); }
      if(peek() === '+'){ pos++; return parseUnary(); }
      return parseAtom();
    }
    function parseAtom(){
      const p = peek();
      if(p === '('){
        pos++;
        const v = parseExpr();
        eat(')');
        return v;
      }
      if(/[\d.]/.test(p)){
        let n = '';
        while(/[\d.]/.test(peek())) n += s[pos++];
        const num = parseFloat(n);
        if(!isFinite(num)) throw new Error('bad number');
        return C.fromReal(num);
      }
      if(/[a-zA-Z_]/.test(p)){
        let id = '';
        while(pos < s.length && /[a-zA-Z_0-9]/.test(s[pos])) id += s[pos++];
        if(peek() === '('){
          pos++;
          const arg = parseExpr();
          eat(')');
          return callFn(id, arg);
        }
        if(id === 'i' || id === 'I') return C.i();
        // A variable named pi/e wins over the constant.
        const isVar = !!(vars && id in vars);
        if(!isVar && (id === 'pi' || id === 'PI')) return C.fromReal(Math.PI);
        if(!isVar && id === 'e')  return C.fromReal(Math.E);
        if(isVar){
          const v = vars[id];
          if(typeof v === 'number') return C.fromReal(v);
          if(v && typeof v === 'object' && 're' in v) return v;
          return C.fromReal(Number(v));
        }
        throw new Error('unknown identifier: ' + id);
      }
      throw new Error('unexpected "' + p + '" at ' + pos);
    }
    function callFn(name, arg){
      switch(name){
        case 're': case 'Re':  return C.re(arg);
        case 'im': case 'Im':  return C.im(arg);
        case 'abs':            return C.abs(arg);
        case 'conj':           return C.conj(arg);
        case 'arg':            return C.arg(arg);
        case 'sqrt':           return C.sqrt(arg);
        case 'exp':            return C.exp(arg);
        case 'sin':            return C.fromReal(Math.sin(arg.re));
        case 'cos':            return C.fromReal(Math.cos(arg.re));
        case 'ln': case 'log': {
          const r = Math.hypot(arg.re, arg.im);
          if(r === 0) return mk(NaN, NaN);
          return mk(Math.log(r), Math.atan2(arg.im, arg.re));
        }
        default: throw new Error('unknown function: ' + name);
      }
    }
    try {
      const r = parseExpr();
      if(pos !== s.length) return null;
      return r;
    } catch{
      return null;
    }
  }

  // Format a complex number as text. Special cases: 0, +-i, bi, a+-bi, a+-i.
  function formatComplex(c){
    if(!c || !Number.isFinite(c.re) || !Number.isFinite(c.im)) return '-';
    const round = x => Math.abs(x) < 1e-9 ? 0 : (Math.round(x * 10000) / 10000);
    const re = round(c.re);
    const im = round(c.im);
    const fmtN = n => Number.isInteger(n) ? String(n) : String(n);
    if(re === 0 && im === 0) return '0';
    if(im === 0)             return fmtN(re);
    if(re === 0){
      if(im === 1)  return 'i';
      if(im === -1) return '-i';
      return fmtN(im) + 'i';
    }
    const sign = im > 0 ? '+' : '-';
    const absIm = Math.abs(im);
    const imPart = absIm === 1 ? 'i' : fmtN(absIm) + 'i';
    return fmtN(re) + ' ' + sign + ' ' + imPart;
  }

  // Block registration
  Blocks.register('complex-input', {
    label: 'Komplexe Eingabe',
    labelKey: 'block.complex-input.label',
    description: 'Komplexe Zahl als Antwort. Variablen, Formel, Domain-Check.',
    descKey: 'block.complex-input.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
    icon: 'complex-input',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        questionTemplate: '',
        variables: [],
        formula: '',
        tolerance: 0.01,
        maxPoints: 1
      };
    },
    summary(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      return cfg.questionTemplate || t('block.complex-input.summary.empty');
    },
    // Course-wide variables: fine if some draw of the block's own variables
    // gives a finite result.
    acceptsGlobals(cfg, globals){
      const U = window.BlockUtils;
      if(!cfg.formula) return true;
      const tries = (cfg.variables || []).length ? (cfg.integerAnswers ? 2000 : 200) : 1;
      for(let i = 0; i < tries; i++){
        const local = {};
        (cfg.variables || []).forEach(v => {
          if(!v || !v.name) return;
          const min = Number(v.min), max = Number(v.max);
          if(!isFinite(min) || !isFinite(max)) return;
          const val = min + Math.random() * (max - min);
          local[v.name] = v.integer ? Math.round(val) : U.roundVarValue(val, false, v, cfg);
        });
        const r = evalComplexExpr(cfg.formula, U.withGlobalVars(local, cfg.variables, globals));
        if(r && C.isFinite(r) && (!cfg.integerAnswers || (U.isWholeNumber(r.re) && U.isWholeNumber(r.im)))) return true;
      }
      return false;
    },
    validate(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      const w = [];
      if(!cfg.questionTemplate || !String(cfg.questionTemplate).trim()) w.push(t('block.complex-input.validate.missingQuestion'));
      if(!cfg.formula || !String(cfg.formula).trim()) w.push(t('block.complex-input.validate.missingFormula'));
      // Sanity-check the formula parses with sample variables.
      const usesGlobals = !!(window.BlockUtils && window.BlockUtils.globalVarsUsedBy(cfg).length);
      if(cfg.formula && ((cfg.variables || []).length > 0 || usesGlobals)){
        const SAMPLES = 200;
        let invalid = 0;
        for(let i = 0; i < SAMPLES; i++){
          const local = {};
          (cfg.variables || []).forEach(v => {
            const min = Number(v.min), max = Number(v.max);
            if(!isFinite(min) || !isFinite(max)) return;
            let val = min + Math.random() * (max - min);
            if(v.integer) val = Math.round(val);
            else val = window.BlockUtils.roundVarValue(val, false, v, cfg);
            local[v.name] = val;
          });
          const vars = window.BlockUtils.withGlobalVars(local, cfg.variables, window.BlockUtils.genGlobalVarValues());
          const r = evalComplexExpr(cfg.formula, vars);
          if(!r || !C.isFinite(r)) invalid++;
        }
        const ratio = invalid / SAMPLES;
        if(ratio === 1){
          w.push(t('block.complex-input.validate.formulaAlwaysInvalid'));
        } else if(ratio >= 0.2){
          w.push(t('block.complex-input.validate.formulaFailsRatio', { pct: Math.round(ratio * 100) }));
        }
      }
      return w;
    },
    previewConfig(){
      const u = window.BlockUtils || {};
      const locale = (u.getLocale && u.getLocale()) || 'de';
      const en = locale === 'en';
      return {
        blockTitle: '',
        questionTemplate: en
          ? 'Compute $({a}+{b}i)({c}-{d}i)$.'
          : 'Berechnen Sie $({a}+{b}i)({c}-{d}i)$.',
        variables: [
          { name:'a', min:1, max:5, integer:true },
          { name:'b', min:1, max:5, integer:true },
          { name:'c', min:1, max:5, integer:true },
          { name:'d', min:1, max:5, integer:true }
        ],
        formula: '(a+b*i)*(c-d*i)',
        tolerance: 0.01,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.complex-input.field.blockTitle.label',
          type:'text', placeholder:'Komplexe Eingabe', placeholderKey:'block.complex-input.field.blockTitle.placeholder' },
        { type:'section', label:'Frage', labelKey:'block.complex-input.field._sec_q.label', key:'_sec_q' },
        { key:'questionTemplate', label:'Frage-Vorlage', labelKey:'block.complex-input.field.questionTemplate.label',
          type:'math-textarea', rows:2,
          placeholder:'Berechnen Sie $({a}+{b}i)({c}-{d}i)$.',
          placeholderKey:'block.complex-input.field.questionTemplate.placeholder',
          help:'Variablen mit {a}, {b}, … einsetzen. $...$ für KaTeX-Mathe, z. B. $z = {a} + {b}i$.',
          helpKey:'block.complex-input.field.questionTemplate.help' },

        { type:'section', label:'Variablen', labelKey:'block.complex-input.field._sec_vars.label', key:'_sec_vars' },
        { key:'variables', label:'Reelle Variablen', labelKey:'block.complex-input.field.variables.label',
          type:'list', itemLabel:'Variable', itemLabelKey:'block.complex-input.field.variables.itemLabel',
          help:'Reelle Werte, die in Frage und Formel verwendet werden. Bei jedem "Neu generieren" werden sie neu gezogen.',
          helpKey:'block.complex-input.field.variables.help',
          itemSummary: item => (item.name || '?') + ' ∈ [' + (item.min ?? '?') + '..' + (item.max ?? '?') + ']',
          itemSchema: [
            { key:'name', label:'Name', labelKey:'block.complex-input.field.variables.item.name.label',
              type:'text', placeholder:'a', placeholderKey:'block.complex-input.field.variables.item.name.placeholder' },
            { key:'min', label:'Min', labelKey:'block.complex-input.field.variables.item.min.label',
              type:'number', step:'any',
              onChange:(val, item, set) => { if(val != null && item.max != null && val > item.max) set('max', val); }
            },
            { key:'max', label:'Max', labelKey:'block.complex-input.field.variables.item.max.label',
              type:'number', step:'any',
              onChange:(val, item, set) => { if(val != null && item.min != null && val < item.min) set('min', val); }
            },
            { key:'integer', label:'Nur Ganzzahlen', labelKey:'block.complex-input.field.variables.item.integer.label',
              type:'boolean', default:true },
            ...window.BlockUtils.varItemFormatFields(item => !!item.integer)
          ]
        },
        // Task-wide defaults for decimal variables. Unset = decimal (as before).
        ...window.BlockUtils.varFormatSchemaFields({ defaultDisplay: 'decimal' }),

        { type:'section', label:'Lösung', labelKey:'block.complex-input.field._sec_sol.label', key:'_sec_sol' },
        { key:'formula', label:'Lösungs-Formel (komplex)', labelKey:'block.complex-input.field.formula.label',
          type:'text',
          placeholder:'(a+b*i)*(c-d*i)', placeholderKey:'block.complex-input.field.formula.placeholder',
          help:'i ist die imaginäre Einheit. Operatoren: + - * / ^.  Funktionen: re(z), im(z), abs(z), conj(z), arg(z), sqrt(z), exp(z), ln(z), sin(x), cos(x). Variablen aus der Liste werden als reell eingesetzt.',
          helpKey:'block.complex-input.field.formula.help' },
        window.BlockUtils.integerAnswersSchemaField({ helpKey: 'block.complex-input.field.integerAnswers.help' }),
        { key:'tolerance', label:'Toleranz  (|Δ|)', labelKey:'block.complex-input.field.tolerance.label',
          type:'number', step:'any',
          help:'Akzeptierter Abstand zwischen Antwort und Lösung in der komplexen Ebene.',
          helpKey:'block.complex-input.field.tolerance.help' },
        { type:'section', label:'Bewertung', labelKey:'block.complex-input.field._sec_score.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte', labelKey:'block.complex-input.field.maxPoints.label',
          type:'number', min:1, max:100, step:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils || window.BlockUtils;
      const ui = u.questionCard(host, {
        h3: u.l(config.blockTitle) || u.t('block.complex-input.defaultTitle'),
        qBoxTitle: u.t('common.question'),
        inputLabel: u.t('block.complex-input.inputLabel'),
        inputPlaceholder: u.t('block.complex-input.inputPlaceholder')
      });
      const { qText, inp, checkBtn, newBtn, fb } = ui;
      let current = null;

      function genVars(){
        const out = {};
        (config.variables || []).forEach(v => {
          if(!v || !v.name) return;
          const min = Number(v.min), max = Number(v.max);
          if(!isFinite(min) || !isFinite(max)) return;
          let val = min + Math.random() * (max - min);
          if(v.integer) val = Math.round(val);
          else val = u.roundVarValue(val, false, v, config);
          out[v.name] = val;
        });
        return u.withGlobalVars(out, config.variables);
      }
      function fillTemplate(tpl, vars){
        // Decimals + display per variable (default here: always decimal, as before).
        const formats = u.varFormats(config.variables, config, 'decimal');
        const fmt = (v, name) => u.formatVarValue(v, formats[name]);
        return String(tpl || '').replace(/\$[^$]*\$|\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (match, plainName) => {
          if(match.startsWith('$')){
            return match.replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name) => {
              if(name in vars) return '{' + fmt(vars[name], name) + '}';
              return m;
            });
          }
          if(plainName && plainName in vars) return fmt(vars[plainName], plainName);
          return match;
        });
      }
      // "Nur ganzzahlige Lösungen": real and imaginary part whole.
      const intOnly = !!config.integerAnswers;
      const usable = z => !!z && C.isFinite(z) && (!intOnly || (u.isWholeNumber(z.re) && u.isWholeNumber(z.im)));
      function chooseNew(showMsg){
        const MAX_TRIES = intOnly ? 2000 : 200;
        let vars = null, expected = null;
        for(let t = 0; t < MAX_TRIES; t++){
          vars = genVars();
          expected = evalComplexExpr(config.formula || '0', vars);
          if(usable(expected)) break;
        }
        if(!usable(expected)){
          fb.bad(u.t(intOnly ? 'block.complex-input.feedback.notGeneratableInteger' : 'block.complex-input.feedback.notGeneratable'));
          return;
        }
        if(intOnly) expected = { re: Math.round(expected.re), im: Math.round(expected.im) };
        current = { vars, expected };
        inp.value = '';
        qText.textContent = fillTemplate(u.l(config.questionTemplate), vars);
        u.renderMath(qText);
        if(showMsg) fb.neutral(u.t('block.complex-input.feedback.newGenerated'));
      }
      function grade(){
        if(!current){ fb.bad(u.t('block.complex-input.feedback.noTaskLoaded')); return; }
        const given = parseComplex(inp.value);
        if(!given){
          fb.bad(u.t('block.complex-input.feedback.invalidComplex'));
          return;
        }
        const tol = Number(config.tolerance) || 0.01;
        if(C.equals(given, current.expected, tol)){
          fb.ok(u.t('block.complex-input.feedback.correctWithSolution', { solution: formatComplex(current.expected) }));
          api.reportScore(config.maxPoints || 1);
        } else {
          fb.bad(u.t('block.complex-input.feedback.wrongWithSolution', { solution: formatComplex(current.expected) }));
          api.reportScore(0);
        }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', () => chooseNew(true));
      window.BlockUtils.regenPolicy(newBtn, config, api);

      chooseNew(false);
      api.initScore(config.maxPoints || 1);
      return {
        getVars: () => (current && current.vars) || {},
        showSolution(){
          if(!current || !current.expected) return;
          inp.value = formatComplex(current.expected);
          fb.ok(u.t('utils.resume.solved'));
        }
      };
    },
    preview(host, config){
      const t = window.BlockUtils.t;
      const l = window.BlockUtils.l;
      // Static sample values so the picker preview is deterministic.
      const sample = { a: 3, b: 4, c: 2, d: 1 };
      let solution;
      try { solution = evalComplexExpr(config.formula || '(a+b*i)*(c-d*i)', sample); }
      catch{ solution = null; }
      const solStr = solution && C.isFinite(solution) ? formatComplex(solution) : '-';

      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3'); h3.textContent = t('common.question');
      card.appendChild(h3);
      const q = document.createElement('p');
      q.textContent = t('block.complex-input.preview.sampleQuestion');
      card.appendChild(q);

      const row = document.createElement('div');
      row.style.cssText = 'display:flex; align-items:center; gap:0.5rem; margin-top:0.6rem;';
      const lbl = document.createElement('span'); lbl.textContent = t('common.answer'); row.appendChild(lbl);
      const inp = document.createElement('span');
      inp.textContent = solStr;
      inp.className = 'bp-input';
      inp.style.cssText = 'min-width:120px; padding:0.2rem 0.4rem;';
      row.appendChild(inp);
      card.appendChild(row);

      const meta = document.createElement('div');
      meta.style.cssText = 'font-size:0.74rem; color:#5d6872; margin-top:0.5rem;';
      meta.textContent = t('block.complex-input.preview.acceptedHint');
      card.appendChild(meta);
      host.appendChild(card);
    }
  });

  // Exposed for the test harness; the runtime never reads this.
  if(typeof window !== 'undefined'){
    window._complexInputInternals = { parseComplex, evalComplexExpr, formatComplex, C };
  }
})();
