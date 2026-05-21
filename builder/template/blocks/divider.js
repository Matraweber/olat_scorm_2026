(function(){
  'use strict';
  Blocks.register('divider', {
    label: 'Trennlinie',
    description: 'Horizontale Trennlinie mit etwas Abstand.',
    category: 'Medien & Inhalt',
    icon: '━',
    graded: false,
    defaultConfig(){ return {}; },
    summary(){ return 'Trennlinie'; },
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
