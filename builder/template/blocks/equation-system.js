(function(){
  'use strict';

  const EPS = 1e-9;

  // Parser: linear expression -> {coeffs[], constant}. Accepts 2x, -3y, +0.5z, x, -x.
  function parseLinear(str, varNames){
    let s = String(str || '').replace(/\s+/g, '').replace(/\*/g, '');
    if(!s) return { ok: true, coeffs: varNames.map(() => 0), constant: 0 };
    if(s[0] !== '+' && s[0] !== '-') s = '+' + s;
    const coeffs = varNames.map(() => 0);
    let constant = 0;
    let i = 0;
    while(i < s.length){
      if(s[i] !== '+' && s[i] !== '-') return { ok: false, err: 'unerwartetes Zeichen "' + s[i] + '"' };
      const sign = s[i] === '-' ? -1 : 1;
      i++;
      let numStr = '';
      while(i < s.length && /[\d.]/.test(s[i])){ numStr += s[i]; i++; }
      let varStr = '';
      while(i < s.length && /[a-zA-Z_]/.test(s[i])){ varStr += s[i]; i++; }
      let num;
      if(numStr === '' || numStr === '.'){
        if(!varStr) return { ok: false, err: 'leerer Term nach Vorzeichen' };
        num = 1;
      } else {
        if(numStr.split('.').length > 2) return { ok: false, err: 'ungültige Zahl "' + numStr + '"' };
        num = parseFloat(numStr);
        if(!isFinite(num)) return { ok: false, err: 'ungültige Zahl "' + numStr + '"' };
      }
      if(varStr){
        const idx = varNames.indexOf(varStr);
        if(idx < 0) return { ok: false, err: 'unbekannte Variable "' + varStr + '"' };
        coeffs[idx] += sign * num;
      } else {
        constant += sign * num;
      }
    }
    return { ok: true, coeffs, constant };
  }

  function parseEquation(eqStr, varNames){
    const s = String(eqStr || '').trim();
    if(!s) return { ok: false, err: 'leere Gleichung' };
    const idx = s.indexOf('=');
    if(idx < 0) return { ok: false, err: 'kein "=" gefunden' };
    if(s.indexOf('=', idx + 1) >= 0) return { ok: false, err: 'mehr als ein "=", bitte eine Gleichung pro Zeile' };
    const lhs = parseLinear(s.slice(0, idx), varNames);
    if(!lhs.ok) return { ok: false, err: 'linke Seite: ' + lhs.err };
    const rhs = parseLinear(s.slice(idx + 1), varNames);
    if(!rhs.ok) return { ok: false, err: 'rechte Seite: ' + rhs.err };
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
    if(names.length < 1) return { ok: false, err: 'keine Variablen definiert' };
    if(names.length > 4) return { ok: false, err: 'höchstens 4 Variablen unterstützt' };
    if(new Set(names).size !== names.length) return { ok: false, err: 'doppelte Variablennamen' };
    for(const v of names){
      if(!/^[a-zA-Z_]\w*$/.test(v)) return { ok: false, err: 'ungültiger Variablenname "' + v + '"' };
    }
    const lines = String(equationsText || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if(!lines.length) return { ok: false, err: 'keine Gleichung angegeben' };
    // Don't reject m < n; solveSystem detects underdetermined cases by rank.
    const A = [], b = [], rawLines = [];
    for(let i = 0; i < lines.length; i++){
      const parsed = parseEquation(lines[i], names);
      if(!parsed.ok) return { ok: false, err: 'Zeile ' + (i+1) + ': ' + parsed.err };
      A.push(parsed.coeffs);
      b.push(parsed.rhs);
      rawLines.push(lines[i]);
    }
    const result = solveSystem(A, b);
    if(result.kind === 'invalid') return { ok: false, err: 'System ungültig' };
    if(result.kind === 'inconsistent') return { ok: false, err: 'Widerspruch in den Gleichungen; System ist nicht lösbar' };
    if(result.kind === 'underdetermined'){
      return { ok: false, err: 'nicht eindeutig lösbar (' + result.freeCount + ' freie Variable' + (result.freeCount === 1 ? '' : 'n') + ')' };
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
    description: 'Lineares Gleichungssystem, zufällig generiert oder mit eigenen Varianten.',
    category: 'MINT',
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
        return c + ' Variante' + (c === 1 ? '' : 'n');
      }
      return (cfg.variableCount || 2) + ' Variablen, zufällig';
    },
    validate(cfg){
      const w = [];
      if(cfg.mode === 'manual'){
        const variants = Array.isArray(cfg.variants) ? cfg.variants : [];
        if(!variants.length){
          w.push('Manueller Modus: keine Variante angelegt.');
          return w;
        }
        variants.forEach((v, i) => {
          const r = analyzeVariant(v.equations, v.variableNames);
          if(!r.ok) w.push('Variante ' + (i+1) + ': ' + r.err);
        });
        return w;
      }
      // Random
      const n = Number(cfg.variableCount) || 2;
      if(n < 2 || n > 3) w.push('Anzahl Variablen muss 2 oder 3 sein.');
      const lo = Number(cfg.coeffMin), hi = Number(cfg.coeffMax);
      if(cfg.coeffMin == null || cfg.coeffMax == null || !Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi){
        w.push('Koeffizienten-Bereich ungültig.');
      }
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', mode: 'random', preset: 'custom',
        question: 'Lösen Sie das folgende Gleichungssystem.',
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
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Gleichungssystem' },
        { key:'mode', label:'Modus', type:'select', options:[
          { value:'random', label:'Zufällige Werte (Builder erzeugt das System)' },
          { value:'manual', label:'Eigene Varianten (Sie schreiben das System)' }
        ], help:'„Zufällig" generiert bei jedem Start neue Koeffizienten. „Eigene Varianten" wählt aus von Ihnen definierten Systemen.' },

        // Random mode
        { key:'preset', label:'Vorlage', type:'select', options:[
          { value:'custom',     label:'Manuell (leer)' },
          { value:'simple-2',   label:'Beispiel: 2 Variablen, kleine Zahlen' },
          { value:'standard-2', label:'Beispiel: 2 Variablen, Standard-Bereich' },
          { value:'standard-3', label:'Beispiel: 3 Variablen' }
        ], showIf: isRandom },
        { type:'action', label:'Zurücksetzen', action:'reset', showIf: isCustom },

        { type:'section', label:'Frage', key:'_sec_q' },
        { key:'question', label:'Aufgabentext', type:'math-textarea', rows:2 },

        { type:'section', label:'System (zufällig)', key:'_sec_sys', showIf: isCustom },
        { key:'variableCount', label:'Anzahl Variablen (2 oder 3)', type:'number', step:1, min:2, max:3, showIf: isCustom },
        { key:'variableNames', label:'Variablennamen (Komma-getrennt)', type:'text', placeholder:'x,y oder x,y,z', showIf: isCustom },

        { type:'section', label:'Wertebereiche', key:'_sec_ranges', showIf: isCustom },
        { key:'coeffMin', label:'Koeffizient Min', type:'number', step:1, showIf: isCustom },
        { key:'coeffMax', label:'Koeffizient Max', type:'number', step:1, showIf: isCustom },
        { key:'solutionMin', label:'Lösung Min', type:'number', step:1, showIf: isCustom },
        { key:'solutionMax', label:'Lösung Max', type:'number', step:1, showIf: isCustom },
        { key:'integerSolution', label:'Lösungen sind ganzzahlig', type:'boolean', showIf: isCustom },

        // Manual mode
        { type:'section', label:'Varianten', key:'_sec_var', showIf: isManual,
          help:'Pro „Neu generieren" wird zufällig eine Variante gewählt. Jede Variante wird live geprüft. Die Zusammenfassung zeigt die berechnete Lösung oder eine Warnung, falls das System nicht eindeutig lösbar ist.' },
        { key:'variants', type:'list', itemLabel:'Variante', showIf: isManual,
          itemSummary: item => {
            const r = analyzeVariant(item && item.equations, item && item.variableNames);
            if(r.ok) return '✓  ' + formatSolution(r.names, r.solution);
            return '⚠  ' + r.err;
          },
          itemSchema: [
            { key:'variableNames', label:'Variablen (Komma-getrennt)', type:'text', placeholder:'x,y', default:'x,y' },
            { key:'equations', label:'Gleichungen (eine pro Zeile)', type:'textarea', rows:4,
              placeholder:'2x + 3y = 7\nx - y = 1',
              help:'Beispiele: „2x + 3y = 7", „x = 5", „-0.5x + y = 2", „2x = y + 1". Multiplikation muss nicht mit * geschrieben werden.' }
          ]
        },

        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'tolerance', label:'Toleranz pro Variable', type:'number', step:0.01 },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = window.BlockUtils;
      const mode = (config.mode || 'random');
      if(mode === 'random') config = applyPreset(config);

      const ui = u.simpleQuestionCard(host, {
        title: config.blockTitle || 'Gleichungssystem',
        question: config.question || ''
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
        if(cLo >= cHi){ cLo = -5; cHi = 5; }
        let sLo = num(config.solutionMin, -5);
        let sHi = num(config.solutionMax,  5);
        if(sLo > sHi){ sLo = -5; sHi = 5; }

        function randInt(lo, hi){ return Math.floor(lo + Math.random() * (hi - lo + 1)); }
        // 0 is allowed in coefficients. Tight ranges like [-1, 1] still produce
        // ±1 frequently; with 0 in the range, some terms drop out (formatTerm
        // hides them) which gives the system more variety.
        function randCoeff(lo, hi){ return randInt(lo, hi); }
        // Fallback when the range contains only 0 (e.g. [0, 0]): use ±1
        // so we can still produce a non-singular matrix.
        function randCoeffNonZero(lo, hi){
          if(lo === 0 && hi === 0) return Math.random() < 0.5 ? -1 : 1;
          let v;
          let tries = 0;
          do { v = randInt(lo, hi); tries++; } while(v === 0 && tries < 50);
          if(v === 0) v = 1;
          return v;
        }

        solution = [];
        for(let i = 0; i < n; i++){
          let v = randInt(sLo, sHi);
          if(config.integerSolution === false){
            v = v + (Math.random() < 0.5 ? 0.5 : 0);
          }
          solution.push(v);
        }
        // Aim for a non-singular and "dense" (many nonzero entries) matrix.
        // Score = nonZeroCount * 10 + min(|det|, 5): density matters more than
        // a larger determinant, so we prefer interesting-looking systems.
        const MAX_TRIES = 80;
        let bestA = null, bestScore = -1;
        function densityScore(M){
          let nz = 0;
          for(const r of M) for(const v of r) if(v !== 0) nz++;
          const d = Math.abs(det(M));
          if(d <= 0.5) return -1; // singular -> reject
          return nz * 10 + Math.min(d, 5);
        }
        for(let t = 0; t < MAX_TRIES; t++){
          A = [];
          for(let i = 0; i < n; i++){
            const row = [];
            for(let j = 0; j < n; j++) row.push(randCoeff(cLo, cHi));
            A.push(row);
          }
          const score = densityScore(A);
          if(score > bestScore){ bestA = A.map(r => r.slice()); bestScore = score; }
          // Full matrix and non-singular -> ideal, stop early.
          if(score >= n * n * 10) break;
        }
        if(bestScore < 0){
          // No non-singular matrix found (e.g. range [0, 0]): force a diagonal
          // with ±1 entries.
          A = [];
          for(let i = 0; i < n; i++){
            const row = [];
            for(let j = 0; j < n; j++) row.push(i === j ? randCoeffNonZero(cLo, cHi) : 0);
            A.push(row);
          }
        } else {
          A = bestA;
        }
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
          return { ok: false, err: 'Keine gültige Variante konfiguriert.' };
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
          warn.textContent = extraMsg || 'Kein gültiges Gleichungssystem konfiguriert.';
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
          inp.placeholder = 'Zahl oder Bruch';
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
      checkBtn.textContent = 'Korrektur';
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = 'Neu generieren';
      buttons.appendChild(checkBtn); buttons.appendChild(newBtn);

      checkBtn.addEventListener('click', () => {
        if(!inputs.length) return;
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
          fb.ok('Alle Variablen korrekt. ' + max + ' / ' + max + ' Punkte. Lösung: ' + formatSolution(names, solution));
        } else {
          fb.bad(correct + ' von ' + n + ' korrekt. ' + pts + ' / ' + max + ' Punkte. Erwartet: ' + formatSolution(names, solution));
        }
        api.reportScore(pts);
      });
      newBtn.addEventListener('click', () => {
        const ok = generate();
        if(ok) fb.neutral('Neues System generiert.');
      });

      generate();
      api.initScore(Number(config.maxPoints) || 1);
      return {};
    },
    preview(host, config){
      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3');
      h3.textContent = 'Frage';
      card.appendChild(h3);
      const q = document.createElement('p');
      q.textContent = config.question || 'Lösen Sie das folgende Gleichungssystem.';
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
      btn.textContent = 'Korrektur';
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
