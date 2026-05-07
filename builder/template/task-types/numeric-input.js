(function(){
  'use strict';
  TaskTypes.register('numeric-input', {
    label: 'Numerische Eingabe',
    description: 'Freie Frage mit numerischer Lösung; Variablen können aus Zufallsbereichen erzeugt werden.',
    category: 'Allgemein',
    defaultConfig(){
      return {
        intro: 'Berechnen Sie das Ergebnis der untenstehenden Aufgabe.',
        noteTitle: 'Hinweis',
        noteHtml: 'Antwort als Dezimalzahl. Punkt oder Komma als Trennzeichen.',
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
        { key:'intro', label:'Aufgabentext (HTML)', type:'textarea', rows:2 },
        { key:'noteTitle', label:'Hinweisbox-Titel', type:'text' },
        { key:'noteHtml', label:'Hinweisbox-Inhalt (HTML)', type:'textarea', rows:2 },
        { key:'questionTemplate', label:'Frage-Vorlage (Variablen als {name})', type:'textarea', rows:2 },
        { key:'variables', label:'Variablen', type:'list', itemLabel:'Variable',
          itemSchema:[
            { key:'name', label:'Name', type:'text', placeholder:'a' },
            { key:'min', label:'Min', type:'number', step:'any' },
            { key:'max', label:'Max', type:'number', step:'any' },
            { key:'integer', label:'Nur Ganzzahl', type:'boolean' }
          ]},
        { key:'formula', label:'Lösungs-Formel (Variablen verwenden, sin/cos/sqrt etc. erlaubt)', type:'text', placeholder:'sqrt(a^2 + b^2)' },
        { key:'tolerance', label:'Toleranz', type:'number', step:'any' },
        { key:'unit', label:'Einheit (optional, z. B. m/s)', type:'text' },
        { key:'maxPoints', label:'Punkte pro Aufgabe', type:'number', step:1, min:1 }
      ];
    },
    mount(container, config, taskMeta, api){
      const u = api.utils;
      const cfg = Object.assign(this.defaultConfig(), config || {});
      let current = null;
      let achieved = 0;

      const hero = u.el('section', {className:'hero-card', html:
        '<div><h2>' + escapeHtml(taskMeta.title || 'Aufgabe') + '</h2><p>' + (cfg.intro || '') + '</p></div>' +
        '<div class="note-box"><div class="note-title">' + escapeHtml(cfg.noteTitle || 'Hinweis') + '</div><div>' + (cfg.noteHtml || '') + '</div></div>'
      });
      container.appendChild(hero);

      const card = u.el('section', {className:'section-card'});
      card.appendChild(u.el('h3', {text:'Aufgabe'}));
      const qBox = u.el('div', {className:'formula-box', style:{marginBottom:'1rem'}});
      qBox.appendChild(u.el('div', {className:'formula-title', text:'Frage'}));
      const qText = u.el('div', {className:'formula-text'});
      qBox.appendChild(qText);
      card.appendChild(qBox);

      const inpRow = u.el('div', {className:'control-group control-group-compact'});
      inpRow.appendChild(u.el('label', {text:'Antwort' + (cfg.unit ? ' (' + cfg.unit + ')' : '')}));
      const inp = u.el('input', {className:'text-input', attrs:{type:'text', inputmode:'decimal', placeholder:'Zahl eingeben'}});
      inpRow.appendChild(inp);
      card.appendChild(inpRow);

      const btnRow = u.el('div', {className:'button-cluster'});
      const checkBtn = u.el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Korrektur'});
      const newBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Neu generieren'});
      const nextBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: api.isLast() ? 'Test beenden' : 'Weiter'});
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn); btnRow.appendChild(nextBtn);
      card.appendChild(btnRow);

      const fb = u.feedbackBox(card);
      container.appendChild(card);

      function genVars(){
        const vars = {};
        (cfg.variables || []).forEach(v => {
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

      function chooseNew(){
        const vars = genVars();
        const expected = u.safeMathExpr(cfg.formula || '0', vars);
        current = { vars, expected };
        achieved = 0;
        inp.value = '';
        fb.neutral('Neue Aufgabe generiert.');
        qText.textContent = fillTemplate(cfg.questionTemplate, vars);
      }

      function grade(){
        if(current.expected == null){ fb.bad('Lösung konnte nicht berechnet werden (Formel prüfen).'); return; }
        const got = u.parseNum(inp.value);
        if(got == null){ fb.bad('Bitte eine gültige Zahl eingeben.'); return; }
        if(u.nearlyEqual(got, current.expected, Number(cfg.tolerance) || 0.01)){
          achieved = cfg.maxPoints || 1;
          fb.ok('Korrekt. (Lösung: ' + (Math.round(current.expected*1000)/1000) + (cfg.unit ? ' ' + cfg.unit : '') + ')');
        } else {
          achieved = 0;
          fb.bad('Nicht korrekt.');
        }
        api.reportScore(achieved, cfg.maxPoints || 1);
      }

      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      nextBtn.addEventListener('click', () => api.goToNext());

      chooseNew();
      api.initScore(cfg.maxPoints || 1);
      return {};
    }
  });
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();
