(function(){
  'use strict';

  // Same SVG as hotzone.js, inlined so each block file is self-contained.
  const STOCK_LANDSCAPE_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">' +
      '<rect width="400" height="240" fill="#e7f3f8"/>' +
      '<rect y="180" width="400" height="60" fill="#cde4b0"/>' +
      '<circle cx="60" cy="60" r="30" fill="#f5c14d"/>' +
      '<g fill="#ffffff">' +
        '<ellipse cx="280" cy="70" rx="40" ry="20"/>' +
        '<ellipse cx="310" cy="60" rx="25" ry="18"/>' +
        '<ellipse cx="255" cy="65" rx="22" ry="15"/>' +
      '</g>' +
      '<rect x="195" y="150" width="15" height="40" fill="#7a4d28"/>' +
      '<circle cx="202" cy="140" r="38" fill="#3f8a3f"/>' +
    '</svg>'
  );

  Blocks.register('image', {
    label: 'Bild',
    labelKey: 'block.image.label',
    description: 'Bild mit optionaler Bildunterschrift. Quelle: hochladen oder URL.',
    descKey: 'block.image.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: 'IMG',
    graded: false,
    defaultConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        src: '',
        caption: '',
        width: 'auto',
        alt: ''
      };
    },
    summary(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t : null;
      if(cfg.src) return t ? t('block.image.summary.set') : 'Image set';
      return t ? t('block.image.summary.empty') : '(no image yet)';
    },
    validate(cfg){
      const w = [];
      const t = (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t : null;
      if(!cfg.src) w.push(t ? t('block.image.validate.noSrc') : 'No image set.');
      if(cfg.src && !cfg.alt) w.push(t ? t('block.image.validate.noAlt') : 'Alt text is missing (accessibility).');
      return w;
    },
    previewConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        src: STOCK_LANDSCAPE_SVG,
        caption: en ? 'Sample image: landscape' : 'Beispielbild: Landschaft',
        width: 'auto',
        alt: en ? 'Landscape with sun, cloud and tree' : 'Landschaft mit Sonne, Wolke und Baum'
      };
    },
    builderSchema(){
      return [
        {
          key:'src',
          label:'Bildquelle (Data-URL oder URL/Pfad)',
          labelKey:'block.image.field.src.label',
          type:'image',
          help:'Hochgeladene Bilder werden als Data-URL ins SCORM-Paket eingebettet.',
          helpKey:'block.image.field.src.help'
        },
        {
          key:'alt',
          label:'Alt-Text (Barrierefreiheit)',
          labelKey:'block.image.field.alt.label',
          type:'text'
        },
        {
          key:'caption',
          label:'Bildunterschrift (optional)',
          labelKey:'block.image.field.caption.label',
          type:'text'
        },
        {
          key:'width',
          label:'Breite (CSS, z. B. 400px, 60%, auto)',
          labelKey:'block.image.field.width.label',
          type:'text'
        }
      ];
    },
    mount(host, config, api){
      const t = (api && api.utils && api.utils.t) ? api.utils.t : (k => k);
      const l = (api && api.utils && api.utils.l) ? api.utils.l : (v => v);
      const src = l(config.src);
      const alt = l(config.alt);
      const caption = l(config.caption);
      if(!src){
        const ph = document.createElement('div');
        ph.className = 'block-placeholder';
        ph.textContent = t('block.image.placeholder.empty');
        host.appendChild(ph);
        return {};
      }
      const fig = document.createElement('figure');
      fig.className = 'image-block';
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      if(config.width && config.width !== 'auto') img.style.width = config.width;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '12px';
      img.style.display = 'block';
      fig.appendChild(img);
      if(caption){
        const cap = document.createElement('figcaption');
        cap.textContent = caption;
        cap.style.fontSize = '0.85rem';
        cap.style.color = 'var(--muted)';
        cap.style.marginTop = '0.4rem';
        fig.appendChild(cap);
      }
      host.appendChild(fig);
      return {};
    },
    preview(host, config){
      const t = (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t : (k => k);
      const l = (window.BlockUtils && window.BlockUtils.l) ? window.BlockUtils.l : (v => v);
      const src = l(config.src);
      const alt = l(config.alt);
      const caption = l(config.caption);
      if(!src){
        const ph = document.createElement('div');
        ph.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:120px; color:#888; font-style:italic; gap:0.4rem;';
        const kicker = document.createElement('span');
        kicker.style.cssText = 'font-size:1.2rem; font-weight:700; color:#5d6872; letter-spacing:0.05em;';
        kicker.textContent = t('block.image.preview.kicker');
        const hint = document.createElement('span');
        hint.textContent = t('block.image.preview.empty');
        ph.appendChild(kicker);
        ph.appendChild(hint);
        host.appendChild(ph); return;
      }
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; height:100%; padding:0.4rem; box-sizing:border-box;';
      const img = document.createElement('img');
      img.src = src; img.alt = alt || '';
      img.style.cssText = 'flex:1; min-height:0; max-width:100%; object-fit:contain; display:block; margin:0 auto;';
      wrap.appendChild(img);
      if(caption){
        const cap = document.createElement('div');
        cap.textContent = caption;
        cap.style.cssText = 'font-size:0.75rem; color:#666; text-align:center; padding-top:0.3rem;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
    }
  });
})();
