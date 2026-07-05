(function(){
  'use strict';
  const QUESTION_MODE_OPTIONS = [
    {value:'custom',      label:'Eigene Frage / Lösung', labelKey:'block.function-question.field.questionMode.option.custom'},
    {value:'value-at-x',  label:'Funktionswert f(x0)',    labelKey:'block.function-question.field.questionMode.option.value-at-x'},
    {value:'x-for-y',     label:'x-Werte zu f(x) = y0',   labelKey:'block.function-question.field.questionMode.option.x-for-y'},
    {value:'zeros',       label:'Nullstellen',            labelKey:'block.function-question.field.questionMode.option.zeros'},
    {value:'y-intercept', label:'y-Achsenabschnitt f(0)', labelKey:'block.function-question.field.questionMode.option.y-intercept'},
    {value:'minima',      label:'Tiefpunkte / Minima',    labelKey:'block.function-question.field.questionMode.option.minima'},
    {value:'maxima',      label:'Hochpunkte / Maxima',    labelKey:'block.function-question.field.questionMode.option.maxima'},
    {value:'extrema',     label:'Alle Extrempunkte',      labelKey:'block.function-question.field.questionMode.option.extrema'}
  ];

  Blocks.register('function-question', {
    label: 'Funktion ablesen',
    labelKey: 'block.function-question.label',
    description: 'Funktionsgraph anzeigen. Werte, Nullstellen und Extrempunkte ablesen.',
    descKey: 'block.function-question.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
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
    summary(cfg){
      const count = (cfg.functions || []).length;
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      return t('block.function-question.summary', { count });
    },
    builderSchema(){
      const u = (window.BlockUtils && typeof window.BlockUtils.t === 'function') ? window.BlockUtils : null;
      const modeLabel = key => {
        if(!key) return '';
        const fullKey = 'block.function-question.modeLabel.' + key;
        if(u){
          const translated = u.t(fullKey);
          if(translated && translated !== fullKey) return translated;
        }
        return '';
      };
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.function-question.field.blockTitle.label',
          type:'text', placeholder:'Funktionsplot', placeholderKey:'block.function-question.field.blockTitle.placeholder' },
        { key:'functions', label:'Funktions-Pool', labelKey:'block.function-question.field.functions.label',
          type:'list', itemLabel:'Funktion', itemLabelKey:'block.function-question.field.functions.itemLabel',
          itemSummary: item => {
            const expr = (item.expr || '').trim() || '…';
            const mode = modeLabel(item.questionMode || 'value-at-x') || '…';
            return 'f(x) = ' + expr + '   ·   ' + mode;
          },
          itemSchema:[
            // Funktion
            { key:'expr', label:'f(x) =', labelKey:'block.function-question.field.expr.label',
              type:'text', placeholder:'z. B. x^2 - 2*x - 3', placeholderKey:'block.function-question.field.expr.placeholder', fullWidth:true },
            // Koordinatenbereich
            { type:'section', label:'Koordinatenbereich', labelKey:'block.function-question.field._sec_axes.label', key:'_sec_axes' },
            { key:'xMin', label:'x von', labelKey:'block.function-question.field.xMin.label', type:'number', step:'any' },
            { key:'xMax', label:'x bis', labelKey:'block.function-question.field.xMax.label', type:'number', step:'any' },
            { key:'yMin', label:'y von', labelKey:'block.function-question.field.yMin.label', type:'number', step:'any' },
            { key:'yMax', label:'y bis', labelKey:'block.function-question.field.yMax.label', type:'number', step:'any' },
            // Query options
            { type:'section', label:'Abfrage', labelKey:'block.function-question.field._sec_query.label', key:'_sec_query' },
            { key:'questionMode', label:'Was wird gefragt?', labelKey:'block.function-question.field.questionMode.label', type:'select',
              options: QUESTION_MODE_OPTIONS, default:'value-at-x', fullWidth:true },
            { key:'xQuery', label:'Stelle  x₀', labelKey:'block.function-question.field.xQuery.label', type:'number', step:'any',
              showIf: c => (c.questionMode || 'value-at-x') === 'value-at-x' },
            { key:'targetY', label:'Zielwert  y₀', labelKey:'block.function-question.field.targetY.label', type:'number', step:'any',
              showIf: c => c.questionMode === 'x-for-y' },
            { key:'tolerance', label:'Toleranz (± Abweichung)', labelKey:'block.function-question.field.tolerance.label', type:'number', step:'any' },
            { key:'question', label:'Fragetext', labelKey:'block.function-question.field.question.label', type:'text', fullWidth:true,
              help:'Leer lassen: die Frage wird automatisch aus dem Typ erzeugt.', helpKey:'block.function-question.field.question.help',
              showIf: c => c.questionMode === 'custom' },
            { key:'answer', label:'Musterlösung', labelKey:'block.function-question.field.answer.label', type:'text', fullWidth:true,
              help:'Mehrere Werte mit Semikolon trennen.', helpKey:'block.function-question.field.answer.help',
              showIf: c => c.questionMode === 'custom' },
            { key:'answerType', label:'Antwort-Format', labelKey:'block.function-question.field.answerType.label', type:'select',
              options:[
                {value:'number', label:'Einzelne Zahl',   labelKey:'block.function-question.field.answerType.option.number'},
                {value:'list',   label:'Mehrere Zahlen',  labelKey:'block.function-question.field.answerType.option.list'}
              ],
              showIf: c => c.questionMode === 'custom' }
          ]},
        { key:'randomize', label:'Funktion zufällig wählen', labelKey:'block.function-question.field.randomize.label', type:'boolean' },
        { key:'maxPoints', label:'Punkte', labelKey:'block.function-question.field.maxPoints.label', type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;

      const blockTitleText = u.l(config.blockTitle) || u.t('block.function-question.defaultTitle');

      const grid = document.createElement('section'); grid.className = 'content-grid';
      const plotCard = document.createElement('article'); plotCard.className = 'section-card plot-card';
      plotCard.innerHTML = '<div class="card-header"><h3>' + u.escapeHtml(blockTitleText) + '</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>f(x)</span></div></div><div class="plot-host-wrap wide-plot-wrap"><div class="plot-host" id="' + api.blockId + '_plot" role="img"></div></div><div class="formula-box" style="margin-top:1rem"><div class="formula-title">' + u.escapeHtml(u.t('common.question')) + '</div><div class="formula-text" id="' + api.blockId + '_q"></div></div>';
      const controls = document.createElement('aside'); controls.className = 'section-card controls-card';
      controls.appendChild(Object.assign(document.createElement('h3'), {textContent: u.t('common.answer')}));
      // Dynamic answer area: re-built per question so the number of input fields
      // matches the count of visible solutions (extrema / zeros / x-for-y).
      const answerWrap = document.createElement('div');
      answerWrap.className = 'fn-answer-wrap';
      answerWrap.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.8rem;';
      controls.appendChild(answerWrap);
      let answerInputs = []; // [{x, y}] for points, [{v}] for numbers, [{v}] for custom/single
      let noneCheckbox = null;
      const btnRow = document.createElement('div'); btnRow.className = 'button-cluster';
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent = u.t('common.check');
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent = u.t('common.regenerate');
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
      function makeInput(placeholder, width){
        const el = document.createElement('input');
        el.type = 'text';
        el.className = 'text-input';
        el.placeholder = placeholder;
        if(width) el.style.cssText = 'width:' + width + '; min-width:0;';
        return el;
      }
      function buildAnswerInputs(){
        answerWrap.innerHTML = '';
        answerInputs = [];
        noneCheckbox = null;
        if(current._mode === 'custom'){
          const inp = makeInput(u.t('common.answerPlaceholder'));
          answerWrap.appendChild(inp);
          answerInputs.push({ v: inp });
          return;
        }
        const isPoints = current._answerKind === 'points';
        const count = current._expected.length;
        if(count === 0){
          const lbl = document.createElement('label');
          lbl.style.cssText = 'display:flex; align-items:center; gap:0.5rem; color:var(--muted, #5d6872); font-size:0.92rem;';
          noneCheckbox = document.createElement('input');
          noneCheckbox.type = 'checkbox';
          lbl.appendChild(noneCheckbox);
          lbl.appendChild(document.createTextNode(u.t('block.function-question.noneInRange')));
          answerWrap.appendChild(lbl);
          return;
        }
        for(let i = 0; i < count; i++){
          const row = document.createElement('div');
          row.style.cssText = 'display:flex; align-items:center; gap:0.4rem;';
          if(count > 1){
            const idx = document.createElement('span');
            idx.textContent = (i + 1) + '.';
            idx.style.cssText = 'min-width:1.4rem; color:var(--primary, #003b5c); font-weight:700;';
            row.appendChild(idx);
          }
          if(isPoints){
            const lp = document.createElement('span'); lp.textContent = '('; lp.style.cssText = 'color:var(--muted, #5d6872);';
            const sep = document.createElement('span'); sep.textContent = ';'; sep.style.cssText = 'color:var(--muted, #5d6872); padding:0 0.1rem;';
            const rp = document.createElement('span'); rp.textContent = ')'; rp.style.cssText = 'color:var(--muted, #5d6872);';
            const px = makeInput('x', '5.5rem');
            const py = makeInput('y', '5.5rem');
            row.appendChild(lp); row.appendChild(px); row.appendChild(sep); row.appendChild(py); row.appendChild(rp);
            answerInputs.push({ x: px, y: py });
          } else {
            const v = makeInput(u.t('block.function-question.valuePlaceholder'), '8rem');
            row.appendChild(v);
            answerInputs.push({ v: v });
          }
          answerWrap.appendChild(row);
        }
      }
      function readAnswerText(){
        if(current._mode === 'custom') return answerInputs[0] ? answerInputs[0].v.value : '';
        if(current._expected.length === 0) return (noneCheckbox && noneCheckbox.checked) ? 'keine' : '';
        if(current._answerKind === 'points'){
          return answerInputs.map(p => '(' + p.x.value + '; ' + p.y.value + ')').join('; ');
        }
        return answerInputs.map(p => p.v.value).join('; ');
      }
      function chooseNew(){
        current = pickInstance();
        buildAnswerInputs();
        fb.neutral(u.t('block.function-question.newTaskGenerated'));
        renderPlot();
      }
      function hasAnyInput(){
        // Custom mode uses a free-text field even though _expected is empty.
        if(current._mode === 'custom') return !!(answerInputs[0] && String(answerInputs[0].v.value || '').trim() !== '');
        // Auto modes with no solution in range: the answer is the "keine" checkbox.
        if(current._expected.length === 0) return !!(noneCheckbox && noneCheckbox.checked);
        return answerInputs.some(p => p.v
          ? String(p.v.value || '').trim() !== ''
          : (String(p.x.value || '').trim() !== '' || String(p.y.value || '').trim() !== ''));
      }
      function grade(){
        // No input at all: prompt instead of recording a 0.
        if(!hasAnyInput()){ fb.bad(u.t('block.function-question.pleaseEnterAnswer')); return; }
        const result = gradeFunctionAnswer(current, readAnswerText(), u);
        if(result.ok){ fb.ok(result.message); api.reportScore(config.maxPoints || 1); }
        else { fb.bad(result.message); api.reportScore(0); }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      window.BlockUtils.regenPolicy(newBtn, config, api);
      chooseNew();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const fn = (config.functions || [])[0] || {expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5};
      const previewInstance = prepareFunctionInstance(fn, { safeMathExpr: (expr, vars) => safeMath(expr, vars.x) }, u);
      const W = 360, H = 220, P = 24;
      const xMin = numOr(fn.xMin, -5), xMax = numOr(fn.xMax, 5);
      const yMin = numOr(fn.yMin, -5), yMax = numOr(fn.yMax, 5);
      // Equal-aspect mapping: 1 unit in x equals 1 unit in y, letterbox the rest.
      const xRange = xMax - xMin, yRange = yMax - yMin;
      const usableW = W - 2*P, usableH = H - 2*P;
      const scale = (xRange > 0 && yRange > 0) ? Math.min(usableW / xRange, usableH / yRange) : 1;
      const offX = (usableW - scale * xRange) / 2;
      const offY = (usableH - scale * yRange) / 2;
      const plotLeft = P + offX, plotRight = W - P - offX;
      const plotTop = P + offY, plotBottom = H - P - offY;
      const sx = x => plotLeft + (x - xMin) * scale;
      const sy = y => plotBottom - (y - yMin) * scale;
      const ns = 'http://www.w3.org/2000/svg';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.4rem 0.7rem; font-size:0.78rem; display:flex; flex-direction:column; height:100%; gap:0.25rem; overflow:hidden;';
      const tag = document.createElement('div'); tag.textContent = 'ƒ(x) = ' + (fn.expr || ''); tag.style.cssText = 'color:#84bf66; font-size:0.74rem; font-weight:700; font-family:"Courier New",monospace;';
      wrap.appendChild(tag);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.cssText = 'flex:1; min-height:0; max-height:240px; display:block; margin:0 auto; background:#fff; border:1px solid #e2e8ed; border-radius:6px;';
      [[plotLeft,sy(0),plotRight,sy(0)],[sx(0),plotTop,sx(0),plotBottom]].forEach(c => {
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

  function tt(key, params){
    const bu = window.BlockUtils;
    if(bu && typeof bu.t === 'function') return bu.t(key, params);
    return key;
  }

  function ll(value){
    const bu = window.BlockUtils;
    if(bu && typeof bu.l === 'function') return bu.l(value);
    return value == null ? '' : (typeof value === 'string' ? value : '');
  }

  function prepareFunctionInstance(item, u){
    const src = item || {};
    const fn = Object.assign({
      expr:'x', xMin:-5, xMax:5, yMin:-5, yMax:5,
      questionMode:'value-at-x', xQuery:0, targetY:0, tolerance:0.05,
      question:'', answer:'', answerType:'number'
    }, src);
    const authoredQuestion = ll(fn.question);
    const hasManualAnswer = fn.answer != null && String(ll(fn.answer)).trim() !== '';
    const mode = fn.questionMode || (hasManualAnswer ? 'custom' : 'value-at-x');
    const runtime = Object.assign({}, fn, {
      _source: src,
      _mode: mode,
      _answerKind: mode === 'custom' ? 'custom' : 'numbers',
      _expected: [],
      _question: String(authoredQuestion || '').trim()
    });
    if(mode === 'custom'){
      if(!runtime._question) runtime._question = tt('block.function-question.autoQuestion.custom');
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
      runtime._question = runtime._question || tt('block.function-question.autoQuestion.value-at-x', { x: prettyNum(x0) });
    } else if(mode === 'x-for-y'){
      runtime._expected = findXForY(fn.expr, y0, xMin, xMax, tol, u);
      runtime._question = runtime._question || tt('block.function-question.autoQuestion.x-for-y', { y: prettyNum(y0) });
    } else if(mode === 'zeros'){
      runtime._expected = findXForY(fn.expr, 0, xMin, xMax, tol, u);
      runtime._question = runtime._question || tt('block.function-question.autoQuestion.zeros');
    } else if(mode === 'y-intercept'){
      const y = u.safeMathExpr(fn.expr, {x:0});
      runtime._expected = y == null ? [] : [y];
      runtime._question = runtime._question || tt('block.function-question.autoQuestion.y-intercept');
    } else if(mode === 'minima' || mode === 'maxima' || mode === 'extrema'){
      runtime._answerKind = 'points';
      runtime._expected = findExtrema(fn.expr, xMin, xMax, yMin, yMax, mode, u);
      const n = runtime._expected.length;
      let label;
      if(n === 0){
        label = tt('block.function-question.autoQuestion.extrema.none.' + mode);
      } else if(n === 1){
        label = tt('block.function-question.autoQuestion.extrema.single.' + mode);
      } else {
        label = tt('block.function-question.autoQuestion.extrema.multiple.' + mode, { n });
      }
      runtime._question = runtime._question || label;
    } else {
      runtime._expected = [];
      runtime._question = runtime._question || tt('block.function-question.autoQuestion.fallback');
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
      const answerAuthored = ll(current.answer);
      if(current.answerType === 'list'){
        const expected = parseNumberList(answerAuthored, u);
        const got = parseNumberList(text, u);
        if(!text){ return {ok:false, message: tt('block.function-question.grade.pleaseEnterAnswer')}; }
        if(!compareNumberLists(expected, got, tol, u)){
          return {ok:false, message: tt('block.function-question.grade.valuesNotMatching', { n: expected.length })};
        }
        return {ok:true, message: tt('common.correct')};
      }
      const expected = u.parseNum(answerAuthored);
      const got = u.parseNum(text);
      if(got == null){ return {ok:false, message: tt('block.function-question.grade.invalidNumber')}; }
      if(u.nearlyEqual(got, expected, tol)) return {ok:true, message: tt('common.correct')};
      return {ok:false, message: tt('block.function-question.grade.valueNotYetCorrect')};
    }

    if(current._answerKind === 'points'){
      if(current._expected.length === 0){
        if(noSolutionAnswer(text)) return {ok:true, message: tt('block.function-question.grade.correctNoPoints')};
        return {ok:false, message: tt('block.function-question.grade.noPointsInRange')};
      }
      const got = parsePointList(text, u);
      if(!text || got.length === 0) return {ok:false, message: tt('block.function-question.grade.enterCoordinates')};
      if(comparePointLists(current._expected, got, tol, u)) return {ok:true, message: tt('common.correct')};
      return {ok:false, message: tt('block.function-question.grade.coordinatesNotYetCorrect', { n: current._expected.length })};
    }

    if(current._expected.length === 0){
      if(noSolutionAnswer(text)) return {ok:true, message: tt('block.function-question.grade.correctNoValues')};
      return {ok:false, message: tt('block.function-question.grade.noValuesInRange')};
    }
    const got = parseNumberList(text, u);
    if(!text || got.length === 0) return {ok:false, message: tt('block.function-question.grade.invalidNumber')};
    if(compareNumberLists(current._expected, got, tol, u)) return {ok:true, message: tt('common.correct')};
    return {ok:false, message: tt('block.function-question.grade.valuesNotYetCorrect', { n: current._expected.length })};
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
    } catch{ return null; }
  }
})();
