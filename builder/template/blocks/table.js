(function(){
  'use strict';

  Blocks.register('table', {
    label: 'Tabelle',
    labelKey: 'block.table.label',
    description: 'Wertetabelle, Richtig/Falsch-Aussagen, Auswahl-Matrix oder freie Tabelle mit Antwortzellen.',
    descKey: 'block.table.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
    icon: 'table',
    graded: true,
    // Free table with "Punkte je Zelle": total = sum of the cells' points.
    maxPointsFor(cfg){
      if(cfg && (cfg.preset || 'custom') === 'custom' && cfg.mode === 'grid' && cfg.gridCellPoints) return gridMaxPoints(cfg);
      return Number(cfg && cfg.maxPoints) || 1;
    },
    // Course-wide variables: a drawn set is fine for the free table if some
    // draw of the table's own variables gives every number cell a result.
    acceptsGlobals(cfg, globals){
      if(!cfg || (cfg.preset || 'custom') !== 'custom' || cfg.mode !== 'grid') return true;
      const U = window.BlockUtils;
      const { rows, cols, cells } = gridModel(cfg);
      const tries = (cfg.variables || []).some(v => v && v.name) ? (cfg.integerAnswers ? 1000 : 200) : 1;
      for(let i = 0; i < tries; i++){
        const vars = Object.assign(gridGenVars(cfg), U.withGlobalVars({}, cfg.variables, globals));
        const ok = rows.every(r => cols.every(c => {
          if(gridKind(r, c) !== 'numeric') return true;
          const f = String((cells[r.id + '|' + c.id] || {}).formula || '').trim();
          if(!f) return true;
          const v = U.safeMathExpr(U.applyAngleUnit(f, cfg.angleUnit), vars);
          return typeof v === 'number' && Number.isFinite(v) && (!cfg.integerAnswers || U.isWholeNumber(v));
        }));
        if(ok) return true;
      }
      return false;
    },
    defaultConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: '',
        variables: [],
        columns: [],
        rowCount: 4,
        shuffleRows: false,
        maxPoints: 1,
        // Richtig/Falsch mode
        mode: 'values',
        statements: [],
        tfUnanswered: true,
        // Deduction for wrong answers (true/false + matrix modes)
        penalizeWrong: false,
        penaltyPoints: '',
        // Auswahl-Matrix mode (the builder editor fills in a 3 × 3 grid)
        matrix: null,
        matrixSingle: false,
        matrixScoring: 'cell',
        // Freie Tabelle mode (the builder editor fills in a starter grid)
        grid: null,
        gridTolerance: 0.01,
        gridIgnoreCase: true,
        gridLines: false,
        gridHeaderRow: false,
        gridHeaderCol: true,
        gridHeaderColWidth: '',
        gridHeaderColGap: 24,
        gridHeaderRowGap: 8,
        gridCellPoints: false
      };
    },
    summary(cfg){
      if(cfg.mode === 'grid'){
        const g = cfg.grid || {};
        const u = window.BlockUtils;
        const p = { rows: (g.rows || []).length, cols: (g.cols || []).length, answers: gridAnswerCount(g) };
        return (u && typeof u.t === 'function') ? u.t('block.table.grid.summary', p) : (p.rows + ' × ' + p.cols + ' Tabelle');
      }
      if(cfg.mode === 'matrix'){
        const m = cfg.matrix || {};
        const u = window.BlockUtils;
        const p = { rows: (m.rows || []).length, cols: (m.cols || []).length };
        return (u && typeof u.t === 'function') ? u.t('block.table.mx.summary', p) : (p.rows + ' × ' + p.cols + ' Matrix');
      }
      if(cfg.mode === 'truefalse'){
        const n = (cfg.statements || []).length;
        const u = window.BlockUtils;
        return (u && typeof u.t === 'function') ? u.t('block.table.tf.summary', { n }) : (n + ' Aussagen (Richtig/Falsch)');
      }
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
      if(cfg.mode === 'grid'){
        const u = window.BlockUtils;
        const t = (k, p) => (u && typeof u.t === 'function') ? u.t(k, p) : k;
        const g = cfg.grid || {};
        const rows = g.rows || [], cols = g.cols || [], cells = g.cells || {};
        if(!rows.length || !cols.length) w.push(t('block.table.grid.validate.needRowsCols'));
        if(!gridAnswerCount(g)) w.push(t('block.table.grid.validate.noAnswerCell'));
        else {
          // Answer cells exist but none counts for points: everything would be ungraded.
          const graded = (g.rows || []).some(r => (g.cols || []).some(c => gridKind(r, c) !== 'text' && ((g.cells || {})[r.id + '|' + c.id] || {}).graded !== false));
          if(!graded) w.push(t('block.table.grid.validate.noGradedCell'));
        }
        rows.forEach((r, ri) => cols.forEach((c, ci) => {
          const kind = r.kind || c.kind || 'text';
          const cell = cells[r.id + '|' + c.id] || {};
          const pos = { row: ri + 1, col: ci + 1 };
          if(kind === 'numeric' && !String(cell.formula || '').trim()) w.push(t('block.table.grid.validate.missingFormula', pos));
          if(kind === 'textAnswer' && !String((u && u.l ? u.l(cell.answers) : cell.answers) || '').trim()) w.push(t('block.table.grid.validate.missingAnswers', pos));
          if(kind === 'choice' && String((u && u.l ? u.l(cell.options) : cell.options) || '').split('|').map(s => s.trim()).filter(Boolean).length < 2) w.push(t('block.table.grid.validate.missingOptions', pos));
        }));
        return w;
      }
      if(cfg.mode === 'matrix'){
        const u = window.BlockUtils;
        const t = (k, p) => (u && typeof u.t === 'function') ? u.t(k, p) : k;
        const m = cfg.matrix || {};
        const rows = m.rows || [], cols = m.cols || [], correct = m.correct || [];
        if(!rows.length || !cols.length) w.push(t('block.table.mx.validate.needRowsCols'));
        if(rows.some(r => !String(r.label || '').trim()) || cols.some(c => !String(c.label || '').trim())) w.push(t('block.table.mx.validate.emptyLabel'));
        const valid = correct.filter(k => { const [r, c] = k.split('|'); return rows.some(x => x.id === r) && cols.some(x => x.id === c); });
        if(!valid.length) w.push(t('block.table.mx.validate.noCorrect'));
        if(cfg.matrixSingle && rows.some(r => valid.filter(k => k.startsWith(r.id + '|')).length !== 1)) w.push(t('block.table.mx.validate.singleNeedsOne'));
        return w;
      }
      if(cfg.mode === 'truefalse'){
        const u = window.BlockUtils;
        const t = (k, p) => (u && typeof u.t === 'function') ? u.t(k, p) : k;
        const st = cfg.statements || [];
        if(st.length === 0) w.push(t('block.table.tf.validate.noStatements'));
        st.forEach((s, i) => {
          if(!String((u && u.l ? u.l(s && s.text) : (s && s.text)) || '').trim()) w.push(t('block.table.tf.validate.emptyStatement', { n: i + 1 }));
        });
        return w;
      }
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
      // Four modes: value table (columns/rows/formulas, default), true/false
      // statements (Unbeantwortet | Richtig | Falsch per row), choice matrix
      // (rows × columns to tick) and free table (grid of text/answer cells).
      const isTF     = c => isCustom(c) && c.mode === 'truefalse';
      const isMatrix = c => isCustom(c) && c.mode === 'matrix';
      const isGrid   = c => isCustom(c) && c.mode === 'grid';
      const isValues = c => isCustom(c) && !isTF(c) && !isMatrix(c) && !isGrid(c);
      // Variables + decimals are shared by the value table and the free table.
      const hasVars  = c => isValues(c) || isGrid(c);
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
        { key:'mode', label:'Art der Tabelle', labelKey:'block.table.field.mode.label', type:'select', showIf: isCustom, options:[
          {value:'values',    label:'Wertetabelle (Variablen, Formeln, Eingabefelder)', labelKey:'block.table.field.mode.option.values'},
          {value:'truefalse', label:'Richtig/Falsch-Aussagen',                          labelKey:'block.table.field.mode.option.truefalse'},
          {value:'matrix',    label:'Auswahl-Matrix (Zeilen × Spalten ankreuzen)',      labelKey:'block.table.field.mode.option.matrix'},
          {value:'grid',      label:'Freie Tabelle (Text- und Antwortzellen frei anordnen)', labelKey:'block.table.field.mode.option.grid'}
        ], help:'Richtig/Falsch: pro Zeile eine Aussage, die als richtig oder falsch markiert wird. Auswahl-Matrix: Zeilen × Spalten zum Ankreuzen. Freie Tabelle: Text- und Antwortzellen (Zahl oder Text) beliebig anordnen.', helpKey:'block.table.field.mode.help' },

        { type:'section', label:'Frage', labelKey:'block.table.field.sectionQuestion.label', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Aufgabentext', labelKey:'block.table.field.question.label',
          type:'math-textarea', rows:2, showIf: isCustom,
          help:'KaTeX wird gerendert. Beispiel: $f(x) = 2x + 1$.', helpKey:'block.table.field.question.help' },

        // Top-level variables are generated once per row and shared across
        // every column's formula. Keeps min/max in one place when the same
        // value (e.g. a numerator and denominator) feeds several columns.
        { type:'section', label:'Variablen', labelKey:'block.table.field.sectionVariables.label', key:'_sec_vars', showIf: hasVars },
        { key:'variables', label:'Variablen', labelKey:'block.table.field.variables.label',
          type:'list', itemLabel:'Variable', itemLabelKey:'block.table.field.variables.itemLabel',
          showIf: hasVars,
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
            { key:'min', label:'Min', labelKey:'block.table.field.variables.min.label', type:'number', step:'any' },
            { key:'max', label:'Max', labelKey:'block.table.field.variables.max.label', type:'number', step:'any' },
            { key:'integer', label:'Ganzzahlig', labelKey:'block.table.field.variables.integer.label', type:'boolean' },
            // Only used in formulas, so decimals only (no display choice).
            ...window.BlockUtils.varItemFormatFields(item => item.integer !== false, { noDisplay: true })
          ] },
        // Task-wide decimals for random values (variables + random columns).
        // Value table: decimals only (columns have their own fraction switch).
        ...window.BlockUtils.varFormatSchemaFields({ showIf: isValues, noDisplay: true }),
        // Free table: decimals + how decimal values appear in cells (default: decimal).
        ...window.BlockUtils.varFormatSchemaFields({ showIf: isGrid, defaultDisplay: 'decimal' }),
        window.BlockUtils.integerAnswersSchemaField({ showIf: isValues, helpKey: 'block.table.field.integerAnswers.valuesHelp' }),
        window.BlockUtils.integerAnswersSchemaField({ showIf: isGrid, helpKey: 'block.table.field.integerAnswers.gridHelp' }),

        { type:'section', label:'Spalten', labelKey:'block.table.field.sectionColumns.label', key:'_sec_cols', showIf: isValues },
        { key:'columns', label:'Spalten', labelKey:'block.table.field.columns.listLabel',
          type:'list', itemLabel:'Spalte', itemLabelKey:'block.table.field.columns.itemLabel',
          showIf: isValues,
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
              type:'number', step:'any', showIf: it => it.type === 'var',
              disabledIf: it => !!(it.formula && String(it.formula).trim()),
              disabledHint: (window.BlockUtils && typeof window.BlockUtils.t === 'function')
                ? window.BlockUtils.t('block.table.field.columns.min.disabledHint')
                : 'Ohne Effekt: die Formel ersetzt den Zufallswert.',
              disabledHintKey: 'block.table.field.columns.min.disabledHint' },
            { key:'max', label:'Max', labelKey:'block.table.field.columns.max.label',
              type:'number', step:'any', showIf: it => it.type === 'var',
              disabledIf: it => !!(it.formula && String(it.formula).trim()),
              disabledHint: (window.BlockUtils && typeof window.BlockUtils.t === 'function')
                ? window.BlockUtils.t('block.table.field.columns.max.disabledHint')
                : 'Ohne Effekt: die Formel ersetzt den Zufallswert.',
              disabledHintKey: 'block.table.field.columns.max.disabledHint' },
            { type:'section', key:'_col_var_extras',
              showIf: it => it.type === 'var' },
            { key:'integer', label:'Ganzzahlig', labelKey:'block.table.field.columns.integer.label',
              type:'boolean', showIf: it => it.type === 'var' },
            { key:'decimals', label:'Nachkommastellen (leer = wie Tabelle)', labelKey:'block.table.field.columns.decimals.label',
              type:'number', step:1, min:0, max:6, default:'',
              showIf: it => it.type === 'var' && it.integer === false && !(it.formula && String(it.formula).trim()) },
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

        { type:'section', label:'Zeilen', labelKey:'block.table.field.sectionRows.label', key:'_sec_rows', showIf: isValues },
        { key:'rowCount', label:'Anzahl Zeilen', labelKey:'block.table.field.rowCount.label',
          type:'number', step:1, min:1, max:20, showIf: c => !c.mode || c.mode === 'values' },

        // ---- Richtig/Falsch-Aussagen ----
        { type:'section', label:'Aussagen', labelKey:'block.table.field.sectionStatements.label', key:'_sec_tf', showIf: isTF },
        { key:'statements', label:'Aussagen', labelKey:'block.table.field.statements.label',
          type:'list', itemLabel:'Aussage', itemLabelKey:'block.table.field.statements.itemLabel',
          showIf: isTF,
          help:'Jede Aussage wird eine Zeile. $…$ für Formeln, Zeilenumbrüche bleiben erhalten.', helpKey:'block.table.field.statements.help',
          itemSummary: item => {
            const u = window.BlockUtils;
            const txt = String((u && u.l ? u.l(item.text) : item.text) || '…').replace(/\s+/g, ' ').slice(0, 60);
            return (item.correct === 'false' ? '✗ ' : '✓ ') + txt;
          },
          itemSchema:[
            { key:'text', label:'Aussage', labelKey:'block.table.field.statements.text.label', type:'math-textarea', rows:2 },
            { key:'correct', label:'Die Aussage ist', labelKey:'block.table.field.statements.correct.label', type:'select', options:[
              {value:'true',  label:'richtig', labelKey:'block.table.field.statements.correct.option.true'},
              {value:'false', label:'falsch',  labelKey:'block.table.field.statements.correct.option.false'}
            ]}
          ]},
        { key:'tfUnanswered', label:'Spalte „Unbeantwortet“ anzeigen', labelKey:'block.table.field.tfUnanswered.label', type:'boolean', showIf: isTF,
          help:'Vorausgewählt; so lassen sich Aussagen bewusst offen lassen (0 Punkte statt Abzug).', helpKey:'block.table.field.tfUnanswered.help' },
        { key:'shuffleRows', label:'Aussagen mischen', labelKey:'block.table.field.tfShuffle.label', type:'boolean', showIf: isTF },
        { key:'tfLabelTrue', label:'Spaltenkopf „Richtig“ (optional)', labelKey:'block.table.field.tfLabelTrue.label', type:'text', showIf: isTF,
          placeholder:'Richtig', placeholderKey:'block.table.tf.colTrue' },
        { key:'tfLabelFalse', label:'Spaltenkopf „Falsch“ (optional)', labelKey:'block.table.field.tfLabelFalse.label', type:'text', showIf: isTF,
          placeholder:'Falsch', placeholderKey:'block.table.tf.colFalse' },

        // ---- Freie Tabelle ----
        { type:'section', label:'Tabelle', labelKey:'block.table.field.sectionGrid.label', key:'_sec_grid', showIf: isGrid },
        { key:'grid', label:'Zeilen, Spalten und Zellen', labelKey:'block.table.field.grid.label', type:'grid-table', showIf: isGrid },
        window.BlockUtils.angleUnitSchemaField(isGrid),
        { key:'gridTolerance', label:'Toleranz für Zahl-Antworten (±)', labelKey:'block.table.field.gridTolerance.label', type:'number', step:'any', min:0,
          showIf: isGrid, help:'Gilt für alle Zahl-Antworten ohne eigene Toleranz.', helpKey:'block.table.field.gridTolerance.help' },
        { key:'gridIgnoreCase', label:'Groß-/Kleinschreibung bei Text-Antworten ignorieren', labelKey:'block.table.field.gridIgnoreCase.label', type:'boolean', showIf: isGrid },
        { type:'section', label:'Darstellung', labelKey:'block.table.field.sectionGridLayout.label', key:'_sec_grid_layout', showIf: isGrid },
        { key:'gridLines', label:'Gitterlinien anzeigen', labelKey:'block.table.field.gridLines.label', type:'boolean', showIf: isGrid },
        { key:'gridHeaderRow', label:'Erste Zeile ist Kopfzeile', labelKey:'block.table.field.gridHeaderRow.label', type:'boolean', showIf: isGrid },
        { key:'gridHeaderCol', label:'Erste Spalte ist Kopfspalte', labelKey:'block.table.field.gridHeaderCol.label', type:'boolean', showIf: isGrid },
        { key:'gridHeaderColWidth', label:'Breite der Kopfspalte (px, leer = automatisch)', labelKey:'block.table.field.gridHeaderColWidth.label', type:'number', step:10, min:0,
          showIf: c => isGrid(c) && !!c.gridHeaderCol },
        { key:'gridHeaderColGap', label:'Abstand nach der Kopfspalte (px)', labelKey:'block.table.field.gridHeaderColGap.label', type:'number', step:4, min:0,
          showIf: c => isGrid(c) && !!c.gridHeaderCol },
        { key:'gridHeaderRowGap', label:'Abstand nach der Kopfzeile (px)', labelKey:'block.table.field.gridHeaderRowGap.label', type:'number', step:4, min:0,
          showIf: c => isGrid(c) && !!c.gridHeaderRow },

        // ---- Auswahl-Matrix ----
        { type:'section', label:'Matrix', labelKey:'block.table.field.sectionMatrix.label', key:'_sec_mx', showIf: isMatrix },
        { key:'matrix', label:'Zeilen, Spalten und richtige Antworten', labelKey:'block.table.field.matrix.label', type:'choice-matrix', showIf: isMatrix },
        { key:'matrixSingle', label:'Pro Zeile nur eine Antwort', labelKey:'block.table.field.matrixSingle.label', type:'boolean', showIf: isMatrix,
          help:'An: Auswahlknöpfe statt Kästchen, je Zeile ist genau eine Spalte wählbar.', helpKey:'block.table.field.matrixSingle.help' },
        { key:'shuffleRows', label:'Zeilen mischen', labelKey:'block.table.field.matrixShuffle.label', type:'boolean', showIf: isMatrix },

        { type:'section', label:'Bewertung', labelKey:'block.table.field.sectionScoring.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', labelKey:'block.table.field.maxPoints.label',
          // Hidden when the free table sets points per cell (total = their sum).
          showIf: c => !(c.mode === 'grid' && c.gridCellPoints),
          type:'number', step:1, min:1,
          help:'Wird gleichmaessig auf alle Antwort-Zellen verteilt.', helpKey:'block.table.field.maxPoints.help' },
        { key:'matrixScoring', label:'Bewertung der Matrix', labelKey:'block.table.field.matrixScoring.label', type:'select', showIf: isMatrix,
          help:'Pro Kreuz: jedes richtige Kreuz gibt Teilpunkte. Pro Zeile: nur komplett richtig angekreuzte Zeilen zählen.',
          helpKey:'block.table.field.matrixScoring.help', options:[
            {value:'cell', label:'Pro Kreuz (Teilpunkte)',      labelKey:'block.table.field.matrixScoring.option.cell'},
            {value:'row',  label:'Pro Zeile (ganz richtig)',    labelKey:'block.table.field.matrixScoring.option.row'}
          ]},
        // Deduction for wrong answers (Richtig/Falsch + Matrix). The total never
        // drops below 0; unanswered statements / unticked boxes cost nothing.
        { key:'penalizeWrong', label:'Punkte für falsche Antworten abziehen', labelKey:'block.table.field.penalizeWrong.label', type:'boolean',
          showIf: c => isTF(c) || isMatrix(c) || isGrid(c),
          help:'Jede falsche Antwort zieht Punkte ab, die Gesamtpunktzahl fällt dabei nie unter 0. Unbeantwortetes zählt 0.', helpKey:'block.table.field.penalizeWrong.help' },
        { key:'penaltyPoints', label:'Abzug pro falscher Antwort (Punkte)', labelKey:'block.table.field.penaltyPoints.label', type:'number', step:0.25, min:0,
          placeholder:'leer = so viel wie eine richtige Antwort bringt', placeholderKey:'block.table.field.penaltyPoints.placeholder',
          showIf: c => (isTF(c) || isMatrix(c) || isGrid(c)) && tablePenaltyOn(c),
          help:'Leer lassen: Abzug entspricht dem Wert einer richtigen Antwort (Punkte geteilt durch Anzahl der Aussagen bzw. richtigen Kreuze/Zeilen).', helpKey:'block.table.field.penaltyPoints.help' },
        // Only the value table has random values, so regenerate settings live there.
        ...window.BlockUtils.regenSchemaFields(c => !c.mode || c.mode === 'values' || c.mode === 'grid')
      ];
    },
    mount(host, config, api){
      if((config.preset || 'custom') === 'custom' && config.mode === 'truefalse') return mountTrueFalse(host, config, api);
      if((config.preset || 'custom') === 'custom' && config.mode === 'matrix')    return mountMatrix(host, config, api);
      if((config.preset || 'custom') === 'custom' && config.mode === 'grid')      return mountGrid(host, config, api);
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
          else val = u.roundVarValue(val, false, v, activeConfig);
          out[v.name] = val;
        });
        return u.withGlobalVars(out, activeConfig.variables);
      }

      // "Nur ganzzahlige Lösungen": a row is redrawn until all its answer
      // columns are whole numbers (falls back to the last draw).
      const intOnly = !!activeConfig.integerAnswers;
      const rowIsWhole = row => answerCols.every(c => row[c.key] == null || u.isWholeNumber(row[c.key]));
      function generate(){
        rows = [];
        for(let r = 0; r < rowCount; r++){
          let row = null;
          for(let attempt = 0; attempt < (intOnly ? 1000 : 1); attempt++){
            row = buildRow();
            if(!intOnly || rowIsWhole(row)) break;
          }
          if(intOnly) answerCols.forEach(c => { if(u.isWholeNumber(row[c.key])) row[c.key] = Math.round(row[c.key]); });
          rows.push(row);
        }
        renderTable();
      }
      function buildRow(){
        {
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
                // Tidy a random non-integer to the column's decimals (default 2).
                // A formula result keeps full precision so a clean fraction (2/7)
                // can be recovered for display instead of a rounding artefact
                // (0.29 -> 29/100).
                v = u.roundVarValue(v, false, c, activeConfig);
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
          return row;
        }
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
                // Random value columns (no formula) are exact decimals with the
                // column's decimals, so any denominator up to 10^decimals is a
                // true fraction; computed values keep the small-denominator cap.
                const isRandomCol = c.type === 'var' && !(c.formula && String(c.formula).trim());
                const dec = isRandomCol ? u.varDecimals(c, activeConfig) : 3;
                if(c.fraction && !Number.isInteger(v)){
                  const frac = u.asFraction(v, isRandomCol ? Math.max(100, Math.pow(10, dec)) : undefined);
                  if(frac && Math.abs(frac.den) > 1 && (isRandomCol || Math.abs(frac.den) <= 100)){
                    const sign = frac.num < 0 ? '-' : '';
                    shown = '$' + sign + '\\frac{' + Math.abs(frac.num) + '}{' + frac.den + '}$';
                  }
                }
                if(shown != null){
                  td.innerHTML = shown;
                } else {
                  const f = Math.pow(10, dec);
                  td.textContent = Number.isInteger(v) ? String(v) : String(Math.round(v * f) / f);
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
      if((config.preset || 'custom') === 'custom' && config.mode === 'truefalse') return previewTrueFalse(host, config);
      if((config.preset || 'custom') === 'custom' && config.mode === 'matrix')    return previewMatrix(host, config);
      if((config.preset || 'custom') === 'custom' && config.mode === 'grid')      return previewGrid(host, config);
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

  // ---- Deduction for wrong answers (true/false + matrix) ---------------------
  // penalizeWrong on/off; penaltyPoints = points per wrong answer ('' = the
  // value of one correct answer). Older true/false blocks used tfPenalizeWrong.
  function tablePenaltyOn(config){
    return config.penalizeWrong != null ? !!config.penalizeWrong : !!config.tfPenalizeWrong;
  }
  function tablePenalty(config, perCorrect){
    if(!tablePenaltyOn(config)) return 0;
    const raw = config.penaltyPoints;
    const p = Number(raw);
    return (raw === '' || raw == null || !Number.isFinite(p)) ? perCorrect : Math.max(0, p);
  }
  // earned - wrong * penalty, clamped to [0, maxPts], rounded to 2 decimals.
  function tableScore(earned, wrongCount, penalty, maxPts){
    const v = Math.min(maxPts, Math.max(0, earned - wrongCount * penalty));
    return Math.round(v * 100) / 100;
  }

  // ---- Richtig/Falsch-Aussagen ---------------------------------------------
  // One row per statement with radio buttons [Unbeantwortet] | Richtig | Falsch.
  // Points: maxPoints split equally over the statements; optional deduction
  // for wrong answers (never below 0). Unanswered rows score 0.
  function tfStatements(config, u){
    return (config.statements || [])
      .filter(s => s && String(u.l(s.text) || '').trim())
      .map(s => ({ text: String(u.l(s.text)), correct: s.correct === 'false' ? 'false' : 'true' }));
  }
  function tfLabels(config, u){
    return {
      none:  u.t('block.table.tf.colUnanswered'),
      true:  u.l(config.tfLabelTrue)  || u.t('block.table.tf.colTrue'),
      false: u.l(config.tfLabelFalse) || u.t('block.table.tf.colFalse')
    };
  }
  function mountTrueFalse(host, config, api){
    const u = window.BlockUtils;
    const ui = u.simpleQuestionCard(host, {
      title: u.l(config.blockTitle) || api.utils.t('block.table.defaultTitle'),
      question: u.l(config.question) || ''
    });
    const { content, buttons, fb } = ui;
    const maxPts = Math.max(1, Number(config.maxPoints) || 1);
    const showNone = !!config.tfUnanswered;
    const items = tfStatements(config, u);
    if(items.length === 0){
      content.innerHTML = '<div style="color:var(--muted); font-style:italic;">' + api.utils.t('block.table.tf.empty') + '</div>';
      api.initScore(maxPts);
      return {};
    }
    if(config.shuffleRows) u.shuffle(items);
    const L = tfLabels(config, u);
    const cols = (showNone ? ['none'] : []).concat(['true', 'false']);

    const wrap = document.createElement('div');
    wrap.className = 'table-block-host';
    const tbl = document.createElement('table');
    tbl.className = 'table-block tf-table';
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    cols.forEach(c => {
      const th = document.createElement('th');
      th.className = 'tf-col tf-col-' + c;
      th.textContent = L[c];
      trh.appendChild(th);
    });
    trh.appendChild(document.createElement('th'));
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');
    const rows = items.map((it, i) => {
      const tr = document.createElement('tr');
      const name = api.blockId + '_tf_' + i;
      const inputs = {};
      cols.forEach(c => {
        const td = document.createElement('td');
        td.className = 'tf-cell tf-cell-' + c;
        // Label around the radio: the whole cell is clickable.
        const lbl = document.createElement('label');
        lbl.className = 'tf-hit';
        const inp = document.createElement('input');
        inp.type = 'radio'; inp.name = name; inp.value = c;
        inp.setAttribute('aria-label', L[c]);
        if(c === 'none') inp.checked = true;
        inp.addEventListener('change', () => tr.classList.remove('tf-row-ok', 'tf-row-bad', 'tf-row-open'));
        lbl.appendChild(inp);
        td.appendChild(lbl);
        tr.appendChild(td);
        inputs[c] = inp;
      });
      const tdText = document.createElement('td');
      tdText.className = 'tf-statement';
      // textContent: no markup injection; $…$ is typeset by renderMath below.
      tdText.textContent = it.text;
      tr.appendChild(tdText);
      tbody.appendChild(tr);
      return { tr, inputs, correct: it.correct };
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    content.appendChild(wrap);
    u.renderMath(wrap);

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = api.utils.t('common.check');
    buttons.appendChild(checkBtn);
    checkBtn.addEventListener('click', () => {
      const chosen = r => (r.inputs.true.checked ? 'true' : r.inputs.false.checked ? 'false' : null);
      const answered = rows.filter(r => chosen(r) != null);
      if(answered.length === 0){ fb.bad(api.utils.t('block.table.tf.feedback.answerAtLeastOne')); return; }
      let correctN = 0, wrongN = 0;
      rows.forEach(r => {
        const c = chosen(r);
        r.tr.classList.remove('tf-row-ok', 'tf-row-bad', 'tf-row-open');
        if(c == null){ r.tr.classList.add('tf-row-open'); return; }
        if(c === r.correct){ correctN++; r.tr.classList.add('tf-row-ok'); }
        else { wrongN++; r.tr.classList.add('tf-row-bad'); }
      });
      const per = maxPts / rows.length;
      const pts = tableScore(correctN * per, wrongN, tablePenalty(config, per), maxPts);
      const params = { correct: correctN, total: rows.length, wrong: wrongN, open: rows.length - answered.length, pts, max: maxPts };
      if(correctN === rows.length) fb.ok(api.utils.t('block.table.tf.feedback.allCorrect', params));
      else if(pts > 0)             fb.neutral(api.utils.t('block.table.tf.feedback.summary', params));
      else                         fb.bad(api.utils.t('block.table.tf.feedback.summary', params));
      api.reportScore(pts);
    });
    api.initScore(maxPts);
    return {};
  }
  // Builder preview: inline-styled (runtime styles.css is not loaded there).
  function previewTrueFalse(host, config){
    const u = window.BlockUtils;
    const card = document.createElement('div');
    card.className = 'bp-card';
    const h3 = document.createElement('h3');
    h3.textContent = u.t('common.question');
    card.appendChild(h3);
    const q = document.createElement('p');
    q.textContent = u.l(config.question) || u.t('block.table.preview.questionEmpty');
    card.appendChild(q);
    const items = tfStatements(config, u);
    if(!items.length){
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--muted); font-style:italic;';
      p.textContent = u.t('block.table.tf.empty');
      card.appendChild(p);
      host.appendChild(card);
      return;
    }
    const L = tfLabels(config, u);
    const cols = (config.tfUnanswered ? ['none'] : []).concat(['true', 'false']);
    const bg = { none:'#f7f9fb', true:'#e9f5e6', false:'#ffd6db' };
    const tbl = document.createElement('table');
    tbl.style.cssText = 'border-collapse:collapse; margin:0.4rem 0; font-size:0.88rem;';
    const trh = document.createElement('tr');
    cols.concat(['']).forEach(c => {
      const th = document.createElement('th');
      th.textContent = c ? L[c] : '';
      th.style.cssText = 'padding:0.35rem 0.6rem; text-align:left; color:#003b5c;';
      trh.appendChild(th);
    });
    tbl.appendChild(trh);
    items.forEach(it => {
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        // Shows the configured solution: filled marker in the correct column.
        td.textContent = c === it.correct ? '◉' : '○';
        td.style.cssText = 'padding:0.35rem 0.6rem; text-align:center; border-top:1px solid #d8e0e6; background:' + bg[c] + ';';
        tr.appendChild(td);
      });
      const tdT = document.createElement('td');
      tdT.textContent = it.text;
      tdT.style.cssText = 'padding:0.35rem 0.6rem; border-top:1px solid #d8e0e6; white-space:pre-line;';
      tr.appendChild(tdT);
      tbl.appendChild(tr);
    });
    card.appendChild(tbl);
    host.appendChild(card);
  }

  // ---- Freie Tabelle -------------------------------------------------------
  // config.grid = { rows:[{id,kind}], cols:[{id,kind}], cells:{'rowId|colId':
  // {text, formula, tolerance, answers}} }. Cell kind = row.kind || col.kind ||
  // 'text'. Text cells show text with {variables} and $…$; 'numeric' cells
  // are checked against a formula, 'textAnswer' cells like a cloze gap
  // (alternatives separated by |), 'choice' cells as a dropdown (options
  // separated by |, first one correct). Variables are drawn once per task.
  const gridKind = (r, c) => r.kind || c.kind || 'text';
  function gridAnswerCount(g){
    let n = 0;
    (g.rows || []).forEach(r => (g.cols || []).forEach(c => { if(gridKind(r, c) !== 'text') n++; }));
    return n;
  }
  // Points of one answer cell with "Punkte je Zelle" ('' / unset = 1).
  function gridCellPts(cell){
    const v = cell && cell.points;
    const n = Number(v);
    return (v === '' || v == null || !Number.isFinite(n)) ? 1 : Math.max(0, n);
  }
  // Total with "Punkte je Zelle": sum over graded answer cells (all answer
  // cells if none is graded, as at check time). At least 1.
  function gridMaxPoints(config){
    const { rows, cols, cells } = gridModel(config);
    const ans = [];
    rows.forEach(r => cols.forEach(c => { if(gridKind(r, c) !== 'text') ans.push(cells[r.id + '|' + c.id] || {}); }));
    const graded = ans.filter(cell => cell.graded !== false);
    const sum = (graded.length ? graded : ans).reduce((s, cell) => s + gridCellPts(cell), 0);
    return Math.max(1, Math.round(sum * 100) / 100);
  }
  function gridModel(config){
    const g = config.grid || {};
    return { rows: (g.rows || []).filter(r => r && r.id), cols: (g.cols || []).filter(c => c && c.id), cells: g.cells || {} };
  }
  function gridGenVars(config){
    const U = window.BlockUtils;
    const out = {};
    (config.variables || []).forEach(v => {
      if(!v || !v.name) return;
      const lo = Number(v.min), hi = Number(v.max);
      const a = isNaN(lo) ? 1 : lo, b = isNaN(hi) ? 10 : hi;
      // Same convention as the value table: whole numbers unless integer === false.
      out[v.name] = U.roundVarValue(a + Math.random() * (b - a), v.integer !== false, v, config);
    });
    return U.withGlobalVars(out, config.variables);
  }
  function mountGrid(host, config, api){
    const u = window.BlockUtils;
    const ui = u.simpleQuestionCard(host, {
      title: u.l(config.blockTitle) || api.utils.t('block.table.defaultTitle'),
      question: u.l(config.question) || ''
    });
    const { content, buttons, fb } = ui;
    // "Punkte je Zelle": the total is the sum of the graded cells' points.
    const maxPts = config.gridCellPoints ? gridMaxPoints(config) : Math.max(1, Number(config.maxPoints) || 1);
    const { rows, cols, cells } = gridModel(config);
    if(!rows.length || !cols.length){
      content.innerHTML = '<div style="color:var(--muted); font-style:italic;">' + api.utils.t('block.table.grid.empty') + '</div>';
      api.initScore(maxPts);
      return {};
    }
    // Unset display = decimal here (1.5, not 3/2), see varFormatSchemaFields above.
    const formats = u.varFormats(config.variables, config, 'decimal');
    const rawTol = config.gridTolerance;
    const tolDefault = (rawTol === '' || rawTol == null || !Number.isFinite(Number(rawTol))) ? 0.01 : Math.max(0, Number(rawTol));
    const ignoreCase = config.gridIgnoreCase !== false;
    const cellTol = cell => {
      const v = cell.tolerance;
      return (v === '' || v == null || !Number.isFinite(Number(v))) ? tolDefault : Math.max(0, Number(v));
    };
    const evalNum = (cell, vars) => {
      const f = String(cell.formula || '').trim();
      if(!f) return null;
      const r = u.safeMathExpr(u.applyAngleUnit(f, config.angleUnit), vars);
      return (typeof r === 'number' && Number.isFinite(r)) ? r : null;
    };
    const cellOf = (r, c) => cells[r.id + '|' + c.id] || {};
    const gridCellOk = (r, c, vars) => {
      if(gridKind(r, c) !== 'numeric') return true;
      const v = evalNum(cellOf(r, c), vars);
      return v != null && (!config.integerAnswers || u.isWholeNumber(v));
    };
    const host2 = document.createElement('div');
    host2.className = 'table-block-host';
    content.appendChild(host2);
    let answers = [];   // { inp, kind, expected?, tol?, alternatives? }

    let curVars = {};
    function build(){
      // Draw variables until every number cell has a valid result (a whole
      // number with "Nur ganzzahlige Lösungen").
      let vars = {};
      for(let i = 0; i < (config.integerAnswers ? 2000 : 200); i++){
        vars = gridGenVars(config);
        const allOk = rows.every(r => cols.every(c => gridCellOk(r, c, vars)));
        if(allOk) break;
      }
      if(ui.qText && String(u.l(config.question) || '').trim()){
        ui.qText.textContent = u.fillMathTemplate(String(u.l(config.question)), vars, formats);
        u.renderMath(ui.qText);
      }
      curVars = vars;
      host2.innerHTML = '';
      answers = [];
      const tbl = document.createElement('table');
      tbl.className = 'grid-table' + (config.gridLines ? ' grid-lines' : '');
      const w = Number(config.gridHeaderColWidth);
      if(config.gridHeaderColWidth !== '' && config.gridHeaderColWidth != null && Number.isFinite(w) && w > 0) tbl.style.setProperty('--grid-head-col-width', w + 'px');
      tbl.style.setProperty('--grid-head-col-gap', Math.max(0, Number(config.gridHeaderColGap) || 0) + 'px');
      tbl.style.setProperty('--grid-head-row-gap', Math.max(0, Number(config.gridHeaderRowGap) || 0) + 'px');
      const tbody = document.createElement('tbody');
      rows.forEach((r, ri) => {
        const tr = document.createElement('tr');
        cols.forEach((c, ci) => {
          const kind = gridKind(r, c);
          const cell = cellOf(r, c);
          const headRow = !!config.gridHeaderRow && ri === 0;
          const headCol = !!config.gridHeaderCol && ci === 0;
          const td = document.createElement((headRow || headCol) && kind === 'text' ? 'th' : 'td');
          td.className = 'grid-cell' + (headRow ? ' grid-head-row' : '') + (headCol ? ' grid-head-col' : '');
          if(kind === 'text'){
            // textContent: no markup injection; $…$ is typeset below.
            td.textContent = u.fillMathTemplate(String(u.l(cell.text) || ''), vars, formats);
          } else if(kind === 'choice'){
            // Dropdown like a cloze choice gap: first option is correct, shown
            // shuffled behind an empty "–" entry. {a} variables are filled in
            // (a <select> can't show KaTeX, so $…$ stays plain text).
            const opts = String(u.l(cell.options) || '').split('|')
              .map(s => u.fillMathTemplate(s.trim(), vars, formats)).filter(Boolean);
            const sel = document.createElement('select');
            sel.className = 'grid-input grid-select';
            const blank = document.createElement('option');
            blank.value = ''; blank.textContent = '–';
            sel.appendChild(blank);
            u.shuffle(opts.slice()).forEach(o => {
              const op = document.createElement('option');
              op.value = o; op.textContent = o;
              sel.appendChild(op);
            });
            sel.addEventListener('change', () => sel.classList.remove('grid-ok', 'grid-bad'));
            td.appendChild(sel);
            answers.push({ inp: sel, kind, graded: cell.graded !== false, points: gridCellPts(cell), correct: opts[0] || '' });
          } else {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'grid-input';
            inp.placeholder = '?';
            inp.addEventListener('input', () => inp.classList.remove('grid-ok', 'grid-bad'));
            td.appendChild(inp);
            if(kind === 'numeric') answers.push({ inp, kind, graded: cell.graded !== false, points: gridCellPts(cell), expected: evalNum(cell, vars), tol: cellTol(cell) });
            else answers.push({ inp, kind, graded: cell.graded !== false, points: gridCellPts(cell), alternatives: String(u.l(cell.answers) || '').split('|').map(s => s.trim()).filter(Boolean) });
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      host2.appendChild(tbl);
      u.renderMath(host2);
    }

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = api.utils.t('common.check');
    buttons.appendChild(checkBtn);
    checkBtn.addEventListener('click', () => {
      if(!answers.length){ fb.neutral(api.utils.t('block.table.grid.feedback.noAnswerCells')); return; }
      if(answers.every(a => String(a.inp.value).trim() === '')){ fb.bad(api.utils.t('block.table.grid.feedback.fillAtLeastOne')); return; }
      // Only cells with "Punkte" count; ungraded cells are still checked and
      // marked. (If none is graded, every answer cell counts.)
      const counted = answers.some(a => a.graded) ? answers.filter(a => a.graded) : answers;
      let correctN = 0, wrongN = 0;
      answers.forEach(a => {
        a.inp.classList.remove('grid-ok', 'grid-bad');
        a.inp.title = '';
        const v = String(a.inp.value).trim();
        if(!v) return;   // left empty: 0 points, no deduction
        let ok, solution;
        if(a.kind === 'numeric'){
          const got = u.parseNum(v);
          ok = got != null && a.expected != null && u.nearlyEqual(got, a.expected, a.tol);
          solution = a.expected != null ? u.formatSolution(a.expected) : '';
        } else if(a.kind === 'choice'){
          ok = v === a.correct;
          solution = a.correct;
        } else {
          ok = a.alternatives.some(alt => ignoreCase ? alt.toLowerCase() === v.toLowerCase() : alt === v);
          solution = a.alternatives[0] || '';
        }
        a.inp.classList.add(ok ? 'grid-ok' : 'grid-bad');
        if(!ok && solution) a.inp.title = api.utils.t('block.table.grid.solutionTitle', { solution });
        if(!counted.includes(a)) return;
        if(ok) correctN++; else wrongN++;
      });
      let pts;
      if(config.gridCellPoints){
        // Each correct cell earns its own points; a wrong cell may deduct
        // (penaltyPoints, or '' = that cell's points).
        let earned = 0, penalty = 0;
        counted.forEach(a => {
          if(a.inp.classList.contains('grid-ok')) earned += a.points;
          else if(a.inp.classList.contains('grid-bad')) penalty += tablePenalty(config, a.points);
        });
        pts = tableScore(earned, 1, penalty, maxPts);
      } else {
        const per = maxPts / counted.length;
        pts = tableScore(correctN * per, wrongN, tablePenalty(config, per), maxPts);
      }
      const params = { correct: correctN, total: counted.length, wrong: wrongN, pts, max: maxPts };
      if(correctN === counted.length) fb.ok(api.utils.t('block.table.grid.feedback.allCorrect', params));
      else if(pts > 0)                fb.neutral(api.utils.t('block.table.grid.feedback.summary', params));
      else                            fb.bad(api.utils.t('block.table.grid.feedback.summary', params));
      api.reportScore(pts);
    });
    if((config.variables || []).some(v => v && v.name)){
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = api.utils.t('common.regenerate');
      buttons.appendChild(newBtn);
      newBtn.addEventListener('click', () => { build(); fb.neutral(api.utils.t('block.table.feedback.newValues')); });
      u.regenPolicy(newBtn, config, api);
    }
    build();
    api.initScore(maxPts);
    return {
      getVars: () => curVars,
      showSolution(){
        answers.forEach(a => {
          if(a.kind === 'choice') a.inp.value = a.correct;
          else if(a.kind === 'numeric') a.inp.value = a.expected == null ? '' : u.formatSolution(a.expected);
          else a.inp.value = (a.alternatives && a.alternatives[0]) || '';
          if(a.graded) a.inp.classList.add('grid-ok');
        });
        fb.ok(api.utils.t('utils.resume.solved'));
      }
    };
  }
  // Builder preview: text cells as written, answer cells as [= formula] / [a | b].
  function previewGrid(host, config){
    const u = window.BlockUtils;
    const card = document.createElement('div');
    card.className = 'bp-card';
    const h3 = document.createElement('h3');
    h3.textContent = u.t('common.question');
    card.appendChild(h3);
    const q = document.createElement('p');
    q.textContent = u.l(config.question) || u.t('block.table.preview.questionEmpty');
    card.appendChild(q);
    const { rows, cols, cells } = gridModel(config);
    if(!rows.length || !cols.length){
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--muted); font-style:italic;';
      p.textContent = u.t('block.table.grid.empty');
      card.appendChild(p);
      host.appendChild(card);
      return;
    }
    const tbl = document.createElement('table');
    tbl.style.cssText = 'border-collapse:collapse; margin:0.4rem 0; font-size:0.85rem;';
    const line = config.gridLines ? ' border:1px solid #d8e0e6;' : '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        const kind = gridKind(r, c);
        const cell = cells[r.id + '|' + c.id] || {};
        td.style.cssText = 'padding:0.3rem 0.6rem;' + line;
        if(kind === 'text') td.textContent = String(u.l(cell.text) || '');
        else {
          const tag = document.createElement('span');
          tag.style.cssText = 'display:inline-block; padding:0.1rem 0.4rem; border:1px solid #c6d1d8; border-radius:4px; font-family:"Courier New",monospace; font-size:0.78rem;' +
            (kind === 'numeric' ? ' background:#fff8e8;' : kind === 'choice' ? ' background:#f3efff;' : ' background:#eef7ff;') +
            (cell.graded === false ? ' border-style:dashed; opacity:0.7;' : '');
          tag.textContent = kind === 'numeric' ? '= ' + (cell.formula || '?')
            : kind === 'choice' ? '▾ ' + (String(u.l(cell.options) || '?'))
            : (String(u.l(cell.answers) || '?'));
          td.appendChild(tag);
        }
        tr.appendChild(td);
      });
      tbl.appendChild(tr);
    });
    card.appendChild(tbl);
    host.appendChild(card);
  }

  // ---- Auswahl-Matrix ------------------------------------------------------
  // Rows × columns of checkboxes (or one radio group per row). config.matrix =
  // { rows:[{id,label}], cols:[{id,label}], correct:['rowId|colId', …] }.
  // Scoring 'cell' (default): (right ticks − wrong ticks) / correct cells,
  // never below 0. Scoring 'row': share of rows whose ticks match exactly.
  function mxData(config, u){
    const m = config.matrix || {};
    const rows = (m.rows || []).filter(r => r && r.id).map(r => ({ id: r.id, label: String(u.l(r.label) || '') }));
    const cols = (m.cols || []).filter(c => c && c.id).map(c => ({ id: c.id, label: String(u.l(c.label) || '') }));
    const correct = new Set((m.correct || []).filter(k => {
      const [r, c] = String(k).split('|');
      return rows.some(x => x.id === r) && cols.some(x => x.id === c);
    }));
    return { rows, cols, correct };
  }
  function mountMatrix(host, config, api){
    const u = window.BlockUtils;
    const ui = u.simpleQuestionCard(host, {
      title: u.l(config.blockTitle) || api.utils.t('block.table.defaultTitle'),
      question: u.l(config.question) || ''
    });
    const { content, buttons, fb } = ui;
    const maxPts = Math.max(1, Number(config.maxPoints) || 1);
    const { rows, cols, correct } = mxData(config, u);
    if(!rows.length || !cols.length){
      content.innerHTML = '<div style="color:var(--muted); font-style:italic;">' + api.utils.t('block.table.mx.empty') + '</div>';
      api.initScore(maxPts);
      return {};
    }
    if(config.shuffleRows) u.shuffle(rows);
    const single = !!config.matrixSingle;

    const wrap = document.createElement('div');
    wrap.className = 'table-block-host';
    const tbl = document.createElement('table');
    tbl.className = 'table-block mx-table';
    const trh = document.createElement('tr');
    trh.appendChild(document.createElement('th'));
    cols.forEach(c => {
      const th = document.createElement('th');
      th.textContent = c.label;   // $…$ typeset by renderMath below
      trh.appendChild(th);
    });
    const thead = document.createElement('thead');
    thead.appendChild(trh);
    tbl.appendChild(thead);
    const tbody = document.createElement('tbody');
    const cells = [];   // { input, td, key }
    rows.forEach((r, ri) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.className = 'mx-row-label';
      th.textContent = r.label;
      tr.appendChild(th);
      cols.forEach(c => {
        const td = document.createElement('td');
        td.className = 'mx-cell';
        const lbl = document.createElement('label');
        lbl.className = 'tf-hit';
        const inp = document.createElement('input');
        inp.type = single ? 'radio' : 'checkbox';
        inp.name = api.blockId + '_mx_' + ri;
        inp.setAttribute('aria-label', r.label + ': ' + c.label);
        inp.addEventListener('change', () => cells.forEach(x => x.td.classList.remove('mx-ok', 'mx-bad')));
        lbl.appendChild(inp);
        td.appendChild(lbl);
        tr.appendChild(td);
        cells.push({ input: inp, td, key: r.id + '|' + c.id, rowId: r.id });
      });
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    content.appendChild(wrap);
    u.renderMath(wrap);

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = api.utils.t('common.check');
    buttons.appendChild(checkBtn);
    checkBtn.addEventListener('click', () => {
      const ticked = cells.filter(x => x.input.checked);
      if(!ticked.length){ fb.bad(api.utils.t('block.table.mx.feedback.tickAtLeastOne')); return; }
      let hits = 0, wrong = 0;
      cells.forEach(x => {
        x.td.classList.remove('mx-ok', 'mx-bad');
        if(!x.input.checked) return;
        if(correct.has(x.key)){ hits++; x.td.classList.add('mx-ok'); }
        else { wrong++; x.td.classList.add('mx-bad'); }
      });
      let pts;
      if(config.matrixScoring === 'row'){
        // A row is right when its ticks match exactly; a ticked row that
        // doesn't match counts as one wrong answer; untouched rows cost 0.
        const rowCells = r => cells.filter(x => x.rowId === r.id);
        const rowOk = rows.filter(r => rowCells(r).every(x => x.input.checked === correct.has(x.key))).length;
        const rowWrong = rows.filter(r => rowCells(r).some(x => x.input.checked) &&
          !rowCells(r).every(x => x.input.checked === correct.has(x.key))).length;
        const per = maxPts / rows.length;
        pts = tableScore(rowOk * per, rowWrong, tablePenalty(config, per), maxPts);
      } else {
        const per = correct.size ? maxPts / correct.size : 0;
        pts = tableScore(hits * per, wrong, tablePenalty(config, per), maxPts);
      }
      const params = { hits, total: correct.size, wrong, pts, max: maxPts };
      const perfect = hits === correct.size && wrong === 0;
      if(perfect)      fb.ok(api.utils.t('block.table.mx.feedback.allCorrect', params));
      else if(pts > 0) fb.neutral(api.utils.t('block.table.mx.feedback.summary', params));
      else             fb.bad(api.utils.t('block.table.mx.feedback.summary', params));
      api.reportScore(pts);
    });
    api.initScore(maxPts);
    return {};
  }
  function previewMatrix(host, config){
    const u = window.BlockUtils;
    const card = document.createElement('div');
    card.className = 'bp-card';
    const h3 = document.createElement('h3');
    h3.textContent = u.t('common.question');
    card.appendChild(h3);
    const q = document.createElement('p');
    q.textContent = u.l(config.question) || u.t('block.table.preview.questionEmpty');
    card.appendChild(q);
    const { rows, cols, correct } = mxData(config, u);
    if(!rows.length || !cols.length){
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--muted); font-style:italic;';
      p.textContent = u.t('block.table.mx.empty');
      card.appendChild(p);
      host.appendChild(card);
      return;
    }
    const tbl = document.createElement('table');
    tbl.style.cssText = 'border-collapse:collapse; margin:0.4rem 0; font-size:0.88rem;';
    const cellCss = 'padding:0.35rem 0.7rem; border-bottom:1px solid #d8e0e6;';
    const trh = document.createElement('tr');
    [''].concat(cols.map(c => c.label)).forEach(txt => {
      const th = document.createElement('th');
      th.textContent = txt;
      th.style.cssText = cellCss + ' text-align:left; color:#003b5c;';
      trh.appendChild(th);
    });
    tbl.appendChild(trh);
    const mark = config.matrixSingle ? ['◉', '○'] : ['☑', '☐'];
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = r.label;
      th.style.cssText = cellCss + ' text-align:left; color:#003b5c;';
      tr.appendChild(th);
      cols.forEach(c => {
        const td = document.createElement('td');
        // Shows the configured solution.
        td.textContent = correct.has(r.id + '|' + c.id) ? mark[0] : mark[1];
        td.style.cssText = cellCss + ' text-align:center;';
        tr.appendChild(td);
      });
      tbl.appendChild(tr);
    });
    card.appendChild(tbl);
    host.appendChild(card);
  }

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
