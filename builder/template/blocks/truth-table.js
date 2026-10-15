(function(){
  'use strict';
  Blocks.register('truth-table', {
    label: 'Wahrheitstabelle',
    labelKey: 'block.truth-table.label',
    description: 'Boolesche Ausdrücke (AND, OR, NOT, XOR) auswerten, pro Zeile 0/1.',
    descKey: 'block.truth-table.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
    icon: '01',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        expressionPreset: 'custom',
        variableCount: 2,
        expressions: [],
        randomize: true,
        maxPoints: 1
      };
    },
    summary(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      return t('block.truth-table.summary.expressionsCount', { count: (cfg.expressions || []).length });
    },
    validate(cfg){
      if(cfg.expressionPreset && cfg.expressionPreset !== 'custom') return [];
      if(!cfg.expressionPreset && (!Array.isArray(cfg.expressions) || cfg.expressions.length === 0)) return [];
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      const w = [];
      if(!Array.isArray(cfg.expressions) || cfg.expressions.length === 0 || cfg.expressions.every(e => !e.expr)){
        w.push(t('block.truth-table.validate.noExpressions'));
      }
      return w;
    },
    builderSchema(){
      const isCustom = c => (c.expressionPreset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.truth-table.field.blockTitle.label', type:'text', placeholder:'Wahrheitstabelle', placeholderKey:'block.truth-table.field.blockTitle.placeholder' },
        { key:'expressionPreset', label:'Vorlage', labelKey:'block.truth-table.field.expressionPreset.label', type:'select', options:[
          {value:'custom',     label:'Manuell (leer)',                         labelKey:'block.truth-table.field.expressionPreset.option.custom'},
          {value:'basics-2',   label:'Beispiel: AND, OR, NOT (2 Variablen)',   labelKey:'block.truth-table.field.expressionPreset.option.basics-2'},
          {value:'mixed-2',    label:'Beispiel: Gemischte Logik (2 Variablen)', labelKey:'block.truth-table.field.expressionPreset.option.mixed-2'},
          {value:'mixed-3',    label:'Beispiel: Gemischte Logik (3 Variablen)', labelKey:'block.truth-table.field.expressionPreset.option.mixed-3'},
          {value:'de-morgan',  label:'Beispiel: De-Morgan-Gesetze',            labelKey:'block.truth-table.field.expressionPreset.option.de-morgan'},
          {value:'xor',        label:'Beispiel: XOR / Entweder-oder',          labelKey:'block.truth-table.field.expressionPreset.option.xor'}
        ]},
        { type:'action', label:'↺ Zurücksetzen', labelKey:'block.truth-table.field.reset.label', action:'reset',
          showIf: c => (c.expressionPreset || 'custom') === 'custom' },
        { key:'variableCount', label:'Variablenzahl', labelKey:'block.truth-table.field.variableCount.label', type:'number', step:1, min:2, max:3,
          help:'2 Variablen = 4 Zeilen, 3 Variablen = 8 Zeilen.',
          helpKey:'block.truth-table.field.variableCount.help',
          showIf: c => (c.expressionPreset || 'custom') !== 'custom' },
        // Expressions
        { type:'section', label:'Boolesche Ausdrücke', labelKey:'block.truth-table.field.sectionExpressions.label', key:'_sec_expr', showIf: isCustom },
        { key:'expressions', label:'Ausdrücke', labelKey:'block.truth-table.field.expressions.label', type:'list', itemLabel:'Ausdruck', itemLabelKey:'block.truth-table.field.expressions.itemLabel',
          showIf: isCustom,
          itemSummary: item => (item.expr || '…').slice(0, 70),
          itemSchema:[
            { key:'expr', label:'Boolescher Ausdruck', labelKey:'block.truth-table.field.expr.label', type:'text', placeholder:'a && b || !c', placeholderKey:'block.truth-table.field.expr.placeholder', fullWidth:true,
              help:'Operatoren: && (AND), || (OR), ! (NOT), xor (XOR)',
              helpKey:'block.truth-table.field.expr.help' },
            { key:'vars', label:'Variablen (kommasepariert)', labelKey:'block.truth-table.field.vars.label', type:'text', placeholder:'a,b,c', placeholderKey:'block.truth-table.field.vars.placeholder', transform:'csv' }
          ]},
        // Settings & scoring
        { type:'section', label:'Einstellungen & Bewertung', labelKey:'block.truth-table.field.sectionSettings.label', key:'_sec_score' },
        { key:'randomize', label:'Ausdruck zufällig wählen', labelKey:'block.truth-table.field.randomize.label', type:'boolean' },
        { key:'maxPoints', label:'Punkte', labelKey:'block.truth-table.field.maxPoints.label', type:'number', step:1, min:1 },
        // Wrong = row answered with the wrong value; rows left at "?" cost 0.
        ...window.BlockUtils.penaltySchemaFields({
          help:'Jede falsch ausgefüllte Zeile zieht Punkte ab; die Gesamtpunktzahl fällt nie unter 0. Mit „?“ offen gelassene Zeilen zählen 0.',
          helpKey:'block.truth-table.field.penalizeWrong.help' }),
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;

      const card = document.createElement('section'); card.className = 'section-card block-question';
      card.appendChild(Object.assign(document.createElement('h3'), {textContent: u.l(config.blockTitle) || u.t('block.truth-table.defaultTitle')}));
      const exprBox = document.createElement('div'); exprBox.className='formula-box'; exprBox.style.marginBottom='1rem';
      exprBox.innerHTML = '<div class="formula-title">' + u.t('block.truth-table.expressionLabel') + '</div>';
      const exprText = document.createElement('div'); exprText.className='formula-text';
      exprBox.appendChild(exprText); card.appendChild(exprBox);
      const tableHost = document.createElement('div'); card.appendChild(tableHost);

      const btnRow = document.createElement('div'); btnRow.className='button-cluster';
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent=u.t('common.check');
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent=u.t('common.regenerate');
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      card.appendChild(btnRow);

      const fb = u.feedbackBox(card);
      host.appendChild(card);

      function normalizeExpr(expr){
        return String(expr || '')
          .replace(/\bxor\b/gi, '!==')
          .replace(/\band\b/gi, '&&')
          .replace(/\bor\b/gi, '||')
          .replace(/\bnot\b/gi, '!');
      }
      function evalBool(expr, vars){
        const e = normalizeExpr(expr);
        const idents = e.match(/[A-Za-z_][A-Za-z_0-9]*/g) || [];
        const varNames = Object.keys(vars);
        for(const id of idents) if(!varNames.includes(id)) return null;
        try { const fn = new Function(...varNames, '"use strict"; return !!(' + e + ');'); return !!fn(...varNames.map(n => !!vars[n])); }
        catch{ return null; }
      }
      function genTable(varNames){
        const N = 1 << varNames.length;
        const rows = [];
        for(let i = 0; i < N; i++){
          const vars = {};
          varNames.forEach((v, idx) => { vars[v] = !!((i >> (varNames.length - 1 - idx)) & 1); });
          rows.push(vars);
        }
        return rows;
      }
      function pickInstance(){
        const pool = expressionList(config).filter(e => e && e.expr);
        const list = pool.length ? pool : [{expr:'a', vars:['a']}];
        const sameExpression = (candidate, active) => {
          const vars = Array.isArray(candidate.vars) ? candidate.vars : String(candidate.vars || '').split(',').map(s => s.trim()).filter(Boolean);
          return String(candidate.expr || '') === String(active.expr || '') && JSON.stringify(vars) === JSON.stringify(active.varNames || []);
        };
        const item = config.randomize !== false ? u.pickDifferent(list, current, sameExpression) : list[0];
        const vars = Array.isArray(item.vars) ? item.vars : String(item.vars || '').split(',').map(s => s.trim()).filter(Boolean);
        return { expr: item.expr, varNames: vars };
      }
      function renderTable(){
        tableHost.innerHTML = '';
        const table = document.createElement('table'); table.className = 'truth-table';
        const head = document.createElement('tr');
        current.varNames.forEach(v => { const th = document.createElement('th'); th.textContent = v; head.appendChild(th); });
        const thr = document.createElement('th'); thr.textContent = u.t('block.truth-table.resultColumn'); head.appendChild(thr);
        table.appendChild(head);
        const rows = genTable(current.varNames);
        current.rows = rows; current.inputs = [];
        rows.forEach(r => {
          const tr = document.createElement('tr');
          current.varNames.forEach(v => { const td = document.createElement('td'); td.textContent = r[v] ? '1' : '0'; tr.appendChild(td); });
          const td = document.createElement('td');
          const sel = document.createElement('select'); sel.className = 'text-input'; sel.style.padding='0.3rem 0.5rem'; sel.style.minWidth='5rem';
          ['?','0','1'].forEach(o => { const op = document.createElement('option'); op.value=o; op.textContent=o; sel.appendChild(op); });
          td.appendChild(sel); tr.appendChild(td); table.appendChild(tr);
          current.inputs.push(sel);
        });
        tableHost.appendChild(table);
        exprText.textContent = current.expr;
      }
      function chooseNew(){
        current = pickInstance();
        renderTable();
        fb.neutral(u.t('block.truth-table.fillHint'));
      }
      function grade(){
        const totalRows = current.rows.length;
        let correctRows = 0, wrongRows = 0, any = false;
        current.rows.forEach((vars, i) => {
          const expected = evalBool(current.expr, vars);
          const v = current.inputs[i].value;
          if(v === '?' || expected == null) return;   // left open: 0 points, no deduction
          any = true;
          const got = v === '1';
          if(got === expected) correctRows++; else wrongRows++;
        });
        if(!any){ fb.bad(u.t('block.truth-table.fillAllRows')); return; }
        const maxPoints = config.maxPoints || 1;
        const perRow = totalRows > 0 ? maxPoints / totalRows : 0;
        const pts = u.scoreWithPenalty(correctRows * perRow, wrongRows, u.penaltyPerWrong(config, perRow), maxPoints);
        api.reportScore(pts);
        if(correctRows === totalRows) fb.ok(u.t('feedback.correctScored', { pts, max: maxPoints }));
        else if(correctRows > 0) fb.neutral(u.t('block.truth-table.partialRows', { correct: correctRows, total: totalRows, pts, max: maxPoints }));
        else fb.bad(u.t('block.truth-table.noRowCorrect', { max: maxPoints }));
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
      const wrap = u.tagPreview(host, { icon:'01', label: u.t('block.truth-table.label'), fillHeight:true });
      const exprs = expressionList(config);
      const expr = (exprs[0] || {}).expr || 'a && b';
      const ex = document.createElement('div');
      ex.style.cssText = 'font-family:"Courier New",monospace; padding:0.3rem 0.6rem; background:#f5f8fa; border:1px solid #d8e0e6; border-radius:6px; color:#003b5c; font-weight:700; margin-bottom:0.4rem;';
      ex.textContent = expr;
      wrap.appendChild(ex);
      // Mini truth-table preview (4 rows for 2 vars)
      const tbl = document.createElement('table');
      tbl.style.cssText = 'border-collapse:collapse; font-family:"Courier New",monospace; font-size:0.78rem;';
      const vs = ((exprs[0] || {}).vars) || ['a','b'];
      const varNames = Array.isArray(vs) ? vs : String(vs).split(',').map(s=>s.trim()).filter(Boolean);
      const head = document.createElement('tr');
      varNames.forEach(v => { const th = document.createElement('th'); th.textContent = v; th.style.cssText = 'padding:0.18rem 0.45rem; background:#003b5c; color:#fff; border:1px solid #003b5c;'; head.appendChild(th); });
      const last = document.createElement('th'); last.textContent = '?'; last.style.cssText = 'padding:0.18rem 0.45rem; background:#84bf66; color:#003b5c; border:1px solid #84bf66;';
      head.appendChild(last); tbl.appendChild(head);
      const N = Math.min(4, 1 << varNames.length);
      for(let i = 0; i < N; i++){
        const tr = document.createElement('tr');
        for(let v = 0; v < varNames.length; v++){
          const td = document.createElement('td'); td.textContent = ((i >> (varNames.length - 1 - v)) & 1).toString();
          td.style.cssText = 'padding:0.18rem 0.45rem; border:1px solid #d8e0e6; text-align:center; background:#fff;';
          tr.appendChild(td);
        }
        const t2 = document.createElement('td'); t2.textContent = '?'; t2.style.cssText = 'padding:0.18rem 0.45rem; border:1px solid #d8e0e6; background:#f5f8fa; text-align:center; color:#5d6872; font-weight:600;';
        tr.appendChild(t2); tbl.appendChild(tr);
      }
      wrap.appendChild(tbl);
    }
  });

  function expressionList(config){
    if((config.expressionPreset || 'mixed-2') === 'custom'){
      return config.expressions || [];
    }
    const n = Math.max(2, Math.min(3, Number(config.variableCount) || ((config.expressionPreset || '').includes('3') ? 3 : 2)));
    const vars = n === 3 ? ['a','b','c'] : ['a','b'];
    switch(config.expressionPreset || 'mixed-2'){
      case 'basics-2':
        return [
          {expr:'a && b', vars:['a','b']},
          {expr:'a || b', vars:['a','b']},
          {expr:'!a && b', vars:['a','b']},
          {expr:'!a || b', vars:['a','b']}
        ];
      case 'de-morgan':
        return [
          {expr:'!(a && b)', vars:['a','b']},
          {expr:'!a || !b', vars:['a','b']},
          {expr:'!(a || b)', vars:['a','b']},
          {expr:'!a && !b', vars:['a','b']}
        ];
      case 'xor':
        return [
          {expr:'a xor b', vars:['a','b']},
          {expr:'!(a xor b)', vars:['a','b']},
          {expr:'(a || b) && !(a && b)', vars:['a','b']}
        ];
      case 'mixed-3':
        return [
          {expr:'(a && b) || c', vars:['a','b','c']},
          {expr:'a && (b || c)', vars:['a','b','c']},
          {expr:'!a || (b && c)', vars:['a','b','c']},
          {expr:'(a xor b) && c', vars:['a','b','c']}
        ];
      case 'mixed-2':
      default:
        return [
          {expr:'a && b', vars},
          {expr:'!a || b', vars},
          {expr:'a xor b', vars},
          {expr:'!(a && b)', vars}
        ];
    }
  }
})();
