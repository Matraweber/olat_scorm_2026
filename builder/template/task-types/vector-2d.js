(function(){
  'use strict';
  TaskTypes.register('vector-2d', {
    label: 'Vektor 2D',
    description: '2D-Vektor: Komponenten, Betrag, Winkel ablesen.',
    category: 'Mathematik',
    defaultConfig(){
      return {
        intro: 'Im Diagramm ist ein Vektor dargestellt. Lesen Sie die geforderten Größen ab.',
        noteTitle: 'Hinweis',
        noteHtml: 'Der Winkel wird relativ zur positiven x-Achse gemessen. Eingabe in Grad oder Radiant - bitte unten auswählen.',
        pool: [
          {x:3, y:2}, {x:-1, y:3}, {x:-2, y:-2}, {x:4, y:-1}, {x:0, y:3}, {x:-3, y:0}
        ],
        randomize: true,
        fields: { x: true, y: true, mag: true, angle: true },
        angleUnit: 'rad',
        tolerances: { x: 0.01, y: 0.01, mag: 0.06, angle: 0.06 },
        plotRange: 5.5,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'intro', label:'Aufgabentext (HTML)', type:'textarea', rows:3 },
        { key:'noteTitle', label:'Hinweisbox-Titel', type:'text' },
        { key:'noteHtml', label:'Hinweisbox-Inhalt (HTML)', type:'textarea', rows:2 },
        { key:'pool', label:'Vektor-Pool', type:'list', itemLabel:'Vektor',
          itemSchema:[
            { key:'x', label:'x', type:'number', step:'any' },
            { key:'y', label:'y', type:'number', step:'any' }
          ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
        { key:'fields', label:'Abgefragte Felder', type:'group', schema:[
          { key:'x', label:'x-Komponente', type:'boolean' },
          { key:'y', label:'y-Komponente', type:'boolean' },
          { key:'mag', label:'Betrag |v|', type:'boolean' },
          { key:'angle', label:'Winkel α', type:'boolean' }
        ]},
        { key:'angleUnit', label:'Winkel-Einheit', type:'select', options:[
          {value:'rad', label:'Radiant'},
          {value:'deg', label:'Grad'}
        ]},
        { key:'tolerances', label:'Toleranzen', type:'group', schema:[
          { key:'x', label:'x', type:'number', step:'any' },
          { key:'y', label:'y', type:'number', step:'any' },
          { key:'mag', label:'|v|', type:'number', step:'any' },
          { key:'angle', label:'Winkel (in eingestellter Einheit)', type:'number', step:'any' }
        ]},
        { key:'plotRange', label:'Plot-Bereich (±)', type:'number', step:'any' },
        { key:'maxPoints', label:'Punkte pro Aufgabe', type:'number', step:1, min:1 }
      ];
    },
    mount(container, config, taskMeta, api){
      const u = api.utils;
      const cfg = Object.assign(this.defaultConfig(), config || {});
      const fields = Object.assign({x:true,y:true,mag:true,angle:true}, cfg.fields || {});
      const tol = Object.assign({x:0.01,y:0.01,mag:0.06,angle:0.06}, cfg.tolerances || {});
      let current = null;
      let achieved = 0;

      const angleSuffix = cfg.angleUnit === 'deg' ? '°' : ' rad';

      const hero = u.el('section', {className:'hero-card', html:
        '<div><h2>' + escapeHtml(taskMeta.title || 'Aufgabe') + '</h2><p>' + (cfg.intro || '') + '</p></div>' +
        '<div class="note-box"><div class="note-title">' + escapeHtml(cfg.noteTitle || 'Hinweis') + '</div><div>' + (cfg.noteHtml || '') + '</div></div>'
      });
      container.appendChild(hero);

      const grid = u.el('section', {className:'content-grid'});
      const plotCard = u.el('article', {className:'section-card plot-card', html:
        '<div class="card-header"><h3>Vektor-Plot</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>v</span></div></div>' +
        '<div class="plot-host-wrap square-plot-wrap"><div class="plot-host" id="vPlotHost" role="img"></div></div>'
      });
      const controls = u.el('aside', {className:'section-card controls-card'});
      controls.appendChild(u.el('h3', {text:'Eingabe'}));
      const stack = u.el('div', {className:'input-stack'});
      controls.appendChild(stack);

      const inputs = {};
      function addInput(key, label, placeholder){
        const grp = u.el('div', {className:'control-group control-group-compact'});
        grp.appendChild(u.el('label', {text: label, attrs:{for:'v_' + key}}));
        const inp = u.el('input', {className:'text-input', attrs:{id:'v_' + key, type:'text', inputmode:'decimal', placeholder: placeholder}});
        grp.appendChild(inp);
        stack.appendChild(grp);
        inputs[key] = inp;
      }
      if(fields.x) addInput('x', 'x', 'z. B. 3');
      if(fields.y) addInput('y', 'y', 'z. B. 2');
      if(fields.mag) addInput('mag', '|v|', 'z. B. 3.61');
      if(fields.angle) addInput('angle', 'α' + (cfg.angleUnit==='deg'?' (Grad)':' (rad)'), cfg.angleUnit==='deg' ? 'z. B. 33.7' : 'z. B. pi/6');

      const btnRow = u.el('div', {className:'button-cluster'});
      const checkBtn = u.el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Korrektur'});
      const newBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Neu generieren'});
      const nextBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: api.isLast() ? 'Test beenden' : 'Weiter'});
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn); btnRow.appendChild(nextBtn);
      controls.appendChild(btnRow);

      const fb = u.feedbackBox(controls);
      grid.appendChild(plotCard); grid.appendChild(controls);
      container.appendChild(grid);

      function pickInstance(){
        const pool = cfg.pool && cfg.pool.length ? cfg.pool : [{x:1,y:1}];
        const item = cfg.randomize !== false ? pool[Math.floor(Math.random()*pool.length)] : pool[0];
        const x = Number(item.x), y = Number(item.y);
        const mag = Math.sqrt(x*x + y*y);
        const angleRad = u.normalizeAngle(Math.atan2(y, x));
        return { x, y, mag, angleRad, angle: cfg.angleUnit === 'deg' ? angleRad * 180 / Math.PI : angleRad };
      }

      function renderPlot(){
        const host = plotCard.querySelector('#vPlotHost');
        const R = cfg.plotRange || 5.5;
        u.renderPlane(host, {
          xMin:-R, xMax:R, yMin:-R, yMax:R,
          xLabel:'x', yLabel:'y', gridStep: 1,
          lines: [{x1:0,y1:0,x2:current.x,y2:current.y, stroke:'#1565ff', strokeWidth:4}],
          points: [{x:current.x, y:current.y, label:'v'}]
        });
      }

      function chooseNew(){
        current = pickInstance();
        achieved = 0;
        Object.values(inputs).forEach(i => i.value = '');
        fb.neutral('Neue Aufgabe generiert.');
        renderPlot();
      }

      function grade(){
        const parts = [];
        let allOk = true;
        function check(key, parser, expected, tolerance, label){
          if(!fields[key]) return;
          const v = parser(inputs[key].value);
          if(v == null || !Number.isFinite(v)){ allOk = false; parts.push(label + ' fehlt.'); return; }
          let ok;
          if(key === 'angle' && cfg.angleUnit !== 'deg') ok = u.angleEqual(v, expected, tolerance);
          else if(key === 'angle') ok = Math.abs(((v - expected + 540) % 360) - 180) <= tolerance;
          else ok = u.nearlyEqual(v, expected, tolerance);
          parts.push(ok ? (label + ' richtig.') : (label + ' noch nicht richtig.'));
          if(!ok) allOk = false;
        }
        check('x', u.parseNum, current.x, tol.x, 'x');
        check('y', u.parseNum, current.y, tol.y, 'y');
        check('mag', u.parseNum, current.mag, tol.mag, '|v|');
        check('angle', cfg.angleUnit === 'deg' ? u.parseNum : u.parseAngle, current.angle, tol.angle, 'Winkel');

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
