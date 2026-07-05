// i18n.js: Central locale runtime for the builder UI.
//
// Two orthogonal concepts live here:
//   - Chrome translations: t(key, params) looks up static UI strings in the
//     currently active bundle. Bundles are registered with register(code, bundle).
//   - Multilingual content: l(value) resolves author-supplied fields that may
//     either be plain strings (legacy / single-language courses) or wrapper
//     objects { __i18n: true, de: '...', en: '...' } (multi-language courses).
//
// Adding a new language means: create builder/i18n/<code>.js and
// builder/template/i18n/<code>.js, register both on load, and it appears in
// the language switcher automatically.

const STORAGE_KEY = 'scorm-builder-language';

const bundles = Object.create(null);
const localeMetaMap = Object.create(null);
let activeLocale = 'de';
let defaultLocale = 'de';
const listeners = new Set();

// register('en', bundleObject, { name: 'English', label: 'EN' })
// The `meta` argument is optional; when omitted, both name and label fall
// back to the upper-cased code.
export function register(code, bundle, meta){
  bundles[code] = bundle || {};
  if(meta) localeMetaMap[code] = meta;
  else if(!localeMetaMap[code]) localeMetaMap[code] = { name: String(code).toUpperCase(), label: String(code).toUpperCase() };
}

export function availableLocales(){
  return Object.keys(bundles);
}

export function localeMeta(code){
  return localeMetaMap[code] || { name: String(code).toUpperCase(), label: String(code).toUpperCase() };
}

export function getLocale(){ return activeLocale; }
export function getDefaultLocale(){ return defaultLocale; }

export function setDefaultLocale(code){
  if(bundles[code]) defaultLocale = code;
}

// Restore last saved locale, or use the given fallback (defaults to 'de').
export function initFromStorage(fallback){
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if(stored && bundles[stored]){ activeLocale = stored; return; }
  } catch{}
  if(fallback && bundles[fallback]) activeLocale = fallback;
}

export function setLocale(code){
  if(!bundles[code]) return false;
  if(code === activeLocale) return true;
  activeLocale = code;
  try { localStorage.setItem(STORAGE_KEY, code); } catch{}
  listeners.forEach(fn => { try { fn(code); } catch(e){ console.error(e); } });
  return true;
}

