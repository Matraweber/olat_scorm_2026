(function(){
  'use strict';
  Blocks.register('numeric-input', {
    label: 'Numerische Eingabe',
    description: 'Frage mit numerischer Lösung. Variablen aus Zufallsbereichen + Formel erzeugen die Lösung.',
    category: 'Frage',
    icon: '#',
    graded: true,
    defaultConfig(){
      return {
        questionTemplate: 'Berechnen Sie {a} + {b}.',
        variables: [
          { name:'a', min:1, max:9, integer:true },
          { name:'b', min:1, max:9, integer:true }
        ],
        formula: 'a + b',
        tolerance: 0.01,
        unit: '',
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'questionTemplate', label:'Frage-Vorlage (Variablen als {name})', type:'math-textarea', rows:2 },
        { key:'variables', label:'Variablen', type:'list', itemLabel:'Variable',
          itemSchema:[
            { key:'name', label:'Name', type:'text' },
            { key:'min', label:'Min', type:'number', step:'any' },
            { key:'max', label:'Max', type:'number', step:'any' },
            { key:'integer', label:'Nur Ganzzahl', type:'boolean' }
          ]},
        { key:'formula', label:'Lösungs-Formel', type:'formula-text', placeholder:'sqrt(a^2 + b^2)' },
        { key:'tolerance', label:'Toleranz', type:'number', step:'any' },
        { key:'unit', label:'Einheit (optional)', type:'text' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;

      const ui = u.questionCard(host, {
        h3: 'Aufgabe',
        qBoxTitle: 'Frage',
        inputLabel: 'Antwort' + (config.unit ? ' (' + config.unit + ')' : ''),
        inputPlaceholder: 'Zahl eingeben'
      });
      const { qText, inp, checkBtn, newBtn, fb } = ui;

      function genVars(){
        const vars = {};
        (config.variables || []).forEach(v => {
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
      function chooseNew(showMsg){
        const vars = genVars();
        const expected = u.safeMathExpr(config.formula || '0', vars);
        current = { vars, expected };
        inp.value = '';
        qText.textContent = fillTemplate(config.questionTemplate, vars);
        if(showMsg) fb.neutral('Neue Aufgabe generiert.');
      }
      function grade(){
        if(current.expected == null){ fb.bad('Lösung konnte nicht berechnet werden (Formel prüfen).'); return; }
        const got = u.parseNum(inp.value);
        if(got == null){ fb.bad('Bitte eine gültige Zahl eingeben.'); return; }
        if(u.nearlyEqual(got, current.expected, Number(config.tolerance) || 0.01)){
          fb.ok('Korrekt. (Lösung: ' + (Math.round(current.expected*1000)/1000) + (config.unit ? ' ' + config.unit : '') + ')');
          api.reportScore(config.maxPoints || 1);
        } else {
          fb.bad('Nicht korrekt.');
          api.reportScore(0);
        }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', () => chooseNew(true));

      chooseNew(false);
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const wrap = u.tagPreview(host, { icon:'#', label:'Numerische Eingabe' });
      const q = document.createElement('div');
      q.style.cssText = 'color:#0f2d44; margin-bottom:0.5rem; font-family:"Courier New",monospace; line-height:1.4;';
      q.textContent = config.questionTemplate || '(Aufgabe)';
      wrap.appendChild(q);
      if(config.formula){
        const f = document.createElement('div');
        f.style.cssText = 'font-size:0.72rem; color:#5d6872; font-family:"Courier New",monospace; margin-bottom:0.4rem;';
        f.textContent = 'Lösung = ' + config.formula + (config.unit ? ' [' + config.unit + ']' : '');
        wrap.appendChild(f);
      }
      const inp = document.createElement('div');
      inp.style.cssText = 'border:1px solid #c6d1d8; border-radius:6px; padding:0.4rem 0.6rem; background:#f5f8fa; color:#888; font-size:0.8rem;';
      inp.textContent = '⏤ Zahl eingeben';
      wrap.appendChild(inp);
    }
  });
})();
