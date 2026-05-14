// ============================================================================
// util.js - DOM helpers, string/file utilities, toast notifications
// No imports from other app modules. May be imported by anyone.
// ============================================================================

/**
 * Create an element with options.
 * @param {string} tag
 * @param {Object} [opts] - { className, id, text, html, attrs, style, on, children }
 */
export function el(tag, opts){
  const e = document.createElement(tag);
  if(!opts) return e;
  if(opts.className) e.className = opts.className;
  if(opts.id) e.id = opts.id;
  if(opts.text != null) e.textContent = opts.text;
  if(opts.html != null) e.innerHTML = opts.html;
  if(opts.attrs) Object.entries(opts.attrs).forEach(([k,v]) => e.setAttribute(k, String(v)));
  if(opts.style) Object.assign(e.style, opts.style);
  if(opts.on) Object.entries(opts.on).forEach(([k,v]) => e.addEventListener(k, v));
  if(opts.children) opts.children.forEach(c => c && e.appendChild(c));
  return e;
}

export function escapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function escapeXml(s){
  return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
}

export function uid(prefix){
  return (prefix || 'id_') + Math.random().toString(36).slice(2, 8);
}

export function sanitizeFilename(s){
  return String(s).replace(/[^a-zA-Z0-9_\-]+/g, '_').slice(0, 80) || 'scorm';
}

export function stripHtmlText(html){
  const d = document.createElement('div');
  d.innerHTML = String(html || '');
  return (d.textContent || '').trim();
}

export function cssEscape(s){
  if(window.CSS && CSS.escape) return CSS.escape(s);
  return String(s).replace(/([!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, '\\$1');
}

export function cssEscapeSafe(s){
  if(window.CSS && window.CSS.escape) return CSS.escape(s);
  return String(s).replace(/[^A-Za-z0-9_-]/g, '\\$&');
}

/**
 * Append a cache-busting query parameter to a URL so we always get the latest version
 * of template files when generating preview iframes or SCORM ZIPs.
 */
export function withBust(url){
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
}

export function blobToDataUrl(blob){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export function extractBodyInner(html){
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

let _toastTimer = null;
export function toast(msg, type){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (type || '');
  t.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}
