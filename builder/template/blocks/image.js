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
    description: 'Bild mit optionaler Bildunterschrift. Quelle: hochladen oder URL.',
    category: 'Medien & Inhalt',
    icon: 'IMG',
    graded: false,
    defaultConfig(){
      return { src: '', caption: '', width: 'auto', alt: '' };
    },
    summary(cfg){ return cfg.src ? 'Bild gesetzt' : '(noch kein Bild)'; },
    validate(cfg){
      const w = [];
      if(!cfg.src) w.push('Kein Bild gesetzt.');
      if(cfg.src && !cfg.alt) w.push('Alt-Text fehlt (Barrierefreiheit).');
      return w;
    },
    previewConfig(){
      return {
        src: STOCK_LANDSCAPE_SVG,
        caption: 'Beispielbild: Landschaft',
        width: 'auto',
        alt: 'Landschaft mit Sonne, Wolke und Baum'
      };
    },
    builderSchema(){
      return [
        { key:'src', label:'Bildquelle (Data-URL oder URL/Pfad)', type:'image', help:'Hochgeladene Bilder werden als Data-URL ins SCORM-Paket eingebettet.' },
        { key:'alt', label:'Alt-Text (Barrierefreiheit)', type:'text' },
        { key:'caption', label:'Bildunterschrift (optional)', type:'text' },
        { key:'width', label:'Breite (CSS, z. B. 400px, 60%, auto)', type:'text' }
      ];
    },
    mount(host, config, api){
      if(!config.src){
        const ph = document.createElement('div');
        ph.className = 'block-placeholder';
        ph.textContent = '(Bild noch nicht gesetzt)';
        host.appendChild(ph);
        return {};
      }
      const fig = document.createElement('figure');
      fig.className = 'image-block';
      const img = document.createElement('img');
      img.src = config.src;
      img.alt = config.alt || '';
      if(config.width && config.width !== 'auto') img.style.width = config.width;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '12px';
      img.style.display = 'block';
      fig.appendChild(img);
      if(config.caption){
        const cap = document.createElement('figcaption');
        cap.textContent = config.caption;
        cap.style.fontSize = '0.85rem';
        cap.style.color = 'var(--muted)';
        cap.style.marginTop = '0.4rem';
        fig.appendChild(cap);
      }
      host.appendChild(fig);
      return {};
    },
    preview(host, config){
      if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:120px; color:#888; font-style:italic; gap:0.4rem;';
        ph.innerHTML = '<span style="font-size:1.2rem; font-weight:700; color:#5d6872; letter-spacing:0.05em;">BILD</span><span>(noch kein Bild gesetzt)</span>';
        host.appendChild(ph); return;
      }
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; height:100%; padding:0.4rem; box-sizing:border-box;';
      const img = document.createElement('img');
      img.src = config.src; img.alt = config.alt || '';
      img.style.cssText = 'flex:1; min-height:0; max-width:100%; object-fit:contain; display:block; margin:0 auto;';
      wrap.appendChild(img);
      if(config.caption){
        const cap = document.createElement('div');
        cap.textContent = config.caption;
        cap.style.cssText = 'font-size:0.75rem; color:#666; text-align:center; padding-top:0.3rem;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
    }
  });
})();
