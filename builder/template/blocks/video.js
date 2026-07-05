// video.js: <video> tag for files, embed iframe for YouTube/Vimeo. Optional poster, 16:9.
(function(){
  'use strict';

  // Returns { kind, id|url } or null. kind: 'youtube' | 'vimeo' | 'file'.
  function detectVideoSource(src){
    if(!src || typeof src !== 'string') return null;
    if(src.startsWith('data:')) return { kind:'file', url: src };
    // YouTube: watch?v= / youtu.be/ / /embed/ / /shorts/ / /v/, with extra params.
    const yt = src.match(/(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if(yt) return { kind:'youtube', id: yt[1] };
    const vm = src.match(/vimeo\.com\/(?:video\/|channels\/[^\/]+\/|groups\/[^\/]+\/videos\/)?([0-9]+)/);
    if(vm) return { kind:'vimeo', id: vm[1] };
    return { kind:'file', url: src };
  }

  function buildEmbed(srcInfo, opts){
    const iframe = document.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('loading', 'lazy');
    var fallbackTitle = 'Embedded video';
    if(window.BlockUtils && typeof window.BlockUtils.t === 'function'){
      try { fallbackTitle = window.BlockUtils.t('block.video.embed.defaultTitle'); } catch(_e){}
    }
    iframe.title = (opts && opts.title) || fallbackTitle;
    if(srcInfo.kind === 'youtube'){
      // nocookie + rel=0: no related-videos grid at the end.
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + srcInfo.id + '?rel=0';
    } else if(srcInfo.kind === 'vimeo'){
      iframe.src = 'https://player.vimeo.com/video/' + srcInfo.id + '?dnt=1';
    }
    iframe.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; border:0; display:block;';
    return iframe;
  }

  // Exposed for the builder form (form.js renderVideoField).
  Blocks.register('video', {
    label: 'Video',
    labelKey: 'block.video.label',
    description: 'Videodatei oder YouTube-/Vimeo-URL einbetten. Datei-Upload oder Link.',
    descKey: 'block.video.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: 'video',
    graded: false,
    detectVideoSource,
    defaultConfig(locale = 'de'){
      return {
        src: '',
        poster: '',
        title: '',
        caption: ''
      };
    },
    previewConfig(locale = 'de'){
      const en = locale === 'en';
      // _demo:true renders a mock frame in preview().
      return {
        src: '',
        _demo: true,
        poster: '',
        title: en ? 'Sample video' : 'Beispiel-Video',
        caption: en ? 'Source: own recording' : 'Quelle: eigene Aufnahme'
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Titel (über dem Player, optional)', labelKey:'block.video.field.title.label', type:'text' },
        { key:'src', label:'Videoquelle (Datei, YouTube oder Vimeo)', labelKey:'block.video.field.src.label', type:'video', help:'Hochgeladene Dateien werden als Data-URL eingebettet. YouTube- und Vimeo-Links werden automatisch erkannt und als Embed eingebunden.', helpKey:'block.video.field.src.help' },
        { key:'poster', label:'Vorschaubild (nur bei Datei-Upload sichtbar)', labelKey:'block.video.field.poster.label', type:'image', help:'Bei YouTube/Vimeo verwendet der Embed seine eigene Vorschau.', helpKey:'block.video.field.poster.help' },
        { key:'caption', label:'Bildunterschrift (unter dem Player, optional)', labelKey:'block.video.field.caption.label', type:'text' }
      ];
    },
    mount(host, config, api){
      const t = (api && api.utils && api.utils.t) ? api.utils.t : (k, p) => k;
      const l = (api && api.utils && api.utils.l) ? api.utils.l : (v) => v;
      const wrap = document.createElement('figure');
      wrap.className = 'video-block';
      wrap.style.margin = '0';
      const titleText = l(config.title);
      if(titleText){
        const title = document.createElement('div');
        title.className = 'video-block-title';
        title.textContent = titleText;
        title.style.cssText = 'font-weight:700; color:var(--primary); margin-bottom:0.4rem;';
        wrap.appendChild(title);
      }
      if(!config.src){
        const ph = document.createElement('div');
        ph.className = 'block-placeholder';
        ph.style.cssText = 'aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; color:#888; font-style:italic; border:1px dashed #c7d3dc; border-radius:8px; background:#f7fafc;';
        ph.textContent = t('block.video.placeholder.noVideo');
        wrap.appendChild(ph);
        host.appendChild(wrap);
        return {};
      }
      // Brand-gradient background replaces the browser's dark "no content" overlay.
      const frame = document.createElement('div');
      frame.style.cssText = 'position:relative; width:100%; aspect-ratio:16/9; border-radius:8px; overflow:hidden; background:' + (config.poster ? '#000' : 'linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%)') + ';';
      const srcInfo = detectVideoSource(config.src);
      if(srcInfo && (srcInfo.kind === 'youtube' || srcInfo.kind === 'vimeo')){
        frame.appendChild(buildEmbed(srcInfo, { title: titleText || t('block.video.embed.defaultTitle') }));
      } else {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        video.src = config.src;
        if(config.poster) video.poster = config.poster;
        video.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; display:block; object-fit:contain; background:transparent;';
        frame.appendChild(video);
      }
      wrap.appendChild(frame);
      const captionText = l(config.caption);
      if(captionText){
        const cap = document.createElement('figcaption');
        cap.textContent = captionText;
        cap.style.cssText = 'font-size:0.85rem; color:var(--muted); margin-top:0.4rem;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const t = (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t : (k, p) => k;
      const l = (window.BlockUtils && window.BlockUtils.l) ? window.BlockUtils.l : (v) => v;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; height:100%; padding:0.4rem; box-sizing:border-box; gap:0.3rem; overflow:hidden;';
      const titleText = l(config.title);
      if(titleText){
        const tEl = document.createElement('div');
        tEl.textContent = titleText;
        tEl.style.cssText = 'font-weight:700; color:#003b5c; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        wrap.appendChild(tEl);
      }
      if(config._demo){
        // 16:9 mock frame with play-button overlay for the welcome modal.
        const demo = document.createElement('div');
        demo.style.cssText = 'position:relative; width:100%; aspect-ratio:16/9; border-radius:8px; background:linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%); overflow:hidden; display:flex; align-items:center; justify-content:center;';
        // Faux film grain
        demo.innerHTML =
          '<svg viewBox="0 0 320 180" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute; inset:0; opacity:0.08;" aria-hidden="true">' +
            (() => {
              const dots = [];
              for(let i = 0; i < 60; i++){
                const x = (i * 73) % 320;
                const y = (i * 41) % 180;
                dots.push('<circle cx="' + x + '" cy="' + y + '" r="1" fill="#fff"/>');
              }
              return dots.join('');
            })() +
          '</svg>' +
          '<div style="position:relative; width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,0.92); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(0,0,0,0.35);">' +
            '<svg viewBox="0 0 24 24" width="26" height="26" fill="#003b5c" aria-hidden="true">' +
              '<path d="M6 4 L20 12 L6 20 Z"/>' +
            '</svg>' +
          '</div>';
        wrap.appendChild(demo);
      } else if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'flex:1; display:flex; align-items:center; justify-content:center; color:#888; font-style:italic; font-size:0.8rem; border:1px dashed #c7d3dc; border-radius:6px; background:#f7fafc; min-height:80px;';
        ph.textContent = t('block.video.preview.noVideoFile');
        wrap.appendChild(ph);
      } else {
        // Same gradient wrapper as mount().
        const frame = document.createElement('div');
        frame.style.cssText = 'position:relative; flex:1; min-height:0; width:100%; border-radius:4px; overflow:hidden; background:' + (config.poster ? '#000' : 'linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%)') + ';';
        const srcInfo = detectVideoSource(config.src);
        if(srcInfo && (srcInfo.kind === 'youtube' || srcInfo.kind === 'vimeo')){
          frame.appendChild(buildEmbed(srcInfo, { title: titleText || t('block.video.embed.defaultTitle') }));
        } else {
          const video = document.createElement('video');
          video.controls = true;
          video.preload = 'metadata';
          video.src = config.src;
          if(config.poster) video.poster = config.poster;
          video.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; display:block; object-fit:contain; background:transparent;';
          frame.appendChild(video);
        }
        wrap.appendChild(frame);
      }
      const captionText = l(config.caption);
      if(captionText){
        const cap = document.createElement('div');
        cap.textContent = captionText;
        cap.style.cssText = 'font-size:0.7rem; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
    }
  });
})();
