// ============================================================================
// panes.js: Sidebar (task list) + course + theme settings panes.
// renderActivePaneImpl dispatches to course / theme / task-pane based on the
// current selection. The task editor lives in task-pane.js + sibling modules.
// ============================================================================
import { el, toast } from './util.js';
import { state, pushHistory, render, renderActivePane, defaultTheme, savePersistentTheme, clearPersistentTheme } from './state.js';
import { renderField } from './form.js';
import { renderTaskPane } from './task-pane.js';

// ---- Sidebar: task list + Allgemein-Links ----
export function renderTaskList(){
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  state.course.tasks.forEach((task, idx) => {
    const li = el('li');
    const btn = el('button', {className: 'task-btn' + (state.selected.kind === 'task' && state.selected.idx === idx ? ' active' : ''), attrs:{type:'button'}});
    const titleSpan = el('span', {text: task.title || 'Aufgabe ' + (idx+1)});
    btn.appendChild(titleSpan);
    const blockCount = (task.tabs && task.tabs.length)
      ? task.tabs.reduce((n, t) => n + (t.blocks || []).length, 0)
      : (task.blocks || []).length;
    const tabSuffix = (task.tabs && task.tabs.length) ? ' · ' + task.tabs.length + ' Tabs' : '';
    btn.appendChild(el('span', {className:'task-meta', text: blockCount + ' ' + (blockCount === 1 ? 'Block' : 'Blöcke') + tabSuffix}));
    btn.addEventListener('click', () => { state.selected = {kind:'task', idx}; render(); });
    li.appendChild(btn);
    const ctrls = el('div', {className:'task-controls'});
    const up = el('button', {className:'icon-btn', attrs:{type:'button', title:'Hoch'}, text:'▲'});
    const dn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Runter'}, text:'▼'});
    const rm = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Löschen'}, text:'✕'});
    up.disabled = idx === 0; dn.disabled = idx === state.course.tasks.length - 1;
    up.addEventListener('click', () => swapTasks(idx, idx-1));
    dn.addEventListener('click', () => swapTasks(idx, idx+1));
    rm.addEventListener('click', () => {
      if(!confirm('Aufgabe "' + (task.title || '') + '" entfernen?')) return;
      pushHistory();
      state.course.tasks.splice(idx, 1);
      if(state.selected.kind === 'task'){
        if(state.course.tasks.length === 0) state.selected = {kind:'course'};
        else if(state.selected.idx >= state.course.tasks.length) state.selected = {kind:'task', idx: state.course.tasks.length - 1};
      }
      render();
    });
    ctrls.appendChild(up); ctrls.appendChild(dn); ctrls.appendChild(rm);
    li.appendChild(ctrls);
    list.appendChild(li);
  });
  document.querySelectorAll('.sidebar-link').forEach(b => {
    b.classList.toggle('active', state.selected.kind === b.dataset.target);
  });
}

function swapTasks(a, b){
  if(b < 0 || b >= state.course.tasks.length) return;
  [state.course.tasks[a], state.course.tasks[b]] = [state.course.tasks[b], state.course.tasks[a]];
  if(state.selected.kind === 'task'){
    if(state.selected.idx === a) state.selected.idx = b;
    else if(state.selected.idx === b) state.selected.idx = a;
  }
  render();
}

// ---- Active pane dispatcher (welcome / course / theme / task) ----
export function renderActivePaneImpl(){
  const host = document.getElementById('formPane');
  // Tear down any welcome-pane scroll observer before clearing the host
  if(typeof window._welcomeScrollCleanup === 'function') window._welcomeScrollCleanup();
  host.classList.remove('welcome-pane');
  host.innerHTML = '';
  if(state.jsonMode){ host.classList.add('hidden'); document.getElementById('jsonPane').classList.remove('hidden'); return; }
  host.classList.remove('hidden');
  document.getElementById('jsonPane').classList.add('hidden');
  if(state.selected.kind === 'welcome') renderWelcomePane(host);
  else if(state.selected.kind === 'course') renderCoursePane(host);
  else if(state.selected.kind === 'theme') renderThemePane(host);
  else if(state.selected.kind === 'task') renderTaskPane(host, state.selected.idx);
}

