(function(){
  'use strict';
  Blocks.register('heading', {
    label: 'Überschrift',
    labelKey: 'block.heading.label',
    description: 'Zwischenüberschrift im Aufgabentext.',
    descKey: 'block.heading.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: 'H',
    graded: false,
    defaultConfig(locale = 'de'){
      const en = locale === 'en';
      return { text: en ? 'Heading' : 'Überschrift', level: 2 };
    },
    summary(cfg){
      const u = window.BlockUtils;
      const raw = u && u.l ? u.l(cfg.text) : cfg.text;
      if(raw) return raw;
      return u && u.t ? u.t('block.heading.summary.empty') : '(empty)';
    },
    builderSchema(){
      return [
        { key:'text', label:'Text', labelKey:'block.heading.field.text.label', type:'text' },
        { key:'level', label:'Größe', labelKey:'block.heading.field.level.label', type:'select', options:[
          {value:2, label:'Groß (h2)',   labelKey:'block.heading.field.level.option.2'},
          {value:3, label:'Mittel (h3)', labelKey:'block.heading.field.level.option.3'},
          {value:4, label:'Klein (h4)',  labelKey:'block.heading.field.level.option.4'}
        ]}
      ];
    },
    mount(host, config, api){
      const tag = 'h' + (Number(config.level) || 2);
      const el = document.createElement(tag);
      el.textContent = api.utils.l(config.text) || '';
      el.style.color = 'var(--primary)';
      el.style.margin = '0 0 0.6rem';
      host.appendChild(el);
      return {};
    },
    preview(host, config){
      const lvl = Number(config.level) || 2;
      const e = document.createElement(lvl === 4 ? 'h4' : lvl === 3 ? 'h3' : 'h2');
      e.textContent = window.BlockUtils.l(config.text) || window.BlockUtils.t('block.heading.defaultText');
      e.style.cssText = 'color:#003b5c; margin:0; padding:0.6rem 0.7rem; line-height:1.2; font-size:' + (lvl === 4 ? '1rem' : lvl === 3 ? '1.2rem' : '1.5rem') + ';';
      host.appendChild(e);
    }
  });
})();
