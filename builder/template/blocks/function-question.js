(function(){
  'use strict';
  const QUESTION_MODE_OPTIONS = [
    {value:'custom',      label:'Eigene Frage / Lösung'},
    {value:'value-at-x',  label:'Funktionswert f(x0)'},
    {value:'x-for-y',     label:'x-Werte zu f(x) = y0'},
    {value:'zeros',       label:'Nullstellen'},
    {value:'y-intercept', label:'y-Achsenabschnitt f(0)'},
    {value:'minima',      label:'Tiefpunkte / Minima'},
    {value:'maxima',      label:'Hochpunkte / Maxima'},
    {value:'extrema',     label:'Alle Extrempunkte'}
  ];

  Blocks.register('function-question', {
    label: 'Funktion ablesen',
    description: 'Funktion plotten, Funktionswerte, Nullstellen und Extrempunkte ablesen lassen.',
    category: 'Frage',
    icon: 'ƒ',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        functions: [
          { expr: 'x^2 - 2*x - 3', xMin: -4, xMax: 5, yMin: -6, yMax: 6,
            questionMode: 'value-at-x', xQuery: 2, targetY: 0,
            question: '', answer: '', tolerance: 0.05, answerType: 'number' }
        ],
        randomize: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      const MODE_LABEL = {
        'custom':      'Eigene Frage',
        'value-at-x':  'f(x₀) ablesen',
        'x-for-y':     'x bei f(x) = y₀',
        'zeros':       'Nullstellen',
        'y-intercept': 'y-Achsenabschnitt',
        'minima':      'Tiefpunkte',
        'maxima':      'Hochpunkte',
        'extrema':     'Alle Extrempunkte'
      };
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Funktionsplot' },
        { key:'functions', label:'Funktions-Pool', type:'list', itemLabel:'Funktion',
          itemSummary: item => {
            const expr = (item.expr || '').trim() || '…';
            const mode = MODE_LABEL[item.questionMode || 'value-at-x'] || '…';
            return 'f(x) = ' + expr + '   ·   ' + mode;
          },
          itemSchema:[
            // Funktion
            { key:'expr', label:'f(x) =', type:'text', placeholder:'z. B. x^2 - 2*x - 3', fullWidth:true },
            // Koordinatenbereich
            { type:'section', label:'Koordinatenbereich', key:'_sec_axes' },
            { key:'xMin', label:'x von', type:'number', step:'any' },
            { key:'xMax', label:'x bis', type:'number', step:'any' },
            { key:'yMin', label:'y von', type:'number', step:'any' },
            { key:'yMax', label:'y bis', type:'number', step:'any' },
            // Abfrage
            { type:'section', label:'Abfrage', key:'_sec_query' },
            { key:'questionMode', label:'Was wird gefragt?', type:'select',
              options: QUESTION_MODE_OPTIONS, default:'value-at-x', fullWidth:true },
            { key:'xQuery', label:'Stelle  x₀', type:'number', step:'any',
              showIf: c => (c.questionMode || 'value-at-x') === 'value-at-x' },
            { key:'targetY', label:'Zielwert  y₀', type:'number', step:'any',
              showIf: c => c.questionMode === 'x-for-y' },
            { key:'tolerance', label:'Toleranz (± Abweichung)', type:'number', step:'any' },
            { key:'question', label:'Fragetext', type:'text', fullWidth:true,
              help:'Leer lassen: die Frage wird automatisch aus dem Typ erzeugt.',
              showIf: c => c.questionMode === 'custom' },
            { key:'answer', label:'Musterlösung', type:'text', fullWidth:true,
              help:'Mehrere Werte mit Semikolon trennen.',
              showIf: c => c.questionMode === 'custom' },
            { key:'answerType', label:'Antwort-Format', type:'select',
              options:[{value:'number', label:'Einzelne Zahl'},{value:'list', label:'Mehrere Zahlen'}],
              showIf: c => c.questionMode === 'custom' }
          ]},
        { key:'randomize', label:'Funktion zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;

      const grid = document.createElement('section'); grid.className = 'content-grid';
      const plotCard = document.createElement('article'); plotCard.className = 'section-card plot-card';
      plotCard.innerHTML = '<div class="card-header"><h3>' + (config.blockTitle || 'Funktionsplot') + '</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>f(x)</span></div></div><div class="plot-host-wrap wide-plot-wrap"><div class="plot-host" id="' + api.blockId + '_plot" role="img"></div></div><div class="formula-box" style="margin-top:1rem"><div class="formula-title">Frage</div><div class="formula-text" id="' + api.blockId + '_q"></div></div>';
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
        const pool = config.functions && config.functions.length ? config.functions : [{expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5, questionMode:'value-at-x', xQuery:0, targetY:0, tolerance:0.01}];
        const activeSource = current && current._source;
        const item = config.randomize !== false
          ? u.pickDifferent(pool, activeSource, (candidate, active) => functionIdentity(candidate) === functionIdentity(active))
          : pool[0];
        return prepareFunctionInstance(item, u);
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
        plotCard.querySelector('#' + api.blockId + '_q').textContent = current._question || '';
      }
      function chooseNew(){
        current = pickInstance();
        inp.value = '';
        inp.placeholder = current._answerKind === 'points'
          ? 'z. B. (1; -4)'
          : (current._answerKind === 'numbers' ? 'z. B. -1; 3' : 'Antwort eingeben');
        fb.neutral('Neue Aufgabe generiert.');
        renderPlot();
      }
      function grade(){
        const result = gradeFunctionAnswer(current, inp.value, u);
        if(result.ok){ fb.ok(result.message); api.reportScore(config.maxPoints || 1); }
        else { fb.bad(result.message); api.reportScore(0); }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      chooseNew();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const fn = (config.functions || [])[0] || {expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5};
      const previewInstance = prepareFunctionInstance(fn, { safeMathExpr: (expr, vars) => safeMath(expr, vars.x) });
      const W = 360, H = 220, P = 24;
      const xMin = numOr(fn.xMin, -5), xMax = numOr(fn.xMax, 5);
      const yMin = numOr(fn.yMin, -5), yMax = numOr(fn.yMax, 5);
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
      if(previewInstance._question){
        const q = document.createElement('div'); q.textContent = '? ' + previewInstance._question; q.style.cssText = 'color:#5d6872; font-size:0.74rem; font-style:italic; padding-top:0.2rem;';
        wrap.appendChild(q);
      }
      host.appendChild(wrap);
    }
  });

  function functionIdentity(item){
    const o = item || {};
    return JSON.stringify({
      expr:o.expr, xMin:o.xMin, xMax:o.xMax, yMin:o.yMin, yMax:o.yMax,
      questionMode:o.questionMode, xQuery:o.xQuery, targetY:o.targetY,
      question:o.question, answer:o.answer, answerType:o.answerType
    });
  }

  function numOr(value, fallback){
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function prettyNum(value){
    const n = Number(value);
    if(!Number.isFinite(n)) return String(value);
    return String(Math.round(n * 1000) / 1000).replace('.', ',');
  }

  function prepareFunctionInstance(item, u){
    const src = item || {};
    const fn = Object.assign({
      expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5,
      questionMode:'value-at-x', xQuery:0, targetY:0, tolerance:0.05,
      question:'', answer:'', answerType:'number'
    }, src);
    const hasManualAnswer = fn.answer != null && String(fn.answer).trim() !== '';
    const mode = fn.questionMode || (hasManualAnswer ? 'custom' : 'value-at-x');
    const runtime = Object.assign({}, fn, {
      _source: src,
      _mode: mode,
      _answerKind: mode === 'custom' ? 'custom' : 'numbers',
      _expected: [],
      _question: String(fn.question || '').trim()
    });
    if(mode === 'custom'){
      if(!runtime._question) runtime._question = 'Lesen Sie den geforderten Wert aus dem Plot ab.';
      return runtime;
    }

    const xMin = numOr(fn.xMin, -5), xMax = numOr(fn.xMax, 5);
    const yMin = numOr(fn.yMin, -5), yMax = numOr(fn.yMax, 5);
    const x0 = numOr(fn.xQuery, 0);
    const y0 = numOr(fn.targetY, 0);
    const tol = numOr(fn.tolerance, 0.05);

    if(mode === 'value-at-x'){
      const y = u.safeMathExpr(fn.expr, {x:x0});
      runtime._expected = y == null ? [] : [y];
      runtime._question = runtime._question || 'Bestimmen Sie f(' + prettyNum(x0) + ').';
    } else if(mode === 'x-for-y'){
      runtime._expected = findXForY(fn.expr, y0, xMin, xMax, tol, u);
      runtime._question = runtime._question || 'Für welche x-Werte gilt f(x) = ' + prettyNum(y0) + '?';
    } else if(mode === 'zeros'){
      runtime._expected = findXForY(fn.expr, 0, xMin, xMax, tol, u);
      runtime._question = runtime._question || 'Bestimmen Sie die Nullstelle(n) der Funktion (x-Werte).';
    } else if(mode === 'y-intercept'){
      const y = u.safeMathExpr(fn.expr, {x:0});
      runtime._expected = y == null ? [] : [y];
      runtime._question = runtime._question || 'Bestimmen Sie den y-Achsenabschnitt f(0).';
    } else if(mode === 'minima' || mode === 'maxima' || mode === 'extrema'){
      runtime._answerKind = 'points';
      runtime._expected = findExtrema(fn.expr, xMin, xMax, yMin, yMax, mode, u);
      const label = mode === 'minima' ? 'Tiefpunkt(e)' : (mode === 'maxima' ? 'Hochpunkt(e)' : 'Extrempunkt(e)');
      runtime._question = runtime._question || 'Bestimmen Sie die ' + label + ' als Koordinaten (x; y).';
    } else {
      runtime._expected = [];
      runtime._question = runtime._question || 'Lesen Sie den geforderten Wert aus dem Plot ab.';
    }
    return runtime;
  }

  function evalAt(expr, x, u){
    return u.safeMathExpr(expr, {x});
  }

  function addUniqueNumber(list, value, eps){
    if(!Number.isFinite(value)) return;
    if(list.some(v => Math.abs(v - value) <= eps)) return;
    list.push(value);
  }

  function bisectXForY(expr, targetY, a, b, u){
    let fa = evalAt(expr, a, u) - targetY;
    let fb = evalAt(expr, b, u) - targetY;
    if(!Number.isFinite(fa) || !Number.isFinite(fb)) return null;
    for(let i = 0; i < 60; i++){
      const m = (a + b) / 2;
      const fm = evalAt(expr, m, u) - targetY;
      if(!Number.isFinite(fm)) return null;
      if(Math.abs(fm) < 1e-9) return m;
      if(fa * fm <= 0){ b = m; fb = fm; }
      else { a = m; fa = fm; }
    }
    return (a + b) / 2;
  }

  function findXForY(expr, targetY, xMin, xMax, tol, u){
    const roots = [];
    const N = 1200;
    const epsX = Math.max((xMax - xMin) / N * 2, 1e-4);
    let prevX = null, prevY = null;
    for(let i = 0; i <= N; i++){
      const x = xMin + (xMax - xMin) * (i / N);
      const yRaw = evalAt(expr, x, u);
      const y = yRaw == null ? null : yRaw - targetY;
      if(y == null || !Number.isFinite(y)){ prevX = null; prevY = null; continue; }
      if(Math.abs(y) <= Math.max(tol / 5, 1e-4)) addUniqueNumber(roots, x, epsX);
      if(prevY != null && prevX != null && prevY * y < 0){
        const root = bisectXForY(expr, targetY, prevX, x, u);
        addUniqueNumber(roots, root, epsX);
      }
      prevX = x; prevY = y;
    }

    findExtrema(expr, xMin, xMax, -Infinity, Infinity, 'extrema', u).forEach(p => {
      if(Math.abs(p.y - targetY) <= Math.max(tol, 1e-4)) addUniqueNumber(roots, p.x, epsX);
    });
    return roots.sort((a,b)=>a-b);
  }

  function refineExtremum(expr, a, b, kind, u){
    for(let i = 0; i < 70; i++){
      const m1 = a + (b - a) / 3;
      const m2 = b - (b - a) / 3;
      const y1 = evalAt(expr, m1, u);
      const y2 = evalAt(expr, m2, u);
      if(y1 == null || y2 == null) break;
      if(kind === 'min'){
        if(y1 < y2) b = m2; else a = m1;
      } else {
        if(y1 > y2) b = m2; else a = m1;
      }
    }
    const x = (a + b) / 2;
    const y = evalAt(expr, x, u);
    return y == null ? null : {x, y};
  }

  function addUniquePoint(list, point, epsX){
    if(!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    if(list.some(p => Math.abs(p.x - point.x) <= epsX)) return;
    list.push(point);
  }

  function findExtrema(expr, xMin, xMax, yMin, yMax, mode, u){
    const points = [];
    const N = 800;
    const xs = [], ys = [];
    for(let i = 0; i <= N; i++){
      const x = xMin + (xMax - xMin) * (i / N);
      xs.push(x);
      ys.push(evalAt(expr, x, u));
    }
    const epsX = Math.max((xMax - xMin) / N * 3, 1e-4);
    for(let i = 1; i < N; i++){
      const y0 = ys[i-1], y1 = ys[i], y2 = ys[i+1];
      if(!Number.isFinite(y0) || !Number.isFinite(y1) || !Number.isFinite(y2)) continue;
      const isMin = y1 <= y0 && y1 <= y2 && (y1 < y0 || y1 < y2);
      const isMax = y1 >= y0 && y1 >= y2 && (y1 > y0 || y1 > y2);
      if((mode === 'minima' || mode === 'extrema') && isMin){
        const p = refineExtremum(expr, xs[i-1], xs[i+1], 'min', u);
        if(p && p.y >= yMin - 1e-6 && p.y <= yMax + 1e-6) addUniquePoint(points, p, epsX);
      }
      if((mode === 'maxima' || mode === 'extrema') && isMax){
        const p = refineExtremum(expr, xs[i-1], xs[i+1], 'max', u);
        if(p && p.y >= yMin - 1e-6 && p.y <= yMax + 1e-6) addUniquePoint(points, p, epsX);
      }
    }
    return points.sort((a,b)=>a.x-b.x);
  }

  function parseNumberList(text, u){
    const s = String(text || '').replace(/\u2212/g, '-');
    const matches = s.match(/[-+]?(?:\d+(?:[.,]\d+)?|[.,]\d+)/g) || [];
    return matches.map(m => u.parseNum(m)).filter(v => v != null && Number.isFinite(v));
  }

  function parsePointGroup(group, u){
    const g = String(group || '').trim();
    const pairParts = /[;|/]/.test(g) ? g.split(/[;|/]/) : null;
    if(pairParts && pairParts.length >= 2){
      const x = u.parseNum(pairParts[0]);
      const y = u.parseNum(pairParts[1]);
      return x != null && y != null ? {x, y} : null;
    }
    const commaParts = g.split(',');
    if(commaParts.length === 2 && !/[.]\d+\s*,/.test(g)){
      const x = u.parseNum(commaParts[0]);
      const y = u.parseNum(commaParts[1]);
      return x != null && y != null ? {x, y} : null;
    }
    const nums = parseNumberList(g, u);
    return nums.length >= 2 ? {x:nums[0], y:nums[1]} : null;
  }

  function parsePointList(text, u){
    const s = String(text || '').replace(/\u2212/g, '-');
    const groups = [];
    const re = /\(([^)]+)\)/g;
    let m;
    while((m = re.exec(s))) groups.push(m[1]);
    if(groups.length){
      return groups.map(g => parsePointGroup(g, u)).filter(Boolean);
    }
    const nums = parseNumberList(s, u);
    const points = [];
    for(let i = 0; i + 1 < nums.length; i += 2) points.push({x: nums[i], y: nums[i+1]});
    return points;
  }

  function noSolutionAnswer(text){
    return /^\s*(keine|kein|none|no)\s*$/i.test(String(text || ''));
  }

  function compareNumberLists(expected, got, tol, u){
    if(expected.length === 0) return got.length === 0;
    if(got.length !== expected.length) return false;
    const exp = expected.slice().sort((a,b)=>a-b);
    const g = got.slice().sort((a,b)=>a-b);
    return exp.every((v,i) => u.nearlyEqual(v, g[i], tol));
  }

  function comparePointLists(expected, got, tol, u){
    if(expected.length === 0) return got.length === 0;
    if(got.length !== expected.length) return false;
    const exp = expected.slice().sort((a,b)=>a.x-b.x || a.y-b.y);
    const g = got.slice().sort((a,b)=>a.x-b.x || a.y-b.y);
    return exp.every((p,i) => u.nearlyEqual(p.x, g[i].x, tol) && u.nearlyEqual(p.y, g[i].y, tol));
  }

  function gradeFunctionAnswer(current, raw, u){
    const tol = numOr(current.tolerance, 0.05);
    const text = String(raw || '').trim();
    if(current._mode === 'custom'){
      if(current.answerType === 'list'){
        const expected = parseNumberList(current.answer, u);
        const got = parseNumberList(text, u);
        if(!text){ return {ok:false, message:'Bitte eine Antwort eingeben.'}; }
        if(!compareNumberLists(expected, got, tol, u)){
          return {ok:false, message:'Nicht alle Werte passen. Erwartet werden ' + expected.length + ' Wert(e).'};
        }
        return {ok:true, message:'Korrekt.'};
      }
      const expected = u.parseNum(current.answer);
      const got = u.parseNum(text);
      if(got == null){ return {ok:false, message:'Bitte eine gültige Zahl eingeben.'}; }
      if(u.nearlyEqual(got, expected, tol)) return {ok:true, message:'Korrekt.'};
      return {ok:false, message:'Wert noch nicht richtig.'};
    }

    if(current._answerKind === 'points'){
      if(current._expected.length === 0){
        if(noSolutionAnswer(text)) return {ok:true, message:'Korrekt: Es gibt keine passenden Punkte im sichtbaren Bereich.'};
        return {ok:false, message:'Es gibt keine passenden Punkte im sichtbaren Bereich. Geben Sie „keine“ ein.'};
      }
      const got = parsePointList(text, u);
      if(!text || got.length === 0) return {ok:false, message:'Bitte Koordinaten als (x; y) eingeben.'};
      if(comparePointLists(current._expected, got, tol, u)) return {ok:true, message:'Korrekt.'};
      return {ok:false, message:'Koordinaten noch nicht richtig. Erwartet werden ' + current._expected.length + ' Punkt(e).'};
    }

    if(current._expected.length === 0){
      if(noSolutionAnswer(text)) return {ok:true, message:'Korrekt: Es gibt keine passenden Werte im sichtbaren Bereich.'};
      return {ok:false, message:'Es gibt keine passenden Werte im sichtbaren Bereich. Geben Sie „keine“ ein.'};
    }
    const got = parseNumberList(text, u);
    if(!text || got.length === 0) return {ok:false, message:'Bitte eine gültige Zahl eingeben.'};
    if(compareNumberLists(current._expected, got, tol, u)) return {ok:true, message:'Korrekt.'};
    return {ok:false, message:'Wert(e) noch nicht richtig. Erwartet werden ' + current._expected.length + ' Wert(e).'};
  }

  function safeMath(expr, x){
    try {
      const fns = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','exp','log','log2','log10','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
      let s = String(expr || '').replace(/\s+/g,'').replace(/,/g,'.');
      s = s.replace(/\^/g,'**').replace(/(^|[+\-*/(,])-([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?)\*\*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?)/g, '$1-($2**$3)');
      const ids = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for(const id of ids) if(!(fns.includes(id) || id === 'x' || id === 'pi' || id === 'e' || id === 'PI' || id === 'E')) return null;
      let body = s.replace(/\bpi\b/g,'(Math.PI)').replace(/\bPI\b/g,'(Math.PI)').replace(/\be\b/g,'(Math.E)').replace(/\bE\b/g,'(Math.E)');
      fns.forEach(fn => { body = body.replace(new RegExp('\\b'+fn+'\\b','g'),'Math.'+fn); });
      const f = new Function('x','"use strict";return ('+body+');');
      const r = f(x); return Number.isFinite(r) ? r : null;
    } catch(e){ return null; }
  }
})();
