(function(){
  'use strict';
  Blocks.register('truth-table', {
    label: 'Wahrheitstabelle',
    description: 'Boolesche Ausdrücke (AND, OR, NOT, XOR) auswerten, pro Zeile 0/1.',
    category: 'Frage',
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
    builderSchema(){
      const isCustom = c => (c.expressionPreset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Wahrheitstabelle' },
        { key:'expressionPreset', label:'Vorlage', type:'select', options:[
          {value:'custom',     label:'Manuell (leer)'},
          {value:'basics-2',   label:'Beispiel: AND, OR, NOT (2 Variablen)'},
          {value:'mixed-2',    label:'Beispiel: Gemischte Logik (2 Variablen)'},
          {value:'mixed-3',    label:'Beispiel: Gemischte Logik (3 Variablen)'},
          {value:'de-morgan',  label:'Beispiel: De-Morgan-Gesetze'},
          {value:'xor',        label:'Beispiel: XOR / Entweder-oder'}
        ]},
        { type:'action', label:'↺ Zurücksetzen', action:'reset',
          showIf: c => (c.expressionPreset || 'custom') === 'custom' },
        { key:'variableCount', label:'Variablenzahl', type:'number', step:1, min:2, max:3,
          help:'2 Variablen = 4 Zeilen, 3 Variablen = 8 Zeilen.',
          showIf: c => (c.expressionPreset || 'custom') !== 'custom' },
        // Ausdrücke
        { type:'section', label:'Boolesche Ausdrücke', key:'_sec_expr', showIf: isCustom },
        { key:'expressions', label:'Ausdrücke', type:'list', itemLabel:'Ausdruck',
          showIf: isCustom,
          itemSummary: item => (item.expr || '…').slice(0, 70),
          itemSchema:[
            { key:'expr', label:'Boolescher Ausdruck', type:'text', placeholder:'a && b || !c', fullWidth:true,
              help:'Operatoren: && (AND), || (OR), ! (NOT), xor (XOR)' },
            { key:'vars', label:'Variablen (kommasepariert)', type:'text', placeholder:'a,b,c', transform:'csv' }
          ]},
        // Einstellungen & Bewertung
        { type:'section', label:'Einstellungen & Bewertung', key:'_sec_score' },
        { key:'randomize', label:'Ausdruck zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;

      const card = document.createElement('section'); card.className = 'section-card block-question';
      card.appendChild(Object.assign(document.createElement('h3'), {textContent: config.blockTitle || 'Wahrheitstabelle'}));
      const exprBox = document.createElement('div'); exprBox.className='formula-box'; exprBox.style.marginBottom='1rem';
      exprBox.innerHTML = '<div class="formula-title">Ausdruck</div>';
      const exprText = document.createElement('div'); exprText.className='formula-text';
      exprBox.appendChild(exprText); card.appendChild(exprBox);
      const tableHost = document.createElement('div'); card.appendChild(tableHost);

      const btnRow = document.createElement('div'); btnRow.className='button-cluster'; 
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent='Korrektur';
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent='Neu generieren';
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
        catch(e){ return null; }
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
        const thr = document.createElement('th'); thr.textContent = 'Ergebnis'; head.appendChild(thr);
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
        fb.neutral('Tragen Sie für jede Zeile 0 oder 1 ein.');
      }
      function grade(){
        let correctRows = 0, totalRows = current.rows.length, any = false;
        current.rows.forEach((vars, i) => {
          const expected = evalBool(current.expr, vars);
          const v = current.inputs[i].value;
          if(v === '?' || expected == null) return;
          any = true;
          const got = v === '1';
          if(got === expected) correctRows++;
        });
        if(!any){ fb.bad('Bitte alle Zeilen ausfüllen.'); return; }
        const maxPoints = config.maxPoints || 1;
        const ratio = totalRows > 0 ? correctRows / totalRows : 0;
        const pts = Math.round(ratio * maxPoints * 100) / 100;
        api.reportScore(pts);
        if(correctRows === totalRows) fb.ok('Korrekt. ' + pts + ' / ' + maxPoints + ' Punkte.');
        else if(correctRows > 0) fb.neutral('Teilweise richtig: ' + correctRows + ' von ' + totalRows + ' Zeilen (' + pts + ' / ' + maxPoints + ' Punkte).');
        else fb.bad('Keine Zeile korrekt. 0 / ' + maxPoints + ' Punkte.');
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      chooseNew();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const wrap = u.tagPreview(host, { icon:'01', label:'Wahrheitstabelle', fillHeight:true });
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
        const t2 = document.createElement('td'); t2.textContent = '_'; t2.style.cssText = 'padding:0.18rem 0.45rem; border:1px dashed #d4a72a; background:#fff8e6; text-align:center; color:#888;';
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
