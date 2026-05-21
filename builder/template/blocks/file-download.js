// file-download.js: Lesson attachment block. Renders a download button
// with title + description.
(function(){
  'use strict';

  // Human-readable size from a data-URL. Returns '' for plain URLs.
  function dataUrlSize(src){
    if(!src || !src.startsWith('data:')) return '';
    const b64 = src.split(',')[1] || '';
    const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    const bytes = Math.max(0, (b64.length * 3 / 4) - padding);
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if(bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  // Prefer config.filename; otherwise derive from URL.
  function downloadFilename(config){
    if(config.filename) return config.filename;
    if(config.src && !config.src.startsWith('data:')){
      const last = config.src.split('/').pop().split('?')[0];
      if(last) return last;
    }
    return 'datei';
  }

  Blocks.register('file-download', {
    label: 'Datei-Download',
    description: 'Lerneinheits-Anhang zum Download anbieten, z. B. PDF-Skript, ZIP-Übung oder Vorlagen.',
    category: 'Medien & Inhalt',
    icon: 'file-download',
    graded: false,
    defaultConfig(){
      return { src: '', filename: '', title: '', description: '' };
    },
    previewConfig(){
      return {
        src: '',
        _demo: true,
        filename: 'skript-woche-3.pdf',
        title: 'Vorlesungs-Skript Woche 3',
        description: 'PDF, 12 Seiten · Kapitel 4 (Lineare Algebra)'
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Titel (vor dem Download-Button)', type:'text', placeholder:'z. B. „Vorlesungs-Skript Woche 3"' },
        { key:'src', label:'Datei (Upload oder URL)', type:'file', help:'Hochgeladene Dateien werden als Data-URL ins SCORM-Paket eingebettet.' },
        { key:'filename', label:'Anzeigename / Speichername', type:'text', placeholder:'z. B. „skript-woche-3.pdf"' },
        { key:'description', label:'Beschreibung (optional, unter dem Button)', type:'text', placeholder:'Format, Seitenzahl, Hinweise …' }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('div');
      wrap.className = 'file-download-block';
      wrap.style.cssText = 'display:flex; align-items:center; gap:0.8rem; padding:0.8rem 1rem; border:1px solid var(--line, #d2dce5); border-radius:10px; background:#f7fafc;';

      const ico = document.createElement('div');
      ico.style.cssText = 'flex:0 0 36px; width:36px; height:44px; border-radius:5px 5px 4px 4px; background:#003b5c; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem; letter-spacing:0.04em; position:relative;';
      const ext = (config.filename || '').split('.').pop().toUpperCase();
      ico.textContent = ext && ext.length <= 4 ? ext : 'FILE';
      const corner = document.createElement('div');
      corner.style.cssText = 'position:absolute; top:0; right:0; width:10px; height:10px; background:linear-gradient(225deg, #fff 50%, transparent 50%);';
      ico.appendChild(corner);
      wrap.appendChild(ico);

      const body = document.createElement('div');
      body.style.cssText = 'flex:1; min-width:0;';
      if(config.title){
        const t = document.createElement('div');
        t.style.cssText = 'font-weight:700; color:var(--primary, #003b5c); margin-bottom:0.15rem;';
        t.textContent = config.title;
        body.appendChild(t);
      }
      if(config.description){
        const d = document.createElement('div');
        d.style.cssText = 'font-size:0.85rem; color:var(--muted, #6a7986);';
        d.textContent = config.description;
        body.appendChild(d);
      }
      const fileInfo = document.createElement('div');
      fileInfo.style.cssText = 'font-size:0.78rem; color:var(--muted, #6a7986); font-family:"SF Mono",Menlo,Consolas,monospace; margin-top:0.2rem;';
      const sizeText = dataUrlSize(config.src);
      const fname = downloadFilename(config);
      fileInfo.textContent = sizeText ? (fname + ' · ' + sizeText) : fname;
      body.appendChild(fileInfo);
      wrap.appendChild(body);

      // _demo mode renders the styled button without an href.
      if(config.src || config._demo){
        const btn = document.createElement(config.src ? 'a' : 'span');
        if(config.src){
          btn.href = config.src;
          btn.download = downloadFilename(config);
        }
        btn.style.cssText = 'flex:0 0 auto; padding:0.5rem 1rem; background:var(--primary, #003b5c); color:#fff; border-radius:8px; text-decoration:none; font-weight:700; font-size:0.9rem; white-space:nowrap; display:inline-block;';
        btn.textContent = '↓ Download';
        wrap.appendChild(btn);
      } else {
        const ph = document.createElement('div');
        ph.style.cssText = 'flex:0 0 auto; padding:0.5rem 1rem; background:#dbe5ec; color:#6a7986; border-radius:8px; font-weight:700; font-size:0.9rem; white-space:nowrap;';
        ph.textContent = '(keine Datei)';
        wrap.appendChild(ph);
      }
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      this.mount(host, config, {});
    }
  });
})();