function renderWelcomePane(host){
  host.classList.add('welcome-pane');
  // Enable scroll-snap and smooth-scroll only while welcome is the active pane.
  document.documentElement.classList.add('welcome-active');

  // Thin reading-progress strip directly under the sticky builder-header.
  // Fills with the accent colour as the user scrolls through the chapters.
  const progress = el('div', {className:'welcome-progress', attrs:{'aria-hidden':'true'}});
  progress.appendChild(el('div', {className:'welcome-progress-bar'}));
  host.appendChild(progress);

  // Layout: a two-column grid with the reading content on the left and a
  // sticky chapter rail (table of contents) on the right. The rail tracks
  // scroll position and lets the user jump to any chapter.
  const layout = el('div', {className:'welcome-layout'});
  const main   = el('main', {className:'welcome-content'});
  const rail   = el('aside', {className:'welcome-rail', attrs:{'aria-label':'Kapitel-Übersicht'}});
  const railList = el('ol', {className:'welcome-rail-list'});
  rail.appendChild(el('div', {className:'welcome-rail-label', text:'Kapitel'}));
  rail.appendChild(railList);
  layout.appendChild(main);
  layout.appendChild(rail);
  host.appendChild(layout);

  // Each chapter is registered here so the rail can be built and the
  // scroll-spy can resolve "active" by index.
  const chapters = [];

  // Create a numbered chapter. Returns the body element so callers can append
  // their content directly. `numbered:false` skips the rail number (used for
  // the hero, which is the title page rather than a chapter).
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
  const heroBody = chapter('Willkommen.', { hero: true, hideRail: true });
  heroBody.insertAdjacentHTML('afterbegin',
    '<span class="welcome-kicker">SCORM Builder · Umwelt-Campus Birkenfeld</span>'
  );
  heroBody.appendChild(el('p', {className:'welcome-lede', text:'Mit dem SCORM Builder erstellst du Lerneinheiten für OLAT. Direkt im Browser, ohne Installation. Diese Seite erklärt den Ablauf in fünf Kapiteln.'}));
  const heroCta = el('div', {className:'welcome-cta-row'});
  const newTaskBtn = el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Erste Aufgabe erstellen'});
  newTaskBtn.addEventListener('click', () => document.getElementById('btnAddTask').click());
  const goCourseBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Zu Kopfdaten'});
  goCourseBtn.addEventListener('click', () => { state.selected = {kind:'course'}; renderActivePane(); renderTaskList(); });
  heroCta.appendChild(newTaskBtn); heroCta.appendChild(goCourseBtn);
  heroBody.appendChild(heroCta);

  // 01 Quickstart: 5 Schritte
  const quick = chapter('In 5 Schritten zum SCORM-Paket');
  quick.appendChild(el('p', {className:'welcome-lead', text:'Vom leeren Builder bis zur fertigen ZIP-Datei.'}));

  const steps = el('div', {className:'welcome-steps'});
  const stepDefs = [
    {
      n: 1, title: 'Aufgabe anlegen',
      body: 'Klicke links in der Seitenleiste auf <strong>+ Aufgabe</strong>. Wähle zwischen einer leeren Aufgabe oder einer Vorlage (z. B. „Wahrheitstabelle", „Numerische Eingabe mit Variablen").',
      mock: mockSidebarAddTask()
    },
    {
      n: 2, title: 'Block hinzufügen',
      body: 'Innerhalb der Aufgabe klickst du auf <strong>+ Block</strong>. Es öffnet sich ein Menü mit allen verfügbaren Block-Typen.',
      mock: mockBlockPicker()
    },
    {
      n: 3, title: 'Beispiel laden oder selbst füllen',
      body: 'Jeder Frage-Block startet mit einer <strong>Vorlage</strong>: „Manuell (leer)" für eigene Inhalte, oder ein <strong>Beispiel</strong> mit fertigem Inhalt. Mit <strong>↺ Zurücksetzen</strong> löschst du deine manuelle Eingabe.',
      mock: mockPresetDropdown()
    },
    {
      n: 4, title: 'Vorschau ansehen',
      body: 'Klicke oben rechts auf <strong>Vorschau</strong>. So sehen Studierende die fertige Lerneinheit. Du kannst Antworten direkt ausprobieren.',
      mock: mockTopbarBtn('Vorschau', 'secondary')
    },
    {
      n: 5, title: 'SCORM-ZIP erzeugen',
      body: 'Mit <strong>SCORM-ZIP erzeugen</strong> wird ein vollständiges SCORM-1.2-Paket heruntergeladen. Diese ZIP-Datei kannst du in OLAT als Lerneinheit hochladen.',
      mock: mockTopbarBtn('SCORM-ZIP erzeugen', 'primary')
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

  // 02 Die Oberfläche (annotated mockup)
  const oberflaeche = chapter('Die Oberfläche im Überblick');
  oberflaeche.appendChild(el('p', {className:'welcome-lead', text:'Der Builder besteht aus drei Bereichen.'}));
  oberflaeche.appendChild(mockBuilderLayout());

  const layoutLegend = el('ul', {className:'welcome-legend'});
  [
    ['1', 'Seitenleiste', 'Liste deiner Aufgaben + Allgemein-Links (Kopfdaten, Branding, diese Hilfe). Hier kannst du Aufgaben hinzufügen, umsortieren und löschen.'],
    ['2', 'Canvas', 'Die Arbeitsfläche der ausgewählten Aufgabe. Blöcke werden hier per Drag & Drop angeordnet und in der Größe angepasst.'],
    ['3', 'Konfigurations-Pane', 'Rechts: Eigenschaften des markierten Blocks. Vorlagen, Texte, Antworten und Bewertung werden hier eingestellt.']
  ].forEach(([n, k, v]) => {
    const li = el('li');
    li.innerHTML = '<span class="welcome-legend-num">' + n + '</span><strong>' + k + '</strong> - ' + v;
    layoutLegend.appendChild(li);
  });
  oberflaeche.appendChild(layoutLegend);

  // 03 Block-Typen
  const types = chapter('Block-Typen');
  types.appendChild(el('p', {className:'welcome-lead', text:'Inhalts-Blöcke sind statisch, Frage-Blöcke werden bewertet. Eine Aufgabe kann beliebig viele Blöcke enthalten.'}));

  const blocksGrid = el('div', {className:'welcome-blocks-grid'});
  const allBlocks = window.Blocks ? window.Blocks.ids().map(id => ({ id, def: window.Blocks.get(id) })).filter(x => x.def) : [];
  // Group by category
  const byCat = {};
  allBlocks.forEach(({ id, def }) => {
    const cat = def.category || 'Sonstige';
    if(!byCat[cat]) byCat[cat] = [];
    byCat[cat].push({ id, def });
  });
  Object.entries(byCat).forEach(([cat, items]) => {
    const catLabel = el('div', {className:'welcome-blocks-cat', text: cat});
    blocksGrid.appendChild(catLabel);
    items.forEach(({ id, def }) => {
      const card = el('div', {className:'welcome-block-card' + (def.graded ? ' graded' : '')});
      card.innerHTML =
        '<div class="welcome-block-icon">' + (def.icon || '◧') + '</div>' +
        '<div class="welcome-block-name">' + (def.label || id) + '</div>' +
        '<div class="welcome-block-desc">' + (def.description || '') + '</div>' +
        (def.graded ? '<div class="welcome-block-graded">bewertet</div>' : '');
      blocksGrid.appendChild(card);
    });
  });
  types.appendChild(blocksGrid);

  // 04 Mit dem Canvas arbeiten
  const tips = chapter('Mit dem Canvas arbeiten');
  const tipsGrid = el('div', {className:'welcome-tips-grid'});
  [
    { icon:'✥', title:'Verschieben', body:'Blöcke werden per Maus gezogen. Mit gehaltener Shift-Taste mehrere Blöcke gleichzeitig.' },
    { icon:'⌟', title:'Größe ändern', body:'Unten rechts an jedem Block die Ecke ziehen, oder den ↕-Knopf für „Höhe an Inhalt anpassen".' },
    { icon:'☐', title:'Mehrfach-Auswahl', body:'Shift + Klick wählt mehrere Blöcke aus. Im rechten Pane erscheinen dann Ausrichten/Verteilen/Duplizieren.' },
    { icon:'+/−', title:'Zoom', body:'Strg/Cmd + Mausrad zoomt das Canvas. Oder die +/− Knöpfe oben rechts in der Aufgabe.' },
    { icon:'⌧', title:'Tabs (optional)', body:'Pro Aufgabe können zwei Tabs aktiviert werden, z. B. „Visualisierung" und „Aufgabe".' },
    { icon:'★', title:'Vorlagen speichern', body:'Eine fertige Aufgabe als Vorlage speichern („★ Vorlage" im Aufgaben-Header). Steht beim nächsten Mal sofort zur Verfügung.' }
  ].forEach(t => {
    const card = el('div', {className:'welcome-tip-card'});
    card.innerHTML =
      '<div class="welcome-tip-icon">' + t.icon + '</div>' +
      '<div class="welcome-tip-title">' + t.title + '</div>' +
      '<div class="welcome-tip-body">' + t.body + '</div>';
    tipsGrid.appendChild(card);
  });
  tips.appendChild(tipsGrid);

  // 05 Tastaturkürzel
  const shortcuts = chapter('Tastaturkürzel');
  shortcuts.appendChild(el('p', {className:'welcome-lead', text:'Auf der Canvas verfügbar:'}));
  const kbdTable = el('table', {className:'welcome-kbd-table'});
  [
    ['↑ ↓ ← →',         'Markierte Blöcke pixelweise verschieben'],
    ['Shift + Pfeil',   'Blöcke in 10-px-Schritten verschieben'],
    ['Strg/⌘ + C',      'Markierte Blöcke kopieren'],
    ['Strg/⌘ + V',      'Blöcke einfügen'],
    ['Strg/⌘ + D',      'Markierte Blöcke duplizieren'],
    ['Strg/⌘ + A',      'Alle Blöcke der Aufgabe markieren'],
    ['Entf / ⌫',        'Markierte Blöcke löschen'],
    ['Esc',             'Auswahl aufheben'],
    ['Strg/⌘ + Z',      'Rückgängig'],
    ['Strg/⌘ + Shift+Z','Wiederherstellen'],
    ['Strg/⌘ + Mausrad','Canvas zoomen']
  ].forEach(([k, d]) => {
    const tr = el('tr');
    tr.appendChild(el('td', {className:'welcome-kbd-key', html:'<kbd>' + k.replace(/ \+ /g, '</kbd> + <kbd>') + '</kbd>'}));
    tr.appendChild(el('td', {text: d}));
    kbdTable.appendChild(tr);
  });
  shortcuts.appendChild(kbdTable);

  // Closing call-to-action
  const foot = el('section', {className:'welcome-foot'});
  foot.innerHTML = '<p>Diese Hilfe findest du jederzeit in der Seitenleiste unter <strong>Willkommen / Hilfe</strong>.</p>';
  const footBtn = el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Erste Aufgabe erstellen'});
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

// Scroll-spy: highlight the rail item for the chapter whose head is nearest
// to the top of the viewport, and update the reading-progress bar width.
// Uses a single rAF-throttled scroll listener for both, so there is one
// layout read per frame rather than two.
function setupWelcomeScrollSpy(chapters, railList){
  if(typeof window._welcomeScrollCleanup === 'function'){
    window._welcomeScrollCleanup();
  }
  const railLinks = Array.from(railList.querySelectorAll('.welcome-rail-link'));
  let rafId = null;
  let activeIdx = -1;

  function setActive(idx){
    if(idx === activeIdx) return;
    activeIdx = idx;
    chapters.forEach((ch, i) => ch.section.classList.toggle('is-active', i === idx));
    // The rail skips chapters with `hideRail`, so the rail list index doesn't
    // match the chapter index 1-for-1; resolve via dataset.chapterIdx.
    Array.from(railList.children).forEach(li => {
      const ci = parseInt(li.dataset.chapterIdx, 10);
      li.querySelector('.welcome-rail-link')?.classList.toggle('is-active', ci === idx);
    });
  }

  const progressBar = document.querySelector('.welcome-progress-bar');

  function update(){
    rafId = null;
    // Active chapter: the last one whose top has crossed ~30% from viewport top.
    const triggerY = window.innerHeight * 0.30;
    let best = 0;
    for(let i = 0; i < chapters.length; i++){
      const top = chapters[i].section.getBoundingClientRect().top;
      if(top <= triggerY) best = i;
      else break;
    }
    setActive(best);
    // Reading progress: scrollY / maxScrollY, expressed as a 0-100% width on the bar.
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

// Scroll-triggered reveal: each below-the-fold reading element fades in and
// slides up the first time it enters the viewport. Above-the-fold elements
// render visible immediately (so the hero never flashes blank on load).
// Once revealed, an element stays in place when scrolled past. Respects
// prefers-reduced-motion.
function setupRevealAnimations(host){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const candidates = Array.from(host.querySelectorAll(
    '.welcome-chapter, .welcome-step, .welcome-block-card, .welcome-tip-card, ' +
    '.welcome-legend li, .welcome-foot, .welcome-mock'
  ));
  if(candidates.length === 0 || typeof IntersectionObserver === 'undefined') return;

  // Wait one frame so getBoundingClientRect reflects the final layout, then
  // tag only the elements that start below the viewport. Anything visible at
  // load time skips the animation entirely.
  requestAnimationFrame(() => {
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

    // Safety net: some environments skip the initial intersection callback.
    // After a short delay, force-reveal anything that is in viewport.
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
  });
}

// Mock-UI Helpers (HTML/CSS-Miniaturen)
function mockSidebarAddTask(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-sidebar'});
  wrap.innerHTML =
    '<div class="mm-head"><span>Aufgaben</span><span class="mm-btn mm-btn-primary mm-pulse">+ Aufgabe</span></div>' +
    '<div class="mm-task">Aufgabe 1<span class="mm-meta">2 Blöcke</span></div>' +
    '<div class="mm-task mm-task-faint">Aufgabe 2<span class="mm-meta">1 Block</span></div>';
  return wrap;
}
function mockBlockPicker(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-picker'});
  wrap.innerHTML =
    '<div class="mm-modal-head">Block hinzufügen</div>' +
    '<div class="mm-modal-body">' +
      '<div class="mm-cat">Inhalt</div>' +
      '<div class="mm-row"><span class="mm-chip">¶ Text</span><span class="mm-chip">⌨ Code</span><span class="mm-chip">IMG Bild</span></div>' +
      '<div class="mm-cat">Frage</div>' +
      '<div class="mm-row"><span class="mm-chip mm-chip-q mm-pulse">☑ Multiple Choice</span><span class="mm-chip mm-chip-q">↕ Sortieren</span><span class="mm-chip mm-chip-q"># Numerisch</span></div>' +
    '</div>';
  return wrap;
}
function mockPresetDropdown(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-config'});
  wrap.innerHTML =
    '<div class="mm-field"><label>Überschrift</label><div class="mm-inp">Aufgabe</div></div>' +
    '<div class="mm-field"><label>Vorlage</label>' +
      '<div class="mm-select mm-pulse">Beispiel: Mathematik - Pythagoras ▾</div></div>' +
    '<div class="mm-section">Frage</div>' +
    '<div class="mm-field"><label>Frage-Vorlage</label><div class="mm-inp mm-inp-mono">Berechnen Sie {a}² + {b}².</div></div>';
  return wrap;
}
function mockTopbarBtn(label, kind){
  const wrap = el('div', {className:'welcome-mock welcome-mock-topbar'});
  wrap.innerHTML =
    '<span class="mm-btn">JSON exportieren</span>' +
    '<span class="mm-btn ' + (kind === 'primary' ? 'mm-btn-primary' : '') + ' mm-pulse">' + label + '</span>';
  return wrap;
}
function mockBuilderLayout(){
  const wrap = el('div', {className:'welcome-mock welcome-mock-layout'});
  wrap.innerHTML =
    '<div class="mm-l-side">' +
      '<div class="mm-l-num">1</div>' +
      '<div class="mm-l-side-title">Aufgaben</div>' +
      '<div class="mm-l-row mm-l-row-active">Aufgabe 1</div>' +
      '<div class="mm-l-row">Aufgabe 2</div>' +
      '<div class="mm-l-side-title">Allgemein</div>' +
      '<div class="mm-l-row">Kopfdaten</div>' +
    '</div>' +
    '<div class="mm-l-canvas">' +
      '<div class="mm-l-num">2</div>' +
      '<div class="mm-l-canvas-head">Aufgabe 1 · + Block</div>' +
      '<div class="mm-l-block mm-l-block-1">Multiple Choice</div>' +
      '<div class="mm-l-block mm-l-block-2 mm-l-block-active">Numerische Eingabe</div>' +
    '</div>' +
    '<div class="mm-l-config">' +
      '<div class="mm-l-num">3</div>' +
      '<div class="mm-l-config-head">Konfiguration</div>' +
      '<div class="mm-l-cfg-row">Vorlage</div>' +
      '<div class="mm-l-cfg-row">Frage</div>' +
      '<div class="mm-l-cfg-row">Bewertung</div>' +
    '</div>';
  return wrap;
}

function renderCoursePane(host){
  host.appendChild(el('h2', {text:'Kopfdaten der Lerneinheit'}));
  host.appendChild(el('p', {className:'hint', text:'Diese Angaben erscheinen im SCORM-Header und im OLAT-Lernpfad.'}));
  const c = state.course;
  const get = () => c;
  const set = (k, v) => { c[k] = v; if(k === 'courseTitle') renderTaskList(); };
  [
    { key:'courseTitle', label:'Kurstitel', type:'text', placeholder:'z. B. Maschinendynamik: Komplexe Zahlen' },
    { key:'courseSubtitle', label:'Untertitel', type:'text' },
    { key:'passThreshold', label:'Bestehensschwelle (0 bis 1)', type:'number', step:'any', min:0, max:1 }
  ].forEach(spec => host.appendChild(renderField(spec, get, set)));
}

function renderThemePane(host){
  host.appendChild(el('h2', {text:'Branding / Theme'}));
  host.appendChild(el('p', {className:'hint', text:'Standardmäßig im UCB-Stil. Farben und Footer hier anpassen.'}));
  const t = state.theme;
  const actions = el('div', {className:'button-cluster', style:{marginBottom:'1rem'}});
  const resetBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Standard-Branding wiederherstellen'});
  resetBtn.addEventListener('click', () => {
    if(!confirm('Branding / Theme auf die ursprünglichen Standardwerte zurücksetzen?')) return;
    pushHistory();
    clearPersistentTheme();
    state.theme = defaultTheme();
    renderActivePane();
    toast('Standard-Branding wiederhergestellt.');
  });
  actions.appendChild(resetBtn);
  host.appendChild(actions);

  const persistTheme = () => {
    if(!savePersistentTheme(state.theme)) toast('Branding konnte nicht dauerhaft gespeichert werden.', 'error');
  };
  const get = () => t; const set = (k, v) => { t[k] = v; persistTheme(); };
  [
    { key:'kicker', label:'Kicker (Badge oben links)', type:'text' },
    { key:'fontFamily', label:'Schriftart (CSS font-family)', type:'text' },
    { key:'primaryColor', label:'Primärfarbe', type:'color' },
    { key:'primaryLight', label:'Primärfarbe hell (Verlauf)', type:'color' },
    { key:'accentColor', label:'Akzentfarbe', type:'color' },
    { key:'accentDarkColor', label:'Akzentfarbe dunkel', type:'color' },
    { key:'footerText', label:'Footer-Text', type:'text' },
    { key:'footerLink', label:'Footer-Link', type:'text', placeholder:'https://...' },
    { key:'logoUrl', label:'Logo-Pfad (Datei in template/, wird ins ZIP gepackt)', type:'text', placeholder:'default-logo.svg', help:'Datei mit diesem Namen muss in builder/template/ existieren.' }
  ].forEach(spec => host.appendChild(renderField(spec, get, set)));
  const logoField = el('div', {className:'field'});
  logoField.appendChild(el('label', {text:'Logo per Upload (überschreibt Pfad)'}));
  logoField.appendChild(el('div', {className:'field-help', text:'Lädt das Bild als Data-URL ins JSON.'}));
  const inp = el('input', {attrs:{type:'file', accept:'image/*'}});
  inp.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = () => { state.theme.logoDataUrl = r.result; persistTheme(); renderActivePane(); toast('Logo geladen.'); };
    r.readAsDataURL(file);
  });
  logoField.appendChild(inp);
  if(t.logoDataUrl){
    const preview = el('img', {attrs:{src: t.logoDataUrl, alt:'Logo'}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    logoField.appendChild(preview);
    const remove = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Upload-Logo entfernen', style:{marginTop:'0.4rem'}});
    remove.addEventListener('click', () => { state.theme.logoDataUrl = null; persistTheme(); renderActivePane(); });
    logoField.appendChild(remove);
  } else if(t.logoUrl){
    const preview = el('img', {attrs:{src: 'template/' + t.logoUrl, alt:'Logo'}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    preview.onerror = () => { preview.replaceWith(el('div', {className:'field-help', text:'Logo "' + t.logoUrl + '" in template/ nicht gefunden.'})); };
    logoField.appendChild(preview);
  }
  host.appendChild(logoField);
}
