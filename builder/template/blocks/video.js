// ============================================================================
// video.js: Video block - embeds a video file (uploaded as data-URL or
// referenced via URL) with the browser's built-in <video controls> player.
// Also detects YouTube and Vimeo URLs and renders an embed-iframe instead,
// so authors can paste any common video link without re-encoding to MP4.
// Optional poster image (shown before play). 16:9 default aspect ratio.
// ============================================================================
(function(){
  'use strict';

  // Detect YouTube / Vimeo / direct-file URLs and return an embed descriptor.
  // Returns one of:
  //   { kind:'youtube', id:'<11-char id>' }
  //   { kind:'vimeo',   id:'<numeric id>' }
  //   { kind:'file',    url:'<direct URL or data-URL>' }
  //   null if src is falsy
  function detectVideoSource(src){
    if(!src || typeof src !== 'string') return null;
    if(src.startsWith('data:')) return { kind:'file', url: src };
    // YouTube - accept watch?v=, youtu.be/, /embed/, /shorts/, with extra params
    const yt = src.match(/(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if(yt) return { kind:'youtube', id: yt[1] };
    // Vimeo - numeric ID after vimeo.com/
    const vm = src.match(/vimeo\.com\/(?:video\/|channels\/[^\/]+\/|groups\/[^\/]+\/videos\/)?([0-9]+)/);
    if(vm) return { kind:'vimeo', id: vm[1] };
    return { kind:'file', url: src };
  }

  // Build the embed iframe element for YouTube / Vimeo sources.
  function buildEmbed(srcInfo, opts){
    const iframe = document.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('loading', 'lazy');
    iframe.title = (opts && opts.title) || 'Eingebettetes Video';
    if(srcInfo.kind === 'youtube'){
      // youtube-nocookie keeps the cookie footprint minimal; rel=0 hides
      // suggested-video grid at the end (cleaner for learning materials).
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + srcInfo.id + '?rel=0';
    } else if(srcInfo.kind === 'vimeo'){
      iframe.src = 'https://player.vimeo.com/video/' + srcInfo.id + '?dnt=1';
    }
    iframe.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; border:0; display:block;';
    return iframe;
  }

  // Expose helpers on the block def so tests + media-extraction can use them.
  Blocks.register('video', {
    label: 'Video',
    description: 'Videodatei oder YouTube-/Vimeo-URL einbetten. Datei-Upload oder Link.',
    category: 'Medien & Inhalt',
    icon: 'video',
    graded: false,
    detectVideoSource,
    defaultConfig(){
      return { src: '', poster: '', title: '', caption: '' };
    },
    previewConfig(){
      // The welcome-modal preview detects `_demo: true` and renders a
      // decorative mock video frame with a play button overlay, so users
      // can see the filled layout without us embedding a real video.
      return { src: '', _demo: true, poster: '', title: 'Beispiel-Video', caption: 'Quelle: eigene Aufnahme' };
    },
    builderSchema(){
      return [
        { key:'title', label:'Titel (über dem Player, optional)', type:'text' },
        { key:'src', label:'Videoquelle (Datei, YouTube oder Vimeo)', type:'video', help:'Hochgeladene Dateien werden als Data-URL eingebettet. YouTube- und Vimeo-Links werden automatisch erkannt und als Embed eingebunden.' },
        { key:'poster', label:'Vorschaubild (nur bei Datei-Upload sichtbar)', type:'image', help:'Bei YouTube/Vimeo verwendet der Embed seine eigene Vorschau.' },
        { key:'caption', label:'Bildunterschrift (unter dem Player, optional)', type:'text' }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('figure');
      wrap.className = 'video-block';
      wrap.style.margin = '0';
      if(config.title){
        const title = document.createElement('div');
        title.className = 'video-block-title';
        title.textContent = config.title;
        title.style.cssText = 'font-weight:700; color:var(--primary); margin-bottom:0.4rem;';
        wrap.appendChild(title);
      }
      if(!config.src){
        const ph = document.createElement('div');
        ph.className = 'block-placeholder';
        ph.style.cssText = 'aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; color:#888; font-style:italic; border:1px dashed #c7d3dc; border-radius:8px; background:#f7fafc;';
        ph.textContent = '(Video noch nicht gesetzt)';
        wrap.appendChild(ph);
        host.appendChild(wrap);
        return {};
      }
      // Frame wrapper provides a brand-gradient background that shows
      // through any time the video has no poster + isn't playing. Without
      // this the browser paints its own dark grey "no content" overlay.
      const frame = document.createElement('div');
      frame.style.cssText = 'position:relative; width:100%; aspect-ratio:16/9; border-radius:8px; overflow:hidden; background:' + (config.poster ? '#000' : 'linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%)') + ';';
      const srcInfo = detectVideoSource(config.src);
      if(srcInfo && (srcInfo.kind === 'youtube' || srcInfo.kind === 'vimeo')){
        // YouTube / Vimeo embed: iframe instead of native <video>. The
        // platform's own player UI takes over (controls, poster, etc.).
        frame.appendChild(buildEmbed(srcInfo, { title: config.title || 'Eingebettetes Video' }));
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
      if(config.caption){
        const cap = document.createElement('figcaption');
        cap.textContent = config.caption;
        cap.style.cssText = 'font-size:0.85rem; color:var(--muted); margin-top:0.4rem;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; height:100%; padding:0.4rem; box-sizing:border-box; gap:0.3rem; overflow:hidden;';
      if(config.title){
        const t = document.createElement('div');
        t.textContent = config.title;
        t.style.cssText = 'font-weight:700; color:#003b5c; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        wrap.appendChild(t);
      }
      if(config._demo){
        // Decorative 16:9 frame with a play-button overlay. Shows users
        // the layout without us embedding a real video file.
        const demo = document.createElement('div');
        demo.style.cssText = 'position:relative; width:100%; aspect-ratio:16/9; border-radius:8px; background:linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%); overflow:hidden; display:flex; align-items:center; justify-content:center;';
        // Subtle decorative film-grain dots
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
          // Large play button in centre
          '<div style="position:relative; width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,0.92); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(0,0,0,0.35);">' +
            '<svg viewBox="0 0 24 24" width="26" height="26" fill="#003b5c" aria-hidden="true">' +
              '<path d="M6 4 L20 12 L6 20 Z"/>' +
            '</svg>' +
          '</div>';
        wrap.appendChild(demo);
      } else if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'flex:1; display:flex; align-items:center; justify-content:center; color:#888; font-style:italic; font-size:0.8rem; border:1px dashed #c7d3dc; border-radius:6px; background:#f7fafc; min-height:80px;';
        ph.textContent = '(noch keine Videodatei)';
        wrap.appendChild(ph);
      } else {
        // Same wrapper trick as mount() so the brand gradient shows when
        // no poster is set, instead of the browser's default dark frame.
        const frame = document.createElement('div');
        frame.style.cssText = 'position:relative; flex:1; min-height:0; width:100%; border-radius:4px; overflow:hidden; background:' + (config.poster ? '#000' : 'linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%)') + ';';
        const srcInfo = detectVideoSource(config.src);
        if(srcInfo && (srcInfo.kind === 'youtube' || srcInfo.kind === 'vimeo')){
          frame.appendChild(buildEmbed(srcInfo, { title: config.title || 'Eingebettetes Video' }));
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
      if(config.caption){
        const cap = document.createElement('div');
        cap.textContent = config.caption;
        cap.style.cssText = 'font-size:0.7rem; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
    }
  });
})();
