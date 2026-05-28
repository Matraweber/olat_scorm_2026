(function(){
  'use strict';
  Blocks.register('rich-text', {
    label: 'Fließtext',
    description: 'Absatz mit Formatierung (fett, kursiv, Listen, Links).',
    category: 'Medien & Inhalt',
    icon: '¶',
    graded: false,
    defaultConfig(){ return { html: '' }; },
    summary(cfg){
      const d = document.createElement('div');
      d.innerHTML = (window.BlockUtils && window.BlockUtils.sanitizeHtml)
        ? window.BlockUtils.sanitizeHtml(cfg.html || '')
        : String(cfg.html || '');
      const t = (d.textContent || '').trim();
      return t.length > 80 ? t.slice(0, 80) + '…' : (t || '(leerer Text)');
    },
    previewConfig(){
      return {
        html: '<p>Dieser Block enthält <strong>formatierten Text</strong>. Erlaubt sind unter anderem <em>kursive Auszeichnung</em>, Listen und Links.</p>'
      };
    },
    builderSchema(){
      return [
        { key:'html', label:'Inhalt (HTML erlaubt)', type:'textarea', rows:5,
          help:'Erlaubt: HTML wie <p>, <strong>, <em>, <ul>, <li>, <code>, <a>, <br>.' }
      ];
    },
    mount(host, config, api){
      const u = api.utils || window.BlockUtils;
      const wrap = document.createElement('div');
      wrap.className = 'rich-text';
      wrap.innerHTML = u && u.sanitizeHtml ? u.sanitizeHtml(config.html || '') : (config.html || '');
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const div = document.createElement('div');
      const html = config.html || '';
      if(html.trim()){
        div.innerHTML = (window.BlockUtils && window.BlockUtils.sanitizeHtml)
          ? window.BlockUtils.sanitizeHtml(html) : html;
      } else {
        const em = document.createElement('em');
        em.style.color = '#888';
        em.textContent = '(leerer Text)';
        div.appendChild(em);
      }
      div.style.cssText = 'padding:0.55rem 0.7rem; font-size:0.88rem; line-height:1.45; color:#222; overflow:hidden;';
      host.appendChild(div);
    }
  });
})();