// Subscribe to locale changes. Returns an unsubscribe function.
export function onChange(fn){
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Look up a dot-separated key ('header.new') in the active bundle.
// Falls back through defaultLocale, then the first registered bundle,
// finally the key itself so missing keys are visible in the UI rather
// than silent empty strings.
export function t(key, params){
  const str = lookup(key, activeLocale)
    ?? lookup(key, defaultLocale)
    ?? lookup(key, availableLocales()[0])
    ?? key;
  return params ? interpolate(str, params) : str;
}

function lookup(key, code){
  const bundle = bundles[code];
  if(!bundle) return null;
  const parts = String(key).split('.');
  let cur = bundle;
  for(let i = 0; i < parts.length; i++){
    if(cur == null) return null;
    cur = cur[parts[i]];
  }
  return typeof cur === 'string' ? cur : null;
}

function interpolate(str, params){
  return String(str).replace(/\{(\w+)\}/g, (_, name) => {
    const v = params[name];
    return v == null ? '' : String(v);
  });
}

// Resolve a multilingual content value. Accepts plain strings (returned
// unchanged) or i18n wrapper objects. Locale defaults to the active builder
// locale but callers can override (Runtime passes the runtime locale here).
export function l(value, code){
  if(value == null) return '';
  if(typeof value === 'string') return value;
  if(typeof value !== 'object') return String(value);
  if(!value.__i18n) return '';
  const locale = code || activeLocale;
  const primary = value[locale];
  if(primary != null && primary !== '') return String(primary);
  const fb = value[defaultLocale];
  if(fb != null && fb !== '') return String(fb);
  for(const k of Object.keys(value)){
    if(k === '__i18n') continue;
    if(value[k] != null && value[k] !== '') return String(value[k]);
  }
  return '';
}

export function isI18nField(value){
  return value != null && typeof value === 'object' && value.__i18n === true;
}

// Convert a plain string to an i18n wrapper, keeping the existing text
// under `sourceLocale` (defaults to the currently active builder locale).
export function toI18nField(value, sourceLocale){
  if(isI18nField(value)) return value;
  const code = sourceLocale || activeLocale;
  const out = { __i18n: true };
  out[code] = value == null ? '' : String(value);
  return out;
}

// Read a value for display inside an editable input. Plain strings are
// treated as belonging to the source locale (defaults to the bundle default).
// When the caller is editing a different locale, the input starts empty so
// the author can type the translation.
export function readForEdit(value, editorLocale, sourceLocale){
  const source = sourceLocale || defaultLocale;
  if(value == null) return '';
  if(typeof value === 'string'){
    return editorLocale === source ? value : '';
  }
  if(typeof value !== 'object' || !value.__i18n) return '';
  return value[editorLocale] == null ? '' : String(value[editorLocale]);
}

// Write a new value coming from an editable input. If the user is editing
// the source locale and the field is still a plain string, keep it plain.
// Otherwise upgrade to a wrapper so both locales can coexist.
export function writeFromEdit(value, editorLocale, newValue, sourceLocale){
  const source = sourceLocale || defaultLocale;
  const clean = newValue == null ? '' : String(newValue);
  if(editorLocale === source && (value == null || typeof value === 'string')){
    return clean;
  }
  let wrapper;
  if(value != null && typeof value === 'object' && value.__i18n){
    wrapper = value;
  } else {
    wrapper = { __i18n: true };
    if(typeof value === 'string') wrapper[source] = value;
  }
  wrapper[editorLocale] = clean;
  // Collapse a wrapper whose every slot is empty back to a plain empty
  // string. A field the author cleared in all languages then behaves
  // exactly like a field that was never filled (same fallbacks, no ghost
  // locale entries in the export's locale detection).
  let hasText = false;
  for(const k of Object.keys(wrapper)){
    if(k === '__i18n') continue;
    if(wrapper[k] != null && wrapper[k] !== ''){ hasText = true; break; }
  }
  return hasText ? wrapper : '';
}

// Return the source-locale text of a field, useful as a placeholder hint
// when the author edits a second locale and has left the input empty.
export function getSourceHint(value, editorLocale, sourceLocale){
  const source = sourceLocale || defaultLocale;
  if(editorLocale === source) return '';
  if(value == null) return '';
  if(typeof value === 'string') return value;
  if(typeof value !== 'object' || !value.__i18n) return '';
  return value[source] == null ? '' : String(value[source]);
}

// Read a specific locale from a wrapper (or a plain string, returned as is
// only for the source locale so callers can safely round-trip).
export function readI18nField(value, locale){
  if(!isI18nField(value)){
    // A plain string represents whichever locale it was authored in. We
    // return it only when asked for that same locale; otherwise empty so
    // the toggle UI shows an empty input on the other side.
    if(typeof value !== 'string') return '';
    return locale === activeLocale ? value : '';
  }
  return value[locale] == null ? '' : String(value[locale]);
}

// Write a specific locale into a field, converting a plain string to a
// wrapper transparently. Returns the resulting wrapper (never a plain string
// once a second locale has been introduced).
export function writeI18nField(value, locale, newValue){
  const wrapper = toI18nField(value, activeLocale);
  wrapper[locale] = newValue == null ? '' : String(newValue);
  return wrapper;
}

// applyDataI18n walks the given root (defaults to document) and translates
// every element with a data-i18n* attribute using the active bundle.
//
//   data-i18n         -> textContent
//   data-i18n-html    -> innerHTML (allows embedded markup in translations)
//   data-i18n-title   -> title attribute
//   data-i18n-aria    -> aria-label attribute
//   data-i18n-ph      -> placeholder attribute
//   data-i18n-alt     -> alt attribute
//
// Each attribute value is a translation key. Params are not supported here
// (keep it simple). For dynamic strings that need placeholders, render them
// in JS via t(key, params) instead.
export function applyDataI18n(root){
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  scope.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  scope.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
  scope.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  scope.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
  scope.querySelectorAll('[data-i18n-alt]').forEach(el => {
    el.setAttribute('alt', t(el.getAttribute('data-i18n-alt')));
  });
}

// Walk any content tree (course, task, block config) and return the set of
// locales that carry at least one non-empty string. Used by the SCORM export
// to decide which runtime bundles to pack.
export function collectContentLocales(root){
  const found = new Set();
  function walk(v){
    if(v == null) return;
    if(isI18nField(v)){
      for(const k of Object.keys(v)){
        if(k === '__i18n') continue;
        if(v[k] != null && v[k] !== '') found.add(k);
      }
      return;
    }
    if(Array.isArray(v)){ v.forEach(walk); return; }
    if(typeof v === 'object'){ Object.values(v).forEach(walk); }
  }
  walk(root);
  return Array.from(found);
}
