(function(){
  'use strict';
  Blocks.register('function-sandbox', {
    label: 'Funktionsplot-Sandbox',
    description: 'Funktion mit Schiebereglern interaktiv erkunden, nicht bewertet.',
    category: 'Visualisierung',
    icon: 'ƒ',
    graded: false,
    defaultConfig(){
      return {
        title: 'Funktion erkunden',
        expr: 'a*sin(b*x + c)',
        xMin: -6.28, xMax: 6.28, yMin: -3, yMax: 3,
        sliders: [
          { name:'a', min:-2, max:2, step:0.1, value:1 },
          { name:'b', min:0.5, max:3, step:0.1, value:1 },
          { name:'c', min:-3.14, max:3.14, step:0.05, value:0 }
        ]
      };
    },
    builderSchema(){
      return [
        // Funktion
        { type:'section', label:'Funktion', key:'_sec_fn' },
        { key:'title', label:'Titel (optional)', type:'text', placeholder:'z. B.  Sinus erkunden' },
        { key:'expr',  label:'f(x) =', type:'text', placeholder:'a*sin(b*x + c)',
          help:'Slider-Variablen (a, b, c, …) dürfen hier vorkommen.' },
        // Koordinatenbereich
        { type:'section', label:'Koordinatenbereich', key:'_sec_axes' },
        { key:'xMin', label:'x von', type:'number', step:'any' },
        { key:'xMax', label:'x bis', type:'number', step:'any' },
        { key:'yMin', label:'y von', type:'number', step:'any' },
        { key:'yMax', label:'y bis', type:'number', step:'any' },
        // Schieberegler
        { type:'section', label:'Schieberegler', key:'_sec_sliders' },
        { key:'sliders', label:'Regler', type:'list', itemLabel:'Regler',
          itemSummary: item => {
            if(!item.name) return '…';
            const start = item.value ?? '';
            return item.name + ':  [' + (item.min ?? '') + ', ' + (item.max ?? '') + ']  Schritt ' + (item.step ?? '') + '  Start ' + start;
          },
          itemSchema:[
            { key:'name',  label:'Variable',    type:'text',   placeholder:'a' },
            { type:'section', label:'Bereich & Schritt', key:'_sec_range' },
            { key:'min',   label:'von',          type:'number', step:'any' },
            { key:'max',   label:'bis',          type:'number', step:'any' },
            { key:'step',  label:'Schrittweite', type:'number', step:'any' },
            { key:'value', label:'Startwert',    type:'number', step:'any' }
          ]}
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const card = document.createElement('section'); card.className = 'section-card';
      if(config.title){ const h = document.createElement('h3'); h.textContent = config.title; card.appendChild(h); }
      const grid = document.createElement('div'); grid.style.cssText = 'display:grid; grid-template-columns:1fr 240px; gap:1rem; align-items:start;';
      const plotHost = document.createElement('div');
      plotHost.style.cssText = 'min-height:240px; aspect-ratio:16/9; border:1px solid var(--line); border-radius:10px; overflow:hidden;';
      grid.appendChild(plotHost);
      const ctrls = document.createElement('div'); ctrls.style.cssText = 'display:flex; flex-direction:column; gap:0.7rem;';
      grid.appendChild(ctrls);
      card.appendChild(grid);
      host.appendChild(card);

      const vars = {};
      const sliderEls = {};
      (config.sliders || []).forEach(s => {
        if(!s || !s.name) return;
        vars[s.name] = Number(s.value);
        const wrap = document.createElement('div');
        const lbl = document.createElement('label');
        lbl.style.cssText = 'display:flex; justify-content:space-between; font-weight:700; color:var(--primary); margin-bottom:0.3rem;';
        const valSpan = document.createElement('span'); valSpan.textContent = Number(s.value).toFixed(2);
        valSpan.style.cssText = 'color:var(--primary); font-family:"Courier New",monospace;';
        lbl.appendChild(Object.assign(document.createElement('span'), {textContent: s.name})); lbl.appendChild(valSpan);
        wrap.appendChild(lbl);
        const inp = document.createElement('input'); inp.type = 'range';
        inp.min = s.min; inp.max = s.max; inp.step = s.step || 0.1; inp.value = s.value;
        inp.style.cssText = 'width:100%; accent-color:var(--primary);';
        inp.addEventListener('input', () => { vars[s.name] = Number(inp.value); valSpan.textContent = Number(inp.value).toFixed(2); render(); });
        wrap.appendChild(inp);
        ctrls.appendChild(wrap);
        sliderEls[s.name] = {inp, valSpan};
      });

      function safeEval(x){
        try {
          const fns = ['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','exp','log','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
          let s = String(config.expr || '0').replace(/\s+/g,'').replace(/,/g,'.').replace(/\^/g,'**');
          const ids = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
          const allowed = Object.keys(vars).concat(['x','pi','e','PI','E']).concat(fns);
          for(const id of ids) if(!allowed.includes(id)) return null;
          let body = s.replace(/\bpi\b/g,'(Math.PI)').replace(/\bPI\b/g,'(Math.PI)').replace(/\be\b/g,'(Math.E)').replace(/\bE\b/g,'(Math.E)');
          fns.forEach(fn => { body = body.replace(new RegExp('\\b'+fn+'\\b','g'),'Math.'+fn); });
          const argNames = Object.keys(vars).concat(['x']);
          const f = new Function(...argNames, '"use strict";return ('+body+');');
          const r = f(...argNames.map(n => n === 'x' ? x : vars[n]));
          return Number.isFinite(r) ? r : null;
        } catch(e){ return null; }
      }

      function render(){
        const xMin = Number(config.xMin), xMax = Number(config.xMax);
        const yMin = Number(config.yMin), yMax = Number(config.yMax);
        const N = 400, points = [];
        for(let i = 0; i <= N; i++){
          const x = xMin + (xMax - xMin) * (i/N);
          const y = safeEval(x);
          if(y != null && y >= yMin - 5 && y <= yMax + 5) points.push([x, y]);
        }
        u.renderPlane(plotHost, {
          width: 720, height: 420, pad: 50,
          xMin, xMax, yMin, yMax,
          gridStep: chooseGridStep(Math.max(xMax-xMin, yMax-yMin)),
          paths: [{points, stroke:'#1565ff', strokeWidth: 3}]
        });
      }
      function chooseGridStep(range){
        const cs = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
        const target = range / 12;
        for(const c of cs) if(c >= target) return c;
        return 100;
      }
      render();
      return {};
    },
    preview(host, config){
      // Mini plot at current slider start values
      const vars = {};
      (config.sliders || []).forEach(s => { if(s && s.name) vars[s.name] = Number(s.value) || 0; });
      const xMin = Number(config.xMin), xMax = Number(config.xMax);
      const yMin = Number(config.yMin), yMax = Number(config.yMax);
      const W = 360, H = 220, P = 24;
      const sx = x => P + ((x - xMin)/(xMax - xMin))*(W - 2*P);
      const sy = y => H - P - ((y - yMin)/(yMax - yMin))*(H - 2*P);
      const ns = 'http://www.w3.org/2000/svg';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.4rem 0.7rem; font-size:0.78rem; display:flex; flex-direction:column; height:100%; gap:0.25rem; overflow:hidden;';
      const tag = document.createElement('div'); tag.textContent = 'ƒ  Sandbox: ' + (config.expr || ''); tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; font-family:"Courier New",monospace;';
      wrap.appendChild(tag);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.cssText = 'flex:1; min-height:0; max-height:240px; display:block; margin:0 auto; background:#fff; border:1px solid #e2e8ed; border-radius:6px;';
      [[P,sy(0),W-P,sy(0)],[sx(0),P,sx(0),H-P]].forEach(c => {
        const l = document.createElementNS(ns,'line');
        l.setAttribute('x1',c[0]); l.setAttribute('y1',c[1]); l.setAttribute('x2',c[2]); l.setAttribute('y2',c[3]);
        l.setAttribute('stroke','#003b5c'); l.setAttribute('stroke-width',1.5); svg.appendChild(l);
      });
      // safe eval inline
      const fns = ['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','exp','log','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
      let s = String(config.expr || '0').replace(/\s+/g,'').replace(/,/g,'.').replace(/\^/g,'**');
      const allowed = Object.keys(vars).concat(['x','pi','e','PI','E']).concat(fns);
      const ids = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      let safe = ids.every(id => allowed.includes(id));
      let body = s.replace(/\bpi\b/g,'(Math.PI)').replace(/\bPI\b/g,'(Math.PI)').replace(/\be\b/g,'(Math.E)').replace(/\bE\b/g,'(Math.E)');
      fns.forEach(fn => { body = body.replace(new RegExp('\\b'+fn+'\\b','g'),'Math.'+fn); });
      const argNames = Object.keys(vars).concat(['x']);
      const N = 200, points = [];
      if(safe){
        try {
          const f = new Function(...argNames, '"use strict";return ('+body+');');
          for(let i = 0; i <= N; i++){
            const x = xMin + (xMax - xMin) * (i/N);
            const y = f(...argNames.map(n => n === 'x' ? x : vars[n]));
            if(Number.isFinite(y) && y >= yMin - 5 && y <= yMax + 5) points.push([x, y]);
          }
        } catch(e){}
      }
      if(points.length){
        const d = points.map((pt,i) => (i===0?'M':'L') + sx(pt[0]) + ' ' + sy(pt[1])).join(' ');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d); path.setAttribute('stroke', '#1565ff'); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', 2.5); svg.appendChild(path);
      }
      wrap.appendChild(svg);
      // Slider hint
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:0.72rem; color:#5d6872; padding-top:0.2rem;';
      hint.textContent = ((config.sliders||[]).length) + ' Schieberegler · interaktiv im SCORM';
      wrap.appendChild(hint);
      host.appendChild(wrap);
    }
  });
})();
