(function(){
  'use strict';
  Blocks.register('number-base', {
    label: 'Zahlensysteme (Bin/Dez/Hex)',
    description: 'Umrechnung zwischen Binär, Oktal, Dezimal und Hexadezimal.',
    category: 'MINT',
    icon: '0x',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        directionPreset: 'standard',
        directions: [{ from: 'dec', to: 'bin' }, { from: 'bin', to: 'dec' }, { from: 'dec', to: 'hex' }],
        valueRange: { min: 0, max: 255 },
        randomize: true,
        maxPoints: 1
      };
    },
    summary(){ return 'Zahlensystem-Umrechnung'; },
    builderSchema(){
      const baseOpts = [
        {value:'bin', label:'Binär (Basis 2)'},
        {value:'oct', label:'Oktal (Basis 8)'},
        {value:'dec', label:'Dezimal (Basis 10)'},
        {value:'hex', label:'Hexadezimal (Basis 16)'}
      ];
      const presetOpts = [
        {value:'custom', label:'Eigene Richtungen'},
        {value:'standard', label:'Standardmix'},
        {value:'all-decimal', label:'Alle von/nach Dezimal'},
        {value:'dec-bin', label:'Dezimal → Binär'},
        {value:'bin-dec', label:'Binär → Dezimal'},
        {value:'dec-hex', label:'Dezimal → Hex'},
        {value:'hex-dec', label:'Hex → Dezimal'},
        {value:'bin-hex', label:'Binär ↔ Hex'}
      ];
      const BASE_LABEL = { bin:'Binär', oct:'Oktal', dec:'Dezimal', hex:'Hex' };
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Zahlensysteme' },
        { key:'directionPreset', label:'Umrechnungs-Preset', type:'select', options: presetOpts },
        // Directions (only when "Custom directions" is selected)
        { type:'section', label:'Erlaubte Umrechnungs-Richtungen', key:'_sec_dir',
          showIf: c => (c.directionPreset || 'standard') === 'custom' },
        { key:'directions', label:'Richtungen', type:'list', itemLabel:'Richtung',
          showIf: c => (c.directionPreset || 'standard') === 'custom',
          itemSummary: item => (BASE_LABEL[item.from] || item.from || '?') + '  →  ' + (BASE_LABEL[item.to] || item.to || '?'),
          itemSchema:[
            { key:'from', label:'Von',  type:'select', options: baseOpts },
            { key:'to',   label:'Nach', type:'select', options: baseOpts }
          ]},
        // Settings & scoring
        { type:'section', label:'Einstellungen & Bewertung', key:'_sec_opts' },
        { key:'valueRange', label:'Wertebereich (dezimal)', type:'group', schema:[
          { key:'min', label:'von', type:'number', step:1 },
          { key:'max', label:'bis', type:'number', step:1 }
        ]},
        { key:'randomize', label:'Richtung zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const baseLabels = {bin:'Binär', oct:'Oktal', dec:'Dezimal', hex:'Hexadezimal'};
      const baseRadix  = {bin:2, oct:8, dec:10, hex:16};
      let current = null;

      const ui = u.questionCard(host, { h3: config.blockTitle || 'Aufgabe', qBoxTitle:'Frage', inputLabel:'Antwort', inputPlaceholder:'Antwort eingeben' });
      const { qText, inp, checkBtn, newBtn, fb } = ui;

      function buildInstance(){
        const directions = directionList(config);
        const dir = config.randomize !== false ? directions[Math.floor(Math.random()*directions.length)] : directions[0];
        const min = Math.max(0, Number((config.valueRange && config.valueRange.min) ?? 0));
        const max = Math.max(min + 1, Number((config.valueRange && config.valueRange.max) ?? 255));
        const valueDec = Math.floor(min + Math.random() * (max - min + 1));
        const fromStr = valueDec.toString(baseRadix[dir.from]).toUpperCase();
        const toStr   = valueDec.toString(baseRadix[dir.to]).toUpperCase();
        return { dir, valueDec, fromStr, toStr };
      }
      function sameInstance(a, b){
        return !!a && !!b && a.valueDec === b.valueDec && a.dir.from === b.dir.from && a.dir.to === b.dir.to;
      }
      function chooseNew(showMsg){
        let next = buildInstance();
        for(let i = 0; current && sameInstance(next, current) && i < 30; i++) next = buildInstance();
        current = next;
        inp.value = '';
        qText.innerHTML = 'Wandeln Sie <strong>' + current.fromStr + '</strong> aus <em>' + baseLabels[current.dir.from] + '</em> nach <em>' + baseLabels[current.dir.to] + '</em> um.';
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
      window.BlockUtils.regenPolicy(newBtn, config, api);
      chooseNew(false);
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const baseLabels = {bin:'Binär (₂)', oct:'Oktal (₈)', dec:'Dezimal (₁₀)', hex:'Hex (₁₆)'};
      const baseRadix = {bin:2, oct:8, dec:10, hex:16};
      const wrap = u.tagPreview(host, { icon:'0x', label:'Zahlensystem-Umrechnung', fillHeight:true });
      // Show example
      const dirs = directionList(config);
      const dir = dirs[0];
      const min = (config.valueRange && config.valueRange.min) || 0;
      const max = (config.valueRange && config.valueRange.max) || 255;
      const sample = Math.floor((min + max) / 2);
      const fromStr = sample.toString(baseRadix[dir.from] || 10).toUpperCase();
      const ex = document.createElement('div');
      ex.style.cssText = 'font-family:"Courier New",monospace; padding:0.4rem 0.6rem; background:#f5f8fa; border:1px solid #d8e0e6; border-radius:6px; color:#0f2d44;';
      ex.innerHTML = '<strong>' + fromStr + '</strong> <span style="color:#5d6872">[' + (baseLabels[dir.from] || dir.from) + ']</span> &nbsp;→&nbsp; <span style="background:#fff8e6; padding:0 0.3rem; border-radius:3px;">?</span> <span style="color:#5d6872">[' + (baseLabels[dir.to] || dir.to) + ']</span>';
      wrap.appendChild(ex);
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:0.72rem; color:#5d6872; margin-top:0.3rem;';
      hint.textContent = dirs.length + ' Richtung(en) im Pool, Werte ' + min + ' bis ' + max;
      wrap.appendChild(hint);
    }
  });

  function directionList(config){
    const custom = config.directions && config.directions.length ? config.directions : [{from:'dec', to:'bin'}];
    switch(config.directionPreset || 'standard'){
      case 'custom': return custom;
      case 'all-decimal': return [{from:'dec', to:'bin'}, {from:'bin', to:'dec'}, {from:'dec', to:'oct'}, {from:'oct', to:'dec'}, {from:'dec', to:'hex'}, {from:'hex', to:'dec'}];
      case 'dec-bin': return [{from:'dec', to:'bin'}];
      case 'bin-dec': return [{from:'bin', to:'dec'}];
      case 'dec-hex': return [{from:'dec', to:'hex'}];
      case 'hex-dec': return [{from:'hex', to:'dec'}];
      case 'bin-hex': return [{from:'bin', to:'hex'}, {from:'hex', to:'bin'}];
      case 'standard':
      default: return [{from:'dec', to:'bin'}, {from:'bin', to:'dec'}, {from:'dec', to:'hex'}];
    }
  }
})();
