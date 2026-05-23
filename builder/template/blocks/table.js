(function(){
  'use strict';

  Blocks.register('table', {
    label: 'Tabelle',
    description: 'Werte-Tabelle mit Spalten als Variable, Text, berechnet oder Eingabefeld.',
    category: 'MINT',
    icon: 'table',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: '',
        columns: [],
        rowCount: 4,
        shuffleRows: false,
        maxPoints: 1
      };
    },
    summary(cfg){
      const c = (cfg.columns || []).length;
      const r = Number(cfg.rowCount) || 0;
      return c + ' Spalten, ' + r + ' Zeilen';
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const w = [];
      const cols = cfg.columns || [];
      if(cols.length < 2) w.push('Mindestens zwei Spalten erforderlich.');
      if(!cols.some(c => c.type === 'answer')) w.push('Mindestens eine Antwort-Spalte erforderlich.');
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: 'Berechnen Sie $f(x) = 2x + 1$ für die gegebenen Werte.',
        columns: [
          { key:'x',  label:'x',    type:'var',    min:1, max:9, integer:true },
          { key:'fx', label:'f(x)', type:'answer', formula:'2*x + 1', tolerance:0.01 }
        ],
        rowCount: 4,
        shuffleRows: false,
        maxPoints: 4
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Wertetabelle' },
        { key:'preset', label:'Vorlage', type:'select', options:[
          {value:'custom',     label:'Manuell (leer)'},
          {value:'linear',     label:'Beispiel: f(x) = 2x + 1'},
          {value:'quadratic',  label:'Beispiel: f(x) = x^2'},
          {value:'area-rect',  label:'Beispiel: Rechteck-Fläche A = a*b'}
        ], help:'Bei "Manuell" eigene Spalten und Formeln festlegen.' },
        { type:'action', label:'Zurücksetzen', action:'reset', showIf: isCustom },

        { type:'section', label:'Frage', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Aufgabentext', type:'math-textarea', rows:2, showIf: isCustom,
          help:'KaTeX wird gerendert. Beispiel: $f(x) = 2x + 1$.' },

        { type:'section', label:'Spalten', key:'_sec_cols', showIf: isCustom },
        { key:'columns', label:'Spalten', type:'list', itemLabel:'Spalte',
          showIf: isCustom,
          itemSummary: item => (item.label || '...') + ' (' + (item.type || 'text') + ')',
          itemSchema:[
            { key:'label', label:'Spaltenkopf', type:'text', placeholder:'z. B. x' },
            { key:'key',   label:'Variable (interner Schlüssel)', type:'text', placeholder:'z. B. x',
              help:'Wird in Formeln referenziert. Nur Buchstaben/Ziffern.' },
            { key:'type',  label:'Typ', type:'select', options:[
              {value:'var',    label:'Zufallswert'},
              {value:'answer', label:'Antwortfeld (Student fuellt aus)'},
              {value:'expr',   label:'Berechnet (automatisch)'},
              {value:'text',   label:'Statischer Text'}
            ]},
            { key:'unit',    label:'Einheit (optional)',  type:'text', placeholder:'z. B. cm' },
            // Variable-only fields (random source)
            { key:'min',     label:'Min', type:'number', step:1,
              showIf: it => it.type === 'var' },
            { key:'max',     label:'Max', type:'number', step:1,
              showIf: it => it.type === 'var' },
            { key:'integer', label:'Ganzzahlig', type:'boolean',
              showIf: it => it.type === 'var' },
            // Text-only
            { key:'text',    label:'Text', type:'text',
              showIf: it => it.type === 'text' },
            // Formula columns (expr + answer)
            { key:'formula', label:'Formel', type:'text', placeholder:'z. B. 2*x + 1',
              help:'Andere Spalten-Schlüssel als Variablen verwenden.',
              showIf: it => it.type === 'expr' || it.type === 'answer' },
            { key:'tolerance', label:'Toleranz', type:'number', step:0.01, default:0.01,
              showIf: it => it.type === 'answer' }
          ]},

        { type:'section', label:'Zeilen', key:'_sec_rows', showIf: isCustom },
        { key:'rowCount', label:'Anzahl Zeilen', type:'number', step:1, min:1, max:20 },

        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1,
          help:'Wird gleichmaessig auf alle Antwort-Zellen verteilt.' }
      ];
    },
    mount(host, config, api){
      const u = window.BlockUtils;
      const activeConfig = tablePresetConfig(config);
      const ui = u.simpleQuestionCard(host, {
        title: activeConfig.blockTitle || 'Wertetabelle',
        question: activeConfig.question || ''
      });
      const { content, buttons, fb } = ui;

      const cols = (activeConfig.columns || []).filter(c => c && c.key);
      const rowCount = Math.max(1, Math.min(20, Number(activeConfig.rowCount) || 1));
      const answerCols = cols.filter(c => c.type === 'answer');
      if(cols.length === 0 || answerCols.length === 0){
        content.innerHTML = '<div style="color:var(--muted); font-style:italic;">(Keine Spalten oder keine Antwort-Spalte definiert.)</div>';
        api.initScore(Number(activeConfig.maxPoints) || 1);
        return {};
      }

      const tableHost = document.createElement('div');
      tableHost.className = 'table-block-host';
      content.appendChild(tableHost);

      // Per row: {key -> value (numeric)}. Answer columns get the expected value
      // at generate time; the input element holds the user answer.
      let rows = [];
      const inputsByRowAndKey = [];

      function evalExpr(formula, varsObj){
        try {
          const r = u.safeMathExpr(String(formula || ''), varsObj);
          return typeof r === 'number' && Number.isFinite(r) ? r : null;
        } catch(e){ return null; }
      }

      function generate(){
        rows = [];
        for(let r = 0; r < rowCount; r++){
          const row = {};
          // Pass 1: variable + text columns.
          cols.forEach(c => {
            if(c.type === 'var'){
              const min = Number(c.min); const max = Number(c.max);
              const lo = isNaN(min) ? 1 : min;
              const hi = isNaN(max) ? 10 : max;
              let v = lo + Math.random() * (hi - lo);
              if(c.integer !== false) v = Math.round(v);
              else v = Math.round(v * 100) / 100;
              row[c.key] = v;
            } else if(c.type === 'text'){
              row[c.key] = String(c.text || '');
            }
          });
          // Pass 2: computed + answer-target columns.
          cols.forEach(c => {
            if(c.type === 'expr' || c.type === 'answer'){
              const v = evalExpr(c.formula, row);
              row[c.key] = v;
            }
          });
          rows.push(row);
        }
        renderTable();
      }

      function renderTable(){
        tableHost.innerHTML = '';
        const tbl = document.createElement('table');
        tbl.className = 'table-block';
        const thead = document.createElement('thead');
        const trh = document.createElement('tr');
        cols.forEach(c => {
          const th = document.createElement('th');
          th.textContent = (c.label || c.key) + (c.unit ? ' [' + c.unit + ']' : '');
          trh.appendChild(th);
        });
        thead.appendChild(trh);
        tbl.appendChild(thead);
        const tbody = document.createElement('tbody');
        rows.forEach((row, rIdx) => {
          const tr = document.createElement('tr');
          const inputs = {};
          cols.forEach(c => {
            const td = document.createElement('td');
            if(c.type === 'answer'){
              const inp = document.createElement('input');
              inp.type = 'text';
              inp.className = 'text-input table-block-input';
              inp.placeholder = '?';
              td.appendChild(inp);
              inputs[c.key] = inp;
            } else if(c.type === 'text'){
              td.textContent = String(row[c.key] != null ? row[c.key] : '');
            } else {
              // var or expr: display numeric value
              const v = row[c.key];
              if(typeof v === 'number'){
                td.textContent = Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
              } else {
                td.textContent = String(v != null ? v : '');
              }
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
          inputsByRowAndKey[rIdx] = inputs;
        });
        tbl.appendChild(tbody);
        tableHost.appendChild(tbl);
      }

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Korrektur';
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = 'Neu generieren';
      buttons.appendChild(checkBtn); buttons.appendChild(newBtn);

      checkBtn.addEventListener('click', () => {
        const totalCells = rowCount * answerCols.length;
        if(totalCells === 0){ fb.bad('Keine Antwort-Zellen.'); return; }
        let correct = 0;
        rows.forEach((row, rIdx) => {
          answerCols.forEach(c => {
            const inp = inputsByRowAndKey[rIdx][c.key];
            if(!inp) return;
            const got = u.parseNum(inp.value);
            const expected = row[c.key];
            const tol = Number(c.tolerance) || 0.01;
            inp.classList.remove('table-cell-correct', 'table-cell-wrong');
            if(got != null && expected != null && u.nearlyEqual(got, expected, tol)){
              correct++;
              inp.classList.add('table-cell-correct');
            } else {
              inp.classList.add('table-cell-wrong');
            }
          });
        });
        const maxPoints = Number(activeConfig.maxPoints) || totalCells;
        const pts = Math.round((correct / totalCells) * maxPoints * 100) / 100;
        if(correct === totalCells){
          fb.ok('Alle ' + totalCells + ' Eintraege korrekt. ' + maxPoints + ' / ' + maxPoints + ' Punkte.');
        } else {
          fb.bad(correct + ' von ' + totalCells + ' korrekt. ' + pts + ' / ' + maxPoints + ' Punkte.');
        }
        api.reportScore(pts);
      });
      newBtn.addEventListener('click', () => { generate(); fb.neutral('Neue Werte generiert.'); });

      generate();
      api.initScore(Number(activeConfig.maxPoints) || 1);
      return {};
    },
    preview(host, config){
      const activeConfig = tablePresetConfig(config);
      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3');
      h3.textContent = 'Frage';
      card.appendChild(h3);
      const q = document.createElement('p');
      q.innerHTML = activeConfig.question || '(Frage leer)';
      card.appendChild(q);

      const cols = (activeConfig.columns || []).filter(c => c && c.key);
      if(cols.length === 0){
        card.innerHTML += '<p style="color:var(--muted);font-style:italic;">(Keine Spalten definiert.)</p>';
        host.appendChild(card);
        return;
      }
      const tbl = document.createElement('table');
      tbl.className = 'table-block table-block-preview';
      // Inline styling so the preview looks like a real table inside the
      // welcome modal where the SCORM-runtime styles.css is not loaded.
      tbl.style.cssText = 'border-collapse:collapse; margin:0.4rem 0 0.8rem; width:auto; font-size:0.92rem;';
      const thead = document.createElement('thead');
      const trh = document.createElement('tr');
      cols.forEach(c => {
        const th = document.createElement('th');
        th.textContent = (c.label || c.key) + (c.unit ? ' [' + c.unit + ']' : '');
        th.style.cssText = 'padding:0.5rem 0.85rem; border:1px solid #c6d1d8; background:#eef5f8; color:#003b5c; font-weight:700; text-align:left;';
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      tbl.appendChild(thead);
      const tbody = document.createElement('tbody');
      // Static sample rows.
      const sampleRows = [
        { sample: { x: 2, a: 4, b: 3 } },
        { sample: { x: 5, a: 6, b: 2 } },
        { sample: { x: 7, a: 3, b: 5 } }
      ];
      sampleRows.forEach(sr => {
        const tr = document.createElement('tr');
        cols.forEach(c => {
          const td = document.createElement('td');
          td.style.cssText = 'padding:0.45rem 0.85rem; border:1px solid #c6d1d8; background:#fff; color:var(--text);';
          if(c.type === 'answer'){
            const inp = document.createElement('span');
            inp.className = 'bp-input';
            inp.style.cssText = 'display:inline-block; min-width:60px; padding:0.15rem 0.5rem; color:#5d6872;';
            inp.textContent = '?';
            td.appendChild(inp);
          } else if(c.type === 'text'){
            td.textContent = String(c.text || '');
          } else if(c.type === 'var'){
            const v = sr.sample[c.key];
            td.textContent = v != null ? String(v) : (Math.floor(Math.random()*9)+1);
          } else if(c.type === 'expr'){
            try {
              const v = window.BlockUtils.safeMathExpr(c.formula || '0', sr.sample);
              td.textContent = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : Math.round(v*100)/100) : '?';
            } catch(e){ td.textContent = '?'; }
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      card.appendChild(tbl);
      const btn = document.createElement('span');
      btn.textContent = 'Korrektur';
      btn.className = 'bp-btn';
      btn.style.marginTop = '0.8rem';
      btn.style.display = 'inline-block';
      card.appendChild(btn);
      host.appendChild(card);
    }
  });

  function tablePresetConfig(config){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const base = Object.assign({}, config, { shuffleRows: false });
    if(config.preset === 'linear'){
      return Object.assign(base, {
        question: 'Berechnen Sie $f(x) = 2x + 1$ für die gegebenen Werte.',
        columns: [
          { key:'x',  label:'x',    type:'var',    min:1, max:9, integer:true },
          { key:'fx', label:'f(x)', type:'answer', formula:'2*x + 1', tolerance:0.01 }
        ],
        rowCount: 4, maxPoints: 4
      });
    }
    if(config.preset === 'quadratic'){
      return Object.assign(base, {
        question: 'Berechnen Sie $f(x) = x^2$ für die gegebenen Werte.',
        columns: [
          { key:'x',  label:'x',    type:'var',    min:1, max:9, integer:true },
          { key:'fx', label:'f(x)', type:'answer', formula:'x^2', tolerance:0.01 }
        ],
        rowCount: 4, maxPoints: 4
      });
    }
    if(config.preset === 'area-rect'){
      return Object.assign(base, {
        question: 'Berechnen Sie die Flaeche $A = a \\cdot b$ des Rechtecks.',
        columns: [
          { key:'a', label:'a', type:'var', min:2, max:9, integer:true, unit:'cm' },
          { key:'b', label:'b', type:'var', min:2, max:9, integer:true, unit:'cm' },
          { key:'A', label:'A', type:'answer', formula:'a*b', tolerance:0.01, unit:'cm²' }
        ],
        rowCount: 3, maxPoints: 3
      });
    }
    return config;
  }
})();
