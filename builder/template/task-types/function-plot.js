(function(){
  'use strict';
  TaskTypes.register('function-plot', {
    label: 'Funktionsplot',
    description: 'Funktion zeichnen, Funktionswert / Nullstelle / Extremum ablesen.',
    category: 'Mathematik',
    defaultConfig(){
      return {
        intro: 'Im Diagramm ist eine Funktion dargestellt. Beantworten Sie die untenstehende Frage anhand des Plots.',
        noteTitle: 'Hinweis',
        noteHtml: 'Antworten als Dezimalzahl mit Punkt oder Komma. Mehrere Lösungen mit Komma trennen.',
        functions: [
          { expr: 'x^2 - 2*x - 3', xMin: -4, xMax: 5, yMin: -6, yMax: 6,
            question: 'Bestimmen Sie f(2).', answer: '-3', tolerance: 0.05,
            answerType: 'number' }
        ],
        randomize: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'intro', label:'Aufgabentext (HTML)', type:'textarea', rows:3 },
        { key:'noteTitle', label:'Hinweisbox-Titel', type:'text' },
        { key:'noteHtml', label:'Hinweisbox-Inhalt (HTML)', type:'textarea', rows:2 },
        { key:'functions', label:'Funktions-Pool', type:'list',
          itemLabel:'Funktion', itemSchema:[
            { key:'expr', label:'f(x) = ', type:'text', placeholder:'z. B. x^2 - 2*x - 3' },
            { key:'xMin', label:'x min', type:'number', step:'any' },
            { key:'xMax', label:'x max', type:'number', step:'any' },
            { key:'yMin', label:'y min', type:'number', step:'any' },
            { key:'yMax', label:'y max', type:'number', step:'any' },
            { key:'question', label:'Frage', type:'text' },
            { key:'answer', label:'Lösung (Zahl oder kommasepariert)', type:'text', placeholder:'-1, 3' },
            { key:'tolerance', label:'Toleranz', type:'number', step:'any' },
            { key:'answerType', label:'Antwort-Typ', type:'select', options:[
              {value:'number', label:'Einzelne Zahl'},
              {value:'list', label:'Mehrere Zahlen (Komma)'}
            ]}
          ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
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

      const grid = u.el('section', {className:'content-grid'});
      const plotCard = u.el('article', {className:'section-card plot-card', html:
        '<div class="card-header"><h3>Funktionsplot</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>f(x)</span></div></div>' +
        '<div class="plot-host-wrap wide-plot-wrap"><div class="plot-host" id="fpPlotHost" role="img"></div></div>' +
        '<div class="formula-box" style="margin-top:1rem"><div class="formula-title">Frage</div><div class="formula-text" id="fpQuestion"></div></div>'
      });
      const controls = u.el('aside', {className:'section-card controls-card'});
      controls.appendChild(u.el('h3', {text:'Antwort'}));
      const inp = u.el('input', {className:'text-input', attrs:{type:'text', placeholder:'Antwort eingeben'}});
      controls.appendChild(inp);

      const btnRow = u.el('div', {className:'button-cluster', style:{marginTop:'0.8rem'}});
      const checkBtn = u.el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Korrektur'});
      const newBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Neu generieren'});
      const nextBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: api.isLast() ? 'Test beenden' : 'Weiter'});
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn); btnRow.appendChild(nextBtn);
      controls.appendChild(btnRow);

      const fb = u.feedbackBox(controls);
      grid.appendChild(plotCard); grid.appendChild(controls);
      container.appendChild(grid);

      function pickInstance(){
        const pool = cfg.functions && cfg.functions.length ? cfg.functions : [{expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5, question:'f(0)?', answer:'0', tolerance:0.01, answerType:'number'}];
        return cfg.randomize !== false ? pool[Math.floor(Math.random()*pool.length)] : pool[0];
      }

      function renderPlot(){
        const host = plotCard.querySelector('#fpPlotHost');
        const xMin = Number(current.xMin), xMax = Number(current.xMax);
        const yMin = Number(current.yMin), yMax = Number(current.yMax);
        const N = 400;
        const points = [];
        for(let i = 0; i <= N; i++){
          const x = xMin + (xMax - xMin) * (i / N);
          const y = u.safeMathExpr(current.expr, {x});
          if(y != null && y >= yMin - 5 && y <= yMax + 5) points.push([x, y]);
        }
        u.renderPlane(host, {
          width: 720, height: 420, pad: 50,
          xMin, xMax, yMin, yMax,
          gridStep: chooseGridStep(Math.max(xMax-xMin, yMax-yMin)),
          paths: [{points, stroke:'#1565ff', strokeWidth:3}]
        });
        plotCard.querySelector('#fpQuestion').textContent = current.question || '';
      }

      function chooseGridStep(range){
        const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
        const target = range / 12;
        for(const c of candidates) if(c >= target) return c;
        return 100;
      }

      function chooseNew(){
        current = pickInstance();
        achieved = 0;
        inp.value = '';
        fb.neutral('Neue Aufgabe generiert.');
        renderPlot();
      }

      function grade(){
        const tol = Number(current.tolerance) || 0.05;
        if(current.answerType === 'list'){
          const expected = String(current.answer || '').split(',').map(s => u.parseNum(s)).filter(v => v != null && Number.isFinite(v));
          const got = String(inp.value || '').split(',').map(s => u.parseNum(s)).filter(v => v != null && Number.isFinite(v));
          if(got.length !== expected.length){ fb.bad('Es werden ' + expected.length + ' Wert(e) erwartet, ' + got.length + ' eingegeben.'); return; }
          const exp = expected.slice().sort((a,b)=>a-b);
          const g = got.slice().sort((a,b)=>a-b);
          const ok = exp.every((v,i) => u.nearlyEqual(v, g[i], tol));
          if(ok){ achieved = cfg.maxPoints || 1; fb.ok('Korrekt.'); } else { achieved = 0; fb.bad('Nicht alle Werte passen.'); }
        } else {
          const expected = u.parseNum(current.answer);
          const got = u.parseNum(inp.value);
          if(got == null){ fb.bad('Bitte eine gültige Zahl eingeben.'); return; }
          if(u.nearlyEqual(got, expected, tol)){ achieved = cfg.maxPoints || 1; fb.ok('Korrekt.'); } else { achieved = 0; fb.bad('Wert noch nicht richtig.'); }
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
