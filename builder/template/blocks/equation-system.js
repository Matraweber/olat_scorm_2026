(function(){
  'use strict';

  const EPS = 1e-9;

  function tt(key, params){
    const u = window.BlockUtils;
    if(u && typeof u.t === 'function') return u.t(key, params);
    return key;
  }

  // Parser: linear expression -> {coeffs[], constant}. Accepts 2x, -3y, +0.5z, x, -x.
  function parseLinear(str, varNames){
    let s = String(str || '').replace(/\s+/g, '').replace(/\*/g, '');
    if(!s) return { ok: true, coeffs: varNames.map(() => 0), constant: 0 };
    if(s[0] !== '+' && s[0] !== '-') s = '+' + s;
    const coeffs = varNames.map(() => 0);
    let constant = 0;
    let i = 0;
    while(i < s.length){
      if(s[i] !== '+' && s[i] !== '-') return { ok: false, err: tt('block.equation-system.parser.unexpectedChar', { char: s[i] }) };
      const sign = s[i] === '-' ? -1 : 1;
      i++;
      let numStr = '';
      while(i < s.length && /[\d.]/.test(s[i])){ numStr += s[i]; i++; }
      let varStr = '';
      while(i < s.length && /[a-zA-Z_]/.test(s[i])){ varStr += s[i]; i++; }
      let num;
      if(numStr === '' || numStr === '.'){
        if(!varStr) return { ok: false, err: tt('block.equation-system.parser.emptyTermAfterSign') };
        num = 1;
      } else {
        if(numStr.split('.').length > 2) return { ok: false, err: tt('block.equation-system.parser.invalidNumber', { num: numStr }) };
        num = parseFloat(numStr);
        if(!isFinite(num)) return { ok: false, err: tt('block.equation-system.parser.invalidNumber', { num: numStr }) };
      }
      if(varStr){
        const idx = varNames.indexOf(varStr);
        if(idx < 0) return { ok: false, err: tt('block.equation-system.parser.unknownVariable', { name: varStr }) };
        coeffs[idx] += sign * num;
      } else {
        constant += sign * num;
      }
    }
    return { ok: true, coeffs, constant };
  }

  function parseEquation(eqStr, varNames){
    const s = String(eqStr || '').trim();
    if(!s) return { ok: false, err: tt('block.equation-system.parser.emptyEquation') };
    const idx = s.indexOf('=');
    if(idx < 0) return { ok: false, err: tt('block.equation-system.parser.noEquals') };
    if(s.indexOf('=', idx + 1) >= 0) return { ok: false, err: tt('block.equation-system.parser.multipleEquals') };
    const lhs = parseLinear(s.slice(0, idx), varNames);
    if(!lhs.ok) return { ok: false, err: tt('block.equation-system.parser.leftSide', { err: lhs.err }) };
    const rhs = parseLinear(s.slice(idx + 1), varNames);
    if(!rhs.ok) return { ok: false, err: tt('block.equation-system.parser.rightSide', { err: rhs.err }) };
    const coeffs = varNames.map((_, i) => lhs.coeffs[i] - rhs.coeffs[i]);
    const constant = rhs.constant - lhs.constant;
    return { ok: true, coeffs, rhs: constant };
  }

  // Gauss-Jordan on augmented matrix. Returns kind: unique/inconsistent/underdetermined.
  function solveSystem(A, b){
    const m = A.length;
    if(!m) return { kind: 'invalid' };
    const n = A[0].length;
    if(!n) return { kind: 'invalid' };
    // Augmented copy
    const M = A.map((row, i) => row.concat([b[i]]));
    const pivotCols = [];
    let row = 0;
    for(let col = 0; col < n && row < m; col++){
      let pivot = -1;
      let maxAbs = EPS;
      for(let r = row; r < m; r++){
        if(Math.abs(M[r][col]) > maxAbs){ maxAbs = Math.abs(M[r][col]); pivot = r; }
      }
      if(pivot < 0) continue; // no pivot in this column
      if(pivot !== row){ const tmp = M[row]; M[row] = M[pivot]; M[pivot] = tmp; }
      const piv = M[row][col];
      for(let c = col; c <= n; c++) M[row][c] /= piv;
      for(let r = 0; r < m; r++){
        if(r === row) continue;
        if(Math.abs(M[r][col]) <= EPS) continue;
        const factor = M[r][col];
        for(let c = col; c <= n; c++) M[r][c] -= factor * M[row][c];
      }
      pivotCols.push(col);
      row++;
    }
    // Inconsistency: any row [0 … 0 | nonzero]?
    for(let r = 0; r < m; r++){
      let allZero = true;
      for(let c = 0; c < n; c++){
        if(Math.abs(M[r][c]) > EPS){ allZero = false; break; }
      }
      if(allZero && Math.abs(M[r][n]) > EPS) return { kind: 'inconsistent' };
    }
    if(pivotCols.length < n){
      return { kind: 'underdetermined', freeCount: n - pivotCols.length };
    }
    const solution = new Array(n).fill(0);
    for(let i = 0; i < pivotCols.length; i++){
      solution[pivotCols[i]] = M[i][n];
    }
    // Residual check to guard against RREF rounding drift.
    for(let i = 0; i < m; i++){
      let sum = 0;
      for(let j = 0; j < n; j++) sum += A[i][j] * solution[j];
      if(Math.abs(sum - b[i]) > 1e-6) return { kind: 'inconsistent' };
    }
    return { kind: 'unique', solution };
  }

  // High-level: parse a variant and return either parsed-system or err
  function analyzeVariant(equationsText, namesText){
    const names = String(namesText || '').split(',').map(s => s.trim()).filter(Boolean);
    if(names.length < 1) return { ok: false, err: tt('block.equation-system.parser.noVariables') };
    if(names.length > 4) return { ok: false, err: tt('block.equation-system.parser.tooManyVariables') };
    if(new Set(names).size !== names.length) return { ok: false, err: tt('block.equation-system.parser.duplicateVariables') };
    for(const v of names){
      if(!/^[a-zA-Z_]\w*$/.test(v)) return { ok: false, err: tt('block.equation-system.parser.invalidVariableName', { name: v }) };
    }
    const lines = String(equationsText || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if(!lines.length) return { ok: false, err: tt('block.equation-system.parser.noEquation') };
    // Don't reject m < n; solveSystem detects underdetermined cases by rank.
    const A = [], b = [], rawLines = [];
    for(let i = 0; i < lines.length; i++){
      const parsed = parseEquation(lines[i], names);
      if(!parsed.ok) return { ok: false, err: tt('block.equation-system.parser.linePrefix', { line: (i+1), err: parsed.err }) };
      A.push(parsed.coeffs);
      b.push(parsed.rhs);
      rawLines.push(lines[i]);
    }
    const result = solveSystem(A, b);
    if(result.kind === 'invalid') return { ok: false, err: tt('block.equation-system.parser.systemInvalid') };
    if(result.kind === 'inconsistent') return { ok: false, err: tt('block.equation-system.parser.systemInconsistent') };
    if(result.kind === 'underdetermined'){
      const key = result.freeCount === 1
        ? 'block.equation-system.parser.underdeterminedOne'
        : 'block.equation-system.parser.underdeterminedMany';
      return { ok: false, err: tt(key, { count: result.freeCount }) };
    }
    return { ok: true, names, A, b, solution: result.solution, rawLines };
  }

  // Render a coefficient row as LaTeX. Near-zero (< 1e-9) drops the term so the
  // variable disappears from the equation rather than printing "0x".
  function formatTerm(coeff, varName, first){
    if(!Number.isFinite(coeff) || Math.abs(coeff) < 1e-9) return '';
    const absC = Math.abs(coeff);
    const sign = coeff < 0 ? ' - ' : (first ? '' : ' + ');
    let numStr;
    if(Number.isInteger(absC)) numStr = (absC === 1 ? '' : String(absC));
    else numStr = String(Math.round(absC * 10000) / 10000);
    return sign + numStr + varName;
  }

  // Rows for an `aligned` LaTeX environment: `& =` keeps the equals
  // sign on a fixed column so it doesn't shift between rows.
  function systemToLatex(A, b, names){
    return A.map((row, i) => {
      let latex = '';
      row.forEach((c, j) => { latex += formatTerm(c, names[j], latex === ''); });
      if(latex === '') latex = '0';
      const rhs = Number.isInteger(b[i]) ? b[i] : (Math.round(b[i] * 10000) / 10000);
      return latex + ' &= ' + rhs;
    });
  }

  function formatSolution(names, solution){
    return names.map((nm, i) => {
      const v = solution[i];
      return nm + ' = ' + (Number.isInteger(v) ? v : (Math.round(v * 10000) / 10000));
    }).join(', ');
  }

  // Block registration
  Blocks.register('equation-system', {
    label: 'Gleichungssystem',
    labelKey: 'block.equation-system.label',
    description: 'Lineares Gleichungssystem, zufällig generiert oder mit eigenen Varianten.',
    descKey: 'block.equation-system.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
    icon: 'equation-system',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        mode: 'random',
        preset: 'custom',
        question: '',
        // Random mode
        variableCount: 2,
        variableNames: '',
        coeffMin: null, coeffMax: null,
        solutionMin: null, solutionMax: null,
        integerSolution: true,
        // Manual mode
        variants: [],
        // Shared between modes
        tolerance: 0.01,
        maxPoints: 2
      };
    },
    summary(cfg){
      if(cfg.mode === 'manual'){
        const c = (cfg.variants || []).length;
        const key = c === 1
          ? 'block.equation-system.summary.variantsCountOne'
          : 'block.equation-system.summary.variantsCountMany';
        return tt(key, { count: c });
      }
      return tt('block.equation-system.summary.randomWithVars', { count: (cfg.variableCount || 2) });
    },
    validate(cfg){
      const w = [];
      if(cfg.mode === 'manual'){
        const variants = Array.isArray(cfg.variants) ? cfg.variants : [];
        if(!variants.length){
          w.push(tt('block.equation-system.validate.manualNoVariants'));
          return w;
        }
        variants.forEach((v, i) => {
          const r = analyzeVariant(v.equations, v.variableNames);
          if(!r.ok) w.push(tt('block.equation-system.validate.variantPrefix', { index: (i+1), err: r.err }));
        });
        return w;
      }
      // Random
      const n = Number(cfg.variableCount) || 2;
      if(n < 2 || n > 3) w.push(tt('block.equation-system.validate.varCountRange'));
      const lo = Number(cfg.coeffMin), hi = Number(cfg.coeffMax);
      if(cfg.coeffMin == null || cfg.coeffMax == null || !Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi){
        w.push(tt('block.equation-system.validate.coeffRangeInvalid'));
      }
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', mode: 'random', preset: 'custom',
        question: tt('block.equation-system.preview.defaultQuestion'),
        variableCount: 2,
        variableNames: 'x,y',
        coeffMin: -5, coeffMax: 5,
        solutionMin: -5, solutionMax: 5,
        integerSolution: true,
        tolerance: 0.01,
        maxPoints: 2
      };
    },
    builderSchema(){
      const isRandom = c => (c.mode || 'random') === 'random';
      const isManual = c => (c.mode || 'random') === 'manual';
      const isCustom = c => isRandom(c) && (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.equation-system.field.blockTitle.label', type:'text', placeholder:'Gleichungssystem', placeholderKey:'block.equation-system.field.blockTitle.placeholder' },
        { key:'mode', label:'Modus', labelKey:'block.equation-system.field.mode.label', type:'select', options:[
          { value:'random', label:'Zufällige Werte (Builder erzeugt das System)', labelKey:'block.equation-system.field.mode.option.random' },
          { value:'manual', label:'Eigene Varianten (Sie schreiben das System)', labelKey:'block.equation-system.field.mode.option.manual' }
        ], help:'„Zufällig" generiert bei jedem Start neue Koeffizienten. „Eigene Varianten" wählt aus von Ihnen definierten Systemen.', helpKey:'block.equation-system.field.mode.help' },

        // Random mode
        { key:'preset', label:'Vorlage', labelKey:'block.equation-system.field.preset.label', type:'select', options:[
          { value:'custom',     label:'Manuell (leer)', labelKey:'block.equation-system.field.preset.option.custom' },
          { value:'simple-2',   label:'Beispiel: 2 Variablen, kleine Zahlen', labelKey:'block.equation-system.field.preset.option.simple-2' },
          { value:'standard-2', label:'Beispiel: 2 Variablen, Standard-Bereich', labelKey:'block.equation-system.field.preset.option.standard-2' },
          { value:'standard-3', label:'Beispiel: 3 Variablen', labelKey:'block.equation-system.field.preset.option.standard-3' }
        ], showIf: isRandom },
        { type:'action', label:'Zurücksetzen', labelKey:'block.equation-system.field.reset.label', action:'reset', showIf: isCustom },

        { type:'section', label:'Frage', labelKey:'block.equation-system.field._sec_q.label', key:'_sec_q' },
        { key:'question', label:'Aufgabentext', labelKey:'block.equation-system.field.question.label', type:'math-textarea', rows:2 },

        { type:'section', label:'System (zufällig)', labelKey:'block.equation-system.field._sec_sys.label', key:'_sec_sys', showIf: isCustom },
        { key:'variableCount', label:'Anzahl Variablen (2 oder 3)', labelKey:'block.equation-system.field.variableCount.label', type:'number', step:1, min:2, max:3, showIf: isCustom },
        { key:'variableNames', label:'Variablennamen (Komma-getrennt)', labelKey:'block.equation-system.field.variableNames.label', type:'text', placeholder:'x,y oder x,y,z', placeholderKey:'block.equation-system.field.variableNames.placeholder', showIf: isCustom },

        { type:'section', label:'Wertebereiche', labelKey:'block.equation-system.field._sec_ranges.label', key:'_sec_ranges', showIf: isCustom },
        { key:'coeffMin', label:'Koeffizient Min', labelKey:'block.equation-system.field.coeffMin.label', type:'number', step:1, showIf: isCustom },
        { key:'coeffMax', label:'Koeffizient Max', labelKey:'block.equation-system.field.coeffMax.label', type:'number', step:1, showIf: isCustom },
        { key:'solutionMin', label:'Lösung Min', labelKey:'block.equation-system.field.solutionMin.label', type:'number', step:1, showIf: isCustom },
        { key:'solutionMax', label:'Lösung Max', labelKey:'block.equation-system.field.solutionMax.label', type:'number', step:1, showIf: isCustom },
        { key:'integerSolution', label:'Lösungen sind ganzzahlig', labelKey:'block.equation-system.field.integerSolution.label', type:'boolean', showIf: isCustom },

        // Manual mode
        { type:'section', label:'Varianten', labelKey:'block.equation-system.field._sec_var.label', key:'_sec_var', showIf: isManual,
          help:'Pro „Neu generieren" wird zufällig eine Variante gewählt. Jede Variante wird live geprüft. Die Zusammenfassung zeigt die berechnete Lösung oder eine Warnung, falls das System nicht eindeutig lösbar ist.', helpKey:'block.equation-system.field._sec_var.help' },
        { key:'variants', type:'list', itemLabel:'Variante', itemLabelKey:'block.equation-system.field.variants.itemLabel', labelKey:'block.equation-system.field.variants.label', label:'Varianten', showIf: isManual,
          itemSummary: item => {
            const r = analyzeVariant(item && item.equations, item && item.variableNames);
            if(r.ok) return '✓  ' + formatSolution(r.names, r.solution);
            return '⚠  ' + r.err;
          },
          itemSchema: [
            { key:'variableNames', label:'Variablen (Komma-getrennt)', labelKey:'block.equation-system.field.variants.item.variableNames.label', type:'text', placeholder:'x,y', placeholderKey:'block.equation-system.field.variants.item.variableNames.placeholder', default:'x,y' },
            { key:'equations', label:'Gleichungen (eine pro Zeile)', labelKey:'block.equation-system.field.variants.item.equations.label', type:'textarea', rows:4,
              placeholder:'2x + 3y = 7\nx - y = 1', placeholderKey:'block.equation-system.field.variants.item.equations.placeholder',
              help:'Beispiele: „2x + 3y = 7", „x = 5", „-0.5x + y = 2", „2x = y + 1". Multiplikation muss nicht mit * geschrieben werden.', helpKey:'block.equation-system.field.variants.item.equations.help' }
          ]
        },

        { type:'section', label:'Bewertung', labelKey:'block.equation-system.field._sec_score.label', key:'_sec_score' },
        { key:'tolerance', label:'Toleranz pro Variable', labelKey:'block.equation-system.field.tolerance.label', type:'number', step:0.01 },
        { key:'maxPoints', label:'Punkte (gesamt)', labelKey:'block.equation-system.field.maxPoints.label', type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = window.BlockUtils;
      const t = api.utils.t;
      const l = api.utils.l;
      const mode = (config.mode || 'random');
      if(mode === 'random') config = applyPreset(config);

      const ui = u.simpleQuestionCard(host, {
        title: l(config.blockTitle) || t('block.equation-system.defaultTitle'),
        question: l(config.question) || ''
      });
      const { content, buttons, fb } = ui;

      // State that gets refreshed on each `generate()` call.
      let A = [], b = [], solution = [], names = [];
      const inputs = [];

      function num(v, def){
        if(v == null || v === '') return def;
        const x = Number(v);
        return isFinite(x) ? x : def;
      }

      // Random generation
      function generateRandom(){
        const n = Math.max(2, Math.min(3, Number(config.variableCount) || 2));
        names = String(config.variableNames || 'x,y,z').split(',').map(s => s.trim()).filter(Boolean).slice(0, n);
        while(names.length < n) names.push(['x','y','z'][names.length]);
        let cLo = num(config.coeffMin, -5);
        let cHi = num(config.coeffMax,  5);
        // Single-value ranges (e.g. [0, 0] or [2, 2]) are allowed; only swap
        // the order if min > max. randCoeff handles the [0, 0] case via ±1.
        if(cLo > cHi){ const t = cLo; cLo = cHi; cHi = t; }
        let sLo = num(config.solutionMin, -5);
        let sHi = num(config.solutionMax,  5);
        if(sLo > sHi){ const t = sLo; sLo = sHi; sHi = t; }

        function randInt(lo, hi){ return Math.floor(lo + Math.random() * (hi - lo + 1)); }
        // 0 is a valid coefficient. formatTerm drops zero terms so the
        // corresponding variable disappears from the rendered equation, e.g.
        // "0x + 3y = 6" renders as "3y = 6".
        function randCoeff(lo, hi){ return randInt(lo, hi); }

        solution = [];
        for(let i = 0; i < n; i++){
          let v = randInt(sLo, sHi);
          if(config.integerSolution === false){
            v = v + (Math.random() < 0.5 ? 0.5 : 0);
          }
          solution.push(v);
        }
        // Pick the first non-singular matrix from the configured range. 0 is
        // treated like any other coefficient, so the corresponding variable
        // may simply not appear in some equations (formatTerm drops 0 terms).
        const MAX_TRIES = 200;
        let foundA = null;
        for(let t = 0; t < MAX_TRIES; t++){
          A = [];
          for(let i = 0; i < n; i++){
            const row = [];
            for(let j = 0; j < n; j++) row.push(randCoeff(cLo, cHi));
            A.push(row);
          }
          if(Math.abs(det(A)) > 0.5){ foundA = A; break; }
        }
        // No non-singular matrix in the configured range (e.g. coeffMin =
        // coeffMax = 0): mark the system as empty so renderSystem shows the
        // "no valid system configured" warning.
        if(!foundA){
          A = []; b = []; solution = []; names = [];
          return;
        }
        A = foundA;
        b = A.map(row => row.reduce((s, c, j) => s + c * solution[j], 0));
      }
      function det(M){
        if(M.length === 2) return M[0][0]*M[1][1] - M[0][1]*M[1][0];
        if(M.length === 3){
          return M[0][0]*(M[1][1]*M[2][2] - M[1][2]*M[2][1])
               - M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0])
               + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0]);
        }
        return 0;
      }

      // Manual variant generation
      function generateManual(){
        const variants = Array.isArray(config.variants) ? config.variants : [];
        // Keep only uniquely-solvable variants.
        const valid = [];
        variants.forEach(v => {
          const r = analyzeVariant(v && v.equations, v && v.variableNames);
          if(r.ok) valid.push(r);
        });
        if(!valid.length){
          A = []; b = []; solution = []; names = [];
          return { ok: false, err: t('block.equation-system.noValidVariant') };
        }
        const pick = valid[Math.floor(Math.random() * valid.length)];
        A = pick.A; b = pick.b; solution = pick.solution; names = pick.names;
        return { ok: true };
      }

      // Render current system
      function renderSystem(extraMsg){
        content.innerHTML = '';
        if(!A.length){
          const warn = document.createElement('div');
          warn.className = 'eqsys-warn';
          warn.textContent = extraMsg || t('block.equation-system.noValidSystem');
          warn.style.cssText = 'padding:0.6rem 0.8rem; background:#fff3cd; border:1px solid #ffc107; border-radius:6px; color:#856404;';
          content.appendChild(warn);
          return;
        }
        const sysWrap = document.createElement('div');
        sysWrap.className = 'eqsys-system';
        const block = document.createElement('div');
        block.className = 'eqsys-line eqsys-aligned';
        const body = systemToLatex(A, b, names).join(' \\\\ ');
        block.innerHTML = '\\[\\begin{aligned} ' + body + ' \\end{aligned}\\]';
        sysWrap.appendChild(block);
        content.appendChild(sysWrap);

        const inputWrap = document.createElement('div');
        inputWrap.className = 'eqsys-inputs';
        inputs.length = 0;
        names.forEach(name => {
          const row = document.createElement('div');
          row.className = 'eqsys-input-row';
          const lbl = document.createElement('label');
          lbl.innerHTML = '\\(' + name + '\\) =';
          lbl.className = 'eqsys-input-label';
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'text-input eqsys-input';
          inp.placeholder = t('block.equation-system.inputPlaceholder');
          row.appendChild(lbl); row.appendChild(inp);
          inputWrap.appendChild(row);
          inputs.push(inp);
        });
        content.appendChild(inputWrap);
        u.renderMath(content);
      }

      function generate(){
        if(mode === 'manual'){
          const res = generateManual();
          if(!res.ok){
            renderSystem(res.err);
            fb.bad(res.err);
            return false;
          }
        } else {
          generateRandom();
        }
        renderSystem();
        return true;
      }

      const tol = Number(config.tolerance) || 0.01;
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = t('common.check');
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = t('common.regenerate');
      buttons.appendChild(checkBtn); buttons.appendChild(newBtn);

      checkBtn.addEventListener('click', () => {
        if(!inputs.length) return;
        // No variable entered at all: prompt instead of recording a 0.
        if(inputs.every(inp => String(inp.value || '').trim() === '')){
          fb.bad(t('block.equation-system.enterAtLeastOne'));
          return;
        }
        let correct = 0;
        inputs.forEach((inp, i) => {
          const got = u.parseNum(inp.value);
          inp.classList.remove('eqsys-correct', 'eqsys-wrong');
          if(got != null && u.nearlyEqual(got, solution[i], tol)){
            inp.classList.add('eqsys-correct');
            correct++;
          } else {
            inp.classList.add('eqsys-wrong');
          }
        });
        const n = inputs.length;
        const max = Number(config.maxPoints) || n;
        const pts = Math.round((correct / n) * max * 100) / 100;
        if(correct === n){
          fb.ok(t('block.equation-system.allCorrect', { max: max, solution: formatSolution(names, solution) }));
        } else {
          fb.bad(t('block.equation-system.partialCorrect', { correct: correct, total: n, pts: pts, max: max, solution: formatSolution(names, solution) }));
        }
        api.reportScore(pts);
      });
      newBtn.addEventListener('click', () => {
        const ok = generate();
        if(ok) fb.neutral(t('block.equation-system.newSystemGenerated'));
      });
      window.BlockUtils.regenPolicy(newBtn, config, api);

      generate();
      api.initScore(Number(config.maxPoints) || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const t = u.t;
      const l = u.l;
      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3');
      h3.textContent = t('common.question');
      card.appendChild(h3);
      const q = document.createElement('p');
      q.textContent = l(config.question) || t('block.equation-system.defaultQuestion');
      card.appendChild(q);

      // Static example (x=4, y=1). Inline styles so preview works without runtime CSS.
      const sys = document.createElement('div');
      sys.className = 'eqsys-system';
      sys.style.cssText = 'display:flex; flex-direction:column; gap:0.55rem; padding:0.9rem 1.1rem; ' +
        'background:var(--panel-soft, #eef5f8); border-radius:10px; border-left:5px solid var(--accent, #84bf66); ' +
        'margin:0.6rem 0 1rem; font-size:1.05rem; line-height:1.6;';
      sys.innerHTML =
        '<div class="eqsys-line eqsys-aligned" style="padding:0.15rem 0;">' +
        '\\[\\begin{aligned} 2x + 3y &= 13 \\\\ x - y &= 1 \\end{aligned}\\]' +
        '</div>';
      card.appendChild(sys);

      const inputs = document.createElement('div');
      inputs.className = 'eqsys-inputs';
      inputs.style.cssText = 'display:flex; flex-direction:column; gap:0.65rem; margin-bottom:0.8rem;';
      inputs.innerHTML =
        '<div class="eqsys-input-row" style="display:flex; align-items:center; gap:0.6rem;"><span class="eqsys-input-label" style="font-weight:700; color:var(--primary, #003b5c); min-width:36px;">\\(x\\) =</span><span class="bp-input" style="width:80px;">?</span></div>' +
        '<div class="eqsys-input-row" style="display:flex; align-items:center; gap:0.6rem;"><span class="eqsys-input-label" style="font-weight:700; color:var(--primary, #003b5c); min-width:36px;">\\(y\\) =</span><span class="bp-input" style="width:80px;">?</span></div>';
      card.appendChild(inputs);

      const btn = document.createElement('span');
      btn.textContent = t('common.check');
      btn.className = 'bp-btn';
      btn.style.marginTop = '0.8rem';
      btn.style.display = 'inline-block';
      card.appendChild(btn);
      host.appendChild(card);
    }
  });

  function applyPreset(config){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const base = Object.assign({}, config);
    if(config.preset === 'simple-2'){
      return Object.assign(base, {
        variableCount: 2, variableNames: 'x,y',
        coeffMin: -3, coeffMax: 3, solutionMin: -3, solutionMax: 3,
        integerSolution: true, tolerance: 0.01
      });
    }
    if(config.preset === 'standard-2'){
      return Object.assign(base, {
        variableCount: 2, variableNames: 'x,y',
        coeffMin: -5, coeffMax: 5, solutionMin: -5, solutionMax: 5,
        integerSolution: true, tolerance: 0.01
      });
    }
    if(config.preset === 'standard-3'){
      return Object.assign(base, {
        variableCount: 3, variableNames: 'x,y,z',
        coeffMin: -3, coeffMax: 3, solutionMin: -3, solutionMax: 3,
        integerSolution: true, tolerance: 0.01
      });
    }
    return config;
  }
})();
