(function(){
  'use strict';
  Blocks.register('divider', {
    label: 'Trennlinie',
    labelKey: 'block.divider.label',
    description: 'Horizontale Trennlinie mit etwas Abstand.',
    descKey: 'block.divider.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: '━',
    graded: false,
    defaultConfig(locale = 'de'){ return {}; },
    summary(){
      try {
        if(window.BlockUtils && typeof window.BlockUtils.t === 'function'){
          return window.BlockUtils.t('block.divider.summary');
        }
      } catch(_e){}
      return 'Divider';
    },
    builderSchema(){ return []; },
    mount(host, config, api){
      const hr = document.createElement('hr');
      hr.style.border = 'none';
      hr.style.borderTop = '1px solid var(--line)';
      hr.style.margin = '1rem 0';
      host.appendChild(hr);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; align-items:center; height:100%; padding:0 1rem;';
      const hr = document.createElement('div');
      hr.style.cssText = 'width:100%; border-top:2px solid #003b5c; opacity:0.55;';
      wrap.appendChild(hr);
      host.appendChild(wrap);
    }
  });
})();
