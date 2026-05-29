(function(){
  'use strict';
  const PRESET_OPTIONS = [
    {value:'custom',         label:'Manuell (leer)'},
    {value:'pythagoras',     label:'Beispiel: Pythagoras (c = √(a²+b²))'},
    {value:'rectangle-area', label:'Beispiel: Rechteckfläche (A = a·b)'},
    {value:'circle-area',    label:'Beispiel: Kreisfläche (A = π·r²)'},
    {value:'ohm',            label:'Beispiel: Ohmsches Gesetz (U = R·I)'}
  ];

  Blocks.register('numeric-input', {
    label: 'Numerische Eingabe',
    description: 'Numerische Frage mit Zufallsvariablen und Lösungs-Formel.',
    category: 'MINT',
    icon: '#',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        preset: 'custom',
        questionTemplate: '',
        variables: [],
        formula: '',
        tolerance: 0.01,
        unit: '',
        simplifyFractions: true,
        maxPoints: 1
      };
    },
    summary(cfg){ return cfg.questionTemplate || '(Frage leer)'; },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const w = [];
      if(!cfg.questionTemplate || !String(cfg.questionTemplate).trim()) w.push('Frage-Vorlage fehlt.');
      if(!cfg.formula || !String(cfg.formula).trim()) w.push('Lösungsformel fehlt.');
      // Variable names must be ASCII identifiers. The substitution regex
      // and the math evaluator both reject non-ASCII names, so reject early.
      (cfg.variables || []).forEach((v, i) => {
        if(!v || !v.name) return;
        if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.name)){
          w.push('Variable ' + (i + 1) + ' („' + v.name + '"): Name darf nur Buchstaben (a-z, A-Z), Ziffern und Unterstrich enthalten.');
        }
        const lo = Number(v.min), hi = Number(v.max);
        if(isFinite(lo) && isFinite(hi) && lo > hi){
          w.push('Variable „' + v.name + '": Min (' + lo + ') ist größer als Max (' + hi + ').');
        }
      });
      // Monte Carlo check: catches 0 under a fraction bar, sqrt(-x), log(0) before export.
      if(cfg.formula && (cfg.variables || []).length > 0 && window.BlockUtils){
        const SAMPLES = 200;
        let invalid = 0;
        for(let i = 0; i < SAMPLES; i++){
          const vars = {};
          (cfg.variables || []).forEach(v => {
            const min = Number(v.min), max = Number(v.max);
            if(!isFinite(min) || !isFinite(max)) return;
            let val = min + Math.random() * (max - min);
            if(v.integer) val = Math.round(val);
            else val = Math.round(val * 100) / 100;
            vars[v.name] = val;
          });
          const r = window.BlockUtils.safeMathExpr(cfg.formula, vars);
          if(typeof r !== 'number' || !Number.isFinite(r)) invalid++;
        }
        const ratio = invalid / SAMPLES;
        if(ratio === 1){
          w.push('Formel ergibt mit den aktuellen Variablenbereichen IMMER ein ungültiges Ergebnis (z. B. Division durch 0, Wurzel aus Negativem). Formel oder Bereiche anpassen.');
        } else if(ratio >= 0.2){
          w.push('Formel scheitert in ' + Math.round(ratio * 100) + '% der Stichproben (z. B. Division durch 0). Variablenbereich enger fassen oder Formel anpassen.');
        }
      }
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', preset: 'custom',
        questionTemplate: 'Wie viel ist {a} + {b}?',
        variables: [
          { name: 'a', min: 1, max: 10, step: 1 },
          { name: 'b', min: 1, max: 10, step: 1 }
        ],
        formula: 'a + b', tolerance: 0.01, unit: '', maxPoints: 1
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Numerische Eingabe' },
        { key:'preset', label:'Vorlage', type:'select', options: PRESET_OPTIONS,
          help:'Beispiele zeigen alle Möglichkeiten des Blocks. „Manuell" für eigene Fragen.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },
        // Question
        { type:'section', label:'Frage', key:'_sec_q' },
        { key:'questionTemplate', label:'Frage-Vorlage  (Variablen als {name})', type:'math-textarea', rows:2, showIf: isCustom,
          help:'Beispiel: „Berechnen Sie {a} + {b}." Variablen werden beim Start zufällig belegt. Die Lösungs-Formel wird automatisch abgeleitet.',
          onChange: (val, cfg, set) => {
            // Auto-derive the formula unless the user has edited it.
            const derived = deriveFormula(val);
            const previous = cfg._derivedFormula || '';
            const userTouched = cfg.formula && cfg.formula !== previous;
            if(!userTouched){
              set('formula', derived);
              set('_derivedFormula', derived);
              // Push value into the open formula input without re-render (keeps focus).
              const fld = document.querySelector('[data-formula-field-key="formula"]');
              if(fld) fld.dispatchEvent(new CustomEvent('formula-field-set', { detail: { value: derived } }));
            }
          } },
        // Variables
        { type:'section', label:'Zufallsvariablen', key:'_sec_vars' },
        { key:'variables', label:'Variablen', type:'list', itemLabel:'Variable',
          showIf: isCustom,
          itemSummary: item => {
            if(!item.name) return '…';
            const range = (item.min ?? '') + ' … ' + (item.max ?? '');
            return item.name + ':  ' + range + (item.integer ? '  (ganz)' : '');
          },
          itemSchema:[
            { key:'name',    label:'Name',           type:'text',    placeholder:'z. B. a' },
            { key:'min',     label:'von',             type:'number',  step:'any',
              onChange:(val, item, set) => {
                // Lower bound exceeds upper: raise upper alongside.
                if(val != null && item.max != null && val > item.max) set('max', val);
              }},
            { key:'max',     label:'bis',             type:'number',  step:'any',
              onChange:(val, item, set) => {
                // Upper bound below lower: lower the lower bound alongside.
                if(val != null && item.min != null && val < item.min) set('min', val);
              }},
            { key:'integer', label:'Nur Ganzzahlen',  type:'boolean' }
          ]},
        // Solution
        { type:'section', label:'Lösung', key:'_sec_formula' },
        { key:'formula', label:'Lösungs-Formel', type:'formula-text', placeholder:'sqrt(a^2 + b^2)', showIf: isCustom,
          help:'Wird automatisch aus der Frage abgeleitet. Bei Bedarf manuell überschreiben.' },
        { key:'tolerance', label:'Toleranz  (±)', type:'number', step:'any',
          help:'Abweichung, die noch als korrekt gilt. 0 = exakt.' },
        { key:'unit', label:'Antwort-Einheit (optional)', type:'text', placeholder:'z. B. m/s oder kg',
          help:'Wird neben dem Antwortfeld angezeigt. Die Einheit in der Frage selbst gehört in den Fragetext.' },
        { key:'simplifyFractions', label:'Term vereinfachen', type:'boolean',
          help:'Aktiv: Studierende müssen den gekürzten Bruch eingeben. „10/20" wird als falsch gewertet, „1/2" ist korrekt. Aus: alle äquivalenten Eingaben werden akzeptiert.' },
        // Scoring
        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;
      const activeConfig = numericPresetConfig(config);

      const ui = u.questionCard(host, {
        h3: activeConfig.blockTitle || 'Aufgabe',
        qBoxTitle: 'Frage',
        inputLabel: 'Antwort' + (activeConfig.unit ? ' (' + activeConfig.unit + ')' : ''),
        inputPlaceholder: 'Zahl oder Bruch (z. B. 0.75 oder 3/4)'
      });
      const { qText, inp, checkBtn, newBtn, fb } = ui;

      function genVars(){
        const vars = {};
        (activeConfig.variables || []).forEach(v => {
          const min = Number(v.min), max = Number(v.max);
          let val = min + Math.random() * (max - min);
          if(v.integer) val = Math.round(val);
          else val = Math.round(val * 100) / 100;
          vars[v.name] = val;
        });
        return vars;
      }
      function fillTemplate(tpl, vars){
        // Render a numeric value. Clean small-denominator fractions show as
        // "num/den" with the sign in front; everything else falls back to a
        // rounded decimal. (The simplifyFractions toggle only changes how
        // the solution is reported, not the question display.)
        function formatValue(v, wrapNeg){
          let s;
          const frac = u.asFraction(v);
          // den <= 20 keeps fractions readable (1/2, 3/7) and avoids ugly
          // artefacts like 43/100 that come from 2-decimal rounding.
          if(frac && Math.abs(frac.den) > 1 && Math.abs(frac.den) <= 20){
            const absNum = Math.abs(frac.num);
            s = (frac.num < 0 ? '-' : '') + absNum + '/' + frac.den;
          } else if(Number.isInteger(v)){
            s = String(v);
          } else {
            s = String(Math.round(v * 100) / 100);
          }
          // After a multiplicative, divisive or power operator a negative
          // value is wrapped so the sign stays glued to the number:
          // a · (-3/7) instead of the confusing a · -3/7.
          if(wrapNeg && v < 0) s = '(' + s + ')';
          return s;
        }
        // True when the placeholder follows a binary operator (so a negative
        // substitution should appear inside parentheses).
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
            // Inside $...$ KaTeX preserves {} as argument grouping. Decide
            // wrapping based on the character before each placeholder inside
            // the math expression. innerOffset is relative to `match`, which
            // begins at `offset` in the full template, so the absolute index
            // of each {x} is offset + innerOffset.
            const filled = match.replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name, innerOffset) => {
              if(name in vars){
                const wrap = shouldWrap(tplStr, offset + innerOffset);
                return '{' + formatValue(vars[name], wrap) + '}';
              }
              return m;
            });
            // A negative value in a fraction numerator reads better with the
            // sign in front of the bar: \frac{-3}{7} -> -\frac{3}{7}.
            return fracMinusOut(filled);
          }
          if(plainName && plainName in vars){
            return formatValue(vars[plainName], shouldWrap(tplStr, offset));
          }
          return match;
        });
      }
      function sameInstance(a, b){
        return !!a && !!b && JSON.stringify(a.vars || {}) === JSON.stringify(b.vars || {}) && a.expected === b.expected;
      }
      // Valid = finite real number (no NaN/Infinity).
      function isValidExpected(e){
        return typeof e === 'number' && Number.isFinite(e);
      }
      function chooseNew(showMsg){
        const MAX_TRIES = 200;
        let vars = null, expected = null;
        // First find any combination that evaluates to a finite number.
        let attempts = 0;
        while(attempts < MAX_TRIES){
          vars = genVars();
          expected = u.safeMathExpr(activeConfig.formula || '0', vars);
          if(isValidExpected(expected)) break;
          attempts++;
        }
        if(!isValidExpected(expected)){
          // Formula always fails (e.g. 1/0). Feedback and bail out.
          fb.bad('Aufgabe nicht generierbar: Formel führt mit den aktuellen Variablenbereichen immer zu einem ungültigen Ergebnis (z. B. Division durch 0). Variablenbereiche oder Formel anpassen.');
          return;
        }
        // Prefer a different instance than before, but never sacrifice validity.
        let next = { vars, expected };
        for(let i = 0; current && sameInstance(next, current) && i < 30; i++){
          const tryVars = genVars();
          const tryExp = u.safeMathExpr(activeConfig.formula || '0', tryVars);
          if(!isValidExpected(tryExp)) continue;
          vars = tryVars; expected = tryExp; next = { vars, expected };
        }
        current = next;
        inp.value = '';
        qText.textContent = fillTemplate(activeConfig.questionTemplate, vars);
        u.renderMath(qText);
        if(showMsg) fb.neutral('Neue Aufgabe generiert.');
      }
      function grade(){
        if(!current || current.expected == null){ fb.bad('Lösung konnte nicht berechnet werden (Formel prüfen).'); return; }
        const got = u.parseNum(inp.value);
        if(got == null){ fb.bad('Bitte eine gültige Zahl oder Bruch (z. B. 3/4) eingeben.'); return; }
        // simplifyFractions: when on, an unsimplified fraction like "10/20"
        // is rejected even though its numeric value matches the expected one.
        if(activeConfig.simplifyFractions !== false){
          const fracParts = parseFractionInput(inp.value);
          if(fracParts && !isFractionSimplified(fracParts.num, fracParts.den)){
            fb.bad('Bitte gekürzten Bruch eingeben (z. B. 1/2 statt 2/4).');
            api.reportScore(0);
            return;
          }
        }
        if(u.nearlyEqual(got, current.expected, Number(activeConfig.tolerance) || 0.01)){
          fb.ok('Korrekt. (Lösung: ' + u.formatSolution(current.expected) + (activeConfig.unit ? ' ' + activeConfig.unit : '') + ')');
          api.reportScore(activeConfig.maxPoints || 1);
        } else {
          fb.bad('Nicht korrekt.');
          api.reportScore(0);
        }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', () => chooseNew(true));
      u.regenPolicy(newBtn, activeConfig, api);

      chooseNew(false);
      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const activeConfig = numericPresetConfig(config);
      // Deterministic sample so the preview is stable across renders.
      const sample = { a: 7, b: 3, p: 20, g: 150, x: 4, y: 3 };
      const questionText = (activeConfig.questionTemplate || '(Aufgabe)')
        .replace(/\{(\w+)\}/g, (_, name) => (sample[name] != null ? sample[name] : '?'));
      // Evaluate with the same sample so the solution hint shows a number.
      let solution = null;
      if(activeConfig.formula){
        try {
          solution = window.BlockUtils.safeMathExpr(activeConfig.formula, sample);
          if(typeof solution === 'number') solution = Math.round(solution * 100) / 100;
        } catch{}
      }
      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3');
      h3.textContent = 'Frage';
      card.appendChild(h3);
      const q = document.createElement('p');
      q.textContent = questionText;
      card.appendChild(q);
      const inpRow = document.createElement('div');
      inpRow.className = 'bp-input-row';
      const inp = document.createElement('div');
      inp.className = 'bp-input';
      inp.textContent = 'Zahl eingeben…';
      inpRow.appendChild(inp);
      if(activeConfig.unit){
        const u = document.createElement('span');
        u.className = 'bp-unit';
        u.textContent = activeConfig.unit;
        inpRow.appendChild(u);
      }
      card.appendChild(inpRow);
      const btn = document.createElement('span');
      btn.textContent = 'Korrektur';
      btn.className = 'bp-btn';
      card.appendChild(btn);
      if(solution != null){
        const hint = document.createElement('div');
        hint.className = 'bp-hint';
        hint.innerHTML = '<div class="bp-hint-title">Beispiel-Lösung</div>' +
          '<div class="bp-hint-body">' + activeConfig.formula + ' = ' + solution +
          (activeConfig.unit ? ' ' + activeConfig.unit : '') + '</div>';
        card.appendChild(hint);
      }
      host.appendChild(card);
    },
    // Custom builder-actions. Dispatched from the right-pane action buttons.
    applyAction(action, cfg){
      if(action === 'derive-formula'){
        const derived = deriveFormula(cfg.questionTemplate || '');
        if(derived){
          cfg.formula = derived;
          return true;
        }
      }
      return false;
    }
  });

  // Detect fraction-form input ("a/b" or "-a/b") with INTEGER parts only.
  // Decimals like "1.5/2" and mixed numbers like "1 3/4" return null because
  // their "simplified" form is ambiguous; only plain integer fractions are
  // candidates for the cancellation check.
  function parseFractionInput(value){
    const s = String(value == null ? '' : value).trim().replace(',', '.');
    const m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if(!m) return null;
    const num = Number(m[1]), den = Number(m[2]);
    if(!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return { num, den };
  }
  function isFractionSimplified(num, den){
    let a = Math.abs(num), b = Math.abs(den);
    while(b){ const t = b; b = a % b; a = t; }
    return a === 1;
  }

  // Question template -> JS formula. Prefers $...$, translates LaTeX constructs to ASCII.
  function deriveFormula(template){
    if(!template) return '';
    let s = String(template);
    // Prefer the contents between $...$.
    const dollarMatch = s.match(/\$([^$]+)\$/);
    if(dollarMatch) s = dollarMatch[1];
    // LaTeX -> ASCII via shared helper. \frac is wrapped in outer parens
    // so fraction-division compositions evaluate correctly:
    //   \frac{a}{b} \div \frac{c}{d}  ->  ((a)/(b)) / ((c)/(d))  ->  (a/b)/(c/d)
    const utilsRef = (typeof window !== 'undefined' && window.BlockUtils) || null;
    s = utilsRef && utilsRef.latexToAscii ? utilsRef.latexToAscii(s) : s;
    // After LaTeX-replacements, convert remaining {x} placeholders to plain x.
    function unwrapBraces(str){
      return str.replace(/\{([^{}]*)\}/g, '($1)');
    }
    s = unwrapBraces(s);
    // Normalize multiplicative / additive symbols and √. Colon is handled
    // separately below so we can group its operands.
    s = s.replace(/[·×∙]/g, '*')
         .replace(/÷/g, '/')
         .replace(/−/g, '-')
         .replace(/√/g, 'sqrt');
    // Strip German connector words.
    s = s.replace(/\b(Berechnen Sie|Berechne|Was ist|Wie viel ist|Wieviel ist|Bestimmen Sie|Bestimme|Gib an|Bestimme den Wert von|Geben Sie an)\b/gi, ' ');
    // Colon as "outer division": when both sides contain math, group each
    // segment in parens before joining with /. Plain-text templates like
    // "{a}/{b} : {c}/{d}" then auto-derive to ((a)/(b))/((c)/(d)).
    // A trailing sentence period (templates often end the prose with ".")
    // is stripped before wrapping so the final group stays valid.
    if(s.includes(':')){
      const parts = s.split(':').map(p => p.trim().replace(/^[.,;:!?]+|[.,;:!?]+$/g, '').trim());
      const allMathy = parts.length >= 2 && parts.every(p => /[A-Za-z0-9]/.test(p));
      if(allMathy){
        s = parts.map(p => '(' + p + ')').join(' / ');
      } else {
        s = s.replace(/:/g, '/');
      }
    }
    // Find the longest contiguous math-allowed substring around variables.
    const allowed = /[A-Za-z_0-9+\-*/^().,\s]/;
    let best = '';
    let current = '';
    for(let i = 0; i < s.length; i++){
      const c = s[i];
      if(allowed.test(c)) current += c;
      else { if(current.length > best.length) best = current; current = ''; }
    }
    if(current.length > best.length) best = current;
    best = best.trim().replace(/^[\s.,]+|[\s.,]+$/g, '');
    // Collapse multiple whitespace runs into a single space.
    best = best.replace(/\s+/g, ' ');
    return best;
  }

  // Read the balanced {...} group whose opening brace is at index i.
  // Returns { content, end } where end is the index of the matching '}'.
  function readBraceGroup(s, i){
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
  function fracMinusOut(tex){
    let out = '', i = 0;
    while(i < tex.length){
      if(tex.startsWith('\\frac', i)){
        let j = i + 5;
        while(j < tex.length && tex[j] === ' ') j++;
        if(tex[j] === '{'){
          const num = readBraceGroup(tex, j);
          if(num){
            let k = num.end + 1;
            while(k < tex.length && tex[k] === ' ') k++;
            if(tex[k] === '{'){
              const den = readBraceGroup(tex, k);
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
                  // binary operator on EITHER side, so it reads "a + (-3/7)" and
                  // "(-3/7) + a" instead of the confusing "a + -3/7" / "-3/7 + a"
                  // (mirrors how a plain negative value is wrapped to "(-3)").
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
  }

  function numericPresetConfig(config){
    const preset = config.preset || 'custom';
    if(preset === 'custom') return config;
    const base = Object.assign({}, config, { tolerance: config.tolerance || 0.01, unit: '' });
    const vInt = (name, min, max) => ({name, min, max, integer:true});
    const vDec = (name, min, max) => ({name, min, max, integer:false});
    switch(preset){
      case 'addition':
        return Object.assign(base, {questionTemplate:'Berechnen Sie {a} + {b}.', variables:[vInt('a',1,60), vInt('b',1,60)], formula:'a + b'});
      case 'subtraction':
        return Object.assign(base, {questionTemplate:'Berechnen Sie {a} - {b}.', variables:[vInt('a',20,100), vInt('b',1,20)], formula:'a - b'});
      case 'multiplication':
        return Object.assign(base, {questionTemplate:'Berechnen Sie {a} · {b}.', variables:[vInt('a',2,12), vInt('b',2,12)], formula:'a * b'});
      case 'division':
        return Object.assign(base, {questionTemplate:'Berechnen Sie {a} : {b}.', variables:[vInt('a',20,120), vInt('b',2,12)], formula:'a / b', tolerance:0.05});
      case 'percent':
        return Object.assign(base, {questionTemplate:'Berechnen Sie {p}% von {g}.', variables:[vInt('p',5,40), vInt('g',20,300)], formula:'g * p / 100'});
      case 'pythagoras':
        return Object.assign(base, {questionTemplate:'Ein rechtwinkliges Dreieck hat Katheten {a} und {b}. Berechnen Sie die Hypotenuse.', variables:[vInt('a',3,12), vInt('b',4,16)], formula:'sqrt(a^2 + b^2)', tolerance:0.05});
      case 'rectangle-area':
        return Object.assign(base, {questionTemplate:'Ein Rechteck ist {a} cm lang und {b} cm breit. Berechnen Sie die Fläche.', variables:[vInt('a',2,30), vInt('b',2,20)], formula:'a * b', unit:'cm²'});
      case 'circle-area':
        return Object.assign(base, {questionTemplate:'Ein Kreis hat den Radius {r} cm. Berechnen Sie die Fläche.', variables:[vInt('r',1,12)], formula:'pi * r^2', tolerance:0.1, unit:'cm²'});
      case 'ohm':
        return Object.assign(base, {questionTemplate:'An einem Widerstand von {r} Ω fließt ein Strom von {i} A. Berechnen Sie die Spannung.', variables:[vInt('r',5,200), vDec('i',0.1,3)], formula:'r * i', tolerance:0.1, unit:'V'});
      default:
        return config;
    }
  }
})();
