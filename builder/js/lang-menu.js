// lang-menu.js: Header popover to switch the builder UI language.
// Pattern mirrors setupFileMenu() in main.js: open on click, close on
// outside-click / Escape / item activation. Populates itself dynamically
// from the set of registered i18n bundles, so adding a new language is
// purely a matter of registering another bundle.
import { availableLocales, localeMeta, getLocale, setLocale, t } from './i18n.js';

export function setupLangMenu(onLocaleChange){
  const wrap = document.getElementById('langMenu');
  const trig = document.getElementById('btnLangMenu');
  const pop  = wrap?.querySelector('.header-lang-popover');
  const label = document.getElementById('langMenuLabel');
  if(!wrap || !trig || !pop) return;

  function setOpen(open){
    wrap.dataset.open = open ? 'true' : 'false';
    trig.setAttribute('aria-expanded', open ? 'true' : 'false');
    pop.hidden = !open;
  }

  function refreshLabelAndTooltip(){
    const cur = getLocale();
    const meta = localeMeta(cur);
    if(label) label.textContent = meta.label || cur.toUpperCase();
    const title = t('header.languageTitle');
    trig.setAttribute('title', title);
    trig.setAttribute('aria-label', title);
  }

  function renderPopover(){
    pop.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'header-menu-section-label';
    heading.textContent = t('lang.switchLabel');
    pop.appendChild(heading);
    const cur = getLocale();
    availableLocales().forEach(code => {
      const meta = localeMeta(code);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'header-menu-item header-lang-item' + (code === cur ? ' active' : '');
      btn.setAttribute('role', 'menuitem');
      btn.dataset.locale = code;
      btn.innerHTML =
        '<span class="header-menu-label">' + escape(meta.name || code) + '</span>' +
        '<span class="header-menu-hint">' + escape(meta.label || code.toUpperCase()) + '</span>';
      btn.addEventListener('click', () => {
        setOpen(false);
        if(code === getLocale()) return;
        if(setLocale(code) && typeof onLocaleChange === 'function') onLocaleChange(code);
      });
      pop.appendChild(btn);
    });
  }

  trig.addEventListener('click', e => {
    e.stopPropagation();
    if(pop.hidden) renderPopover();
    setOpen(pop.hidden);
  });
  document.addEventListener('click', e => {
    if(!pop.hidden && !wrap.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !pop.hidden){ setOpen(false); trig.focus(); }
  });

  refreshLabelAndTooltip();
  // Render once so the popover DOM does not carry a stale locale label
  // even while closed. Callers may re-invoke renderPopover after switching.
  renderPopover();

  return { refreshLabelAndTooltip, renderPopover };
}

function escape(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
