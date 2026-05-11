(function(){
  'use strict';
  Blocks.register('number-base', {
    label: 'Zahlensystem-Umrechnung',
    description: 'Umrechnung zwischen Binär, Dezimal, Oktal, Hexadezimal.',
    category: 'Frage',
    icon: '0x',
    graded: true,
    defaultConfig(){
      return {
        directions: [{ from: 'dec', to: 'bin' }, { from: 'bin', to: 'dec' }, { from: 'dec', to: 'hex' }],
        valueRange: { min: 0, max: 255 },
        randomize: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      const baseOpts = [
        {value:'bin', label:'Binär (Basis 2)'},
        {value:'oct', label:'Oktal (Basis 8)'},
        {value:'dec', label:'Dezimal (Basis 10)'},
        {value:'hex', label:'Hexadezimal (Basis 16)'}
      ];
      return [
        { key:'directions', label:'Erlaubte Richtungen', type:'list', itemLabel:'Richtung',
          itemSchema:[
            { key:'from', label:'Von', type:'select', options: baseOpts },
            { key:'to',   label:'Nach', type:'select', options: baseOpts }
          ]},
        { key:'valueRange', label:'Wertebereich (dezimal)', type:'group', schema:[
          { key:'min', label:'Min', type:'number', step:1 },
          { key:'max', label:'Max', type:'number', step:1 }
        ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const baseLabels = {bin:'Binär', oct:'Oktal', dec:'Dezimal', hex:'Hexadezimal'};
      const baseRadix  = {bin:2, oct:8, dec:10, hex:16};
      let current = null;

      const card = document.createElement('section'); card.className = 'section-card block-question';
      card.appendChild(Object.assign(document.createElement('h3'), {textContent:'Aufgabe'}));
      const qBox = document.createElement('div'); qBox.className = 'formula-box'; qBox.style.marginBottom = '1rem';
      qBox.innerHTML = '<div class="formula-title">Aufgabe</div>';
      const qText = document.createElement('div'); qText.className = 'formula-text';
      qBox.appendChild(qText); card.appendChild(qBox);

      const grp = document.createElement('div'); grp.className = 'control-group control-group-compact';
      grp.appendChild(Object.assign(document.createElement('label'), {textContent:'Antwort'}));
      const inp = document.createElement('input'); inp.type='text'; inp.className='text-input'; inp.placeholder='Antwort eingeben';
      grp.appendChild(inp); card.appendChild(grp);

      const btnRow = document.createElement('div'); btnRow.className='button-cluster';
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent='Korrektur';
      const newBtn = document.createElement('button'); newBtn.type='button'; newBtn.className='btn btn-secondary'; newBtn.textContent='Neu generieren';
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn);
      card.appendChild(btnRow);

      const fb = u.feedbackBox(card);
      host.appendChild(card);

      function chooseNew(showMsg){
        const directions = config.directions && config.directions.length ? config.directions : [{from:'dec', to:'bin'}];
        const dir = config.randomize !== false ? directions[Math.floor(Math.random()*directions.length)] : directions[0];
        const min = Math.max(0, Number((config.valueRange && config.valueRange.min) ?? 0));
        const max = Math.max(min + 1, Number((config.valueRange && config.valueRange.max) ?? 255));
        const valueDec = Math.floor(min + Math.random() * (max - min + 1));
        const fromStr = valueDec.toString(baseRadix[dir.from]).toUpperCase();
        const toStr   = valueDec.toString(baseRadix[dir.to]).toUpperCase();
        current = { dir, valueDec, fromStr, toStr };
        inp.value = '';
        qText.innerHTML = 'Wandeln Sie <strong>' + fromStr + '</strong> aus <em>' + baseLabels[dir.from] + '</em> nach <em>' + baseLabels[dir.to] + '</em> um.';
        if(showMsg) fb.neutral('Neue Aufgabe generiert.');
      }
      function grade(){
        const cleaned = String(inp.value || '').trim().toUpperCase().replace(/^0X/, '').replace(/^0B/, '').replace(/\s+/g, '');
        if(!cleaned){ fb.bad('Bitte eine Antwort eingeben.'); return; }
        const valid = {bin:/^[01]+$/, oct:/^[0-7]+$/, dec:/^[0-9]+$/, hex:/^[0-9A-F]+$/}[current.dir.to];
        if(!valid.test(cleaned)){ fb.bad('Ungültige Zeichen für ' + baseLabels[current.dir.to] + '.'); return; }
        const parsed = parseInt(cleaned, baseRadix[current.dir.to]);
        if(parsed === current.valueDec){ fb.ok('Korrekt.'); api.reportScore(config.maxPoints || 1); }
        else { fb.bad('Nicht korrekt. Richtige Antwort: ' + current.toStr); api.reportScore(0); }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', () => chooseNew(true));
      chooseNew(false);
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const baseLabels = {bin:'Binär (₂)', oct:'Oktal (₈)', dec:'Dezimal (₁₀)', hex:'Hex (₁₆)'};
      const baseRadix = {bin:2, oct:8, dec:10, hex:16};
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.55rem 0.75rem; font-size:0.85rem; height:100%; overflow:hidden;';
      const tag = document.createElement('div');
      tag.textContent = '0x  Zahlensystem-Umrechnung';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.4rem;';
      wrap.appendChild(tag);
      // Show example
      const dirs = config.directions || [{from:'dec', to:'bin'}];
      const dir = dirs[0];
      const min = (config.valueRange && config.valueRange.min) || 0;
      const max = (config.valueRange && config.valueRange.max) || 255;
      const sample = Math.floor((min + max) / 2);
      const fromStr = sample.toString(baseRadix[dir.from] || 10).toUpperCase();
      const toStr   = sample.toString(baseRadix[dir.to]   || 10).toUpperCase();
      const ex = document.createElement('div');
      ex.style.cssText = 'font-family:"Courier New",monospace; padding:0.4rem 0.6rem; background:#f5f8fa; border:1px solid #d8e0e6; border-radius:6px; color:#0f2d44;';
      ex.innerHTML = '<strong>' + fromStr + '</strong> <span style="color:#5d6872">[' + (baseLabels[dir.from] || dir.from) + ']</span> &nbsp;→&nbsp; <span style="background:#fff8e6; padding:0 0.3rem; border-radius:3px;">?</span> <span style="color:#5d6872">[' + (baseLabels[dir.to] || dir.to) + ']</span>';
      wrap.appendChild(ex);
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:0.72rem; color:#5d6872; margin-top:0.3rem;';
      hint.textContent = (config.directions || []).length + ' Richtung(en) im Pool, Werte ' + min + ' bis ' + max;
      wrap.appendChild(hint);
      host.appendChild(wrap);
    }
  });
})();
