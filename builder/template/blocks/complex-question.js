(function(){
  'use strict';
  Blocks.register('complex-question', {
    label: 'Komplexe Zahl ablesen',
    description: 'Plot in Gaußscher Zahlenebene zeigen, Re/Im/|z|/φ abfragen.',
    category: 'Frage',
    icon: 'z',
    graded: true,
    defaultConfig(){
      return {
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
        { key:'pool', label:'Aufgaben-Pool (z = a + bi)', type:'list', itemLabel:'Punkt',
          itemSchema:[
            { key:'a', label:'Re(z)', type:'number', step:'any' },
            { key:'b', label:'Im(z)', type:'number', step:'any' }
          ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
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
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const fields = Object.assign({real:true,imag:true,abs:true,arg:true}, config.fields || {});
      const tol = Object.assign({real:0.01,imag:0.01,abs:0.06,arg:0.06}, config.tolerances || {});
      let current = null;

      const grid = document.createElement('section'); grid.className = 'content-grid';
      const plotCard = document.createElement('article'); plotCard.className = 'section-card plot-card';
      plotCard.innerHTML = '<div class="card-header"><h3>Aufgabenplot</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>z</span></div></div><div class="plot-host-wrap square-plot-wrap"><div class="plot-host" id="' + api.blockId + '_plot" role="img"></div></div>';
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
        grp.appendChild(inp);
        stack.appendChild(grp); inputs[key] = inp;
      }
      if(fields.real) addInput('real', 'Re(z)', 'z. B. 2');
      if(fields.imag) addInput('imag', 'Im(z)', 'z. B. -1');
      if(fields.abs)  addInput('abs',  '|z|',   'z. B. 2.24');
      if(fields.arg)  addInput('arg',  'φ',     'z. B. pi/2');

      const btnRow = document.createElement('div'); btnRow.className = 'button-cluster';
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent='Korrektur';
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent='Neu generieren';
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      controls.appendChild(btnRow);

      const fb = u.feedbackBox(controls);
      grid.appendChild(plotCard); grid.appendChild(controls);
      host.appendChild(grid);

      function pickInstance(){
        const pool = config.pool && config.pool.length ? config.pool : [{a:1,b:1}];
        const item = config.randomize !== false ? pool[Math.floor(Math.random()*pool.length)] : pool[0];
        const a = Number(item.a), b = Number(item.b);
        return { a, b, r: Math.sqrt(a*a + b*b), phi: u.normalizeAngle(Math.atan2(b,a)) };
      }
      function renderPlot(){
        const hostP = plotCard.querySelector('#' + api.blockId + '_plot');
        const R = config.plotRange || 5.5;
        u.renderPlane(hostP, {
          xMin:-R, xMax:R, yMin:-R, yMax:R,
          xLabel:'Re', yLabel:'Im', gridStep: 1,
          lines: [
            {x1:0,y1:0,x2:current.a,y2:current.b, stroke:'#1565ff', strokeWidth:4},
            {x1:current.a,y1:0,x2:current.a,y2:current.b, stroke:'#9bbdff', strokeWidth:2, dash:'5 4'},
            {x1:0,y1:current.b,x2:current.a,y2:current.b, stroke:'#9bbdff', strokeWidth:2, dash:'5 4'}
          ],
          points: [{x:current.a, y:current.b, label:'z'}]
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
          if(key === 'arg') ok = u.angleEqual(v, expected, tolerance);
          else ok = u.nearlyEqual(v, expected, tolerance);
          parts.push(ok ? (label + ' richtig.') : (label + ' noch nicht richtig.'));
          if(!ok) allOk = false;
        }
        check('real', u.parseNum,   current.a,   tol.real, 'Re(z)');
        check('imag', u.parseNum,   current.b,   tol.imag, 'Im(z)');
        check('abs',  u.parseNum,   current.r,   tol.abs,  '|z|');
        check('arg',  u.parseAngle, current.phi, tol.arg,  'φ');
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
      const pool = (config.pool || []); const pt = pool[0] || {a:1,b:1};
      const R = config.plotRange || 5.5;
      const W = 300, H = 220, P = 22;
      const sx = x => P + ((x + R)/(2*R))*(W - 2*P);
      const sy = y => H - P - ((y + R)/(2*R))*(H - 2*P);
      const ns = 'http://www.w3.org/2000/svg';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.4rem 0.7rem; font-size:0.78rem; display:flex; flex-direction:column; height:100%; gap:0.25rem; overflow:hidden;';
      const tag = document.createElement('div'); tag.textContent = 'z = a + bi   ablesen'; tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700;';
      wrap.appendChild(tag);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.cssText = 'flex:1; min-height:0; max-height:240px; display:block; margin:0 auto; background:#fff; border:1px solid #e2e8ed; border-radius:6px;';
      // axes
      [[P,sy(0),W-P,sy(0)],[sx(0),P,sx(0),H-P]].forEach(c => {
        const l = document.createElementNS(ns,'line');
        l.setAttribute('x1',c[0]); l.setAttribute('y1',c[1]); l.setAttribute('x2',c[2]); l.setAttribute('y2',c[3]);
        l.setAttribute('stroke','#003b5c'); l.setAttribute('stroke-width',1.5); svg.appendChild(l);
      });
      const reLab = document.createElementNS(ns,'text'); reLab.textContent='Re'; reLab.setAttribute('x',W-P+2); reLab.setAttribute('y',sy(0)-4); reLab.setAttribute('font-size',10); reLab.setAttribute('fill','#003b5c'); svg.appendChild(reLab);
      const imLab = document.createElementNS(ns,'text'); imLab.textContent='Im'; imLab.setAttribute('x',sx(0)+4); imLab.setAttribute('y',P+10); imLab.setAttribute('font-size',10); imLab.setAttribute('fill','#003b5c'); svg.appendChild(imLab);
      // vector
      const vec = document.createElementNS(ns,'line');
      vec.setAttribute('x1',sx(0)); vec.setAttribute('y1',sy(0)); vec.setAttribute('x2',sx(pt.a)); vec.setAttribute('y2',sy(pt.b));
      vec.setAttribute('stroke','#1565ff'); vec.setAttribute('stroke-width',3); svg.appendChild(vec);
      const dot = document.createElementNS(ns,'circle');
      dot.setAttribute('cx',sx(pt.a)); dot.setAttribute('cy',sy(pt.b)); dot.setAttribute('r',5); dot.setAttribute('fill','#1565ff'); svg.appendChild(dot);
      const lbl = document.createElementNS(ns,'text'); lbl.textContent='z'; lbl.setAttribute('x',sx(pt.a)+8); lbl.setAttribute('y',sy(pt.b)-6); lbl.setAttribute('font-size',12); lbl.setAttribute('fill','#003b5c'); lbl.setAttribute('font-weight',700); svg.appendChild(lbl);
      wrap.appendChild(svg);
      host.appendChild(wrap);
    }
  });
})();
