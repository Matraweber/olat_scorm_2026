(function(){
  'use strict';
  Blocks.register('vector-question', {
    label: 'Vektor 2D ablesen',
    description: '2D-Vektor: Komponenten, Betrag, Winkel ablesen.',
    category: 'Frage',
    icon: '→',
    graded: true,
    defaultConfig(){
      return {
        pool: [{x:3, y:2}, {x:-1, y:3}, {x:-2, y:-2}, {x:4, y:-1}, {x:0, y:3}, {x:-3, y:0}],
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
        { key:'pool', label:'Vektor-Pool', type:'list', itemLabel:'Vektor',
          itemSchema:[
            { key:'x', label:'x', type:'number', step:'any' },
            { key:'y', label:'y', type:'number', step:'any' }
          ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
        { key:'fields', label:'Abgefragte Felder', type:'group', schema:[
          { key:'x', label:'x', type:'boolean' },
          { key:'y', label:'y', type:'boolean' },
          { key:'mag', label:'|v|', type:'boolean' },
          { key:'angle', label:'Winkel', type:'boolean' }
        ]},
        { key:'angleUnit', label:'Winkel-Einheit', type:'select', options:[
          {value:'rad', label:'Radiant'}, {value:'deg', label:'Grad'}
        ]},
        { key:'tolerances', label:'Toleranzen', type:'group', schema:[
          { key:'x', label:'x', type:'number', step:'any' },
          { key:'y', label:'y', type:'number', step:'any' },
          { key:'mag', label:'|v|', type:'number', step:'any' },
          { key:'angle', label:'Winkel', type:'number', step:'any' }
        ]},
        { key:'plotRange', label:'Plot-Bereich (±)', type:'number', step:'any' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const fields = Object.assign({x:true,y:true,mag:true,angle:true}, config.fields || {});
      const tol = Object.assign({x:0.01,y:0.01,mag:0.06,angle:0.06}, config.tolerances || {});
      let current = null;

      const grid = document.createElement('section'); grid.className = 'content-grid';
      const plotCard = document.createElement('article'); plotCard.className = 'section-card plot-card';
      plotCard.innerHTML = '<div class="card-header"><h3>Vektor-Plot</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>v</span></div></div><div class="plot-host-wrap square-plot-wrap"><div class="plot-host" id="' + api.blockId + '_plot" role="img"></div></div>';
      const controls = document.createElement('aside'); controls.className = 'section-card controls-card';
      controls.appendChild(Object.assign(document.createElement('h3'), {textContent:'Eingabe'}));
      const stack = document.createElement('div'); stack.className = 'input-stack';
      controls.appendChild(stack);
      const inputs = {};
      function addInput(key, label, placeholder){
        const grp = document.createElement('div'); grp.className = 'control-group control-group-compact';
        const lbl = document.createElement('label'); lbl.textContent = label; lbl.htmlFor = api.blockId + '_' + key;
        grp.appendChild(lbl);
        const inp = document.createElement('input'); inp.id = api.blockId + '_' + key;
        inp.type = 'text'; inp.inputMode = 'decimal'; inp.className = 'text-input'; inp.placeholder = placeholder;
        grp.appendChild(inp); stack.appendChild(grp); inputs[key] = inp;
      }
      if(fields.x) addInput('x', 'x', 'z. B. 3');
      if(fields.y) addInput('y', 'y', 'z. B. 2');
      if(fields.mag) addInput('mag', '|v|', 'z. B. 3.61');
      if(fields.angle) addInput('angle', 'α' + (config.angleUnit==='deg'?' (Grad)':' (rad)'), config.angleUnit==='deg' ? 'z. B. 33.7' : 'z. B. pi/6');

      const btnRow = document.createElement('div'); btnRow.className = 'button-cluster';
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent='Korrektur';
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent='Neu generieren';
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      controls.appendChild(btnRow);
      const fb = u.feedbackBox(controls);
      grid.appendChild(plotCard); grid.appendChild(controls);
      host.appendChild(grid);

      function pickInstance(){
        const pool = config.pool && config.pool.length ? config.pool : [{x:1,y:1}];
        const item = config.randomize !== false ? pool[Math.floor(Math.random()*pool.length)] : pool[0];
        const x = Number(item.x), y = Number(item.y);
        const mag = Math.sqrt(x*x + y*y);
        const angleRad = u.normalizeAngle(Math.atan2(y, x));
        return { x, y, mag, angleRad, angle: config.angleUnit === 'deg' ? angleRad * 180 / Math.PI : angleRad };
      }
      function renderPlot(){
        const hostP = plotCard.querySelector('#' + api.blockId + '_plot');
        const R = config.plotRange || 5.5;
        u.renderPlane(hostP, {
          xMin:-R, xMax:R, yMin:-R, yMax:R,
          xLabel:'x', yLabel:'y', gridStep: 1,
          lines: [{x1:0,y1:0,x2:current.x,y2:current.y, stroke:'#1565ff', strokeWidth:4}],
          points: [{x:current.x, y:current.y, label:'v'}]
        });
      }
      function chooseNew(){
        current = pickInstance();
        Object.values(inputs).forEach(i => i.value = '');
        fb.neutral('Neue Aufgabe generiert.');
        renderPlot();
      }
      function grade(){
        const parts = []; let allOk = true;
        function check(key, parser, expected, tolerance, label){
          if(!fields[key]) return;
          const v = parser(inputs[key].value);
          if(v == null || !Number.isFinite(v)){ allOk = false; parts.push(label + ' fehlt.'); return; }
          let ok;
          if(key === 'angle' && config.angleUnit !== 'deg') ok = u.angleEqual(v, expected, tolerance);
          else if(key === 'angle') ok = Math.abs(((v - expected + 540) % 360) - 180) <= tolerance;
          else ok = u.nearlyEqual(v, expected, tolerance);
          parts.push(ok ? (label + ' richtig.') : (label + ' noch nicht richtig.'));
          if(!ok) allOk = false;
        }
        check('x', u.parseNum, current.x, tol.x, 'x');
        check('y', u.parseNum, current.y, tol.y, 'y');
        check('mag', u.parseNum, current.mag, tol.mag, '|v|');
        check('angle', config.angleUnit === 'deg' ? u.parseNum : u.parseAngle, current.angle, tol.angle, 'Winkel');
        if(allOk){ fb.ok('Korrekt.'); api.reportScore(config.maxPoints || 1); }
        else { fb.bad(parts.join(' ')); api.reportScore(0); }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      chooseNew();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const v = (config.pool || [])[0] || {x:3, y:2};
      const R = config.plotRange || 5.5;
      const W = 300, H = 220, P = 22;
      const sx = x => P + ((x + R)/(2*R))*(W - 2*P);
      const sy = y => H - P - ((y + R)/(2*R))*(H - 2*P);
      const ns = 'http://www.w3.org/2000/svg';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.4rem 0.7rem; font-size:0.78rem; display:flex; flex-direction:column; height:100%; gap:0.25rem; overflow:hidden;';
      const tag = document.createElement('div'); tag.textContent = '→  Vektor 2D ablesen'; tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700;';
      wrap.appendChild(tag);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.cssText = 'flex:1; min-height:0; max-height:240px; display:block; margin:0 auto; background:#fff; border:1px solid #e2e8ed; border-radius:6px;';
      [[P,sy(0),W-P,sy(0)],[sx(0),P,sx(0),H-P]].forEach(c => {
        const l = document.createElementNS(ns,'line');
        l.setAttribute('x1',c[0]); l.setAttribute('y1',c[1]); l.setAttribute('x2',c[2]); l.setAttribute('y2',c[3]);
        l.setAttribute('stroke','#003b5c'); l.setAttribute('stroke-width',1.5); svg.appendChild(l);
      });
      // Vector with arrow head
      const vec = document.createElementNS(ns,'line');
      vec.setAttribute('x1',sx(0)); vec.setAttribute('y1',sy(0)); vec.setAttribute('x2',sx(v.x)); vec.setAttribute('y2',sy(v.y));
      vec.setAttribute('stroke','#1565ff'); vec.setAttribute('stroke-width',3); vec.setAttribute('marker-end','url(#vmAh)');
      svg.appendChild(vec);
      // arrow marker
      const defs = document.createElementNS(ns,'defs');
      const m = document.createElementNS(ns,'marker');
      m.setAttribute('id','vmAh'); m.setAttribute('viewBox','0 0 10 10'); m.setAttribute('refX','8'); m.setAttribute('refY','5');
      m.setAttribute('markerWidth','7'); m.setAttribute('markerHeight','7'); m.setAttribute('orient','auto');
      const path = document.createElementNS(ns,'path');
      path.setAttribute('d','M0,0 L10,5 L0,10 z'); path.setAttribute('fill','#1565ff');
      m.appendChild(path); defs.appendChild(m); svg.appendChild(defs);
      const lbl = document.createElementNS(ns,'text'); lbl.textContent='v'; lbl.setAttribute('x',sx(v.x)+8); lbl.setAttribute('y',sy(v.y)-6); lbl.setAttribute('font-size',12); lbl.setAttribute('fill','#003b5c'); lbl.setAttribute('font-weight',700); svg.appendChild(lbl);
      wrap.appendChild(svg);
      host.appendChild(wrap);
    }
  });
})();
