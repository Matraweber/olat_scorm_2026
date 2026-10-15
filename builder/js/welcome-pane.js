// welcome-pane.js: Welcome / help page. Hero, 5-step quickstart, video,
// layout legend, block-type grid with live preview modal, canvas tips,
// feature chapters (variables, grading, course settings, pools, templates,
// saving, OLAT), languages, KaTeX examples, shortcuts; scrollable chapter
// rail with scrollspy.
import { el, escapeHtml, tProp } from './util.js';
import { state, renderActivePane } from './state.js';
import { renderTaskList } from './panes.js';
import { t, getLocale } from './i18n.js';


function renderWelcomePane(host){
  host.classList.add('welcome-pane');
  // Scoped to the welcome pane so other panes scroll normally.
  document.documentElement.classList.add('welcome-active');

  // Reading-progress strip under the sticky header.
  const progress = el('div', {className:'welcome-progress', attrs:{'aria-hidden':'true'}});
  progress.appendChild(el('div', {className:'welcome-progress-bar'}));
  host.appendChild(progress);

  // Two columns: content on the left, sticky chapter rail on the right.
  const layout = el('div', {className:'welcome-layout'});
  const main   = el('main', {className:'welcome-content'});
  const rail   = el('aside', {className:'welcome-rail', attrs:{'aria-label': t('welcome.rail.ariaLabel')}});
  const railList = el('ol', {className:'welcome-rail-list'});
  rail.appendChild(el('div', {className:'welcome-rail-label', text: t('welcome.rail.label')}));
  rail.appendChild(railList);
  layout.appendChild(main);
  layout.appendChild(rail);
  host.appendChild(layout);

  const chapters = [];

  // Create a numbered chapter. opts.hero hides it from the rail.
  function chapter(title, opts){
    opts = opts || {};
    const idx = chapters.length;
    const id  = 'welcome-ch-' + idx;
    const section = el('section', {className:'welcome-chapter' + (opts.hero ? ' welcome-chapter-hero' : ''), attrs:{id}});
    const head = el('header', {className:'welcome-chapter-head'});
    if(!opts.hero){
      head.appendChild(el('span', {className:'welcome-chapter-num', text: String(idx).padStart(2, '0')}));
    }
    head.appendChild(el(opts.hero ? 'h1' : 'h2', {text: title, className:'welcome-chapter-title'}));
    section.appendChild(head);
    const body = el('div', {className:'welcome-chapter-body'});
    section.appendChild(body);
    main.appendChild(section);
    chapters.push({ id, title, section, hideRail: !!opts.hideRail });
    return body;
  }

  // 00 Hero / title page
  const heroBody = chapter(t('welcome.hero.title'), { hero: true, hideRail: true });
  heroBody.insertAdjacentHTML('afterbegin',
    '<span class="welcome-kicker">' + t('welcome.hero.kicker') + '</span>'
  );
  heroBody.appendChild(el('p', {
    className: 'welcome-lede',
    html: t('welcome.hero.lede')
  }));
  const heroCta = el('div', {className:'welcome-cta-row'});
  const newTaskBtn = el('button', {className:'btn btn-primary', attrs:{type:'button'}, text: t('welcome.hero.ctaPrimary')});
  newTaskBtn.addEventListener('click', () => document.getElementById('btnAddTask').click());
  const goCourseBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: t('welcome.hero.ctaSecondary')});
  goCourseBtn.addEventListener('click', () => { state.selected = {kind:'course'}; renderActivePane(); renderTaskList(); });
  heroCta.appendChild(newTaskBtn); heroCta.appendChild(goCourseBtn);
  heroBody.appendChild(heroCta);

  // 01 Quickstart: 5 steps
  const quick = chapter(t('welcome.quickstart.title'));
  quick.appendChild(el('p', {className:'welcome-lead', text: t('welcome.quickstart.lead')}));
  const optionalRow = el('div', {className: 'welcome-optional-row'});
  optionalRow.innerHTML =
    '<span class="welcome-optional-label">' + t('welcome.quickstart.optionalLabel') + '</span> ' +
    '<button type="button" class="welcome-optional-btn" data-target="course">' + t('welcome.quickstart.optionalCourse') + '</button>' +
    '<button type="button" class="welcome-optional-btn" data-target="theme">' + t('welcome.quickstart.optionalTheme') + '</button>';
  optionalRow.querySelectorAll('.welcome-optional-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selected = { kind: btn.dataset.target };
      renderActivePane();
    });
  });
  quick.appendChild(optionalRow);

  const steps = el('div', {className:'welcome-steps'});
  const stepDefs = [
    {
      n: 1, title: t('welcome.step1.title'),
      body: t('welcome.step1.body'),
      mock: mockSidebarAddTask()
    },
    {
      n: 2, title: t('welcome.step2.title'),
      body: t('welcome.step2.body'),
      mock: mockBlockPicker()
    },
    {
      n: 3, title: t('welcome.step3.title'),
      body: t('welcome.step3.body'),
      mock: mockPresetDropdown()
    },
    {
      n: 4, title: t('welcome.step4.title'),
      body: t('welcome.step4.body'),
      mock: mockTopbarBtn(t('welcome.mock.previewBtn'), 'secondary')
    },
    {
      n: 5, title: t('welcome.step5.title'),
      body: t('welcome.step5.body'),
      mock: mockTopbarBtn(t('welcome.mock.exportBtn'), 'primary')
    }
  ];
  stepDefs.forEach(s => {
    const card = el('div', {className:'welcome-step'});
    const badge = el('div', {className:'welcome-step-badge', text: String(s.n)});
    const body = el('div', {className:'welcome-step-body'});
    body.appendChild(el('h3', {text: s.title}));
    body.appendChild(el('p', {html: s.body}));
    card.appendChild(badge); card.appendChild(body);
    if(s.mock) card.appendChild(s.mock);
    steps.appendChild(card);
  });
  quick.appendChild(steps);

  // 02 Video tutorial: the five steps as a screen recording, one file per
  // language. Picked by the active chrome locale; render() re-runs this pane
  // on locale switch, so the source follows the language automatically.
  // The files live at the project root (tutorial/); the builder page is
  // served from /builder/, hence the relative parent path.
  const video = chapter(t('welcome.video.title'));
  video.appendChild(el('p', {className:'welcome-lead', text: t('welcome.video.lead')}));
  const videoWrap = el('div', {className:'welcome-video-wrap'});
  const videoLang = getLocale() === 'en' ? 'en' : 'de';
  const videoFile = 'tutorial/scorm-builder-tutorial-' + videoLang + '.webm';
  const videoEl = el('video', {
    className: 'welcome-video',
    attrs: {
      controls: '',
      preload: 'metadata',
      src: '../' + videoFile
    }
  });
  // Hide the whole section body gracefully when the file is missing
  // (e.g. a checkout without the tutorial folder). The message names the
  // exact file so a stale cache or wrong path is easy to spot.
  videoEl.addEventListener('error', () => {
    videoWrap.innerHTML = '';
    videoWrap.appendChild(el('p', {className:'welcome-video-missing', text: t('welcome.video.missing', {file: videoFile})}));
  });
  videoWrap.appendChild(videoEl);
  video.appendChild(videoWrap);

  // 03 The interface (annotated mockup)
  const oberflaeche = chapter(t('welcome.interface.title'));
  oberflaeche.appendChild(el('p', {className:'welcome-lead', text: t('welcome.interface.lead')}));
  oberflaeche.appendChild(mockBuilderLayout());

  const layoutLegend = el('ul', {className:'welcome-legend'});
  [
    ['1', t('welcome.interface.legend.sidebarTitle'), t('welcome.interface.legend.sidebarBody')],
    ['2', t('welcome.interface.legend.canvasTitle'), t('welcome.interface.legend.canvasBody')],
    ['3', t('welcome.interface.legend.configTitle'), t('welcome.interface.legend.configBody')]
  ].forEach(([n, k, v]) => {
    const li = el('li');
    li.innerHTML = '<span class="welcome-legend-num">' + n + '</span><strong>' + k + '</strong> ' + v;
    layoutLegend.appendChild(li);
  });
  oberflaeche.appendChild(layoutLegend);

  // 03 Block-Typen
  const types = chapter(t('welcome.blockTypes.title'));
  types.appendChild(el('p', {className:'welcome-lead', text: t('welcome.blockTypes.lead')}));

  types.appendChild(el('p', {className:'welcome-hint', text: t('welcome.blockTypes.hint')}));
  const blocksGrid = el('div', {className:'welcome-blocks-grid'});
  const allBlocks = window.Blocks ? window.Blocks.ids().map(id => ({ id, def: window.Blocks.get(id) })).filter(x => x.def) : [];
  const byCat = {};
  allBlocks.forEach(({ id, def }) => {
    const cat = tProp(def, 'category') || t('welcome.blockTypes.categoryOther');
    if(!byCat[cat]) byCat[cat] = [];
    byCat[cat].push({ id, def });
  });
  Object.entries(byCat).forEach(([cat, items]) => {
    const catLabel = el('div', {className:'welcome-blocks-cat', text: cat});
    blocksGrid.appendChild(catLabel);
    items.forEach(({ id, def }) => {
      // <button> for keyboard focus + correct screen-reader announcement.
      const card = el('button', {
        className:'welcome-block-card' + (def.graded ? ' graded' : ''),
        attrs:{ type:'button', 'data-block-id': id, 'aria-label': t('welcome.blockTypes.cardAriaLabel', { name: tProp(def, 'label') || id }) }
      });
      // SVG icon from window.BlockIcons, string fallback for legacy blocks.
      const svgIcon = window.BlockIcons && window.BlockIcons.get(id);
      const iconHtml = svgIcon || escapeHtml(def.icon || '◧');
      card.innerHTML =
        '<div class="welcome-block-icon">' + iconHtml + '</div>' +
        '<div class="welcome-block-name">' + escapeHtml(tProp(def, 'label') || id) +
          (def.graded ? ' <span class="welcome-block-graded">' + t('welcome.blockTypes.gradedBadge') + '</span>' : '') +
        '</div>' +
        '<div class="welcome-block-desc">' + escapeHtml(tProp(def, 'description')) + '</div>';
      card.addEventListener('click', () => openBlockDetailModal(id, def));
      blocksGrid.appendChild(card);
    });
  });
  types.appendChild(blocksGrid);

  // 04 Working with the canvas
  const tips = chapter(t('welcome.canvas.title'));
  const tipsGrid = el('div', {className:'welcome-tips-grid'});
  [
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L12 22 M2 12 L22 12 M9 5 L12 2 L15 5 M19 9 L22 12 L19 15 M9 19 L12 22 L15 19 M5 9 L2 12 L5 15"/></svg>',
      title: t('welcome.canvas.tipMove.title'),
      body: t('welcome.canvas.tipMove.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 L13 11 M21 3 L15 3 M21 3 L21 9 M3 21 L11 13 M3 21 L9 21 M3 21 L3 15"/></svg>',
      title: t('welcome.canvas.tipResize.title'),
      body: t('welcome.canvas.tipResize.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><circle cx="3"  cy="3"  r="1.5" fill="currentColor"/><circle cx="21" cy="3"  r="1.5" fill="currentColor"/><circle cx="3"  cy="21" r="1.5" fill="currentColor"/><circle cx="21" cy="21" r="1.5" fill="currentColor"/></svg>',
      title: t('welcome.canvas.tipMultiSelect.title'),
      body: t('welcome.canvas.tipMultiSelect.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M21 21 L15 15 M7 10 L13 10 M10 7 L10 13"/></svg>',
      title: t('welcome.canvas.tipZoom.title'),
      body: t('welcome.canvas.tipZoom.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 9 L8 9 L9 6 L15 6 L16 9 L21 9 L21 20 L3 20 Z"/></svg>',
      title: t('welcome.canvas.tipTabs.title'),
      body: t('welcome.canvas.tipTabs.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M6 3 L18 3 L18 21 L12 17 L6 21 Z"/></svg>',
      title: t('welcome.canvas.tipTemplates.title'),
      body: t('welcome.canvas.tipTemplates.body')
    }
  ].forEach(tip => {
    const card = el('div', {className:'welcome-tip-card'});
    card.innerHTML =
      '<div class="welcome-tip-icon">' + tip.icon + '</div>' +
      '<div class="welcome-tip-title">' + tip.title + '</div>' +
      '<div class="welcome-tip-body">' + tip.body + '</div>';
    tipsGrid.appendChild(card);
  });
  tips.appendChild(tipsGrid);

  // Chapters made of tip cards plus an optional example box. Texts live
  // under welcome.<prefix>: title, lead, <card>.title/.body, example.
  const svg = d => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const ICONS = {
    dice:   svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>'),
    globe:  svg('<circle cx="12" cy="12" r="9"/><path d="M3 12 L21 12 M12 3 C15 7 15 17 12 21 C9 17 9 7 12 3"/>'),
    refresh: svg('<path d="M20 11 A8 8 0 1 0 18 17"/><path d="M20 5 L20 11 L14 11"/>'),
    hash:   svg('<path d="M5 9 L19 9 M5 15 L19 15 M10 4 L8 20 M16 4 L14 20"/>'),
    pie:    svg('<path d="M12 3 A9 9 0 1 0 21 12 L12 12 Z"/><path d="M14 3 A7 7 0 0 1 21 10 L14 10 Z"/>'),
    minus:  svg('<circle cx="12" cy="12" r="9"/><path d="M8 12 L16 12"/>'),
    repeat: svg('<path d="M4 9 L17 9 L14 6 M20 15 L7 15 L10 18"/>'),
    bulb:   svg('<path d="M9 18 L15 18 M10 21 L14 21 M12 3 A6 6 0 0 0 8 13.5 C9 14.5 9 15.5 9 16 L15 16 C15 15.5 15 14.5 16 13.5 A6 6 0 0 0 12 3"/>'),
    lock:   svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 L8 7 A4 4 0 0 1 16 7 L16 11"/>'),
    clock:  svg('<circle cx="12" cy="12" r="9"/><path d="M12 7 L12 12 L15 14"/>'),
    sliders: svg('<path d="M4 6 L20 6 M4 12 L20 12 M4 18 L20 18"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/>'),
    flag:   svg('<path d="M5 21 L5 4 M5 4 L18 4 L15 8 L18 12 L5 12"/>'),
    shuffle: svg('<path d="M3 7 L7 7 L15 17 L21 17 M3 17 L7 17 L9.5 14 M13 10 L15 7 L21 7 M18 4 L21 7 L18 10 M18 14 L21 17 L18 20"/>'),
    play:   svg('<circle cx="12" cy="12" r="9"/><path d="M10 8 L16 12 L10 16 Z"/>'),
    star:   svg('<path d="M12 3 L14.6 8.6 L20.6 9.2 L16 13.2 L17.4 19.2 L12 16 L6.6 19.2 L8 13.2 L3.4 9.2 L9.4 8.6 Z"/>'),
    box:    svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9 L20 9 M9 4 L9 20"/>'),
    browser: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9 L21 9"/>'),
    file:   svg('<path d="M6 3 L14 3 L19 8 L19 21 L6 21 Z M14 3 L14 8 L19 8"/>'),
    save:   svg('<path d="M5 3 L16 3 L20 7 L20 21 L5 21 Z M8 3 L8 9 L15 9 L15 3 M8 21 L8 14 L17 14 L17 21"/>'),
    alert:  svg('<path d="M12 3 L22 20 L2 20 Z M12 10 L12 14 M12 17 L12 17.5"/>'),
    image:  svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16 L15 11 L5 19"/>'),
    bar:    svg('<rect x="3" y="10" width="18" height="4" rx="2"/><path d="M3 12 L12 12"/>'),
    pause:  svg('<circle cx="12" cy="12" r="9"/><path d="M10 9 L10 15 M14 9 L14 15"/>'),
    send:   svg('<path d="M3 11 L21 3 L14 21 L11 13 Z"/>'),
    check:  svg('<circle cx="12" cy="12" r="9"/><path d="M8 12 L11 15 L16 9"/>')
  };
  function cardChapter(prefix, cards, opts){
    const body = chapter(t('welcome.' + prefix + '.title'));
    body.appendChild(el('p', {className:'welcome-lead', html: t('welcome.' + prefix + '.lead')}));
    const grid = el('div', {className:'welcome-tips-grid'});
    cards.forEach(([key, icon]) => {
      const card = el('div', {className:'welcome-tip-card'});
      card.innerHTML =
        '<div class="welcome-tip-icon">' + ICONS[icon] + '</div>' +
        '<div class="welcome-tip-title">' + t('welcome.' + prefix + '.' + key + '.title') + '</div>' +
        '<div class="welcome-tip-body">' + t('welcome.' + prefix + '.' + key + '.body') + '</div>';
      grid.appendChild(card);
    });
    body.appendChild(grid);
    if(opts && opts.example) body.appendChild(el('div', {className:'welcome-example', html: t('welcome.' + prefix + '.example')}));
    return body;
  }

  // 05–11 Didactic features and working with the finished unit
  cardChapter('variables', [['local', 'dice'], ['global', 'globe'], ['regen', 'refresh'], ['format', 'hash']], { example: true });
  cardChapter('scoring', [['partial', 'pie'], ['deduct', 'minus'], ['attempts', 'repeat'], ['help', 'bulb'], ['locks', 'lock'], ['timer', 'clock']], { example: true });
  cardChapter('courseSettings', [['inherit', 'sliders'], ['threshold', 'flag']]);
  cardChapter('pools', [['setup', 'shuffle'], ['run', 'play']], { example: true });
  cardChapter('templates', [['task', 'star'], ['block', 'box'], ['storage', 'browser']]);
  cardChapter('saving', [['zip', 'file'], ['autosave', 'save'], ['guard', 'alert'], ['images', 'image']]);
  cardChapter('lms', [['progress', 'bar'], ['resume', 'pause'], ['report', 'send'], ['finish', 'check']]);

  // Languages (UI language vs. per-field content language)
  const langs = chapter(t('welcome.languages.title'));
  langs.appendChild(el('p', {className:'welcome-lead', text: t('welcome.languages.lead')}));
  const langGrid = el('div', {className:'welcome-tips-grid'});
  [
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12 L21 12 M12 3 C15 7 15 17 12 21 C9 17 9 7 12 3"/></svg>',
      title: t('welcome.languages.uiLang.title'),
      body: t('welcome.languages.uiLang.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5 L11 5 M7.5 5 L7.5 12 M5 12 L10 12 M13 19 L20 19 M16.5 19 L16.5 12 M14 12 L19 12 M4 19 L9 14 M15 10 L20 5"/></svg>',
      title: t('welcome.languages.contentLang.title'),
      body: t('welcome.languages.contentLang.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21 L16 21 M12 18 L12 21 M7 9 L11 9 M7 12 L14 12"/></svg>',
      title: t('welcome.languages.student.title'),
      body: t('welcome.languages.student.body')
    },
    {
      icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L12 15 M8 11 L12 15 L16 11 M4 19 L20 19"/></svg>',
      title: t('welcome.languages.export.title'),
      body: t('welcome.languages.export.body')
    }
  ].forEach(tip => {
    const card = el('div', {className:'welcome-tip-card'});
    card.innerHTML =
      '<div class="welcome-tip-icon">' + tip.icon + '</div>' +
      '<div class="welcome-tip-title">' + tip.title + '</div>' +
      '<div class="welcome-tip-body">' + tip.body + '</div>';
    langGrid.appendChild(card);
  });
  langs.appendChild(langGrid);

  // Formulas with KaTeX: input next to the rendered result, tips, and a
  // link to KaTeX's list of supported commands.
  const katexCh = chapter(t('welcome.katex.title'));
  katexCh.appendChild(el('p', {className:'welcome-lead', html: t('welcome.katex.lead')}));
  const bs = String.fromCharCode(92);
  const katexTable = el('table', {className:'welcome-katex-table'});
  const kHead = el('tr');
  [t('welcome.katex.colInput'), t('welcome.katex.colResult'), t('welcome.katex.colNote')]
    .forEach(h => kHead.appendChild(el('th', {text: h})));
  katexTable.appendChild(kHead);
  // Only the variables row shows sample values for {a}/{b}; elsewhere the
  // letters stay letters (with real variables a, b in a block, {a} inside
  // \frac{a}{b} would be replaced too, see the tip below).
  const sampleVars = { a: 3, b: 4 };
  [
    ['$' + bs + 'frac{a}{b}$',                          t('welcome.katex.ex.fraction')],
    ['$x^2 + F_{x}$',                                    t('welcome.katex.ex.scripts')],
    ['$' + bs + 'sqrt{a^2 + b^2}$',                     t('welcome.katex.ex.sqrt')],
    ['$' + bs + 'alpha = 30^' + bs + 'circ$',           t('welcome.katex.ex.greek')],
    ['$M = F ' + bs + 'cdot l$',                         t('welcome.katex.ex.cdot')],
    ['$' + bs + 'vec{F}_{' + bs + 'text{Lager}}$',      t('welcome.katex.ex.text')],
    ['$A = {a} ' + bs + 'cdot {b}$',                     t('welcome.katex.ex.variables'), true],
    ['$$' + bs + 'sum_{i=1}^{n} F_i = 0$$',              t('welcome.katex.ex.display')]
  ].forEach(([src, note, withVars]) => {
    const tr = el('tr');
    tr.appendChild(el('td', {className:'welcome-katex-src', html: '<code>' + escapeHtml(src) + '</code>'}));
    const out = el('td', {className:'welcome-katex-out',
      text: withVars && window.BlockUtils ? window.BlockUtils.fillMathTemplate(src, sampleVars) : src});
    tr.appendChild(out);
    tr.appendChild(el('td', {text: note}));
    katexTable.appendChild(tr);
  });
  katexCh.appendChild(katexTable);
  if(window.BlockUtils && typeof window.BlockUtils.renderMath === 'function') window.BlockUtils.renderMath(katexTable);
  const katexTips = el('ul', {className:'welcome-katex-tips'});
  ['umlauts', 'varsInMath', 'dollar', 'check'].forEach(k => katexTips.appendChild(el('li', {html: t('welcome.katex.tip.' + k)})));
  katexCh.appendChild(katexTips);
  const katexLink = el('p', {className:'welcome-hint'});
  katexLink.appendChild(document.createTextNode(t('welcome.katex.linkIntro') + ' '));
  katexLink.appendChild(el('a', {text: t('welcome.katex.linkText'),
    attrs:{href:'https://katex.org/docs/supported', target:'_blank', rel:'noopener noreferrer'}}));
  katexCh.appendChild(katexLink);

  // Keyboard shortcuts
  const shortcuts = chapter(t('welcome.shortcuts.title'));
  shortcuts.appendChild(el('p', {className:'welcome-lead', text: t('welcome.shortcuts.lead')}));
  const kbdTable = el('table', {className:'welcome-kbd-table'});
  [
    ['↑ ↓ ← →',                                    t('welcome.shortcuts.moveByPixel')],
    ['Shift + ' + t('welcome.shortcuts.keyArrow'), t('welcome.shortcuts.moveBy10')],
    [t('welcome.shortcuts.keyCtrl') + ' + C',      t('welcome.shortcuts.copy')],
    [t('welcome.shortcuts.keyCtrl') + ' + V',      t('welcome.shortcuts.paste')],
    [t('welcome.shortcuts.keyCtrl') + ' + D',      t('welcome.shortcuts.duplicate')],
    [t('welcome.shortcuts.keyCtrl') + ' + A',      t('welcome.shortcuts.selectAll')],
    [t('welcome.shortcuts.keyDel') + ' / ⌫',       t('welcome.shortcuts.delete')],
    ['Esc',                                        t('welcome.shortcuts.deselect')],
    [t('welcome.shortcuts.keyCtrl') + ' + Z',      t('welcome.shortcuts.undo')],
    [t('welcome.shortcuts.keyCtrl') + ' + Shift+Z',t('welcome.shortcuts.redo')],
    [t('welcome.shortcuts.keyCtrl') + ' + S',      t('welcome.shortcuts.save')],
    [t('welcome.shortcuts.keyCtrl') + ' + Shift+S',t('welcome.shortcuts.saveAs')],
    [t('welcome.shortcuts.keyCtrl') + ' + ' + t('welcome.shortcuts.keyWheel'), t('welcome.shortcuts.zoom')]
  ].forEach(([k, d]) => {
    const tr = el('tr');
    tr.appendChild(el('td', {className:'welcome-kbd-key', html:'<kbd>' + k.replace(/ \+ /g, '</kbd> + <kbd>') + '</kbd>'}));
    tr.appendChild(el('td', {text: d}));
    kbdTable.appendChild(tr);
  });
  shortcuts.appendChild(kbdTable);

  // Closing call-to-action
  const foot = el('section', {className:'welcome-foot'});
  foot.innerHTML = '<p>' + t('welcome.foot.note') + '</p>';
  const footBtn = el('button', {className:'btn btn-primary', attrs:{type:'button'}, text: t('welcome.hero.ctaPrimary')});
  footBtn.addEventListener('click', () => document.getElementById('btnAddTask').click());
  foot.appendChild(footBtn);
  main.appendChild(foot);

  // Build the chapter rail (right-side sticky TOC)
  chapters.forEach((ch, i) => {
    if(ch.hideRail) return;
    const li = el('li', {className:'welcome-rail-item'});
    const a  = el('a', {className:'welcome-rail-link', attrs:{href: '#' + ch.id}});
    a.appendChild(el('span', {className:'welcome-rail-num', text: String(i).padStart(2, '0')}));
    a.appendChild(el('span', {className:'welcome-rail-text', text: ch.title}));
    a.addEventListener('click', e => {
      e.preventDefault();
      ch.section.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    li.appendChild(a);
    li.dataset.chapterIdx = String(i);
    railList.appendChild(li);
  });

  setupWelcomeScrollSpy(chapters, railList);
  setupRevealAnimations(host);
}

// Scroll-spy: highlights the current chapter + updates the progress bar.
function setupWelcomeScrollSpy(chapters, railList){
  if(typeof window._welcomeScrollCleanup === 'function'){
    window._welcomeScrollCleanup();
  }
  let rafId = null;
  let activeIdx = -1;

  function setActive(idx){
    if(idx === activeIdx) return;
    activeIdx = idx;
    chapters.forEach((ch, i) => ch.section.classList.toggle('is-active', i === idx));
    // rail list and chapters[] don't align 1:1 because of hideRail entries.
    Array.from(railList.children).forEach(li => {
      const ci = parseInt(li.dataset.chapterIdx, 10);
      li.querySelector('.welcome-rail-link')?.classList.toggle('is-active', ci === idx);
    });
    // Keep the active entry visible when the rail itself scrolls (only the
    // rail moves; scrollIntoView would scroll the page as well).
    const railEl = railList.closest('.welcome-rail');
    const active = railEl && railEl.querySelector('.welcome-rail-link.is-active');
    if(active && railEl.scrollHeight > railEl.clientHeight){
      const a = active.getBoundingClientRect(), r = railEl.getBoundingClientRect();
      if(a.top < r.top + 24) railEl.scrollTop -= (r.top + 24 - a.top);
      else if(a.bottom > r.bottom - 24) railEl.scrollTop += (a.bottom - r.bottom + 24);
    }
  }

  const progressBar = document.querySelector('.welcome-progress-bar');

  function update(){
    rafId = null;
    // Active chapter: last one whose top is above ~30% viewport.
    const triggerY = window.innerHeight * 0.30;
    let best = 0;
    for(let i = 0; i < chapters.length; i++){
      const top = chapters[i].section.getBoundingClientRect().top;
      if(top <= triggerY) best = i;
      else break;
    }
    setActive(best);
    if(progressBar){
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      progressBar.style.width = pct.toFixed(2) + '%';
    }
  }

  function onScroll(){
    if(rafId !== null) return;
    rafId = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  requestAnimationFrame(() => requestAnimationFrame(update));

  window._welcomeScrollCleanup = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if(rafId !== null) cancelAnimationFrame(rafId);
    document.documentElement.classList.remove('welcome-active');
    delete window._welcomeScrollCleanup;
  };
}

// Detail modal for a welcome-page block card. Shows meta + live preview.
function openBlockDetailModal(id, def){
  document.querySelectorAll('.welcome-block-modal').forEach(m => m.remove());

  const modal = el('div', {
    className:'welcome-block-modal',
    attrs:{ role:'dialog', 'aria-modal':'true', 'aria-label': t('welcome.modal.ariaLabel', { name: tProp(def, 'label') || id }) }
  });
  const backdrop = el('div', {className:'welcome-block-modal-backdrop'});
  const card     = el('div', {className:'welcome-block-modal-card'});

  const closeBtn = el('button', {
    className:'welcome-block-modal-close',
    attrs:{ type:'button', 'aria-label': t('common.close') }
  });
  closeBtn.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5 L15 15 M15 5 L5 15"/></svg>';

  const head = el('div', {className:'welcome-block-modal-head'});
  const svgIcon = window.BlockIcons && window.BlockIcons.get(id);
  const modalIcon = svgIcon || escapeHtml(def.icon || '◧');
  head.innerHTML =
    '<div class="welcome-block-modal-icon">' + modalIcon + '</div>' +
    '<div class="welcome-block-modal-titles">' +
      '<h3 class="welcome-block-modal-title">' + escapeHtml(tProp(def, 'label') || id) + '</h3>' +
      '<div class="welcome-block-modal-meta">' +
        '<span class="welcome-block-modal-cat">' + escapeHtml(tProp(def, 'category') || t('welcome.blockTypes.categoryOther')) + '</span>' +
        (def.graded ? '<span class="welcome-block-modal-graded">' + t('welcome.modal.gradedBadge') + '</span>' : '') +
      '</div>' +
    '</div>';
  card.appendChild(closeBtn);
  card.appendChild(head);

  // Body: description left, live preview right.
  const body = el('div', {className:'welcome-block-modal-body'});
  const left = el('div', {className:'welcome-block-modal-text'});
  { const _d = tProp(def, 'description'); if(_d){
    left.appendChild(el('p', {className:'welcome-block-modal-desc', text: _d}));
  } }
  const facts = [];
  facts.push({ k: t('welcome.modal.factCategory'), v: tProp(def, 'category') || t('welcome.blockTypes.categoryOther') });
  facts.push({ k: t('welcome.modal.factGradable'), v: def.graded ? t('common.yes') : t('common.no') });
  if(typeof def.builderSchema === 'function'){
    try {
      const schema = def.builderSchema();
      const optionCount = Array.isArray(schema) ? schema.filter(s => s && s.key).length : 0;
      if(optionCount) facts.push({ k: t('welcome.modal.factConfigOptions'), v: String(optionCount) });
    } catch{ /* ignore: schema may require runtime context */ }
  }
  const factList = el('dl', {className:'welcome-block-modal-facts'});
  facts.forEach(f => {
    factList.appendChild(el('dt', {text: f.k}));
    factList.appendChild(el('dd', {text: f.v}));
  });
  left.appendChild(factList);

  // Live preview via def.preview() / mount(); same rendering as the canvas.
  const right = el('div', {className:'welcome-block-modal-preview'});
  right.appendChild(el('div', {className:'welcome-block-modal-preview-label', text: t('welcome.modal.previewLabel')}));
  const previewHost = el('div', {className:'welcome-block-modal-preview-host'});
  right.appendChild(previewHost);
  try {
    const cfg = (def.previewConfig ? def.previewConfig() : null)
             || (def.defaultConfig ? def.defaultConfig() : {})
             || {};
    if(typeof def.preview === 'function'){
      def.preview(previewHost, cfg);
    } else if(typeof def.mount === 'function' && window.BlockUtils){
      // Some blocks only have mount() (e.g. early composition).
      def.mount(previewHost, cfg, {
        utils: window.BlockUtils,
        blockId: 'welcome_preview_' + id,
        initScore(){}, reportScore(){}
      });
    } else {
      previewHost.appendChild(el('div', {className:'welcome-block-modal-preview-empty', text: t('welcome.modal.previewNone')}));
    }
    // Render KaTeX over the preview so $...$ and \(...\) get typeset.
    if(window.BlockUtils && window.BlockUtils.renderMath){
      window.BlockUtils.renderMath(previewHost);
    }
  } catch{
    previewHost.appendChild(el('div', {className:'welcome-block-modal-preview-empty', text: t('welcome.modal.previewError')}));
  }

  body.appendChild(left);
  body.appendChild(right);
  card.appendChild(body);

  modal.appendChild(backdrop);
  modal.appendChild(card);
  document.body.appendChild(modal);

  closeBtn.focus({ preventScroll: true });

  function close(){
    modal.classList.add('is-closing');
    setTimeout(() => modal.remove(), 180);
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e){
    if(e.key === 'Escape'){ e.preventDefault(); close(); }
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);

  requestAnimationFrame(() => modal.classList.add('is-open'));
}

// Fade-in for below-the-fold reading elements (respects prefers-reduced-motion).
function setupRevealAnimations(host){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const candidates = Array.from(host.querySelectorAll(
    '.welcome-chapter, .welcome-step, .welcome-block-card, .welcome-tip-card, ' +
    '.welcome-legend li, .welcome-foot, .welcome-mock'
  ));
  if(candidates.length === 0 || typeof IntersectionObserver === 'undefined') return;

  // Tag below-the-fold elements so the CSS hides them initially.
  const innerH = window.innerHeight;
  const hidden = [];
  candidates.forEach(el => {
    if(el.getBoundingClientRect().top > innerH - 80){
      el.classList.add('reveal-target');
      hidden.push(el);
    }
  });
  if(hidden.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  hidden.forEach(el => observer.observe(el));

  // Force-reveal in-viewport elements that missed the initial intersection.
  setTimeout(() => {
    hidden.forEach(el => {
      if(el.classList.contains('reveal-visible')) return;
      const r = el.getBoundingClientRect();
      if(r.top < window.innerHeight && r.bottom > 0){
        el.classList.add('reveal-visible');
        observer.unobserve(el);
      }
    });
  }, 250);
}

// Mockup helpers (HTML/CSS miniatures used in welcome page steps).
// Each mock is a decorative illustration of the builder UI; assistive
// tech should skip it. The surrounding chapter text already explains
// the feature in words.
function mockSidebarAddTask(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-sidebar', attrs:{'aria-hidden':'true'}});
  wrap.innerHTML =
    '<div class="mm-head"><span>' + t('sidebar.tasks') + '</span><span class="mm-btn mm-btn-primary mm-pulse">' + t('sidebar.addTask') + '</span></div>' +
    '<div class="mm-task">' + t('welcome.mock.task1') + '<span class="mm-meta">' + t('welcome.mock.blocks2') + '</span></div>' +
    '<div class="mm-task mm-task-faint">' + t('welcome.mock.task2') + '<span class="mm-meta">' + t('welcome.mock.blocks1') + '</span></div>';
  return wrap;
}
// One category header + row of chips; icons from window.BlockIcons so the
// mockup stays in sync with the real picker. `pulse:true` highlights a chip.
function mockChips(catLabel, chips, isQuestion){
  const head = '<div class="mm-cat">' + escapeHtml(catLabel) + '</div>';
  const row = chips.map(c => {
    const icon = (window.BlockIcons && window.BlockIcons.get(c.id)) || '';
    const cls  = 'mm-chip' + (isQuestion ? ' mm-chip-q' : '') + (c.pulse ? ' mm-pulse' : '');
    return '<span class="' + cls + '">' + icon + '<span>' + escapeHtml(c.label) + '</span></span>';
  }).join('');
  return head + '<div class="mm-row">' + row + '</div>';
}
function mockBlockPicker(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-picker', attrs:{'aria-hidden':'true'}});
  wrap.innerHTML =
    '<div class="mm-modal-head">' + t('welcome.mock.pickerHead') + '</div>' +
    '<div class="mm-modal-body">' +
      mockChips(t('welcome.mock.catMedia'), [
        { id: 'rich-text',       label: t('welcome.mock.chipText') },
        { id: 'image',           label: t('welcome.mock.chipImage') },
        { id: 'video',           label: t('welcome.mock.chipVideo') }
      ], false) +
      mockChips(t('welcome.mock.catQuestion'), [
        { id: 'multiple-choice', label: t('welcome.mock.chipMultipleChoice'), pulse: true },
        { id: 'sort-list',       label: t('welcome.mock.chipSort') },
        { id: 'numeric-input',   label: t('welcome.mock.chipNumeric') }
      ], true) +
      mockChips(t('welcome.mock.catStem'), [
        { id: 'truth-table',     label: t('welcome.mock.chipTruthTable') },
        { id: 'unit-convert',    label: t('welcome.mock.chipUnits') }
      ], true) +
    '</div>';
  return wrap;
}
function mockPresetDropdown(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-config', attrs:{'aria-hidden':'true'}});
  wrap.innerHTML =
    '<div class="mm-field"><label>' + t('welcome.mock.headingLabel') + '</label><div class="mm-inp">' + t('welcome.mock.headingValue') + '</div></div>' +
    '<div class="mm-field"><label>' + t('welcome.mock.templateLabel') + '</label>' +
      '<div class="mm-select mm-pulse">' + t('welcome.mock.templateValue') + '</div></div>' +
    '<div class="mm-section">' + t('welcome.mock.questionSection') + '</div>' +
    '<div class="mm-field"><label>' + t('welcome.mock.questionTemplateLabel') + '</label><div class="mm-inp mm-inp-mono">' + t('welcome.mock.questionTemplateValue') + '</div></div>';
  return wrap;
}
function mockTopbarBtn(label, kind){
  const wrap = el('div', {className:'welcome-mock welcome-mock-topbar', attrs:{'aria-hidden':'true'}});
  wrap.innerHTML =
    '<span class="mm-btn">' + t('welcome.mock.jsonExportBtn') + '</span>' +
    '<span class="mm-btn ' + (kind === 'primary' ? 'mm-btn-primary' : '') + ' mm-pulse">' + label + '</span>';
  return wrap;
}
function mockBuilderLayout(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-layout', attrs:{'aria-hidden':'true'}});
  wrap.innerHTML =
    '<div class="mm-l-side">' +
      '<div class="mm-l-num">1</div>' +
      '<div class="mm-l-side-title">' + t('sidebar.tasks') + '</div>' +
      '<div class="mm-l-row mm-l-row-active">' + t('welcome.mock.task1') + '</div>' +
      '<div class="mm-l-row">' + t('welcome.mock.task2') + '</div>' +
      '<div class="mm-l-side-title">' + t('sidebar.general') + '</div>' +
      '<div class="mm-l-row">' + t('sidebar.courseInfoLink') + '</div>' +
    '</div>' +
    '<div class="mm-l-canvas">' +
      '<div class="mm-l-num">2</div>' +
      '<div class="mm-l-canvas-head">' + t('welcome.mock.canvasHead') + '</div>' +
      '<div class="mm-l-block mm-l-block-1">' + t('welcome.mock.chipMultipleChoice') + '</div>' +
      '<div class="mm-l-block mm-l-block-2 mm-l-block-active">' + t('welcome.mock.blockNumericInput') + '</div>' +
    '</div>' +
    '<div class="mm-l-config">' +
      '<div class="mm-l-num">3</div>' +
      '<div class="mm-l-config-head">' + t('welcome.mock.configHead') + '</div>' +
      '<div class="mm-l-cfg-row">' + t('welcome.mock.cfgTemplate') + '</div>' +
      '<div class="mm-l-cfg-row">' + t('welcome.mock.cfgQuestion') + '</div>' +
      '<div class="mm-l-cfg-row">' + t('welcome.mock.cfgScoring') + '</div>' +
    '</div>';
  return wrap;
}

export { renderWelcomePane };
