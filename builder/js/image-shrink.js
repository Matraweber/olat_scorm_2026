// image-shrink.js: Shrink uploaded images before they are embedded.
// Photos are scaled to at most MAX_SIDE px on the longer side and saved as
// JPEG/WebP (quality 0.85); PNGs (screenshots, diagrams with text) stay
// lossless PNG and are only scaled down when larger than MAX_SIDE. SVG and
// GIF stay untouched. The canvas is 1100 px wide and scaled up to 2x, so
// 2000 px stays sharp even on high-DPI screens.
// Course setting "shrinkImages" (default on) switches it off globally; an
// image field can additionally keep the original per upload.
import { state } from './state.js';
import { toast } from './util.js';
import { t } from './i18n.js';

const MAX_SIDE = 2000;
const QUALITY = 0.85;
// Photos below this size are left alone even if a re-encode would be smaller.
const SMALL_BYTES = 400 * 1024;

export function shrinkEnabled(){
  return !(state.course && state.course.shrinkImages === false);
}

function loadImage(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
const dataUrlBytes = u => Math.round((u.length - u.indexOf(',') - 1) * 0.75);
function fmtBytes(n){
  return n >= 1024 * 1024 ? (Math.round(n / 104857.6) / 10) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
}

// Returns the (possibly) smaller data URL; never throws.
export async function shrinkImageDataUrl(dataUrl, opts){
  opts = opts || {};
  if(opts.keepOriginal || !shrinkEnabled()) return dataUrl;
  const m = /^data:image\/(png|jpe?g|webp);/i.exec(String(dataUrl || ''));
  if(!m) return dataUrl;
  try {
    const kind = m[1].toLowerCase();
    const isPng = kind === 'png';
    const before = dataUrlBytes(dataUrl);
    const img = await loadImage(dataUrl);
    const w = img.naturalWidth, h = img.naturalHeight;
    if(!w || !h) return dataUrl;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    if(scale === 1 && (isPng || before < SMALL_BYTES)) return dataUrl;
    const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, cw, ch);
    const out = isPng ? canvas.toDataURL('image/png')
      : canvas.toDataURL(kind === 'webp' ? 'image/webp' : 'image/jpeg', QUALITY);
    const after = dataUrlBytes(out);
    if(after >= before) return dataUrl;
    if(!opts.silent){
      toast(t('form.media.image.shrunk', { from: fmtBytes(before), to: fmtBytes(after), w: cw, h: ch }));
    }
    return out;
  } catch {
    return dataUrl;
  }
}

// Template code (composition image picker) runs in the builder page too.
window.ScormBuilderShrinkImage = shrinkImageDataUrl;
