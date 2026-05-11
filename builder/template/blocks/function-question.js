(function(){
  'use strict';
  Blocks.register('function-question', {
    label: 'Funktion ablesen',
    description: 'Funktion plotten, Funktionswert / Nullstelle / Extremum ablesen lassen.',
    category: 'Frage',
    icon: 'ƒ',
    graded: true,
    defaultConfig(){
      return {
        functions: [
          { expr: 'x^2 - 2*x - 3', xMin: -4, xMax: 5, yMin: -6, yMax: 6,
            question: 'Bestimmen Sie f(2).', answer: '-3', tolerance: 0.05, answerType: 'number' }
        ],
        randomize: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'functions', label:'Funktions-Pool', type:'list', itemLabel:'Funktion',
          itemSchema:[
            { key:'expr', label:'f(x) = ', type:'text', placeholder:'z. B. x^2 - 2*x - 3' },
            { key:'xMin', label:'x min', type:'number', step:'any' },
            { key:'xMax', label:'x max', type:'number', step:'any' },
            { key:'yMin', label:'y min', type:'number', step:'any' },
            { key:'yMax', label:'y max', type:'number', step:'any' },
            { key:'question', label:'Frage', type:'text' },
            { key:'answer', label:'Lösung (Zahl oder kommasepariert)', type:'text' },
            { key:'tolerance', label:'Toleranz', type:'number', step:'any' },
            { key:'answerType', label:'Antwort-Typ', type:'select', options:[
              {value:'number', label:'Einzelne Zahl'},
              {value:'list',   label:'Mehrere Zahlen (Komma)'}
            ]}
          ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;

      const grid = document.createElement('section'); grid.className = 'content-grid';
      const plotCard = document.createElement('article'); plotCard.className = 'section-card plot-card';
      plotCard.innerHTML = '<div class="card-header"><h3>Funktionsplot</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>f(x)</span></div></div><div class="plot-host-wrap wide-plot-wrap"><div class="plot-host" id="' + api.blockId + '_plot" role="img"></div></div><div class="formula-box" style="margin-top:1rem"><div class="formula-title">Frage</div><div class="formula-text" id="' + api.blockId + '_q"></div></div>';
      const controls = document.createElement('aside'); controls.className = 'section-card controls-card';
      controls.appendChild(Object.assign(document.createElement('h3'), {textContent:'Antwort'}));
      const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'text-input'; inp.placeholder = 'Antwort eingeben';
      controls.appendChild(inp);
      const btnRow = document.createElement('div'); btnRow.className = 'button-cluster'; 
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent='Korrektur';
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent='Neu generieren';
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      controls.appendChild(btnRow);
      const fb = u.feedbackBox(controls);
      grid.appendChild(plotCard); grid.appendChild(controls);
      host.appendChild(grid);

      function pickInstance(){
        const pool = config.functions && config.functions.length ? config.functions : [{expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5, question:'f(0)?', answer:'0', tolerance:0.01, answerType:'number'}];
        return config.randomize !== false ? pool[Math.floor(Math.random()*pool.length)] : pool[0];
      }
      function chooseGridStep(range){
        const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
        const target = range / 12;
        for(const c of candidates) if(c >= target) return c;
        return 100;
      }
      function renderPlot(){
        const hostP = plotCard.querySelector('#' + api.blockId + '_plot');
        const xMin = Number(current.xMin), xMax = Number(current.xMax);
        const yMin = Number(current.yMin), yMax = Number(current.yMax);
        const N = 400;
        const points = [];
        for(let i = 0; i <= N; i++){
          const x = xMin + (xMax - xMin) * (i / N);
          const y = u.safeMathExpr(current.expr, {x});
          if(y != null && y >= yMin - 5 && y <= yMax + 5) points.push([x, y]);
        }
        u.renderPlane(hostP, {
          width: 720, height: 420, pad: 50,
          xMin, xMax, yMin, yMax,
          gridStep: chooseGridStep(Math.max(xMax-xMin, yMax-yMin)),
          paths: [{points, stroke:'#1565ff', strokeWidth:3}]
        });
        plotCard.querySelector('#' + api.blockId + '_q').textContent = current.question || '';
      }
      function chooseNew(){
        current = pickInstance();
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
          if(ok){ fb.ok('Korrekt.'); api.reportScore(config.maxPoints || 1); }
          else { fb.bad('Nicht alle Werte passen.'); api.reportScore(0); }
        } else {
          const expected = u.parseNum(current.answer);
          const got = u.parseNum(inp.value);
          if(got == null){ fb.bad('Bitte eine gültige Zahl eingeben.'); return; }
          if(u.nearlyEqual(got, expected, tol)){ fb.ok('Korrekt.'); api.reportScore(config.maxPoints || 1); }
          else { fb.bad('Wert noch nicht richtig.'); api.reportScore(0); }
        }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      chooseNew();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const fn = (config.functions || [])[0] || {expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5};
      const W = 360, H = 220, P = 24;
      const xMin = Number(fn.xMin), xMax = Number(fn.xMax);
      const yMin = Number(fn.yMin), yMax = Number(fn.yMax);
      const sx = x => P + ((x - xMin)/(xMax - xMin))*(W - 2*P);
      const sy = y => H - P - ((y - yMin)/(yMax - yMin))*(H - 2*P);
      const ns = 'http://www.w3.org/2000/svg';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.4rem 0.7rem; font-size:0.78rem; display:flex; flex-direction:column; height:100%; gap:0.25rem; overflow:hidden;';
      const tag = document.createElement('div'); tag.textContent = 'ƒ(x) = ' + (fn.expr || ''); tag.style.cssText = 'color:#84bf66; font-size:0.74rem; font-weight:700; font-family:"Courier New",monospace;';
      wrap.appendChild(tag);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.cssText = 'flex:1; min-height:0; max-height:240px; display:block; margin:0 auto; background:#fff; border:1px solid #e2e8ed; border-radius:6px;';
      [[P,sy(0),W-P,sy(0)],[sx(0),P,sx(0),H-P]].forEach(c => {
        const l = document.createElementNS(ns,'line');
        l.setAttribute('x1',c[0]); l.setAttribute('y1',c[1]); l.setAttribute('x2',c[2]); l.setAttribute('y2',c[3]);
        l.setAttribute('stroke','#003b5c'); l.setAttribute('stroke-width',1.5); svg.appendChild(l);
      });
      // plot the function
      const N = 200, points = [];
      for(let i = 0; i <= N; i++){
        const x = xMin + (xMax - xMin) * (i/N);
        const y = safeMath(fn.expr, x);
        if(y != null && y >= yMin - 5 && y <= yMax + 5) points.push([x, y]);
      }
      if(points.length){
        const d = points.map((pt,i) => (i===0?'M':'L') + sx(pt[0]) + ' ' + sy(pt[1])).join(' ');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d); path.setAttribute('stroke', '#1565ff'); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', 2.5); svg.appendChild(path);
      }
      wrap.appendChild(svg);
      if(fn.question){
        const q = document.createElement('div'); q.textContent = '? ' + fn.question; q.style.cssText = 'color:#5d6872; font-size:0.74rem; font-style:italic; padding-top:0.2rem;';
        wrap.appendChild(q);
      }
      host.appendChild(wrap);
    }
  });

  function safeMath(expr, x){
    try {
      const fns = ['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','exp','log','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
      let s = String(expr || '').replace(/\s+/g,'').replace(/,/g,'.').replace(/\^/g,'**');
      const ids = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for(const id of ids) if(!(fns.includes(id) || id === 'x' || id === 'pi' || id === 'e' || id === 'PI' || id === 'E')) return null;
      let body = s.replace(/\bpi\b/g,'(Math.PI)').replace(/\bPI\b/g,'(Math.PI)').replace(/\be\b/g,'(Math.E)').replace(/\bE\b/g,'(Math.E)');
      fns.forEach(fn => { body = body.replace(new RegExp('\\b'+fn+'\\b','g'),'Math.'+fn); });
      const f = new Function('x','"use strict";return ('+body+');');
      const r = f(x); return Number.isFinite(r) ? r : null;
    } catch(e){ return null; }
  }
})();
