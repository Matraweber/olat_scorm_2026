(function(){
  'use strict';
  Blocks.register('vector-question', {
    label: 'Vektor 2D ablesen',
    labelKey: 'block.vector-question.label',
    description: '2D-Vektor: Komponenten, Betrag, Winkel ablesen.',
    descKey: 'block.vector-question.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
    icon: '→',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        pool: [{x:3, y:2}, {x:-1, y:3}, {x:-2, y:-2}, {x:4, y:-1}, {x:0, y:3}, {x:-3, y:0}],
        questionMode: 'all',
        randomize: true,
        fields: { x: true, y: true, mag: true, angle: true },
        angleUnit: 'rad',
        tolerances: { x: 0.01, y: 0.01, mag: 0.06, angle: 0.06 },
        plotRange: 5.5,
        maxPoints: 1
      };
    },
    summary(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      return t('block.vector-question.summary', { count: (cfg.pool || []).length });
    },
    builderSchema(){
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.vector-question.field.blockTitle.label', type:'text', placeholder:'Vektor-Aufgabe', placeholderKey:'block.vector-question.field.blockTitle.placeholder' },
        // Vektor-Pool
        { key:'pool', label:'Vektor-Pool', labelKey:'block.vector-question.field.pool.label', type:'list', itemLabel:'Vektor', itemLabelKey:'block.vector-question.field.pool.itemLabel',
          itemSummary: item => 'v = (' + (item.x ?? '?') + ',  ' + (item.y ?? '?') + ')',
          itemSchema:[
            { key:'x', label:'x-Komponente', labelKey:'block.vector-question.field.pool.item.x.label', type:'number', step:'any' },
            { key:'y', label:'y-Komponente', labelKey:'block.vector-question.field.pool.item.y.label', type:'number', step:'any' }
          ]},
        { key:'randomize', label:'Vektor zufällig wählen', labelKey:'block.vector-question.field.randomize.label', type:'boolean' },
        // Query options
        { type:'section', label:'Abfrage', labelKey:'block.vector-question.field._sec_query.label', key:'_sec_query' },
        { key:'questionMode', label:'Was wird gefragt?', labelKey:'block.vector-question.field.questionMode.label', type:'select', options:[
          {value:'all',         label:'Komponenten, Betrag und Winkel', labelKey:'block.vector-question.field.questionMode.option.all'},
          {value:'components',  label:'Nur Komponenten  (x, y)',        labelKey:'block.vector-question.field.questionMode.option.components'},
          {value:'magnitude',   label:'Nur Betrag  |v|',                labelKey:'block.vector-question.field.questionMode.option.magnitude'},
          {value:'angle',       label:'Nur Winkel  φ',                  labelKey:'block.vector-question.field.questionMode.option.angle'},
          {value:'unit-vector', label:'Einheitsvektor  v̂  (v / |v|)',   labelKey:'block.vector-question.field.questionMode.option.unit-vector'}
        ]},
        // Felder & Toleranzen
        { type:'section', label:'Felder & Toleranzen', labelKey:'block.vector-question.field._sec_fields.label', key:'_sec_fields' },
        { key:'fields', label:'Felder individuell ein-/ausblenden', labelKey:'block.vector-question.field.fields.label',
          help:'Nur bei „Komponenten, Betrag und Winkel" relevant. Alle anderen Modi legen die Felder fest.',
          helpKey:'block.vector-question.field.fields.help',
          type:'group', schema:[
            { key:'x',     label:'x',      labelKey:'block.vector-question.field.fields.item.x.label',     type:'boolean' },
            { key:'y',     label:'y',      labelKey:'block.vector-question.field.fields.item.y.label',     type:'boolean' },
            { key:'mag',   label:'|v|',    labelKey:'block.vector-question.field.fields.item.mag.label',   type:'boolean' },
            { key:'angle', label:'Winkel', labelKey:'block.vector-question.field.fields.item.angle.label', type:'boolean' }
          ], showIf: c => (c.questionMode || 'all') === 'all' },
        { key:'angleUnit', label:'Winkel-Einheit', labelKey:'block.vector-question.field.angleUnit.label', type:'select', options:[
          {value:'deg', label:'Grad (°)',      labelKey:'block.vector-question.field.angleUnit.option.deg'},
          {value:'rad', label:'Radiant (rad)', labelKey:'block.vector-question.field.angleUnit.option.rad'}
        ], showIf: c => ['all','angle'].includes(c.questionMode || 'all') },
        { key:'tolerances', label:'Toleranzen  (±)', labelKey:'block.vector-question.field.tolerances.label', type:'group', schema:[
          { key:'x',     label:'x',      labelKey:'block.vector-question.field.tolerances.item.x.label',     type:'number', step:'any' },
          { key:'y',     label:'y',      labelKey:'block.vector-question.field.tolerances.item.y.label',     type:'number', step:'any' },
          { key:'mag',   label:'|v|',    labelKey:'block.vector-question.field.tolerances.item.mag.label',   type:'number', step:'any' },
          { key:'angle', label:'Winkel', labelKey:'block.vector-question.field.tolerances.item.angle.label', type:'number', step:'any' }
        ]},
        // Display & scoring
        { type:'section', label:'Darstellung & Bewertung', labelKey:'block.vector-question.field._sec_score.label', key:'_sec_score' },
        { key:'plotRange', label:'Plot-Bereich (±)', labelKey:'block.vector-question.field.plotRange.label', type:'number', step:'any' },
        { key:'maxPoints', label:'Punkte',           labelKey:'block.vector-question.field.maxPoints.label', type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const fields = vectorFields(config);
      const tol = Object.assign({x:0.01,y:0.01,mag:0.06,angle:0.06}, config.tolerances || {});
      let current = null;

      const grid = document.createElement('section'); grid.className = 'content-grid';
      const plotCard = document.createElement('article'); plotCard.className = 'section-card plot-card';
      const plotTitle = u.l(config.blockTitle) || u.t('block.vector-question.plotTitle');
      plotCard.innerHTML = '<div class="card-header"><h3>' + u.escapeHtml(plotTitle) + '</h3><div class="legend"><span class="legend-item"><span class="swatch swatch-blue"></span>v</span></div></div><div class="plot-host-wrap square-plot-wrap"><div class="plot-host" id="' + api.blockId + '_plot" role="img"></div></div><div class="formula-box" style="margin-top:1rem"><div class="formula-title">' + u.escapeHtml(u.t('common.question')) + '</div><div class="formula-text" id="' + api.blockId + '_q"></div></div>';
      const controls = document.createElement('aside'); controls.className = 'section-card controls-card';
      controls.appendChild(Object.assign(document.createElement('h3'), {textContent: u.t('block.vector-question.inputHeading')}));
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
      const isUnit = config.questionMode === 'unit-vector';
      const angleLabel = config.angleUnit === 'deg'
        ? u.t('block.vector-question.input.angleDeg')
        : u.t('block.vector-question.input.angleRad');
      const anglePlaceholder = config.angleUnit === 'deg'
        ? u.t('block.vector-question.placeholder.angleDeg')
        : u.t('block.vector-question.placeholder.angleRad');
      if(fields.x) addInput('x', isUnit ? 'v̂ₓ' : 'x', isUnit ? u.t('block.vector-question.placeholder.unitX') : u.t('block.vector-question.placeholder.x'));
      if(fields.y) addInput('y', isUnit ? 'v̂ᵧ' : 'y', isUnit ? u.t('block.vector-question.placeholder.unitY') : u.t('block.vector-question.placeholder.y'));
      if(fields.mag) addInput('mag', '|v|', u.t('block.vector-question.placeholder.mag'));
      if(fields.angle) addInput('angle', angleLabel, anglePlaceholder);

      const btnRow = document.createElement('div'); btnRow.className = 'button-cluster';
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent = u.t('common.check');
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent = u.t('common.regenerate');
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      controls.appendChild(btnRow);
      const fb = u.feedbackBox(controls);
      grid.appendChild(plotCard); grid.appendChild(controls);
      host.appendChild(grid);

      function pickInstance(){
        const pool = config.pool && config.pool.length ? config.pool : [{x:1,y:1}];
        const item = config.randomize !== false
          ? u.pickDifferent(pool, current, (candidate, active) => Number(candidate.x) === active.x && Number(candidate.y) === active.y)
          : pool[0];
        const x = Number(item.x), y = Number(item.y);
        const mag = Math.sqrt(x*x + y*y);
        const angleRad = u.normalizeAngle(Math.atan2(y, x));
        return { x, y, mag, unitX: mag ? x / mag : 0, unitY: mag ? y / mag : 0, angleRad, angle: config.angleUnit === 'deg' ? angleRad * 180 / Math.PI : angleRad };
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
        plotCard.querySelector('#' + api.blockId + '_q').textContent = vectorQuestionText(config, u);
      }
      function chooseNew(){
        current = pickInstance();
        Object.values(inputs).forEach(i => i.value = '');
        fb.neutral(u.t('block.vector-question.feedback.newGenerated'));
        renderPlot();
      }
      function grade(){
        // No input at all: prompt instead of recording a 0.
        const activeKeys = ['x','y','mag','angle'].filter(k => fields[k]);
        if(activeKeys.every(k => String(inputs[k].value || '').trim() === '')){
          fb.bad(u.t('block.vector-question.feedback.fillAtLeastOne'));
          return;
        }
        const parts = []; let okCount = 0, totalActive = 0;
        function check(key, parser, expected, tolerance, label){
          if(!fields[key]) return;
          totalActive++;
          const v = parser(inputs[key].value);
          if(v == null || !Number.isFinite(v)){ parts.push(u.t('block.vector-question.feedback.fieldMissing', { field: label })); return; }
          let ok;
          if(key === 'angle' && config.angleUnit !== 'deg') ok = u.angleEqual(v, expected, tolerance);
          else if(key === 'angle') ok = Math.abs(((v - expected + 540) % 360) - 180) <= tolerance;
          else ok = u.nearlyEqual(v, expected, tolerance);
          parts.push(ok ? u.t('block.vector-question.feedback.fieldCorrect', { field: label }) : u.t('block.vector-question.feedback.fieldWrong', { field: label }));
          if(ok) okCount++;
        }
        const expectedX = config.questionMode === 'unit-vector' ? current.unitX : current.x;
        const expectedY = config.questionMode === 'unit-vector' ? current.unitY : current.y;
        check('x', u.parseNum, expectedX, tol.x, 'x');
        check('y', u.parseNum, expectedY, tol.y, 'y');
        check('mag', u.parseNum, current.mag, tol.mag, '|v|');
        check('angle', config.angleUnit === 'deg' ? u.parseNum : u.parseAngle, current.angle, tol.angle, u.t('block.vector-question.label.angle'));
        const maxPoints = config.maxPoints || 1;
        const ratio = totalActive > 0 ? okCount / totalActive : 0;
        const pts = Math.round(ratio * maxPoints * 100) / 100;
        api.reportScore(pts);
        if(okCount === totalActive) fb.ok(u.t('feedback.correctScored', { pts: pts, max: maxPoints }));
        else if(okCount > 0) fb.neutral(u.t('block.vector-question.feedback.partialDetailed', { ok: okCount, total: totalActive, pts: pts, max: maxPoints, details: parts.join(' ') }));
        else fb.bad(u.t('block.vector-question.feedback.zeroDetailed', { max: maxPoints, details: parts.join(' ') }));
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      window.BlockUtils.regenPolicy(newBtn, config, api);
      chooseNew();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const BU = window.BlockUtils;
      const v = (config.pool || [])[0] || {x:3, y:2};
      const R = config.plotRange || 5.5;
      const W = 300, H = 220, P = 22;
      // Equal-aspect: same px/unit on x and y so a unit circle stays a circle.
      const usableW = W - 2*P, usableH = H - 2*P;
      const scale = Math.min(usableW / (2*R), usableH / (2*R));
      const offX = (usableW - scale * 2*R) / 2;
      const offY = (usableH - scale * 2*R) / 2;
      const plotLeft = P + offX, plotRight = W - P - offX;
      const plotTop = P + offY, plotBottom = H - P - offY;
      const sx = x => plotLeft + (x + R) * scale;
      const sy = y => plotBottom - (y + R) * scale;
      const ns = 'http://www.w3.org/2000/svg';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.4rem 0.7rem; font-size:0.78rem; display:flex; flex-direction:column; height:100%; gap:0.25rem; overflow:hidden;';
      const tag = document.createElement('div'); tag.textContent = '→  ' + BU.t('block.vector-question.label'); tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700;';
      wrap.appendChild(tag);
      const qline = document.createElement('div'); qline.textContent = vectorQuestionText(config, BU); qline.style.cssText = 'color:#003b5c; font-size:0.75rem; font-weight:600; margin-bottom:0.15rem;';
      wrap.appendChild(qline);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.cssText = 'flex:1; min-height:0; max-height:240px; display:block; margin:0 auto; background:#fff; border:1px solid #e2e8ed; border-radius:6px;';
      [[plotLeft,sy(0),plotRight,sy(0)],[sx(0),plotTop,sx(0),plotBottom]].forEach(c => {
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

  function vectorFields(config){
    const manual = Object.assign({x:true,y:true,mag:true,angle:true}, config.fields || {});
    switch(config.questionMode || 'all'){
      case 'components': return {x:true,y:true,mag:false,angle:false};
      case 'magnitude': return {x:false,y:false,mag:true,angle:false};
      case 'angle': return {x:false,y:false,mag:false,angle:true};
      case 'unit-vector': return {x:true,y:true,mag:false,angle:false};
      case 'all':
      default: return manual;
    }
  }

  function vectorQuestionText(config, u){
    const src = u || window.BlockUtils;
    switch(config.questionMode || 'all'){
      case 'components': return src.t('block.vector-question.question.components');
      case 'magnitude': return src.t('block.vector-question.question.magnitude');
      case 'angle': return src.t('block.vector-question.question.angle');
      case 'unit-vector': return src.t('block.vector-question.question.unitVector');
      default: return src.t('block.vector-question.question.all');
    }
  }
})();
