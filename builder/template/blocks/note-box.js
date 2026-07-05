(function(){
  'use strict';
  Blocks.register('note-box', {
    label: 'Hinweisbox',
    labelKey: 'block.note-box.label',
    description: 'Hervorgehobener Hinweiskasten (Info oder Warnung).',
    descKey: 'block.note-box.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: 'ℹ',
    graded: false,
    defaultConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        title: en ? 'Note' : 'Hinweis',
        html: en ? 'Important note for learners.' : 'Wichtiger Hinweis für die Lernenden.',
        variant: 'info'
      };
    },
    summary(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t : function(k,_p,fb){ return fb; };
      const l = (window.BlockUtils && window.BlockUtils.l) ? window.BlockUtils.l : function(v){ return v; };
      return l(cfg.title) || t('block.note-box.defaultTitle', null, 'Note');
    },
    builderSchema(){
      return [
        { key:'title', label:'Titel', labelKey:'block.note-box.field.title.label', type:'text' },
        { key:'html',  label:'Inhalt (HTML)', labelKey:'block.note-box.field.html.label', type:'textarea', rows:3 },
        { key:'variant', label:'Stil', labelKey:'block.note-box.field.variant.label', type:'select', options:[
          {value:'info', label:'Info (grün)',    labelKey:'block.note-box.field.variant.option.info'},
          {value:'warn', label:'Warnung (gelb)', labelKey:'block.note-box.field.variant.option.warn'},
          {value:'tip',  label:'Tipp (blau)',    labelKey:'block.note-box.field.variant.option.tip'}
        ]}
      ];
    },
    mount(host, config, api){
      const variant = config.variant || 'info';
      const box = document.createElement('div');
      box.className = 'note-box note-box--' + variant;
      const title = document.createElement('div');
      title.className = 'note-title';
      title.textContent = api.utils.l(config.title) || '';
      const body = document.createElement('div');
      body.innerHTML = api.utils.l(config.html) || '';
      box.appendChild(title); box.appendChild(body);
      host.appendChild(box);
      return {};
    },
    preview(host, config){
      const variant = config.variant || 'info';
      const colors = {
        info: { border:'#84bf66', bg:'#f5f8fa', icon:'ℹ' },
        warn: { border:'#d4a72a', bg:'#fff8e6', icon:'!' },
        tip:  { border:'#1565ff', bg:'#eff5ff', icon:'★' }
      };
      const c = colors[variant] || colors.info;
      const box = document.createElement('div');
      box.style.cssText = 'background:' + c.bg + '; border:1px solid #d8e0e6; border-left:6px solid ' + c.border + '; padding:0.6rem 0.8rem; margin:0.4rem; border-radius:8px; height:calc(100% - 0.8rem); overflow:hidden;';
      const head = document.createElement('div');
      head.style.cssText = 'font-weight:700; color:#003b5c; margin-bottom:0.25rem; display:flex; gap:0.4rem; align-items:center;';
      const fallbackTitle = window.BlockUtils.t('block.note-box.defaultTitle', null, 'Note');
      const titleText = window.BlockUtils.l(config.title) || fallbackTitle;
      head.innerHTML = '<span style="color:' + c.border + '">' + c.icon + '</span><span>' + titleText + '</span>';
      box.appendChild(head);
      const body = document.createElement('div');
      body.innerHTML = window.BlockUtils.l(config.html) || '';
      body.style.cssText = 'font-size:0.84rem; color:#333; line-height:1.4;';
      box.appendChild(body);
      host.appendChild(box);
    }
  });
})();
