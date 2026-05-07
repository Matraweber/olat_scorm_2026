(function(){
  'use strict';
  TaskTypes.register('truth-table', {
    label: 'Wahrheitstabelle',
    description: 'Boolesche Ausdrücke (AND, OR, NOT, XOR, ⇒, ⇔) auswerten.',
    category: 'Informatik',
    defaultConfig(){
      return {
        intro: 'Vervollständigen Sie die Wahrheitstabelle für den angegebenen Ausdruck.',
        noteTitle: 'Operator-Syntax',
        noteHtml: '<code>&amp;&amp;</code>/<code>and</code> = UND, <code>||</code>/<code>or</code> = ODER, <code>!</code>/<code>not</code> = NICHT, <code>xor</code> = XOR. Implikation als <code>!a || b</code> formulieren.',
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
        { key:'intro', label:'Aufgabentext (HTML)', type:'textarea', rows:3 },
        { key:'noteTitle', label:'Hinweisbox-Titel', type:'text' },
        { key:'noteHtml', label:'Hinweisbox-Inhalt (HTML)', type:'textarea', rows:2 },
        { key:'expressions', label:'Ausdrücke', type:'list', itemLabel:'Ausdruck',
          itemSchema:[
            { key:'expr', label:'Boolescher Ausdruck', type:'text', placeholder:'a && b || !c' },
            { key:'vars', label:'Variablen (kommasepariert)', type:'text', placeholder:'a,b,c', transform:'csv' }
          ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte pro Aufgabe', type:'number', step:1, min:1 }
      ];
    },
    mount(container, config, taskMeta, api){
      const u = api.utils;
      const cfg = Object.assign(this.defaultConfig(), config || {});
      let current = null;
      let achieved = 0;

      const hero = u.el('section', {className:'hero-card', html:
        '<div><h2>' + escapeHtml(taskMeta.title || 'Aufgabe') + '</h2><p>' + (cfg.intro || '') + '</p></div>' +
        '<div class="note-box"><div class="note-title">' + escapeHtml(cfg.noteTitle || 'Hinweis') + '</div><div>' + (cfg.noteHtml || '') + '</div></div>'
      });
      container.appendChild(hero);

      const card = u.el('section', {className:'section-card'});
      card.appendChild(u.el('h3', {text:'Wahrheitstabelle'}));
      const exprBox = u.el('div', {className:'formula-box', style:{marginBottom:'1rem'}});
      exprBox.appendChild(u.el('div', {className:'formula-title', text:'Ausdruck'}));
      const exprText = u.el('div', {className:'formula-text'});
      exprBox.appendChild(exprText);
      card.appendChild(exprBox);
      const tableHost = u.el('div');
      card.appendChild(tableHost);

      const btnRow = u.el('div', {className:'button-cluster', style:{marginTop:'1rem'}});
      const checkBtn = u.el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Korrektur'});
      const newBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Neu generieren'});
      const nextBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: api.isLast() ? 'Test beenden' : 'Weiter'});
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn); btnRow.appendChild(nextBtn);
      card.appendChild(btnRow);

      const fb = u.feedbackBox(card);
      container.appendChild(card);

      function normalizeExpr(expr){
        return String(expr || '')
          .replace(/\bxor\b/gi, '!==')
          .replace(/\band\b/gi, '&&')
          .replace(/\bor\b/gi, '||')
          .replace(/\bnot\b/gi, '!');
      }

      function evalBool(expr, vars){
        // Allowed identifiers: var names; allowed tokens: && || ! ( ) digits
        const e = normalizeExpr(expr);
        const idents = e.match(/[A-Za-z_][A-Za-z_0-9]*/g) || [];
        const varNames = Object.keys(vars);
        for(const id of idents) if(!varNames.includes(id)) return null;
        try {
          const fn = new Function(...varNames, '"use strict"; return !!(' + e + ');');
          return !!fn(...varNames.map(n => !!vars[n]));
        } catch(e) { return null; }
      }

      function genTable(varNames){
        const N = 1 << varNames.length;
        const rows = [];
        for(let i = 0; i < N; i++){
          const vars = {};
          // Standard truth-table order: leftmost variable changes slowest
          varNames.forEach((v, idx) => { vars[v] = !!((i >> (varNames.length - 1 - idx)) & 1); });
          rows.push(vars);
        }
        return rows;
      }

      function pickInstance(){
        const pool = (cfg.expressions || []).filter(e => e && e.expr);
        const list = pool.length ? pool : [{expr:'a', vars:['a']}];
        const item = cfg.randomize !== false ? list[Math.floor(Math.random()*list.length)] : list[0];
        const vars = Array.isArray(item.vars) ? item.vars : String(item.vars || '').split(',').map(s => s.trim()).filter(Boolean);
        return { expr: item.expr, varNames: vars };
      }

      function renderTable(){
        tableHost.innerHTML = '';
        const table = u.el('table', {className:'truth-table'});
        const head = u.el('tr');
        current.varNames.forEach(v => head.appendChild(u.el('th', {text: v})));
        head.appendChild(u.el('th', {text: 'Ergebnis'}));
        table.appendChild(head);
        const rows = genTable(current.varNames);
        current.rows = rows;
        current.inputs = [];
        rows.forEach(r => {
          const tr = u.el('tr');
          current.varNames.forEach(v => tr.appendChild(u.el('td', {text: r[v] ? '1' : '0'})));
          const td = u.el('td');
          const sel = u.el('select', {className:'text-input', style:{padding:'0.3rem 0.5rem', minWidth:'5rem'}});
          ['?','0','1'].forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; sel.appendChild(op); });
          td.appendChild(sel);
          tr.appendChild(td);
          table.appendChild(tr);
          current.inputs.push(sel);
        });
        tableHost.appendChild(table);
        exprText.textContent = current.expr;
      }

      function chooseNew(){
        current = pickInstance();
        achieved = 0;
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
        if(allOk){
          achieved = cfg.maxPoints || 1;
          fb.ok('Korrekt. (' + achieved + ' Punkt' + (achieved===1?'':'e') + ')');
        } else {
          achieved = 0;
          fb.bad('Mindestens eine Zeile ist falsch oder leer.');
        }
        api.reportScore(achieved, cfg.maxPoints || 1);
      }

      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      nextBtn.addEventListener('click', () => api.goToNext());

      chooseNew();
      api.initScore(cfg.maxPoints || 1);
      return {};
    }
  });
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();
