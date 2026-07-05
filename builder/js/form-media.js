// form-media.js: file-upload field renderers (image, audio, video,
// generic file). Pulled out of form.js so the four similar flows
// (MIME validation → toast → embed as data-URL) share a focused file.

import { el } from './util.js';
import { validateUpload, makeUploadStatus } from './form.js';
import { t } from './i18n.js';

// image field: file upload or URL.
export function renderImageField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file', accept:'image/*'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:t('form.media.image.clear')});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'image');
    if(!v.ok){
      status.showError(v.error);
      fileInp.value = '';  // reset so the user can retry the same file
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      status.showSuccess(t('form.media.image.embedded', { size: v.sizeHuman }));
      rerenderImagePreview();
    };
    r.onerror = () => status.showError(t('form.media.readError'));
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => {
    setObj(spec.key, '');
    status.clear();
    rerenderImagePreview();
  });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
  const urlInp = el('input', {attrs:{type:'text', placeholder:t('form.media.urlPlaceholder')}});
  urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
  urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderImagePreview(); });
  inner.appendChild(urlInp);
  const previewWrap = el('div', {style:{marginTop:'0.5rem'}});
  function rerenderImagePreview(){
    previewWrap.innerHTML = '';
    const v = (getObj() || {})[spec.key];
    if(!v) return;
    const img = el('img', {attrs:{src: v, alt:''}, style:{maxHeight:'120px', maxWidth:'100%', borderRadius:'8px', border:'1px solid var(--line)'}});
    previewWrap.appendChild(img);
  }
  inner.appendChild(previewWrap);
  rerenderImagePreview();
  wrap.appendChild(inner);
  return wrap;
}

// audio field: file upload or URL. Same shape as renderImageField.
export function renderAudioField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file', accept:'audio/*'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:t('form.media.audio.clear')});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'audio');
    if(!v.ok){ status.showError(v.error); fileInp.value = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      status.showSuccess(t('form.media.audio.embedded', { size: v.sizeHuman }));
      rerenderAudioPreview();
    };
    r.onerror = () => status.showError(t('form.media.readError'));
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => { setObj(spec.key, ''); status.clear(); rerenderAudioPreview(); });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
  const urlInp = el('input', {attrs:{type:'text', placeholder:t('form.media.audio.urlPlaceholder')}});
  urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
  urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderAudioPreview(); });
  inner.appendChild(urlInp);
  const previewWrap = el('div', {style:{marginTop:'0.5rem'}});
  function rerenderAudioPreview(){
    previewWrap.innerHTML = '';
    const v = (getObj() || {})[spec.key];
    if(!v) return;
    const a = document.createElement('audio');
    a.controls = true; a.preload = 'metadata';
    a.src = v;
    a.style.cssText = 'width:100%; display:block;';
    previewWrap.appendChild(a);
  }
  inner.appendChild(previewWrap);
  rerenderAudioPreview();
  wrap.appendChild(inner);
  return wrap;
}

// video field: file upload or URL. Previews with <video controls> or
// embed iframe for YouTube/Vimeo links.
export function renderVideoField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file', accept:'video/*'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:t('form.media.video.clear')});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'video');
    if(!v.ok){ status.showError(v.error); fileInp.value = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      status.showSuccess(t('form.media.video.embedded', { size: v.sizeHuman }));
      rerenderVideoPreview();
    };
    r.onerror = () => status.showError(t('form.media.readError'));
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => { setObj(spec.key, ''); status.clear(); rerenderVideoPreview(); });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
  const urlInp = el('input', {attrs:{type:'text', placeholder:t('form.media.video.urlPlaceholder')}});
  urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
  urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderVideoPreview(); });
  inner.appendChild(urlInp);
  const previewWrap = el('div', {style:{marginTop:'0.5rem'}});
  function rerenderVideoPreview(){
    previewWrap.innerHTML = '';
    const v = (getObj() || {})[spec.key];
    if(!v) return;
    // Match runtime's YouTube/Vimeo detection.
    const def = window.Blocks && window.Blocks.get('video');
    const info = def && typeof def.detectVideoSource === 'function' ? def.detectVideoSource(v) : null;
    if(info && (info.kind === 'youtube' || info.kind === 'vimeo')){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative; width:100%; aspect-ratio:16/9; max-width:320px; border-radius:6px; overflow:hidden; background:#000;';
      const iframe = document.createElement('iframe');
      iframe.setAttribute('frameborder','0');
      iframe.setAttribute('allow','accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen','true');
      iframe.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; border:0;';
      iframe.src = info.kind === 'youtube'
        ? 'https://www.youtube-nocookie.com/embed/' + info.id + '?rel=0'
        : 'https://player.vimeo.com/video/' + info.id + '?dnt=1';
      wrap.appendChild(iframe);
      previewWrap.appendChild(wrap);
      const hint = document.createElement('div');
      hint.textContent = t('form.media.video.embedDetected', { provider: info.kind === 'youtube' ? 'YouTube' : 'Vimeo' });
      hint.style.cssText = 'font-size:0.78rem; color:#2c7a3f; margin-top:0.3rem;';
      previewWrap.appendChild(hint);
      return;
    }
    const video = document.createElement('video');
    video.controls = true; video.preload = 'metadata';
    video.src = v;
    video.style.cssText = 'max-width:100%; max-height:180px; display:block; background:linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%); border-radius:6px;';
    previewWrap.appendChild(video);
  }
  inner.appendChild(previewWrap);
  rerenderVideoPreview();
  wrap.appendChild(inner);
  return wrap;
}

// Generic file upload. Auto-fills sibling `filename` field.
export function renderFileField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:t('form.media.file.clear')});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'file');
    if(!v.ok){ status.showError(v.error); fileInp.value = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      // Auto-fill sibling `filename` if empty.
      const cur = getObj() || {};
      if('filename' in cur && !cur.filename) setObj('filename', f.name);
      status.showSuccess(t('form.media.file.embedded', { size: v.sizeHuman }));
      rerenderFilePreview();
    };
    r.onerror = () => status.showError(t('form.media.readError'));
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => { setObj(spec.key, ''); status.clear(); rerenderFilePreview(); });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
  const urlInp = el('input', {attrs:{type:'text', placeholder:t('form.media.urlPlaceholder')}});
  urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
  urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderFilePreview(); });
  inner.appendChild(urlInp);
  const previewWrap = el('div', {style:{marginTop:'0.5rem', fontSize:'0.85rem', color:'var(--muted)'}});
  function rerenderFilePreview(){
    previewWrap.innerHTML = '';
    const v = (getObj() || {})[spec.key];
    if(!v) return;
    if(v.startsWith('data:')){
      const b64 = v.split(',')[1] || '';
      const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
      const bytes = Math.max(0, (b64.length * 3 / 4) - padding);
      const human = bytes < 1024 ? bytes + ' B' :
                    bytes < 1024*1024 ? (bytes/1024).toFixed(1) + ' KB' :
                    bytes < 1024*1024*1024 ? (bytes/1024/1024).toFixed(1) + ' MB' :
                    (bytes/1024/1024/1024).toFixed(2) + ' GB';
      previewWrap.textContent = t('form.media.file.previewEmbedded', { size: human });
    } else {
      previewWrap.textContent = t('form.media.file.previewUrl', { url: v });
    }
  }
  inner.appendChild(previewWrap);
  rerenderFilePreview();
  wrap.appendChild(inner);
  return wrap;
}

