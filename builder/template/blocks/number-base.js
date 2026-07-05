(function(){
  'use strict';
  Blocks.register('number-base', {
    label: 'Zahlensysteme (Bin/Dez/Hex)',
    labelKey: 'block.number-base.label',
    description: 'Umrechnung zwischen Binär, Oktal, Dezimal und Hexadezimal.',
    descKey: 'block.number-base.description',
    category: 'MINT',
    categoryKey: 'block.category.mint',
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
    summary(){
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      return t('block.number-base.summary');
    },
    builderSchema(){
      const baseOpts = [
        {value:'bin', label:'Binär (Basis 2)',      labelKey:'block.number-base.field.from.option.bin'},
        {value:'oct', label:'Oktal (Basis 8)',      labelKey:'block.number-base.field.from.option.oct'},
        {value:'dec', label:'Dezimal (Basis 10)',   labelKey:'block.number-base.field.from.option.dec'},
        {value:'hex', label:'Hexadezimal (Basis 16)', labelKey:'block.number-base.field.from.option.hex'}
      ];
      const baseOptsTo = [
        {value:'bin', label:'Binär (Basis 2)',      labelKey:'block.number-base.field.to.option.bin'},
        {value:'oct', label:'Oktal (Basis 8)',      labelKey:'block.number-base.field.to.option.oct'},
        {value:'dec', label:'Dezimal (Basis 10)',   labelKey:'block.number-base.field.to.option.dec'},
        {value:'hex', label:'Hexadezimal (Basis 16)', labelKey:'block.number-base.field.to.option.hex'}
      ];
      const presetOpts = [
        {value:'custom',      label:'Eigene Richtungen',   labelKey:'block.number-base.field.directionPreset.option.custom'},
        {value:'standard',    label:'Standardmix',         labelKey:'block.number-base.field.directionPreset.option.standard'},
        {value:'all-decimal', label:'Alle von/nach Dezimal', labelKey:'block.number-base.field.directionPreset.option.all-decimal'},
        {value:'dec-bin',     label:'Dezimal → Binär',     labelKey:'block.number-base.field.directionPreset.option.dec-bin'},
        {value:'bin-dec',     label:'Binär → Dezimal',     labelKey:'block.number-base.field.directionPreset.option.bin-dec'},
        {value:'dec-hex',     label:'Dezimal → Hex',       labelKey:'block.number-base.field.directionPreset.option.dec-hex'},
        {value:'hex-dec',     label:'Hex → Dezimal',       labelKey:'block.number-base.field.directionPreset.option.hex-dec'},
        {value:'bin-hex',     label:'Binär ↔ Hex',         labelKey:'block.number-base.field.directionPreset.option.bin-hex'}
      ];
      const BASE_LABEL = { bin:'Binär', oct:'Oktal', dec:'Dezimal', hex:'Hex' };
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.number-base.field.blockTitle.label', type:'text', placeholder:'Zahlensysteme', placeholderKey:'block.number-base.field.blockTitle.placeholder' },
        { key:'directionPreset', label:'Umrechnungs-Preset', labelKey:'block.number-base.field.directionPreset.label', type:'select', options: presetOpts },
        // Directions (only when "Custom directions" is selected)
        { type:'section', label:'Erlaubte Umrechnungs-Richtungen', labelKey:'block.number-base.field.sectionDirections.label', key:'_sec_dir',
          showIf: c => (c.directionPreset || 'standard') === 'custom' },
        { key:'directions', label:'Richtungen', labelKey:'block.number-base.field.directions.label', type:'list', itemLabel:'Richtung', itemLabelKey:'block.number-base.field.directions.itemLabel',
          showIf: c => (c.directionPreset || 'standard') === 'custom',
          itemSummary: item => (BASE_LABEL[item.from] || item.from || '?') + '  →  ' + (BASE_LABEL[item.to] || item.to || '?'),
          itemSchema:[
            { key:'from', label:'Von',  labelKey:'block.number-base.field.from.label',  type:'select', options: baseOpts },
            { key:'to',   label:'Nach', labelKey:'block.number-base.field.to.label', type:'select', options: baseOptsTo }
          ]},
        // Settings & scoring
        { type:'section', label:'Einstellungen & Bewertung', labelKey:'block.number-base.field.sectionSettings.label', key:'_sec_opts' },
        { key:'valueRange', label:'Wertebereich (dezimal)', labelKey:'block.number-base.field.valueRange.label', type:'group', schema:[
          { key:'min', label:'von', labelKey:'block.number-base.field.valueRange.min.label', type:'number', step:1 },
          { key:'max', label:'bis', labelKey:'block.number-base.field.valueRange.max.label', type:'number', step:1 }
        ]},
        { key:'randomize', label:'Richtung zufällig wählen', labelKey:'block.number-base.field.randomize.label', type:'boolean' },
        { key:'maxPoints', label:'Punkte', labelKey:'block.number-base.field.maxPoints.label', type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const baseLabels = {
        bin: u.t('block.number-base.base.bin'),
        oct: u.t('block.number-base.base.oct'),
        dec: u.t('block.number-base.base.dec'),
        hex: u.t('block.number-base.base.hex')
      };
      const baseRadix  = {bin:2, oct:8, dec:10, hex:16};
      let current = null;

      const ui = u.questionCard(host, {
        h3: u.l(config.blockTitle) || u.t('common.task'),
        qBoxTitle: u.t('common.question'),
        inputLabel: u.t('common.answer'),
        inputPlaceholder: u.t('common.answerPlaceholder')
      });
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
        qText.innerHTML = u.t('block.number-base.instruction', {
          value: current.fromStr,
          from: baseLabels[current.dir.from],
          to: baseLabels[current.dir.to]
        });
        if(showMsg) fb.neutral(u.t('block.number-base.newTaskGenerated'));
      }
      function grade(){
        const cleaned = String(inp.value || '').trim().toUpperCase().replace(/^0X/, '').replace(/^0B/, '').replace(/\s+/g, '');
        if(!cleaned){ fb.bad(u.t('block.number-base.enterAnswer')); return; }
        const valid = {bin:/^[01]+$/, oct:/^[0-7]+$/, dec:/^[0-9]+$/, hex:/^[0-9A-F]+$/}[current.dir.to];
        if(!valid.test(cleaned)){ fb.bad(u.t('block.number-base.invalidChars', { base: baseLabels[current.dir.to] })); return; }
        const parsed = parseInt(cleaned, baseRadix[current.dir.to]);
        if(parsed === current.valueDec){ fb.ok(u.t('common.correct')); api.reportScore(config.maxPoints || 1); }
        else { fb.bad(u.t('block.number-base.incorrectWithAnswer', { answer: current.toStr })); api.reportScore(0); }
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
      const baseLabels = {
        bin: u.t('block.number-base.baseShort.bin'),
        oct: u.t('block.number-base.baseShort.oct'),
        dec: u.t('block.number-base.baseShort.dec'),
        hex: u.t('block.number-base.baseShort.hex')
      };
      const baseRadix = {bin:2, oct:8, dec:10, hex:16};
      const wrap = u.tagPreview(host, { icon:'0x', label: u.t('block.number-base.previewLabel'), fillHeight:true });
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
      hint.textContent = u.t('block.number-base.previewHint', { count: dirs.length, min: min, max: max });
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
