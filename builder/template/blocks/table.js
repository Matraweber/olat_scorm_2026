(function(){
  'use strict';

  Blocks.register('table', {
    label: 'Tabelle',
    labelKey: 'block.table.label',
    description: 'Werte-Tabelle mit Spalten als Variable, Text, berechnet oder Eingabefeld.',
    descKey: 'block.table.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
    icon: 'table',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: '',
        variables: [],
        columns: [],
        rowCount: 4,
        shuffleRows: false,
        maxPoints: 1
      };
    },
    summary(cfg){
      const c = (cfg.columns || []).length;
      const r = Number(cfg.rowCount) || 0;
      const hasT = window.BlockUtils && typeof window.BlockUtils.t === 'function';
      return hasT
        ? window.BlockUtils.t('block.table.summary', { cols: c, rows: r })
        : (c + ' Spalten, ' + r + ' Zeilen');
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const w = [];
      const cols = cfg.columns || [];
      const hasT = window.BlockUtils && typeof window.BlockUtils.t === 'function';
      if(cols.length < 2){
        w.push(hasT ? window.BlockUtils.t('block.table.validate.minColumns') : 'Mindestens zwei Spalten erforderlich.');
      }
      if(!cols.some(c => c.type === 'answer')){
        w.push(hasT ? window.BlockUtils.t('block.table.validate.needAnswerColumn') : 'Mindestens eine Antwort-Spalte erforderlich.');
      }
      return w;
    },
    previewConfig(){
      const u = window.BlockUtils || {};
      const t = (typeof u.t === 'function') ? u.t : (k => k);
      return {
        blockTitle: '', preset: 'custom',
        question: t('block.table.preview.defaultQuestion'),
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
        { key:'blockTitle', label:'Überschrift', labelKey:'block.table.field.blockTitle.label',
          type:'text', placeholder:'Wertetabelle', placeholderKey:'block.table.field.blockTitle.placeholder' },
        { key:'preset', label:'Vorlage', labelKey:'block.table.field.preset.label', type:'select', options:[
          {value:'custom',     label:'Manuell (leer)',            labelKey:'block.table.field.preset.option.custom'},
          {value:'linear',     label:'Beispiel: f(x) = 2x + 1',   labelKey:'block.table.field.preset.option.linear'},
          {value:'quadratic',  label:'Beispiel: f(x) = x^2',      labelKey:'block.table.field.preset.option.quadratic'},
          {value:'area-rect',  label:'Beispiel: Rechteck-Fläche A = a*b', labelKey:'block.table.field.preset.option.area-rect'}
        ], help:'Bei "Manuell" eigene Spalten und Formeln festlegen.', helpKey:'block.table.field.preset.help' },
        { type:'action', label:'Zurücksetzen', labelKey:'block.table.field.reset.label', action:'reset', showIf: isCustom },

        { type:'section', label:'Frage', labelKey:'block.table.field.sectionQuestion.label', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Aufgabentext', labelKey:'block.table.field.question.label',
          type:'math-textarea', rows:2, showIf: isCustom,
          help:'KaTeX wird gerendert. Beispiel: $f(x) = 2x + 1$.', helpKey:'block.table.field.question.help' },

        // Top-level variables are generated once per row and shared across
        // every column's formula. Keeps min/max in one place when the same
        // value (e.g. a numerator and denominator) feeds several columns.
        { type:'section', label:'Variablen', labelKey:'block.table.field.sectionVariables.label', key:'_sec_vars', showIf: isCustom },
        { key:'variables', label:'Variablen', labelKey:'block.table.field.variables.label',
          type:'list', itemLabel:'Variable', itemLabelKey:'block.table.field.variables.itemLabel',
          showIf: isCustom,
          help:'Pro Zeile neu gewürfelt. Werden über ihren Namen in Spalten-Formeln referenziert.',
          helpKey:'block.table.field.variables.help',
          itemSummary: item => {
            if(!item || !item.name) return '...';
            const range = (item.min ?? '?') + ' bis ' + (item.max ?? '?');
            return item.name + '  ·  ' + range + (item.integer === false ? '' : '  (ganz)');
          },
          itemSchema:[
            { key:'name', label:'Name', labelKey:'block.table.field.variables.name.label',
              type:'text', placeholder:'z. B. n', placeholderKey:'block.table.field.variables.name.placeholder',
              help:'Nur Buchstaben/Ziffern.', helpKey:'block.table.field.variables.name.help' },
            { type:'section', label:'Bereich', labelKey:'block.table.field.variables.sectionRange.label', key:'_var_range' },
            { key:'min', label:'Min', labelKey:'block.table.field.variables.min.label', type:'number', step:1 },
            { key:'max', label:'Max', labelKey:'block.table.field.variables.max.label', type:'number', step:1 },
            { key:'integer', label:'Ganzzahlig', labelKey:'block.table.field.variables.integer.label', type:'boolean' }
          ] },

        { type:'section', label:'Spalten', labelKey:'block.table.field.sectionColumns.label', key:'_sec_cols', showIf: isCustom },
        { key:'columns', label:'Spalten', labelKey:'block.table.field.columns.label',
          type:'list', itemLabel:'Spalte', itemLabelKey:'block.table.field.columns.itemLabel',
          showIf: isCustom,
          itemSummary: item => {
            const u = window.BlockUtils;
            const tt = (u && typeof u.t === 'function') ? u.t : (k => k);
            const typeLabel = tt('block.table.typeShort.' + (item.type || 'text'));
            return (item.label || '...') + '  ·  ' + typeLabel;
          },
          itemSchema:[
            // Header + key share a row.
            { key:'label', label:'Spaltenkopf', labelKey:'block.table.field.columns.label.label',
              type:'text', placeholder:'z. B. f(x) = 2*x + 1', placeholderKey:'block.table.field.columns.label.placeholder',
              help:'Schreibe „Name = Term", damit die Formel automatisch übernommen wird.',
              helpKey:'block.table.field.columns.label.help',
              onChange: (val, item, set) => {
                if(item.type !== 'expr' && item.type !== 'answer') return;
                const derived = deriveFormulaFromLabel(val);
                if(!derived) return;
                const previous = item._derivedFormula || '';
                const userTouched = item.formula && item.formula !== previous;
                if(userTouched) return;
                set('formula', derived);
                set('_derivedFormula', derived);
                const fld = document.querySelector('[data-formula-field-key="formula"]');
                if(fld) fld.dispatchEvent(new CustomEvent('formula-field-set', { detail: { value: derived } }));
              } },
            { key:'key', label:'Schlüssel', labelKey:'block.table.field.columns.key.label',
              type:'text', placeholder:'z. B. x', placeholderKey:'block.table.field.columns.key.placeholder',
              help:'Interner Name für Formeln. Nur Buchstaben/Ziffern.', helpKey:'block.table.field.columns.key.help' },

            // Type selector on its own row so the long option labels fit.
            { type:'section', label:'Quelle', labelKey:'block.table.field.columns.sectionSource.label', key:'_col_src' },
            { key:'type', label:'Typ', labelKey:'block.table.field.columns.type.label', type:'select', options:[
              {value:'var',    label:'Zufallswert',                            labelKey:'block.table.field.columns.type.option.var'},
              {value:'answer', label:'Antwortfeld (Studierende füllen aus)', labelKey:'block.table.field.columns.type.option.answer'},
              {value:'expr',   label:'Berechnet (automatisch)',               labelKey:'block.table.field.columns.type.option.expr'},
              {value:'text',   label:'Statischer Text',                       labelKey:'block.table.field.columns.type.option.text'}
            ]},

            // Random-value fields. Min/Max sit together, integer + formula below.
            { type:'section', label:'Bereich', labelKey:'block.table.field.columns.sectionRange.label', key:'_col_var_range',
              showIf: it => it.type === 'var' },
            { key:'min', label:'Min', labelKey:'block.table.field.columns.min.label',
              type:'number', step:1, showIf: it => it.type === 'var',
              disabledIf: it => !!(it.formula && String(it.formula).trim()),
              disabledHint: (window.BlockUtils && typeof window.BlockUtils.t === 'function')
                ? window.BlockUtils.t('block.table.field.columns.min.disabledHint')
                : 'Ohne Effekt: die Formel ersetzt den Zufallswert.',
              disabledHintKey: 'block.table.field.columns.min.disabledHint' },
            { key:'max', label:'Max', labelKey:'block.table.field.columns.max.label',
              type:'number', step:1, showIf: it => it.type === 'var',
              disabledIf: it => !!(it.formula && String(it.formula).trim()),
              disabledHint: (window.BlockUtils && typeof window.BlockUtils.t === 'function')
                ? window.BlockUtils.t('block.table.field.columns.max.disabledHint')
                : 'Ohne Effekt: die Formel ersetzt den Zufallswert.',
              disabledHintKey: 'block.table.field.columns.max.disabledHint' },
            { type:'section', key:'_col_var_extras',
              showIf: it => it.type === 'var' },
            { key:'integer', label:'Ganzzahlig', labelKey:'block.table.field.columns.integer.label',
              type:'boolean', showIf: it => it.type === 'var' },
            { key:'formula', label:'Formel (optional)', labelKey:'block.table.field.columns.varFormula.label',
              type:'text', placeholder:'z. B. 5 * k', placeholderKey:'block.table.field.columns.varFormula.placeholder',
              help:'Wenn gesetzt, ersetzt sie den Zufallswert. Greift auf Top-Level-Variablen zu. Beispiel: Variable k = 0..72 ganz, Formel „5 * k" liefert zufällige Vielfache von 5 zwischen 0 und 360.',
              helpKey:'block.table.field.columns.varFormula.help',
              showIf: it => it.type === 'var' },

            // Static-text field gets its own row.
            { type:'section', key:'_col_text',
              showIf: it => it.type === 'text' },
            { key:'text', label:'Text', labelKey:'block.table.field.columns.text.label',
              type:'text', showIf: it => it.type === 'text' },

            // Formula + tolerance only show for computed / answer columns.
            { type:'section', label:'Formel', labelKey:'block.table.field.columns.sectionFormula.label', key:'_col_formula',
              showIf: it => it.type === 'expr' || it.type === 'answer' },
            { key:'formula', label:'Formel', labelKey:'block.table.field.columns.formula.label',
              type:'text', placeholder:'z. B. 2*x + 1', placeholderKey:'block.table.field.columns.formula.placeholder',
              help:'Verwendet andere Spalten-Schlüssel und Variablen.', helpKey:'block.table.field.columns.formula.help',
              showIf: it => it.type === 'expr' || it.type === 'answer' },
            { key:'tolerance', label:'Toleranz', labelKey:'block.table.field.columns.tolerance.label',
              type:'number', step:0.01, default:0.01,
              help:'Erlaubte Abweichung der Studierenden-Antwort.', helpKey:'block.table.field.columns.tolerance.help',
              showIf: it => it.type === 'answer' },

            // Unit is always optional and shown last.
            { type:'section', label:'Anzeige', labelKey:'block.table.field.columns.sectionDisplay.label', key:'_col_display' },
            { key:'unit', label:'Einheit (optional)', labelKey:'block.table.field.columns.unit.label',
              type:'text', placeholder:'z. B. cm', placeholderKey:'block.table.field.columns.unit.placeholder' },
            { key:'fraction', label:'Als Bruch anzeigen', labelKey:'block.table.field.columns.fraction.label',
              type:'boolean',
              help:'Dezimalwerte wie 4.5 werden als Bruch (\\frac{9}{2}) gerendert. Ohne Effekt bei ganzzahligen Werten.',
              helpKey:'block.table.field.columns.fraction.help' }
          ]},

        { type:'section', label:'Zeilen', labelKey:'block.table.field.sectionRows.label', key:'_sec_rows', showIf: isCustom },
        { key:'rowCount', label:'Anzahl Zeilen', labelKey:'block.table.field.rowCount.label',
          type:'number', step:1, min:1, max:20 },

        { type:'section', label:'Bewertung', labelKey:'block.table.field.sectionScoring.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', labelKey:'block.table.field.maxPoints.label',
          type:'number', step:1, min:1,
          help:'Wird gleichmaessig auf alle Antwort-Zellen verteilt.', helpKey:'block.table.field.maxPoints.help' },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = window.BlockUtils;
      const activeConfig = tablePresetConfig(config, (window.BlockUtils && window.BlockUtils.getLocale && window.BlockUtils.getLocale()) || 'de');
      const ui = u.simpleQuestionCard(host, {
        title: u.l(activeConfig.blockTitle) || api.utils.t('block.table.defaultTitle'),
        question: u.l(activeConfig.question) || ''
      });
      const { content, buttons, fb } = ui;

      const cols = (activeConfig.columns || []).filter(c => c && c.key);
      const rowCount = Math.max(1, Math.min(20, Number(activeConfig.rowCount) || 1));
      const answerCols = cols.filter(c => c.type === 'answer');
      if(cols.length === 0 || answerCols.length === 0){
        content.innerHTML = '<div style="color:var(--muted); font-style:italic;">' + api.utils.t('block.table.emptyState') + '</div>';
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
        } catch{ return null; }
      }

      const topVars = (activeConfig.variables || []).filter(v => v && v.name);

      // Roll one set of top-level variable values (used per row so each row
      // gets its own random numerator / denominator / …).
      function genTopVars(){
        const out = {};
        topVars.forEach(v => {
          const lo = Number(v.min); const hi = Number(v.max);
          const a = isNaN(lo) ? 1 : lo;
          const b = isNaN(hi) ? 10 : hi;
          let val = a + Math.random() * (b - a);
          if(v.integer !== false) val = Math.round(val);
          else val = Math.round(val * 100) / 100;
          out[v.name] = val;
        });
        return out;
      }

      function generate(){
        rows = [];
        for(let r = 0; r < rowCount; r++){
          // Top-level variables roll fresh per row so a column like "n/d"
          // gets a different pair each row.
          const rowVars = genTopVars();
          const row = Object.assign({}, rowVars);
          // Pass 1: variable + text columns. A var column with a formula
          // computes its value from top-level variables instead of rolling
          // a random number in [min, max].
          cols.forEach(c => {
            if(c.type === 'var'){
              let v;
              if(c.formula && String(c.formula).trim()){
                v = evalExpr(c.formula, row);
                if(v == null){
                  // Bad formula: fall back to the random base so the row
                  // still has a numeric value instead of NaN.
                  const min = Number(c.min); const max = Number(c.max);
                  const lo = isNaN(min) ? 1 : min;
                  const hi = isNaN(max) ? 10 : max;
                  v = lo + Math.random() * (hi - lo);
                }
              } else {
                const min = Number(c.min); const max = Number(c.max);
                const lo = isNaN(min) ? 1 : min;
                const hi = isNaN(max) ? 10 : max;
                v = lo + Math.random() * (hi - lo);
              }
              const hasFormula = !!(c.formula && String(c.formula).trim());
              if(c.integer !== false){
                v = Math.round(v);
              } else if(!hasFormula){
                // Tidy a random non-integer to 2 decimals. A formula result
                // keeps full precision so a clean fraction (2/7) can be
                // recovered for display instead of a rounding artefact
                // (0.29 -> 29/100).
                v = Math.round(v * 100) / 100;
              }
              row[c.key] = v;
            } else if(c.type === 'text'){
              row[c.key] = String(u.l(c.text) || '');
            }
          });
          // Pass 2: computed + answer-target columns. Formula context sees
          // top-level variables, var-columns, and any earlier expr columns.
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
          // innerHTML so headers can carry LaTeX ($\frac{1}{2}$, \sqrt{x}…),
          // KaTeX picks it up below via renderMath().
          const headLabel = (u.l(c.label) || c.key) + (c.unit ? ' [' + u.l(c.unit) + ']' : '');
          th.innerHTML = headLabel;
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
              // Static text cells may contain LaTeX too.
              const text = String(row[c.key] != null ? row[c.key] : '');
              if(/[\\$]/.test(text)) td.innerHTML = text;
              else td.textContent = text;
            } else {
              // var or expr: numeric value. Render as KaTeX fraction when
              // the column opts in and the value has a clean small-denom
              // fraction representation. Integers stay as plain digits.
              const v = row[c.key];
              if(typeof v === 'number'){
                let shown = null;
                if(c.fraction && !Number.isInteger(v)){
                  const frac = u.asFraction(v);
                  if(frac && Math.abs(frac.den) > 1 && Math.abs(frac.den) <= 100){
                    const sign = frac.num < 0 ? '-' : '';
                    shown = '$' + sign + '\\frac{' + Math.abs(frac.num) + '}{' + frac.den + '}$';
                  }
                }
                if(shown != null){
                  td.innerHTML = shown;
                } else {
                  td.textContent = Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
                }
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
        // Typeset any LaTeX in headers + text cells.
        if(u.renderMath) u.renderMath(tbl);
      }

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = api.utils.t('common.check');
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = api.utils.t('common.regenerate');
      buttons.appendChild(checkBtn); buttons.appendChild(newBtn);

      checkBtn.addEventListener('click', () => {
        const totalCells = rowCount * answerCols.length;
        if(totalCells === 0){ fb.bad(api.utils.t('block.table.feedback.noAnswerCells')); return; }
        // No cell filled at all: prompt instead of recording a 0.
        const anyFilled = rows.some((row, rIdx) => answerCols.some(c => {
          const inp = inputsByRowAndKey[rIdx][c.key];
          return inp && String(inp.value || '').trim() !== '';
        }));
        if(!anyFilled){ fb.bad(api.utils.t('block.table.feedback.fillAtLeastOne')); return; }
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
          fb.ok(api.utils.t('block.table.feedback.allCorrect', { total: totalCells, max: maxPoints }));
        } else {
          fb.bad(api.utils.t('block.table.feedback.someCorrect', { correct: correct, total: totalCells, pts: pts, max: maxPoints }));
        }
        api.reportScore(pts);
      });
      newBtn.addEventListener('click', () => { generate(); fb.neutral(api.utils.t('block.table.feedback.newValues')); });
      window.BlockUtils.regenPolicy(newBtn, config, api);

      generate();
      // Render KaTeX over the whole card so the question text + any LaTeX
      // in headers/text cells are typeset (works for $...$, \(...\), \[...\]).
      if(u.renderMath) u.renderMath(ui.card);
      api.initScore(Number(activeConfig.maxPoints) || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const activeConfig = tablePresetConfig(config, (window.BlockUtils && window.BlockUtils.getLocale && window.BlockUtils.getLocale()) || 'de');
      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3');
      h3.textContent = u.t('common.question');
      card.appendChild(h3);
      const q = document.createElement('p');
      q.innerHTML = u.l(activeConfig.question) || u.t('block.table.preview.questionEmpty');
      card.appendChild(q);

      const cols = (activeConfig.columns || []).filter(c => c && c.key);
      if(cols.length === 0){
        card.innerHTML += '<p style="color:var(--muted);font-style:italic;">' + u.t('block.table.preview.noColumns') + '</p>';
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
        th.textContent = (u.l(c.label) || c.key) + (c.unit ? ' [' + u.l(c.unit) + ']' : '');
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
            td.textContent = String(u.l(c.text) || '');
          } else if(c.type === 'var'){
            const v = sr.sample[c.key];
            td.textContent = v != null ? String(v) : (Math.floor(Math.random()*9)+1);
          } else if(c.type === 'expr'){
            try {
              const v = window.BlockUtils.safeMathExpr(c.formula || '0', sr.sample);
              td.textContent = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : Math.round(v*100)/100) : '?';
            } catch{ td.textContent = '?'; }
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      card.appendChild(tbl);
      const btn = document.createElement('span');
      btn.textContent = u.t('common.check');
      btn.className = 'bp-btn';
      btn.style.marginTop = '0.8rem';
      btn.style.display = 'inline-block';
      card.appendChild(btn);
      host.appendChild(card);
    }
  });

  function tablePresetConfig(config, locale){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const u = window.BlockUtils || {};
    const loc = locale || (u.getLocale && u.getLocale()) || 'de';
    const en = loc === 'en';
    const base = Object.assign({}, config, { shuffleRows: false });
    if(config.preset === 'linear'){
      return Object.assign(base, {
        question: en
          ? 'Compute $f(x) = 2x + 1$ for the given values.'
          : 'Berechnen Sie $f(x) = 2x + 1$ für die gegebenen Werte.',
        columns: [
          { key:'x',  label:'x',    type:'var',    min:1, max:9, integer:true },
          { key:'fx', label:'f(x)', type:'answer', formula:'2*x + 1', tolerance:0.01 }
        ],
        rowCount: 4, maxPoints: 4
      });
    }
    if(config.preset === 'quadratic'){
      return Object.assign(base, {
        question: en
          ? 'Compute $f(x) = x^2$ for the given values.'
          : 'Berechnen Sie $f(x) = x^2$ für die gegebenen Werte.',
        columns: [
          { key:'x',  label:'x',    type:'var',    min:1, max:9, integer:true },
          { key:'fx', label:'f(x)', type:'answer', formula:'x^2', tolerance:0.01 }
        ],
        rowCount: 4, maxPoints: 4
      });
    }
    if(config.preset === 'area-rect'){
      return Object.assign(base, {
        question: en
          ? 'Compute the area $A = a \\cdot b$ of the rectangle.'
          : 'Berechnen Sie die Flaeche $A = a \\cdot b$ des Rechtecks.',
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

  // Column-header to formula: "f(x) = 2*x + 1" -> "2*x + 1". Returns null
  // when there is no "=" so plain headers like "x" or "f(x)" never overwrite
  // a real formula. Mirrors deriveFormula() in numeric-input for consistency.
  function deriveFormulaFromLabel(label){
    if(!label || typeof label !== 'string') return null;
    const eq = label.indexOf('=');
    if(eq < 0) return null;
    let s = label.slice(eq + 1);
    // LaTeX -> ASCII via the shared utils helper.
    const u = (typeof window !== 'undefined' && window.BlockUtils) || null;
    if(u && u.latexToAscii) s = u.latexToAscii(s);
    s = s.replace(/\{([^{}]*)\}/g, '($1)');
    s = s.replace(/[·×∙]/g, '*').replace(/÷|:/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt');
    s = s.replace(/\$/g, '').trim();
    // Strip trailing punctuation that came from a sentence-final label.
    s = s.replace(/[\s.,;:!?]+$/g, '');
    return s || null;
  }
})();
