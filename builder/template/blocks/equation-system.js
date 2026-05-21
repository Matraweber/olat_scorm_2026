(function(){
  'use strict';

  Blocks.register('equation-system', {
    label: 'Gleichungssystem',
    description: 'Lineares Gleichungssystem mit 2 oder 3 Variablen, Zufallsgeneration.',
    category: 'MINT',
    icon: 'equation-system',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: '',
        variableCount: 2,
        variableNames: '',
        coeffMin: null, coeffMax: null,
        solutionMin: null, solutionMax: null,
        integerSolution: true,
        tolerance: 0.01,
        maxPoints: 2
      };
    },
    summary(cfg){ return (cfg.variableCount || 2) + ' Variablen'; },
    validate(cfg){
      const w = [];
      const n = Number(cfg.variableCount) || 2;
      if(n < 2 || n > 3) w.push('Anzahl Variablen muss 2 oder 3 sein.');
      const lo = Number(cfg.coeffMin), hi = Number(cfg.coeffMax);
      if(!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) w.push('Koeffizienten-Bereich ungueltig.');
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: 'Loesen Sie das folgende Gleichungssystem.',
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
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Ueberschrift', type:'text', placeholder:'Gleichungssystem' },
        { key:'preset', label:'Vorlage', type:'select', options:[
          { value:'custom',     label:'Manuell (leer)' },
          { value:'simple-2',   label:'Beispiel: 2 Variablen, kleine Zahlen' },
          { value:'standard-2', label:'Beispiel: 2 Variablen, Standard-Bereich' },
          { value:'standard-3', label:'Beispiel: 3 Variablen' }
        ], help:'Beispiele zeigen typische Konfigurationen. „Manuell" fuer eigene Einstellungen.' },
        { type:'action', label:'Zuruecksetzen', action:'reset', showIf: isCustom },

        { type:'section', label:'Frage', key:'_sec_q' },
        { key:'question', label:'Aufgabentext', type:'math-textarea', rows:2 },

        { type:'section', label:'System', key:'_sec_sys', showIf: isCustom },
        { key:'variableCount', label:'Anzahl Variablen (2 oder 3)', type:'number', step:1, min:2, max:3, showIf: isCustom },
        { key:'variableNames', label:'Variablennamen (Komma-getrennt)', type:'text', placeholder:'x,y oder x,y,z', showIf: isCustom },

        { type:'section', label:'Wertebereiche', key:'_sec_ranges', showIf: isCustom },
        { key:'coeffMin', label:'Koeffizient Min', type:'number', step:1, showIf: isCustom },
        { key:'coeffMax', label:'Koeffizient Max', type:'number', step:1, showIf: isCustom },
        { key:'solutionMin', label:'Loesung Min', type:'number', step:1, showIf: isCustom },
        { key:'solutionMax', label:'Loesung Max', type:'number', step:1, showIf: isCustom },
        { key:'integerSolution', label:'Loesungen sind ganzzahlig', type:'boolean', showIf: isCustom },

        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'tolerance', label:'Toleranz pro Variable', type:'number', step:0.01 },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = window.BlockUtils;
      config = applyPreset(config);
      const ui = u.simpleQuestionCard(host, {
        title: config.blockTitle || 'Gleichungssystem',
        question: config.question || ''
      });
      const { content, buttons, fb } = ui;

      const n = Math.max(2, Math.min(3, Number(config.variableCount) || 2));
      const names = String(config.variableNames || 'x,y,z').split(',').map(s => s.trim()).filter(Boolean).slice(0, n);
      while(names.length < n) names.push(['x','y','z'][names.length]);
      const coeffMin = Number(config.coeffMin); const coeffMax = Number(config.coeffMax);
      const cLo = isNaN(coeffMin) ? -5 : coeffMin;
      const cHi = isNaN(coeffMax) ? 5  : coeffMax;
      const sLo = isNaN(Number(config.solutionMin)) ? -5 : Number(config.solutionMin);
      const sHi = isNaN(Number(config.solutionMax)) ?  5 : Number(config.solutionMax);
      const tol = Number(config.tolerance) || 0.01;

      let A = [], b = [], solution = [];
      const inputs = [];

      function randInt(lo, hi){ return Math.floor(lo + Math.random() * (hi - lo + 1)); }
      function randNonZero(lo, hi){
        let v;
        do { v = randInt(lo, hi); } while(v === 0);
        return v;
      }
      function generate(){
        // Pick a random solution.
        solution = [];
        for(let i = 0; i < n; i++){
          let v = randInt(sLo, sHi);
          if(config.integerSolution === false){
            v = v + (Math.random() < 0.5 ? 0.5 : 0);
          }
          solution.push(v);
        }
        // Generate non-singular coefficient matrix and corresponding b vector.
        const MAX_TRIES = 30;
        for(let tries = 0; tries < MAX_TRIES; tries++){
          A = [];
          for(let i = 0; i < n; i++){
            const row = [];
            for(let j = 0; j < n; j++) row.push(randNonZero(cLo, cHi));
            A.push(row);
          }
          if(Math.abs(det(A)) > 0.5) break;
        }
        b = A.map(row => row.reduce((s, c, j) => s + c * solution[j], 0));
        renderSystem();
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
      function formatTerm(coeff, varName, first){
        if(coeff === 0) return '';
        const absC = Math.abs(coeff);
        const sign = coeff < 0 ? ' - ' : (first ? '' : ' + ');
        const num = absC === 1 ? '' : String(absC);
        return sign + num + varName;
      }
      function renderSystem(){
        content.innerHTML = '';
        const sysWrap = document.createElement('div');
        sysWrap.className = 'eqsys-system';
        A.forEach((row, i) => {
          let latex = '';
          row.forEach((c, j) => {
            const t = formatTerm(c, names[j], latex === '');
            latex += t;
          });
          latex += ' = ' + b[i];
          const line = document.createElement('div');
          line.className = 'eqsys-line';
          line.innerHTML = '\\(' + latex + '\\)';
          sysWrap.appendChild(line);
        });
        content.appendChild(sysWrap);

        const inputWrap = document.createElement('div');
        inputWrap.className = 'eqsys-inputs';
        inputs.length = 0;
        names.forEach((name, i) => {
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

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Korrektur';
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = 'Neu generieren';
      buttons.appendChild(checkBtn); buttons.appendChild(newBtn);

      checkBtn.addEventListener('click', () => {
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
        const max = Number(config.maxPoints) || n;
        const pts = Math.round((correct / n) * max * 100) / 100;
        if(correct === n){
          fb.ok('Alle Variablen korrekt. ' + max + ' / ' + max + ' Punkte. Loesung: ' +
            names.map((nm, i) => nm + ' = ' + solution[i]).join(', '));
        } else {
          fb.bad(correct + ' von ' + n + ' korrekt. ' + pts + ' / ' + max + ' Punkte. Erwartet: ' +
            names.map((nm, i) => nm + ' = ' + solution[i]).join(', '));
        }
        api.reportScore(pts);
      });
      newBtn.addEventListener('click', () => { generate(); fb.neutral('Neues System generiert.'); });

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
      q.textContent = config.question || 'Loesen Sie das folgende Gleichungssystem.';
      card.appendChild(q);

      // Statisches Beispiel: 2x + 3y = 13, x - y = 1 (Loesung: x=4, y=1)
      const sys = document.createElement('div');
      sys.className = 'eqsys-system';
      sys.innerHTML =
        '<div class="eqsys-line">\\(2x + 3y = 13\\)</div>' +
        '<div class="eqsys-line">\\(x - y = 1\\)</div>';
      card.appendChild(sys);

      const inputs = document.createElement('div');
      inputs.className = 'eqsys-inputs';
      inputs.innerHTML =
        '<div class="eqsys-input-row"><span class="eqsys-input-label">\\(x\\) =</span><span class="bp-input" style="width:80px;">?</span></div>' +
        '<div class="eqsys-input-row"><span class="eqsys-input-label">\\(y\\) =</span><span class="bp-input" style="width:80px;">?</span></div>';
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
