(function(){
  'use strict';
  const PRESET_OPTIONS = [
    {value:'custom',         label:'Manuell (leer)',                            labelKey:'block.numeric-input.field.preset.option.custom'},
    {value:'pythagoras',     label:'Beispiel: Pythagoras (c = √(a²+b²))',       labelKey:'block.numeric-input.field.preset.option.pythagoras'},
    {value:'rectangle-area', label:'Beispiel: Rechteckfläche (A = a·b)',       labelKey:'block.numeric-input.field.preset.option.rectangle-area'},
    {value:'circle-area',    label:'Beispiel: Kreisfläche (A = π·r²)',         labelKey:'block.numeric-input.field.preset.option.circle-area'},
    {value:'ohm',            label:'Beispiel: Ohmsches Gesetz (U = R·I)',       labelKey:'block.numeric-input.field.preset.option.ohm'}
  ];

  Blocks.register('numeric-input', {
    label: 'Numerische Eingabe',
    labelKey: 'block.numeric-input.label',
    description: 'Numerische Frage mit Zufallsvariablen und Lösungs-Formel.',
    descKey: 'block.numeric-input.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
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
        answerPrefix: '',
        extraAnswers: [],
        simplifyFractions: true,
        integerAnswers: false,
        decimals: 2,
        valueDisplay: 'auto',
        allowImpossible: false,
        maxPoints: 1
      };
    },
    summary(cfg){
      const u = window.BlockUtils;
      const empty = (u && typeof u.t === 'function') ? u.t('block.numeric-input.summary.empty') : '(Frage leer)';
      return cfg.questionTemplate || empty;
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const u = window.BlockUtils;
      const t = (key, fallback, params) => (u && typeof u.t === 'function') ? u.t(key, params) : fallback;
      const w = [];
      if(!cfg.questionTemplate || !String(cfg.questionTemplate).trim()) w.push(t('block.numeric-input.validate.templateMissing', 'Frage-Vorlage fehlt.'));
      if(!cfg.formula || !String(cfg.formula).trim()) w.push(t('block.numeric-input.validate.formulaMissing', 'Lösungsformel fehlt.'));
      (cfg.extraAnswers || []).forEach((a, i) => {
        if(!a || !String(a.formula || '').trim()){
          w.push(t('block.numeric-input.validate.extraFormulaMissing',
            'Antwortfeld ' + (i + 2) + ': Lösungsformel fehlt (Feld wird ignoriert).', { n: i + 2 }));
        }
      });
      // Variable names must be ASCII identifiers. The substitution regex
      // and the math evaluator both reject non-ASCII names, so reject early.
      (cfg.variables || []).forEach((v, i) => {
        if(!v || !v.name) return;
        if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.name)){
          w.push(t('block.numeric-input.validate.varNameInvalid',
            'Variable ' + (i + 1) + ' („' + v.name + '"): Name darf nur Buchstaben (a-z, A-Z), Ziffern und Unterstrich enthalten.',
            { index: i + 1, name: v.name }));
        }
        const lo = Number(v.min), hi = Number(v.max);
        if(isFinite(lo) && isFinite(hi) && lo > hi){
          w.push(t('block.numeric-input.validate.varRangeInverted',
            'Variable „' + v.name + '": Min (' + lo + ') ist größer als Max (' + hi + ').',
            { name: v.name, min: lo, max: hi }));
        }
      });
      // Monte Carlo check: catches 0 under a fraction bar, sqrt(-x), log(0) before export.
      const usesGlobals = !!(window.BlockUtils && window.BlockUtils.globalVarsUsedBy(cfg).length);
      if(cfg.formula && ((cfg.variables || []).length > 0 || usesGlobals) && window.BlockUtils){
        const SAMPLES = 200;
        let invalid = 0, whole = 0;
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
          // Global variables get a fresh sample each round, like at runtime.
          const vars = window.BlockUtils.withGlobalVars(local, cfg.variables, window.BlockUtils.genGlobalVarValues());
          const r = window.BlockUtils.safeMathExpr(window.BlockUtils.applyAngleUnit(cfg.formula, cfg.angleUnit), vars);
          if(typeof r !== 'number' || !Number.isFinite(r)) invalid++;
          else if(Math.abs(r - Math.round(r)) < 1e-9) whole++;
        }
        const ratio = invalid / SAMPLES;
        if(ratio === 1){
          w.push(t('block.numeric-input.validate.formulaAlwaysInvalid',
            'Formel ergibt mit den aktuellen Variablenbereichen IMMER ein ungültiges Ergebnis (z. B. Division durch 0, Wurzel aus Negativem). Formel oder Bereiche anpassen.'));
        } else if(ratio >= 0.2 && !cfg.allowImpossible){
          // With "X" allowed, invalid results are intended tasks, not errors.
          w.push(t('block.numeric-input.validate.formulaOftenInvalid',
            'Formel scheitert in ' + Math.round(ratio * 100) + '% der Stichproben (z. B. Division durch 0). Variablenbereich enger fassen oder Formel anpassen.',
            { pct: Math.round(ratio * 100) }));
        }
        if(cfg.integerAnswers && ratio < 1 && whole === 0){
          w.push(t('block.numeric-input.validate.integerNever',
            '„Nur ganzzahlige Lösungen“: In keiner Stichprobe war die Lösung ganzzahlig. Variablen auf „Nur Ganzzahlen“ stellen oder Formel/Bereiche anpassen.'));
        }
      }
      return w;
    },
    // Global variables are drawn for the whole course; the runtime asks every
    // block that uses them whether a drawn set still allows a valid task
    // (whole-number / solvable results as configured).
    acceptsGlobals(cfg, globals){
      const u = window.BlockUtils;
      const ac = numericPresetConfig(cfg, (u.getLocale && u.getLocale()) || 'de');
      const formulas = [ac.formula || '0'].concat((ac.extraAnswers || [])
        .filter(a => a && String(a.formula || '').trim()).map(a => a.formula));
      const isWhole = v => Math.abs(v - Math.round(v)) < 1e-9;
      const tries = (ac.variables || []).length ? (ac.integerAnswers ? 2000 : 200) : 1;
      for(let i = 0; i < tries; i++){
        const local = {};
        (ac.variables || []).forEach(v => {
          const min = Number(v.min), max = Number(v.max);
          let val = min + Math.random() * (max - min);
          val = v.integer ? Math.round(val) : u.roundVarValue(val, false, v, ac);
          local[v.name] = val;
        });
        const vars = u.withGlobalVars(local, ac.variables, globals);
        const ok = formulas.every(f => {
          const r = u.safeMathExpr(u.applyAngleUnit(f, ac.angleUnit), vars);
          const valid = typeof r === 'number' && Number.isFinite(r);
          return valid ? (!ac.integerAnswers || isWhole(r)) : !!ac.allowImpossible;
        });
        if(ok) return true;
      }
      return false;
    },
    previewConfig(){
      const u = window.BlockUtils || {};
      const locale = (u.getLocale && u.getLocale()) || 'de';
      const en = locale === 'en';
      return {
        blockTitle: '', preset: 'custom',
        questionTemplate: en ? 'How much is {a} + {b}?' : 'Wie viel ist {a} + {b}?',
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
        { key:'blockTitle', label:'Überschrift', labelKey:'block.numeric-input.field.blockTitle.label', type:'text', placeholder:'Numerische Eingabe', placeholderKey:'block.numeric-input.field.blockTitle.placeholder' },
        { key:'preset', label:'Vorlage', labelKey:'block.numeric-input.field.preset.label', type:'select', options: PRESET_OPTIONS,
          help:'Beispiele zeigen alle Möglichkeiten des Blocks. „Manuell" für eigene Fragen.', helpKey:'block.numeric-input.field.preset.help' },
        { type:'action', label:'↺ Zurücksetzen', labelKey:'block.numeric-input.field.reset.label', action:'reset', showIf: isCustom },
        // Question
        { type:'section', label:'Frage', labelKey:'block.numeric-input.field.sectionQuestion.label', key:'_sec_q' },
        { key:'questionTemplate', label:'Frage-Vorlage  (Variablen als {name})', labelKey:'block.numeric-input.field.questionTemplate.label', type:'math-textarea', rows:2, showIf: isCustom,
          help:'Beispiel: „Berechnen Sie {a} + {b}." Variablen werden beim Start zufällig belegt. Die Lösungs-Formel wird automatisch abgeleitet.', helpKey:'block.numeric-input.field.questionTemplate.help',
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
        { type:'section', label:'Zufallsvariablen', labelKey:'block.numeric-input.field.sectionVariables.label', key:'_sec_vars' },
        { key:'variables', label:'Variablen', labelKey:'block.numeric-input.field.variables.label', type:'list', itemLabel:'Variable', itemLabelKey:'block.numeric-input.field.variables.itemLabel',
          showIf: isCustom,
          itemSummary: item => {
            if(!item.name) return '…';
            const range = (item.min ?? '') + ' … ' + (item.max ?? '');
            return item.name + ':  ' + range + (item.integer ? '  (ganz)' : '');
          },
          itemSchema:[
            { key:'name',    label:'Name',           labelKey:'block.numeric-input.field.variables.item.name.label',    type:'text',    placeholder:'z. B. a', placeholderKey:'block.numeric-input.field.variables.item.name.placeholder' },
            { key:'min',     label:'von',            labelKey:'block.numeric-input.field.variables.item.min.label',     type:'number',  step:'any',
              onChange:(val, item, set) => {
                // Lower bound exceeds upper: raise upper alongside.
                if(val != null && item.max != null && val > item.max) set('max', val);
              }},
            { key:'max',     label:'bis',            labelKey:'block.numeric-input.field.variables.item.max.label',     type:'number',  step:'any',
              onChange:(val, item, set) => {
                // Upper bound below lower: lower the lower bound alongside.
                if(val != null && item.min != null && val < item.min) set('min', val);
              }},
            { key:'integer', label:'Nur Ganzzahlen', labelKey:'block.numeric-input.field.variables.item.integer.label', type:'boolean' },
            ...window.BlockUtils.varItemFormatFields(item => !!item.integer)
          ]},
        // Task-wide defaults for decimal variables (each variable can override).
        ...window.BlockUtils.varFormatSchemaFields(isCustom),
        // Solution
        { type:'section', label:'Lösung', labelKey:'block.numeric-input.field.sectionSolution.label', key:'_sec_formula' },
        { key:'formula', label:'Lösungs-Formel', labelKey:'block.numeric-input.field.formula.label', type:'formula-text', placeholder:'sqrt(a^2 + b^2)', placeholderKey:'block.numeric-input.field.formula.placeholder', showIf: isCustom,
          help:'Wird automatisch aus der Frage abgeleitet. Bei Bedarf manuell überschreiben.', helpKey:'block.numeric-input.field.formula.help' },
        { key:'tolerance', label:'Toleranz  (±)', labelKey:'block.numeric-input.field.tolerance.label', type:'number', step:'any',
          help:'Abweichung, die noch als korrekt gilt. 0 = exakt.', helpKey:'block.numeric-input.field.tolerance.help' },
        { key:'unit', label:'Antwort-Einheit (optional)', labelKey:'block.numeric-input.field.unit.label', type:'text', placeholder:'z. B. m/s oder kg', placeholderKey:'block.numeric-input.field.unit.placeholder',
          help:'Wird neben dem Antwortfeld angezeigt. Die Einheit in der Frage selbst gehört in den Fragetext.', helpKey:'block.numeric-input.field.unit.help' },
        { key:'answerPrefix', label:'Bezeichnung vor dem Antwortfeld (optional)', labelKey:'block.numeric-input.field.answerPrefix.label', type:'text', placeholder:'z. B. x =', placeholderKey:'block.numeric-input.field.answerPrefix.placeholder',
          help:'Steht links vor dem Eingabefeld, z. B. ein Variablenname. $…$ für Formeln möglich.', helpKey:'block.numeric-input.field.answerPrefix.help' },
        // Additional answer fields, each with its own formula. Field 1 is the
        // main formula/unit/prefix above.
        { key:'extraAnswers', label:'Weitere Antwortfelder', labelKey:'block.numeric-input.field.extraAnswers.label', type:'list',
          itemLabel:'Antwortfeld', itemLabelKey:'block.numeric-input.field.extraAnswers.itemLabel', showIf: isCustom,
          help:'Jedes Feld hat eine eigene Formel (gleiche Zufallsvariablen). Teilpunkte pro richtigem Feld.', helpKey:'block.numeric-input.field.extraAnswers.help',
          itemSummary: item => {
            const L = v => (window.BlockUtils && window.BlockUtils.l) ? (window.BlockUtils.l(v) || '') : (v || '');
            return [L(item.prefix), item.formula ? '= ' + item.formula : '…', L(item.unit)].filter(Boolean).join(' ');
          },
          itemSchema:[
            { key:'prefix',    label:'Bezeichnung davor', labelKey:'block.numeric-input.field.extraAnswers.item.prefix.label', type:'text', placeholder:'z. B. y =', placeholderKey:'block.numeric-input.field.extraAnswers.item.prefix.placeholder' },
            { key:'formula',   label:'Lösungs-Formel',    labelKey:'block.numeric-input.field.extraAnswers.item.formula.label', type:'formula-text', placeholder:'a - b' },
            { key:'unit',      label:'Einheit dahinter',  labelKey:'block.numeric-input.field.extraAnswers.item.unit.label', type:'text', placeholder:'z. B. m', placeholderKey:'block.numeric-input.field.extraAnswers.item.unit.placeholder' },
            // '' (not 0) by default: empty = use the block tolerance above.
            { key:'tolerance', label:'Toleranz (±), leer = wie oben', labelKey:'block.numeric-input.field.extraAnswers.item.tolerance.label', type:'number', step:'any', default:'' }
          ]},
        window.BlockUtils.angleUnitSchemaField(isCustom),
        { key:'simplifyFractions', label:'Term vereinfachen', labelKey:'block.numeric-input.field.simplifyFractions.label', type:'boolean',
          help:'Aktiv: Studierende müssen den gekürzten Bruch eingeben. „10/20" wird als falsch gewertet, „1/2" ist korrekt. Aus: alle äquivalenten Eingaben werden akzeptiert.', helpKey:'block.numeric-input.field.simplifyFractions.help' },
        { key:'integerAnswers', label:'Nur ganzzahlige Lösungen', labelKey:'block.numeric-input.field.integerAnswers.label', type:'boolean',
          help:'Es werden nur Aufgaben gestellt, deren Lösungen (alle Antwortfelder) ganze Zahlen sind.', helpKey:'block.numeric-input.field.integerAnswers.help' },
        { key:'allowImpossible', label:'Unlösbare Aufgaben zulassen (Antwort „X“)', labelKey:'block.numeric-input.field.allowImpossible.label', type:'boolean',
          help:'Hat eine Formel für die gezogenen Werte kein Ergebnis (z. B. Wurzel aus Negativem, Division durch 0), wird die Aufgabe trotzdem gestellt. Richtig ist dann die Eingabe „X“.', helpKey:'block.numeric-input.field.allowImpossible.help' },
        // Scoring
        { type:'section', label:'Bewertung', labelKey:'block.numeric-input.field.sectionScoring.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte', labelKey:'block.numeric-input.field.maxPoints.label', type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;
      const locale = (u && u.getLocale && u.getLocale()) || 'de';
      const activeConfig = numericPresetConfig(config, locale);
      const unitStr = u.l(activeConfig.unit) || '';
      const titleStr = u.l(activeConfig.blockTitle);
      const blockTol = Number(activeConfig.tolerance) || 0.01;
      // Answer fields: #1 is the main formula/unit/prefix, then any
      // additional fields (ones without a formula are skipped).
      const answers = [{
        prefix: u.l(activeConfig.answerPrefix) || '',
        formula: activeConfig.formula || '0',
        unit: unitStr,
        tolerance: blockTol
      }].concat((activeConfig.extraAnswers || [])
        .filter(a => a && String(a.formula || '').trim())
        .map(a => {
          const tol = Number(a.tolerance);
          return {
            prefix: u.l(a.prefix) || '',
            formula: a.formula,
            unit: u.l(a.unit) || '',
            tolerance: (a.tolerance === '' || a.tolerance == null || !Number.isFinite(tol)) ? blockTol : tol
          };
        }));
      // Row layout (prefix · input · unit) as soon as there is more than one
      // field or a prefix; otherwise the original single-field card.
      const multi = answers.length > 1 || !!answers[0].prefix;

      const ui = u.questionCard(host, {
        h3: titleStr || u.t('common.task'),
        qBoxTitle: u.t('common.question'),
        inputLabel: (unitStr && !multi)
          ? u.t('block.numeric-input.answerWithUnit', { unit: unitStr })
          : u.t('common.answer'),
        inputPlaceholder: u.t(activeConfig.allowImpossible ? 'block.numeric-input.answerPlaceholderX' : 'block.numeric-input.answerPlaceholder')
      });
      const { qText, inp, checkBtn, newBtn, fb } = ui;
      answers[0].input = inp;
      if(multi){
        const grp = inp.parentElement;
        const rows = document.createElement('div');
        rows.className = 'ni-answer-rows';
        answers.forEach((a, i) => {
          const row = document.createElement('div');
          row.className = 'ni-answer-row';
          if(a.prefix){
            const p = document.createElement('span');
            p.className = 'ni-prefix';
            p.textContent = a.prefix;
            row.appendChild(p);
          }
          let field = inp;
          if(i > 0){
            field = document.createElement('input');
            field.type = 'text';
            field.className = 'text-input';
            field.placeholder = inp.placeholder;
            a.input = field;
          }
          row.appendChild(field);
          if(a.unit){
            const un = document.createElement('span');
            un.className = 'ni-unit';
            un.textContent = a.unit;
            row.appendChild(un);
          }
          rows.appendChild(row);
        });
        grp.appendChild(rows);
        u.renderMath(rows);
      }

      function genVars(){
        const vars = {};
        (activeConfig.variables || []).forEach(v => {
          const min = Number(v.min), max = Number(v.max);
          let val = min + Math.random() * (max - min);
          if(v.integer) val = Math.round(val);
          else val = u.roundVarValue(val, false, v, activeConfig);
          vars[v.name] = val;
        });
        return u.withGlobalVars(vars, activeConfig.variables);
      }
      // Shared with the composition block (utils.fillMathTemplate): keeps {}
      // inside $…$, shows clean fractions, wraps negatives after operators.
      const varFormats = u.varFormats(activeConfig.variables, activeConfig);
      const fillTemplate = (tpl, vars) => u.fillMathTemplate(tpl, vars, varFormats);
      function sameInstance(a, b){
        return !!a && !!b && JSON.stringify(a.vars || {}) === JSON.stringify(b.vars || {}) &&
          JSON.stringify(a.expected) === JSON.stringify(b.expected);
      }
      // Valid = finite real number (no NaN/Infinity).
      function isValidExpected(e){
        return typeof e === 'number' && Number.isFinite(e);
      }
      const integerOnly = !!activeConfig.integerAnswers;
      const allowImpossible = !!activeConfig.allowImpossible;
      // Expected value per answer field; null = no valid result (impossible,
      // e.g. sqrt of a negative or division by 0).
      function evalAll(vars){
        return answers.map(a => {
          const r = u.safeMathExpr(u.applyAngleUnit(a.formula || '0', activeConfig.angleUnit), vars);
          return isValidExpected(r) ? r : null;
        });
      }
      const isWhole = v => Math.abs(v - Math.round(v)) < 1e-9;
      // A task is usable if every field has a valid result (whole-numbered
      // when "Nur ganzzahlige Lösungen" is on), or, with "Unlösbar = X" on,
      // no result at all; those fields are then answered with X.
      function acceptable(list){
        return list.every(e => e == null ? allowImpossible : (!integerOnly || isWhole(e)));
      }
      function chooseNew(showMsg){
        // Whole-number results can be rare, so search harder for them.
        const MAX_TRIES = integerOnly ? 2000 : 200;
        let vars = null, expected = null;
        let attempts = 0;
        while(attempts < MAX_TRIES){
          vars = genVars();
          expected = evalAll(vars);
          if(acceptable(expected)) break;
          attempts++;
        }
        if(!acceptable(expected)){
          // No usable combination (formula always fails, or never whole).
          fb.bad(u.t(integerOnly ? 'block.numeric-input.feedback.notGeneratableInteger' : 'block.numeric-input.feedback.notGeneratable'));
          return;
        }
        // Snap whole results so 2.9999999 displays and grades as 3.
        if(integerOnly) expected = expected.map(e => e == null ? e : Math.round(e));
        // Prefer a different instance than before, but never sacrifice validity.
        let next = { vars, expected };
        for(let i = 0; current && sameInstance(next, current) && i < 30; i++){
          const tryVars = genVars();
          let tryExp = evalAll(tryVars);
          if(!acceptable(tryExp)) continue;
          if(integerOnly) tryExp = tryExp.map(e => e == null ? e : Math.round(e));
          vars = tryVars; expected = tryExp; next = { vars, expected };
        }
        current = next;
        answers.forEach(a => {
          a.input.value = '';
          a.input.classList.remove('ni-ok', 'ni-bad');
        });
        qText.textContent = fillTemplate(u.l(activeConfig.questionTemplate), vars);
        u.renderMath(qText);
        if(showMsg) fb.neutral(u.t('block.numeric-input.feedback.newTask'));
      }
      const isX = s => allowImpossible && /^\s*x\s*$/i.test(String(s || ''));
      function grade(){
        if(!current || !current.expected){ fb.bad(u.t('block.numeric-input.feedback.solutionUnavailable')); return; }
        // 'X' = "impossible" answer (only when allowed); otherwise a number.
        const gots = answers.map(a => isX(a.input.value) ? 'X' : u.parseNum(a.input.value));
        if(gots.some(g => g == null)){
          fb.bad(u.t(allowImpossible ? 'block.numeric-input.feedback.enterValidNumberOrX' : 'block.numeric-input.feedback.enterValidNumber'));
          return;
        }
        // simplifyFractions: when on, an unsimplified fraction like "10/20"
        // is rejected even though its numeric value matches the expected one.
        if(activeConfig.simplifyFractions !== false){
          const unsimplified = answers.some(a => {
            const fracParts = parseFractionInput(a.input.value);
            return fracParts && !isFractionSimplified(fracParts.num, fracParts.den);
          });
          if(unsimplified){
            fb.bad(u.t('block.numeric-input.feedback.needSimplifiedFraction'));
            api.reportScore(0);
            return;
          }
        }
        const maxPts = activeConfig.maxPoints || 1;
        const ok = answers.map((a, i) => {
          const exp = current.expected[i];
          if(exp == null) return gots[i] === 'X';
          return gots[i] !== 'X' && u.nearlyEqual(gots[i], exp, a.tolerance);
        });
        if(multi) answers.forEach((a, i) => {
          a.input.classList.toggle('ni-ok', ok[i]);
          a.input.classList.toggle('ni-bad', !ok[i]);
        });
        const nOk = ok.filter(Boolean).length;
        if(nOk === answers.length){
          const solutionText = answers.map((a, i) => {
            const exp = current.expected[i];
            if(exp == null) return (multi && a.prefix ? a.prefix + ' ' : '') + u.t('block.numeric-input.impossibleSolution');
            return (multi && a.prefix ? a.prefix + ' ' : '') + u.formatSolution(exp) + (a.unit ? ' ' + a.unit : '');
          }).join('; ');
          fb.ok(u.t('block.numeric-input.feedback.correctWithSolution', { solution: solutionText }));
          api.reportScore(maxPts);
        } else if(nOk > 0){
          // Partial credit: equal share per correct field.
          const pts = Math.round(maxPts * nOk / answers.length * 100) / 100;
          fb.neutral(u.t('block.numeric-input.feedback.partial', { n: nOk, total: answers.length, pts, max: maxPts }));
          api.reportScore(pts);
        } else {
          fb.bad(u.t('common.wrong'));
          api.reportScore(0);
        }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', () => chooseNew(true));
      u.regenPolicy(newBtn, activeConfig, api);

      chooseNew(false);
      api.initScore(activeConfig.maxPoints || 1);
      return {
        getVars: () => (current && current.vars) || {},
        showSolution(){
          if(!current || !current.expected) return;
          answers.forEach((a, i) => {
            const e = current.expected[i];
            a.input.value = e == null ? 'X' : u.formatSolution(e);
            if(multi) a.input.classList.add('ni-ok');
          });
          fb.ok(u.t('utils.resume.solved'));
        }
      };
    },
    preview(host, config){
      const BU = window.BlockUtils;
      const locale = (BU && BU.getLocale && BU.getLocale()) || 'de';
      const activeConfig = numericPresetConfig(config, locale);
      const previewUnit = BU.l(activeConfig.unit) || '';
      const previewFormula = BU.l(activeConfig.formula) || '';
      const previewTemplate = BU.l(activeConfig.questionTemplate) || '';
      // Deterministic sample so the preview is stable across renders.
      const sample = Object.assign({ a: 7, b: 3, p: 20, g: 150, x: 4, y: 3 }, BU.globalVarValues());
      const questionText = (previewTemplate || BU.t('block.numeric-input.preview.taskPlaceholder'))
        .replace(/\{(\w+)\}/g, (_, name) => (sample[name] != null ? sample[name] : '?'));
      // Evaluate with the same sample so the solution hint shows a number.
      let solution = null;
      if(previewFormula){
        try {
          solution = BU.safeMathExpr(BU.applyAngleUnit(previewFormula, activeConfig.angleUnit), sample);
          if(typeof solution === 'number') solution = Math.round(solution * 100) / 100;
        } catch{}
      }
      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3');
      h3.textContent = BU.t('common.question');
      card.appendChild(h3);
      const q = document.createElement('p');
      q.textContent = questionText;
      card.appendChild(q);
      // One row per answer field: [prefix] input [unit].
      const rowsSpec = [{ prefix: BU.l(activeConfig.answerPrefix) || '', unit: previewUnit }]
        .concat((activeConfig.extraAnswers || []).filter(a => a && String(a.formula || '').trim())
          .map(a => ({ prefix: BU.l(a.prefix) || '', unit: BU.l(a.unit) || '' })));
      rowsSpec.forEach(rs => {
        const inpRow = document.createElement('div');
        inpRow.className = 'bp-input-row';
        if(rs.prefix){
          const p = document.createElement('span');
          p.className = 'bp-unit';
          p.textContent = rs.prefix;
          inpRow.appendChild(p);
        }
        const inp = document.createElement('div');
        inp.className = 'bp-input';
        inp.textContent = BU.t('block.numeric-input.preview.enterNumber');
        inpRow.appendChild(inp);
        if(rs.unit){
          const u = document.createElement('span');
          u.className = 'bp-unit';
          u.textContent = rs.unit;
          inpRow.appendChild(u);
        }
        card.appendChild(inpRow);
      });
      const btn = document.createElement('span');
      btn.textContent = BU.t('common.check');
      btn.className = 'bp-btn';
      card.appendChild(btn);
      if(solution != null){
        const hint = document.createElement('div');
        hint.className = 'bp-hint';
        hint.innerHTML = '<div class="bp-hint-title">' + BU.t('block.numeric-input.preview.exampleSolutionTitle') + '</div>' +
          '<div class="bp-hint-body">' + previewFormula + ' = ' + solution +
          (previewUnit ? ' ' + previewUnit : '') + '</div>';
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
    // Strip German and English connector words.
    s = s.replace(/\b(Berechnen Sie|Berechne|Was ist|Wie viel ist|Wieviel ist|Bestimmen Sie|Bestimme|Gib an|Bestimme den Wert von|Geben Sie an|Compute|Calculate|Determine|Find|Solve|What is|How much is)\b/gi, ' ');
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

  function numericPresetConfig(config, locale){
    const preset = config.preset || 'custom';
    if(preset === 'custom') return config;
    const u = window.BlockUtils || {};
    const loc = locale || (u.getLocale && u.getLocale()) || 'de';
    const en = loc === 'en';
    const base = Object.assign({}, config, { tolerance: config.tolerance || 0.01, unit: '' });
    const vInt = (name, min, max) => ({name, min, max, integer:true});
    const vDec = (name, min, max) => ({name, min, max, integer:false});
    switch(preset){
      case 'addition':
        return Object.assign(base, {questionTemplate: en ? 'Compute {a} + {b}.' : 'Berechnen Sie {a} + {b}.', variables:[vInt('a',1,60), vInt('b',1,60)], formula:'a + b'});
      case 'subtraction':
        return Object.assign(base, {questionTemplate: en ? 'Compute {a} - {b}.' : 'Berechnen Sie {a} - {b}.', variables:[vInt('a',20,100), vInt('b',1,20)], formula:'a - b'});
      case 'multiplication':
        return Object.assign(base, {questionTemplate: en ? 'Compute {a} · {b}.' : 'Berechnen Sie {a} · {b}.', variables:[vInt('a',2,12), vInt('b',2,12)], formula:'a * b'});
      case 'division':
        return Object.assign(base, {questionTemplate: en ? 'Compute {a} : {b}.' : 'Berechnen Sie {a} : {b}.', variables:[vInt('a',20,120), vInt('b',2,12)], formula:'a / b', tolerance:0.05});
      case 'percent':
        return Object.assign(base, {questionTemplate: en ? 'Compute {p}% of {g}.' : 'Berechnen Sie {p}% von {g}.', variables:[vInt('p',5,40), vInt('g',20,300)], formula:'g * p / 100'});
      case 'pythagoras':
        return Object.assign(base, {questionTemplate: en
          ? 'A right triangle has legs {a} and {b}. Compute the hypotenuse.'
          : 'Ein rechtwinkliges Dreieck hat Katheten {a} und {b}. Berechnen Sie die Hypotenuse.',
          variables:[vInt('a',3,12), vInt('b',4,16)], formula:'sqrt(a^2 + b^2)', tolerance:0.05});
      case 'rectangle-area':
        return Object.assign(base, {questionTemplate: en
          ? 'A rectangle is {a} cm long and {b} cm wide. Compute the area.'
          : 'Ein Rechteck ist {a} cm lang und {b} cm breit. Berechnen Sie die Fläche.',
          variables:[vInt('a',2,30), vInt('b',2,20)], formula:'a * b', unit:'cm²'});
      case 'circle-area':
        return Object.assign(base, {questionTemplate: en
          ? 'A circle has radius {r} cm. Compute the area.'
          : 'Ein Kreis hat den Radius {r} cm. Berechnen Sie die Fläche.',
          variables:[vInt('r',1,12)], formula:'pi * r^2', tolerance:0.1, unit:'cm²'});
      case 'ohm':
        return Object.assign(base, {questionTemplate: en
          ? 'A current of {i} A flows through a resistor of {r} Ω. Compute the voltage.'
          : 'An einem Widerstand von {r} Ω fließt ein Strom von {i} A. Berechnen Sie die Spannung.',
          variables:[vInt('r',5,200), vDec('i',0.1,3)], formula:'r * i', tolerance:0.1, unit:'V'});
      default:
        return config;
    }
  }
})();
