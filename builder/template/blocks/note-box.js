(function(){
  'use strict';
  Blocks.register('note-box', {
    label: 'Hinweisbox',
    description: 'Hervorgehobener Hinweiskasten (Info oder Warnung).',
    category: 'Inhalt',
    icon: 'ℹ',
    graded: false,
    defaultConfig(){ return { title: 'Hinweis', html: 'Wichtiger Hinweis für die Lernenden.', variant: 'info' }; },
    builderSchema(){
      return [
        { key:'title', label:'Titel', type:'text' },
        { key:'html', label:'Inhalt (HTML)', type:'textarea', rows:3 },
        { key:'variant', label:'Stil', type:'select', options:[
          {value:'info', label:'Info (grün)'},
          {value:'warn', label:'Warnung (gelb)'},
          {value:'tip',  label:'Tipp (blau)'}
        ]}
      ];
    },
    mount(host, config, api){
      const variant = config.variant || 'info';
      const box = document.createElement('div');
      box.className = 'note-box note-box--' + variant;
      const title = document.createElement('div');
      title.className = 'note-title';
      title.textContent = config.title || '';
      const body = document.createElement('div');
      body.innerHTML = config.html || '';
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
      head.innerHTML = '<span style="color:' + c.border + '">' + c.icon + '</span><span>' + (config.title || 'Hinweis') + '</span>';
      box.appendChild(head);
      const body = document.createElement('div');
      body.innerHTML = config.html || '';
      body.style.cssText = 'font-size:0.84rem; color:#333; line-height:1.4;';
      box.appendChild(body);
      host.appendChild(box);
    }
  });
})();
