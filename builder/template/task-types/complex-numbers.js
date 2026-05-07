(function(){
  'use strict';
  TaskTypes.register('complex-numbers', {
    label: 'Komplexe Zahlen',
    description: 'Re(z), Im(z), |z|, φ aus einem Plot ablesen.',
    category: 'Mathematik',
    defaultConfig(){
      return {
        intro: 'Im Diagramm ist eine komplexe Zahl in der Gaußschen Zahlenebene dargestellt. Lesen Sie die geforderten Werte ab und tragen Sie sie ein.',
        noteTitle: 'Eingabehinweis',
        noteHtml: 'Re(z) und Im(z) als Dezimalzahl. Für φ sind <strong>pi</strong>-Ausdrücke wie <strong>pi/2</strong> oder <strong>3*pi/4</strong> erlaubt.',
        pool: [
          {a:1,b:1}, {a:2,b:0}, {a:0,b:2}, {a:-1,b:1}, {a:2,b:-1},
          {a:-2,b:2}, {a:-2,b:-1}, {a:1,b:-2}, {a:3,b:0}, {a:0,b:-3}
        ],
        randomize: true,
        fields: { real: true, imag: true, abs: true, arg: true },
        tolerances: { real: 0.01, imag: 0.01, abs: 0.06, arg: 0.06 },
        plotRange: 5.5,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'intro', label:'Aufgabentext (HTML erlaubt)', type:'textarea', rows:3 },
        { key:'noteTitle', label:'Hinweisbox-Titel', type:'text' },
        { key:'noteHtml', label:'Hinweisbox-Inhalt (HTML)', type:'textarea', rows:2 },
        { key:'pool', label:'Aufgaben-Pool (z = a + bi)', type:'list',
          itemLabel:'Punkt', itemSchema:[
            { key:'a', label:'Re(z) = a', type:'number', step:'any' },
            { key:'b', label:'Im(z) = b', type:'number', step:'any' }
          ] },
        { key:'randomize', label:'Zufällig aus Pool wählen (statt der Reihe nach)', type:'boolean' },
        { key:'fields', label:'Abgefragte Felder', type:'group', schema:[
          { key:'real', label:'Re(z)', type:'boolean' },
          { key:'imag', label:'Im(z)', type:'boolean' },
          { key:'abs',  label:'|z|',   type:'boolean' },
          { key:'arg',  label:'φ',     type:'boolean' }
        ]},
        { key:'tolerances', label:'Toleranzen', type:'group', schema:[
          { key:'real', label:'Re(z)', type:'number', step:'any' },
          { key:'imag', label:'Im(z)', type:'number', step:'any' },
          { key:'abs',  label:'|z|',   type:'number', step:'any' },
          { key:'arg',  label:'φ (rad)', type:'number', step:'any' }
        ]},
        { key:'plotRange', label:'Plot-Bereich (±)', type:'number', step:'any' },
        { key:'maxPoints', label:'Punkte für korrekte Antwort', type:'number', step:1, min:1 }
      ];
    },
    mount(container, config, taskMeta, api){
      const u = api.utils;
      const cfg = Object.assign(this.defaultConfig(), config || {});
      const fields = Object.assign({real:true,imag:true,abs:true,arg:true}, cfg.fields || {});
      const tol = Object.assign({real:0.01,imag:0.01,abs:0.06,arg:0.06}, cfg.tolerances || {});

      let currentTask = null;
      let achieved = 0;

      // ---- Hero card ----
      const hero = u.el('section', {className:'hero-card', html:
        '<div><h2>' + escapeHtml(taskMeta.title || 'Aufgabe') + '</h2><p>' + (cfg.intro || '') + '</p></div>' +
        '<div class="note-box"><div class="note-title">' + escapeHtml(cfg.noteTitle || 'Hinweis') + '</div><div>' + (cfg.noteHtml || '') + '</div></div>'
      });
      container.appendChild(hero);

      // ---- Content grid ----
      const grid = u.el('section', {className:'content-grid'});
      const plotCard = u.el('article', {className:'section-card plot-card', html:
        '<div class="card-header"><h3>Aufgabenplot</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>z</span></div></div>' +
        '<div class="plot-host-wrap square-plot-wrap"><div class="plot-host" id="cnPlotHost" aria-label="Aufgabenplot komplexe Zahl" role="img"></div></div>'
      });
      const controls = u.el('aside', {className:'section-card controls-card'});
      controls.appendChild(u.el('h3', {text:'Eingabe'}));
      const inputStack = u.el('div', {className:'input-stack'});
      controls.appendChild(inputStack);

      const inputs = {};
      function addInput(key, label, placeholder){
        const grp = u.el('div', {className:'control-group control-group-compact'});
        grp.appendChild(u.el('label', {text:label, attrs:{for:'cn_' + key}}));
        const inp = u.el('input', {className:'text-input', attrs:{id:'cn_' + key, type:'text', inputmode:'decimal', placeholder: placeholder}});
        grp.appendChild(inp);
        inputStack.appendChild(grp);
        inputs[key] = inp;
      }
      if(fields.real) addInput('real', 'Re(z)', 'z. B. 2');
      if(fields.imag) addInput('imag', 'Im(z)', 'z. B. -1');
      if(fields.abs)  addInput('abs',  '|z|',   'z. B. 2.24');
      if(fields.arg)  addInput('arg',  'φ',     'z. B. pi/2');

      const buttonRow = u.el('div', {className:'button-cluster'});
      const checkBtn = u.el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Korrektur'});
      const newBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Neu generieren'});
      const nextBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: api.isLast() ? 'Test beenden' : 'Weiter'});
      buttonRow.appendChild(checkBtn); buttonRow.appendChild(newBtn); buttonRow.appendChild(nextBtn);
      controls.appendChild(buttonRow);

      const fb = u.feedbackBox(controls);

      grid.appendChild(plotCard); grid.appendChild(controls);
      container.appendChild(grid);

      function pickInstance(){
        const pool = cfg.pool && cfg.pool.length ? cfg.pool : [{a:1,b:1}];
        const item = cfg.randomize !== false ? pool[Math.floor(Math.random()*pool.length)] : pool[0];
        const a = Number(item.a), b = Number(item.b);
        return { a, b, r: Math.sqrt(a*a + b*b), phi: u.normalizeAngle(Math.atan2(b,a)) };
      }

      function renderPlot(){
        const host = plotCard.querySelector('#cnPlotHost');
        const R = cfg.plotRange || 5.5;
        u.renderPlane(host, {
          xMin:-R, xMax:R, yMin:-R, yMax:R,
          xLabel:'Re', yLabel:'Im', gridStep: 1,
          lines: [
            {x1:0,y1:0,x2:currentTask.a,y2:currentTask.b, stroke:'#1565ff', strokeWidth:4},
            {x1:currentTask.a,y1:0,x2:currentTask.a,y2:currentTask.b, stroke:'#9bbdff', strokeWidth:2, dash:'5 4'},
            {x1:0,y1:currentTask.b,x2:currentTask.a,y2:currentTask.b, stroke:'#9bbdff', strokeWidth:2, dash:'5 4'}
          ],
          points: [{x:currentTask.a, y:currentTask.b, label:'z'}]
        });
      }

      function chooseNew(){
        currentTask = pickInstance();
        achieved = 0;
        Object.values(inputs).forEach(i => i.value = '');
        fb.neutral('Neue Aufgabe generiert. Tragen Sie die geforderten Werte ein.');
        renderPlot();
      }

      function grade(){
        const parts = [];
        let allOk = true;
        function check(key, parser, expected, tolerance, label){
          if(!fields[key]) return;
          const val = parser(inputs[key].value);
          if(val == null || !Number.isFinite(val)){ allOk = false; parts.push(label + ' fehlt oder ungültig.'); return; }
          let ok;
          if(key === 'arg') ok = u.angleEqual(val, expected, tolerance);
          else ok = u.nearlyEqual(val, expected, tolerance);
          parts.push(ok ? (label + ' richtig.') : (label + ' noch nicht richtig.'));
          if(!ok) allOk = false;
        }
        check('real', u.parseNum,  currentTask.a,   tol.real, 'Re(z)');
        check('imag', u.parseNum,  currentTask.b,   tol.imag, 'Im(z)');
        check('abs',  u.parseNum,  currentTask.r,   tol.abs,  '|z|');
        check('arg',  u.parseAngle,currentTask.phi, tol.arg,  'φ');

        if(allOk){
          achieved = cfg.maxPoints || 1;
          fb.ok('Korrekt. (' + achieved + ' Punkt' + (achieved===1?'':'e') + ')');
        } else {
          achieved = 0;
          fb.bad(parts.join(' '));
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
