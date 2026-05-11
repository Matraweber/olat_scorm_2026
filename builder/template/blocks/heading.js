(function(){
  'use strict';
  Blocks.register('heading', {
    label: 'Überschrift',
    description: 'Zwischenüberschrift im Aufgabentext.',
    category: 'Inhalt',
    icon: 'H',
    graded: false,
    defaultConfig(){ return { text: 'Überschrift', level: 2 }; },
    builderSchema(){
      return [
        { key:'text', label:'Text', type:'text' },
        { key:'level', label:'Größe', type:'select', options:[
          {value:2, label:'Groß (h2)'},
          {value:3, label:'Mittel (h3)'},
          {value:4, label:'Klein (h4)'}
        ]}
      ];
    },
    mount(host, config, api){
      const tag = 'h' + (Number(config.level) || 2);
      const el = document.createElement(tag);
      el.textContent = config.text || '';
      el.style.color = 'var(--primary)';
      el.style.margin = '0 0 0.6rem';
      host.appendChild(el);
      return {};
    },
    preview(host, config){
      const lvl = Number(config.level) || 2;
      const e = document.createElement(lvl === 4 ? 'h4' : lvl === 3 ? 'h3' : 'h2');
      e.textContent = config.text || 'Überschrift';
      e.style.cssText = 'color:#003b5c; margin:0; padding:0.6rem 0.7rem; line-height:1.2; font-size:' + (lvl === 4 ? '1rem' : lvl === 3 ? '1.2rem' : '1.5rem') + ';';
      host.appendChild(e);
    }
  });
})();
