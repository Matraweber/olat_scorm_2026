// util.js: DOM helpers, string/file utilities, toast.
// No imports from other app modules.

// el(tag, { className, id, text, html, attrs, style, on, children })
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

// Cache-bust template fetches so preview iframes and ZIPs use fresh files.
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

// Styled replacement for window.confirm(). Returns Promise<boolean>.
// Options: title, message, confirmLabel, cancelLabel, danger.
// Falls back to native confirm() if document.body is unavailable.
export function confirmDialog(opts){
  if(typeof document === 'undefined' || !document.body){
    return Promise.resolve(window.confirm(opts && opts.message ? opts.message : 'OK?'));
  }
  const {
    title = '',
    message = '',
    confirmLabel = 'OK',
    cancelLabel = 'Abbrechen',
    danger = false
  } = opts || {};
  return new Promise(resolve => {
    const prevFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'modal confirm-dialog';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    const titleHtml = title ? '<h2 class="confirm-dialog-title">' + escapeHtml(title) + '</h2>' : '';
    overlay.innerHTML =
      '<div class="modal-card confirm-dialog-card">' +
        titleHtml +
        '<p class="confirm-dialog-message">' + escapeHtml(message) + '</p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-secondary confirm-dialog-cancel" type="button">' + escapeHtml(cancelLabel) + '</button>' +
          '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + ' confirm-dialog-ok" type="button">' + escapeHtml(confirmLabel) + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    const okBtn = overlay.querySelector('.confirm-dialog-ok');
    const cancelBtn = overlay.querySelector('.confirm-dialog-cancel');
    function cleanup(result){
      document.removeEventListener('keydown', onKey, true);
      overlay.removeEventListener('mousedown', onBackdrop);
      overlay.remove();
      if(prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
      resolve(result);
    }
    function onKey(e){
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); cleanup(false); }
      else if(e.key === 'Enter' && e.target !== cancelBtn){ e.preventDefault(); cleanup(true); }
    }
    function onBackdrop(e){
      if(e.target === overlay) cleanup(false);
    }
    okBtn.addEventListener('click', () => cleanup(true));
    cancelBtn.addEventListener('click', () => cleanup(false));
    document.addEventListener('keydown', onKey, true);
    overlay.addEventListener('mousedown', onBackdrop);
    setTimeout(() => okBtn.focus({ preventScroll: true }), 0);
  });
}

