(function(){
  'use strict';
  Blocks.register('code', {
    label: 'Code-Block',
    labelKey: 'block.code.label',
    description: 'Quellcode mit fester Schrift, optional mit Sprach-Tag.',
    descKey: 'block.code.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: '</>',
    graded: false,
    defaultConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        code: en ? 'function hello() {\n  console.log("Hello, world!");\n}' : 'function hello() {\n  console.log("Hallo, Welt!");\n}',
        language: 'javascript',
        title: ''
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Titel (optional)', labelKey:'block.code.field.title.label', type:'text' },
        { key:'language', label:'Sprache (z. B. javascript, python, c)', labelKey:'block.code.field.language.label', type:'text' },
        { key:'code', label:'Code', labelKey:'block.code.field.code.label', type:'textarea', rows:8 }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:#0f2d44; color:#f8fafc; border-radius:10px; overflow:hidden; font-family:"Courier New", Consolas, monospace;';
      const title = api.utils.l(config.title);
      const language = api.utils.l(config.language);
      const code = api.utils.l(config.code);
      if(title || language){
        const head = document.createElement('div');
        head.style.cssText = 'background:rgba(255,255,255,0.06); padding:0.4rem 0.8rem; border-bottom:1px solid rgba(255,255,255,0.1); font-size:0.78rem; display:flex; justify-content:space-between; gap:0.5rem;';
        const t = document.createElement('span'); t.textContent = title || ''; t.style.fontWeight = '700';
        const l = document.createElement('span'); l.textContent = language || ''; l.style.cssText = 'opacity:0.7;';
        head.appendChild(t); head.appendChild(l);
        wrap.appendChild(head);
      }
      const pre = document.createElement('pre');
      pre.style.cssText = 'margin:0; padding:0.85rem 1rem; font-size:0.88rem; line-height:1.5; overflow:auto; white-space:pre;';
      pre.textContent = code || '';
      wrap.appendChild(pre);
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:#0f2d44; color:#cae6ff; border-radius:6px; overflow:hidden; font-family:"Courier New",monospace; height:calc(100% - 0.6rem); margin:0.3rem; display:flex; flex-direction:column;';
      const head = document.createElement('div');
      head.style.cssText = 'background:rgba(255,255,255,0.07); padding:0.25rem 0.6rem; font-size:0.7rem; display:flex; justify-content:space-between; flex:0 0 auto;';
      const title = window.BlockUtils.l(config.title);
      const language = window.BlockUtils.l(config.language);
      const code = window.BlockUtils.l(config.code);
      const fallbackTitle = window.BlockUtils.t('block.code.previewFallbackTitle');
      head.innerHTML = '<span>&lt;/&gt; ' + (title || fallbackTitle) + '</span><span style="opacity:0.7">' + (language || '') + '</span>';
      wrap.appendChild(head);
      const pre = document.createElement('pre');
      pre.style.cssText = 'margin:0; padding:0.45rem 0.6rem; font-size:0.74rem; line-height:1.4; overflow:hidden; white-space:pre; flex:1; min-height:0;';
      pre.textContent = (code || '').split('\n').slice(0, 8).join('\n');
      wrap.appendChild(pre);
      host.appendChild(wrap);
    }
  });
})();
