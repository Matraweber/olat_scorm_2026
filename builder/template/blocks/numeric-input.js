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
    category: 'Frage',
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
          help:'Beispiele zeigen alle Möglichkeiten des Blocks. „Manuell” für eigene Fragen.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },
        // Frage
        { type:'section', label:'Frage', key:'_sec_q' },
        { key:'questionTemplate', label:'Frage-Vorlage  (Variablen als {name})', type:'math-textarea', rows:2, showIf: isCustom,
          help:'Beispiel: „Berechnen Sie {a} + {b}.” Variablen werden beim Start zufällig belegt.' },
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
            { key:'name',    label:'Name',           type:'text',    placeholder:'z. B.  a' },
            { key:'min',     label:'von',             type:'number',  step:'any' },
            { key:'max',     label:'bis',             type:'number',  step:'any' },
            { key:'integer', label:'Nur Ganzzahlen',  type:'boolean' }
          ]},
        // Lösung
        { type:'section', label:'Lösung', key:'_sec_formula' },
        { key:'formula', label:'Lösungs-Formel', type:'formula-text', placeholder:'sqrt(a^2 + b^2)', showIf: isCustom,
          help:'Darf alle Variablen-Namen und Standardfunktionen (sqrt, sin, cos, …) enthalten.' },
        { key:'tolerance', label:'Toleranz  (±)', type:'number', step:'any',
          help:'Abweichung, die noch als korrekt gilt. 0 = exakt.' },
        { key:'unit', label:'Einheit (optional)', type:'text', placeholder:'z. B.  m/s  oder  kg' },
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
        inputPlaceholder: 'Zahl eingeben'
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
        return String(tpl || '').replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name) => {
          if(name in vars){
            const v = vars[name];
            return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
          }
          return m;
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
        if(showMsg) fb.neutral('Neue Aufgabe generiert.');
      }
      function grade(){
        if(current.expected == null){ fb.bad('Lösung konnte nicht berechnet werden (Formel prüfen).'); return; }
        const got = u.parseNum(inp.value);
        if(got == null){ fb.bad('Bitte eine gültige Zahl eingeben.'); return; }
        if(u.nearlyEqual(got, current.expected, Number(activeConfig.tolerance) || 0.01)){
          fb.ok('Korrekt. (Lösung: ' + (Math.round(current.expected*1000)/1000) + (activeConfig.unit ? ' ' + activeConfig.unit : '') + ')');
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
      const u = window.BlockUtils;
      const activeConfig = numericPresetConfig(config);
      const wrap = u.tagPreview(host, { icon:'#', label:'Numerische Eingabe' });
      const q = document.createElement('div');
      q.style.cssText = 'color:#0f2d44; margin-bottom:0.5rem; font-family:"Courier New",monospace; line-height:1.4;';
      q.textContent = activeConfig.questionTemplate || '(Aufgabe)';
      wrap.appendChild(q);
      if(activeConfig.formula){
        const f = document.createElement('div');
        f.style.cssText = 'font-size:0.72rem; color:#5d6872; font-family:"Courier New",monospace; margin-bottom:0.4rem;';
        f.textContent = 'Lösung = ' + activeConfig.formula + (activeConfig.unit ? ' [' + activeConfig.unit + ']' : '');
        wrap.appendChild(f);
      }
      const inp = document.createElement('div');
      inp.style.cssText = 'border:1px solid #c6d1d8; border-radius:6px; padding:0.4rem 0.6rem; background:#f5f8fa; color:#888; font-size:0.8rem;';
      inp.textContent = '⏤ Zahl eingeben';
      wrap.appendChild(inp);
    }
  });

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
