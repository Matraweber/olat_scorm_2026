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
        maxPoints: 1
      };
    },
    summary(cfg){ return cfg.questionTemplate || '(Frage leer)'; },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const w = [];
      if(!cfg.questionTemplate || !String(cfg.questionTemplate).trim()) w.push('Frage-Vorlage fehlt.');
      if(!cfg.formula || !String(cfg.formula).trim()) w.push('Lösungsformel fehlt.');
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
        // Frage
        { type:'section', label:'Frage', key:'_sec_q' },
        { key:'questionTemplate', label:'Frage-Vorlage  (Variablen als {name})', type:'math-textarea', rows:2, showIf: isCustom,
          help:'Beispiel: „Berechnen Sie {a} + {b}." Variablen werden beim Start zufällig belegt. Die Lösungs-Formel wird automatisch abgeleitet.',
          onChange: (val, cfg, set) => {
            // Auto-derive the formula whenever the question changes, unless
            // the user has explicitly customised it (signaled by storing the
            // last auto-derived value in cfg._derivedFormula).
            const derived = deriveFormula(val);
            const previous = cfg._derivedFormula || '';
            const userTouched = cfg.formula && cfg.formula !== previous;
            if(!userTouched){
              set('formula', derived);
              set('_derivedFormula', derived);
              // Push the new value into the open formula input without
              // re-rendering the entire config pane (preserves focus).
              const fld = document.querySelector('[data-formula-field-key="formula"]');
              if(fld) fld.dispatchEvent(new CustomEvent('formula-field-set', { detail: { value: derived } }));
            }
          } },
        // Variablen
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
                // Untere Grenze ueber obere -> obere mit-anheben.
                if(val != null && item.max != null && val > item.max) set('max', val);
              }},
            { key:'max',     label:'bis',             type:'number',  step:'any',
              onChange:(val, item, set) => {
                // Obere unter untere -> untere mit-absenken.
                if(val != null && item.min != null && val < item.min) set('min', val);
              }},
            { key:'integer', label:'Nur Ganzzahlen',  type:'boolean' }
          ]},
        // Lösung
        { type:'section', label:'Lösung', key:'_sec_formula' },
        { key:'formula', label:'Lösungs-Formel', type:'formula-text', placeholder:'sqrt(a^2 + b^2)', showIf: isCustom,
          help:'Wird automatisch aus der Frage abgeleitet. Bei Bedarf manuell überschreiben.' },
        { key:'tolerance', label:'Toleranz  (±)', type:'number', step:'any',
          help:'Abweichung, die noch als korrekt gilt. 0 = exakt.' },
        { key:'unit', label:'Antwort-Einheit (optional)', type:'text', placeholder:'z. B. m/s oder kg',
          help:'Wird neben dem Antwortfeld angezeigt. Die Einheit in der Frage selbst gehoert in den Fragetext.' },
        // Bewertung
        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
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
        function formatValue(v){
          return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
        }
        // Within $...$ blocks (KaTeX) the braces around {a} are LaTeX
        // argument groups - keep them so constructs like \frac{a}{b} stay
        // valid after substitution. Outside math, drop the braces.
        return String(tpl || '').replace(/\$[^$]*\$|\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (match, plainName) => {
          if(match.startsWith('$')){
            // Math context: replace {name} but keep wrapping braces.
            return match.replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name) => {
              if(name in vars) return '{' + formatValue(vars[name]) + '}';
              return m;
            });
          }
          if(plainName && plainName in vars) return formatValue(vars[plainName]);
          return match;
        });
      }
      function sameInstance(a, b){
        return !!a && !!b && JSON.stringify(a.vars || {}) === JSON.stringify(b.vars || {}) && a.expected === b.expected;
      }
      function chooseNew(showMsg){
        let vars = genVars();
        let expected = u.safeMathExpr(activeConfig.formula || '0', vars);
        let next = { vars, expected };
        for(let i = 0; current && sameInstance(next, current) && i < 30; i++){
          vars = genVars();
          expected = u.safeMathExpr(activeConfig.formula || '0', vars);
          next = { vars, expected };
        }
        current = next;
        inp.value = '';
        qText.textContent = fillTemplate(activeConfig.questionTemplate, vars);
        u.renderMath(qText);
        if(showMsg) fb.neutral('Neue Aufgabe generiert.');
      }
      function grade(){
        if(current.expected == null){ fb.bad('Lösung konnte nicht berechnet werden (Formel prüfen).'); return; }
        const got = u.parseNum(inp.value);
        if(got == null){ fb.bad('Bitte eine gültige Zahl oder Bruch (z. B. 3/4) eingeben.'); return; }
        if(u.nearlyEqual(got, current.expected, Number(activeConfig.tolerance) || 0.01)){
          fb.ok('Korrekt. (Loesung: ' + u.formatSolution(current.expected) + (activeConfig.unit ? ' ' + activeConfig.unit : '') + ')');
          api.reportScore(activeConfig.maxPoints || 1);
        } else {
          fb.bad('Nicht korrekt.');
          api.reportScore(0);
        }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', () => chooseNew(true));

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
      // Evaluate with the same sample so the Lösung-Hint shows a number.
      let solution = null;
      if(activeConfig.formula){
        try {
          solution = window.BlockUtils.safeMathExpr(activeConfig.formula, sample);
          if(typeof solution === 'number') solution = Math.round(solution * 100) / 100;
        } catch(e){}
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

  // Best-effort: turn "Berechnen Sie {a} + {b}." into "a + b". Walks the
  // template, drops natural-language tokens, normalizes operator symbols.
  // Try to extract a JavaScript-evaluable formula from a question template.
  // Strategy: prefer math inside $...$ delimiters (KaTeX), then convert LaTeX
  // constructs to ASCII, then strip natural-language fluff.
  function deriveFormula(template){
    if(!template) return '';
    let s = String(template);
    // 1. Prefer the contents inside $...$ if present (KaTeX block).
    const dollarMatch = s.match(/\$([^$]+)\$/);
    if(dollarMatch) s = dollarMatch[1];
    // 2. Convert LaTeX constructs to ASCII expressions BEFORE the brace strip.
    //    \frac{X}{Y} -> (X)/(Y)
    //    \sqrt{X}    -> sqrt(X)
    //    \cdot       -> *
    //    {X}^{Y}     -> (X)^(Y)
    function unwrapBraces(str){
      // {a+b}^{2} pattern: braces denote LaTeX argument groups (single token).
      return str.replace(/\{([^{}]*)\}/g, '($1)');
    }
    // First handle \frac, \sqrt etc. with their {...}-args.
    s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/\\cdot/g, '*');
    s = s.replace(/\\times/g, '*');
    s = s.replace(/\\div/g, '/');
    s = s.replace(/\\pi/g, 'pi');
    s = s.replace(/\\left|\\right/g, '');
    // After LaTeX-replacements, convert remaining {x} placeholders to plain x.
    s = unwrapBraces(s);
    // Normalize math symbols.
    s = s.replace(/[·×∙]/g, '*')
         .replace(/÷|:/g, '/')
         .replace(/−/g, '-')
         .replace(/√/g, 'sqrt');
    // Strip German connector words.
    s = s.replace(/\b(Berechnen Sie|Berechne|Was ist|Wie viel ist|Wieviel ist|Bestimmen Sie|Bestimme|Gib an|Bestimme den Wert von|Geben Sie an)\b/gi, ' ');
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
