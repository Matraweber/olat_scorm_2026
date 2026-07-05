(function(){
  'use strict';
  Blocks.register('rich-text', {
    label: 'Fließtext',
    labelKey: 'block.rich-text.label',
    description: 'Absatz mit Formatierung (fett, kursiv, Listen, Links).',
    descKey: 'block.rich-text.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: '¶',
    graded: false,
    defaultConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        html: en
          ? '<p>Enter your formatted text here.</p>'
          : '<p>Hier den formatierten Text eingeben.</p>'
      };
    },
    summary(cfg){
      const u = window.BlockUtils;
      const d = document.createElement('div');
      const raw = u && u.l ? u.l(cfg.html) : cfg.html;
      d.innerHTML = (u && u.sanitizeHtml)
        ? u.sanitizeHtml(raw || '')
        : String(raw || '');
      const t = (d.textContent || '').trim();
      const emptyLabel = (u && u.t) ? u.t('block.rich-text.emptyText') : '(empty text)';
      return t.length > 80 ? t.slice(0, 80) + '…' : (t || emptyLabel);
    },
    previewConfig(){
      const u = window.BlockUtils;
      return {
        html: (u && u.t)
          ? u.t('block.rich-text.previewHtml')
          : '<p>This block contains <strong>formatted text</strong>. Supported features include <em>italic emphasis</em>, lists and links.</p>'
      };
    },
    builderSchema(){
      return [
        { key:'html',
          label:'Inhalt (HTML erlaubt)',
          labelKey:'block.rich-text.field.html.label',
          type:'textarea', rows:5,
          help:'Erlaubt: HTML wie <p>, <strong>, <em>, <ul>, <li>, <code>, <a>, <br>.',
          helpKey:'block.rich-text.field.html.help' }
      ];
    },
    mount(host, config, api){
      const u = api.utils || window.BlockUtils;
      const wrap = document.createElement('div');
      wrap.className = 'rich-text';
      const raw = u && u.l ? u.l(config.html) : (config.html || '');
      wrap.innerHTML = u && u.sanitizeHtml ? u.sanitizeHtml(raw || '') : (raw || '');
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const div = document.createElement('div');
      const raw = u && u.l ? u.l(config.html) : (config.html || '');
      const html = raw || '';
      if(html.trim()){
        div.innerHTML = (u && u.sanitizeHtml)
          ? u.sanitizeHtml(html) : html;
      } else {
        const em = document.createElement('em');
        em.style.color = '#888';
        em.textContent = (u && u.t) ? u.t('block.rich-text.emptyText') : '(empty text)';
        div.appendChild(em);
      }
      div.style.cssText = 'padding:0.55rem 0.7rem; font-size:0.88rem; line-height:1.45; color:#222; overflow:hidden;';
      host.appendChild(div);
    }
  });
})();
