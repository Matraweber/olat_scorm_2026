(function(){
  'use strict';
  Blocks.register('rich-text', {
    label: 'Fließtext',
    description: 'Absatz mit HTML-Formatierung (z. B. <strong>fett</strong>, <em>kursiv</em>).',
    category: 'Inhalt',
    icon: '¶',
    graded: false,
    defaultConfig(){ return { html: '<p>Erklärungstext eingeben …</p>' }; },
    builderSchema(){
      return [
        { key:'html', label:'Inhalt (HTML erlaubt)', type:'textarea', rows:5,
          help:'Erlaubt: HTML wie <p>, <strong>, <em>, <ul>, <li>, <code>, <a>, <br>.' }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('div');
      wrap.className = 'rich-text';
      wrap.innerHTML = config.html || '';
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const div = document.createElement('div');
      div.innerHTML = config.html || '<em style="color:#888">(leerer Text)</em>';
      div.style.cssText = 'padding:0.55rem 0.7rem; font-size:0.88rem; line-height:1.45; color:#222; overflow:hidden;';
      host.appendChild(div);
    }
  });
})();
