(function(){
  'use strict';
  Blocks.register('truth-table', {
    label: 'Wahrheitstabelle',
    description: 'Boolesche Ausdrücke (AND, OR, NOT, XOR) auswerten - pro Zeile 0/1.',
    category: 'Frage',
    icon: '01',
    graded: true,
    defaultConfig(){
      return {
        expressions: [
          { expr: 'a && b', vars: ['a','b'] },
          { expr: '!a || b', vars: ['a','b'] },
          { expr: 'a xor b', vars: ['a','b'] },
          { expr: '(a && b) || c', vars: ['a','b','c'] }
        ],
        randomize: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'expressions', label:'Ausdrücke', type:'list', itemLabel:'Ausdruck',
          itemSchema:[
            { key:'expr', label:'Boolescher Ausdruck', type:'text', placeholder:'a && b || !c' },
            { key:'vars', label:'Variablen (kommasepariert)', type:'text', placeholder:'a,b,c', transform:'csv' }
          ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      let current = null;

      const card = document.createElement('section'); card.className = 'section-card block-question';
      card.appendChild(Object.assign(document.createElement('h3'), {textContent:'Wahrheitstabelle'}));
      const exprBox = document.createElement('div'); exprBox.className='formula-box'; exprBox.style.marginBottom='1rem';
      exprBox.innerHTML = '<div class="formula-title">Ausdruck</div>';
      const exprText = document.createElement('div'); exprText.className='formula-text';
      exprBox.appendChild(exprText); card.appendChild(exprBox);
      const tableHost = document.createElement('div'); card.appendChild(tableHost);

      const btnRow = document.createElement('div'); btnRow.className='button-cluster'; btnRow.style.marginTop='1rem';
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
        const pool = (config.expressions || []).filter(e => e && e.expr);
        const list = pool.length ? pool : [{expr:'a', vars:['a']}];
        const item = config.randomize !== false ? list[Math.floor(Math.random()*list.length)] : list[0];
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
        let allOk = true, any = false;
        current.rows.forEach((vars, i) => {
          const expected = evalBool(current.expr, vars);
          if(expected == null){ allOk = false; return; }
          const v = current.inputs[i].value;
          if(v === '?'){ allOk = false; return; }
          any = true;
          const got = v === '1';
          if(got !== expected) allOk = false;
        });
        if(!any){ fb.bad('Bitte alle Zeilen ausfüllen.'); return; }
        if(allOk){ fb.ok('Korrekt.'); api.reportScore(config.maxPoints || 1); }
        else { fb.bad('Mindestens eine Zeile ist falsch oder leer.'); api.reportScore(0); }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      chooseNew();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.55rem 0.75rem; font-size:0.85rem; height:100%; overflow:hidden;';
      const tag = document.createElement('div');
      tag.textContent = '01  Wahrheitstabelle';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.4rem;';
      wrap.appendChild(tag);
      const expr = ((config.expressions || [])[0] || {}).expr || 'a && b';
      const ex = document.createElement('div');
      ex.style.cssText = 'font-family:"Courier New",monospace; padding:0.3rem 0.6rem; background:#f5f8fa; border:1px solid #d8e0e6; border-radius:6px; color:#003b5c; font-weight:700; margin-bottom:0.4rem;';
      ex.textContent = expr;
      wrap.appendChild(ex);
      // Mini truth-table preview (4 rows for 2 vars)
      const tbl = document.createElement('table');
      tbl.style.cssText = 'border-collapse:collapse; font-family:"Courier New",monospace; font-size:0.78rem;';
      const vs = (((config.expressions || [])[0] || {}).vars) || ['a','b'];
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
      host.appendChild(wrap);
    }
  });
})();
