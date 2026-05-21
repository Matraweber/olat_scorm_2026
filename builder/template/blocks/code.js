(function(){
  'use strict';
  Blocks.register('code', {
    label: 'Code-Block',
    description: 'Quellcode mit fester Schrift, optional mit Sprach-Tag.',
    category: 'Medien & Inhalt',
    icon: '</>',
    graded: false,
    defaultConfig(){ return { code: 'function hello() {\n  console.log("Hallo, Welt!");\n}', language: 'javascript', title: '' }; },
    builderSchema(){
      return [
        { key:'title', label:'Titel (optional)', type:'text' },
        { key:'language', label:'Sprache (z. B. javascript, python, c)', type:'text' },
        { key:'code', label:'Code', type:'textarea', rows:8 }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:#0f2d44; color:#f8fafc; border-radius:10px; overflow:hidden; font-family:"Courier New", Consolas, monospace;';
      if(config.title || config.language){
        const head = document.createElement('div');
        head.style.cssText = 'background:rgba(255,255,255,0.06); padding:0.4rem 0.8rem; border-bottom:1px solid rgba(255,255,255,0.1); font-size:0.78rem; display:flex; justify-content:space-between; gap:0.5rem;';
        const t = document.createElement('span'); t.textContent = config.title || ''; t.style.fontWeight = '700';
        const l = document.createElement('span'); l.textContent = config.language || ''; l.style.cssText = 'opacity:0.7;';
        head.appendChild(t); head.appendChild(l);
        wrap.appendChild(head);
      }
      const pre = document.createElement('pre');
      pre.style.cssText = 'margin:0; padding:0.85rem 1rem; font-size:0.88rem; line-height:1.5; overflow:auto; white-space:pre;';
      pre.textContent = config.code || '';
      wrap.appendChild(pre);
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:#0f2d44; color:#cae6ff; border-radius:6px; overflow:hidden; font-family:"Courier New",monospace; height:calc(100% - 0.6rem); margin:0.3rem; display:flex; flex-direction:column;';
      const head = document.createElement('div');
      head.style.cssText = 'background:rgba(255,255,255,0.07); padding:0.25rem 0.6rem; font-size:0.7rem; display:flex; justify-content:space-between; flex:0 0 auto;';
      head.innerHTML = '<span>&lt;/&gt; ' + (config.title || 'Code') + '</span><span style="opacity:0.7">' + (config.language || '') + '</span>';
      wrap.appendChild(head);
      const pre = document.createElement('pre');
      pre.style.cssText = 'margin:0; padding:0.45rem 0.6rem; font-size:0.74rem; line-height:1.4; overflow:hidden; white-space:pre; flex:1; min-height:0;';
      pre.textContent = (config.code || '').split('\n').slice(0, 8).join('\n');
      wrap.appendChild(pre);
      host.appendChild(wrap);
    }
  });
})();
