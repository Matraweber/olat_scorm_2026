// io.js: JSON config, SCORM-1.2 ZIP packaging, preview iframe.
import {
  el, escapeHtml, escapeXml, sanitizeFilename, withBust, blobToDataUrl, extractBodyInner, toast, confirmDialog
} from './util.js';
import { state, render, defaultTheme, scheduleAutosave } from './state.js';
import { migrateTaskIfNeeded, cleanTaskForExport, validateCourse } from './tasks.js';
import { BLOCK_FILES, usedBlockTypes } from './canvas.js';

// *Rel variants prepend 'template/'; plain variants take a path relative to builder/.
async function fetchTextRel(path){
  const r = await fetch(withBust('template/' + path));
  if(!r.ok) throw new Error('Konnte Template-Datei nicht laden: ' + path);
  return r.text();
}
async function fetchBinaryRel(path){
  const r = await fetch(withBust('template/' + path));
  if(!r.ok) return null;
  return await r.blob();
}
async function fetchText(absPath){
  const r = await fetch(withBust(absPath));
  if(!r.ok) throw new Error('Konnte Datei nicht laden: ' + absPath);
  return r.text();
}
async function fetchBinary(absPath){
  const r = await fetch(withBust(absPath));
  if(!r.ok) return null;
  return await r.blob();
}

// KaTeX bundle: shipped inside the SCORM ZIP for offline math rendering.
const KATEX_FONTS = [
  'KaTeX_AMS-Regular.woff2','KaTeX_Caligraphic-Bold.woff2','KaTeX_Caligraphic-Regular.woff2',
  'KaTeX_Fraktur-Bold.woff2','KaTeX_Fraktur-Regular.woff2','KaTeX_Main-Bold.woff2',
  'KaTeX_Main-BoldItalic.woff2','KaTeX_Main-Italic.woff2','KaTeX_Main-Regular.woff2',
  'KaTeX_Math-BoldItalic.woff2','KaTeX_Math-Italic.woff2','KaTeX_SansSerif-Bold.woff2',
  'KaTeX_SansSerif-Italic.woff2','KaTeX_SansSerif-Regular.woff2','KaTeX_Script-Regular.woff2',
  'KaTeX_Size1-Regular.woff2','KaTeX_Size2-Regular.woff2','KaTeX_Size3-Regular.woff2',
  'KaTeX_Size4-Regular.woff2','KaTeX_Typewriter-Regular.woff2'
];
async function addKatexToZip(zip){
  const css = await fetchText('lib/katex/katex.min.css');
  const js  = await fetchText('lib/katex/katex.min.js');
  const ar  = await fetchText('lib/katex/contrib/auto-render.min.js');
  zip.file('katex/katex.min.css', css);
  zip.file('katex/katex.min.js', js);
  zip.file('katex/contrib/auto-render.min.js', ar);
  for(const f of KATEX_FONTS){
    const blob = await fetchBinary('lib/katex/fonts/' + f);
    if(blob) zip.file('katex/fonts/' + f, blob);
  }
}
function katexZipFileList(){
  return [
    'katex/katex.min.css', 'katex/katex.min.js', 'katex/contrib/auto-render.min.js',
    ...KATEX_FONTS.map(f => 'katex/fonts/' + f)
  ];
}

// ---- Manifest/index builders ----
function buildManifest(template, courseTitle, fileList){
  const id = 'man_' + Date.now().toString(36);
  const fileXml = fileList.map(f => '      <file href="' + f + '"/>').join('\n');
  return template
    .replace(/__MANIFEST_ID__/g, id)
    .replace(/__COURSE_TITLE__/g, escapeXml(courseTitle || 'SCORM Lerneinheit'))
    .replace('__RESOURCE_FILES__', fileXml);
}
function buildIndexHtml(template, blockFiles, themeJson, tasksJson){
  const tags = blockFiles.map(f => '  <script src="' + f + '"></script>').join('\n');
  const dataScript = '<script>window.__SCORM_THEME__=' + themeJson + ';window.__SCORM_TASKS__=' + tasksJson + ';<\/script>';
  return template
    .replace('<!-- BLOCK_SCRIPTS -->', tags)
    .replace('<!-- DATA_SCRIPT -->', dataScript);
}
async function gatherTemplateFiles(usedBlocks){
  const files = {};
  const list = ['scorm12.js', 'utils.js', 'styles.css', 'runtime.js', 'index.html', 'blocks/_registry.js'];
  for(const f of list) files[f] = await fetchTextRel(f);
  for(const b of usedBlocks){
    const rel = BLOCK_FILES[b]; if(!rel) continue;
    files['blocks/' + rel] = await fetchTextRel('blocks/' + rel);
  }
  return files;
}

// MIME -> extension for extracting data-URLs into binaries. Unknown types use the subtype.
const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/gif':  'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp3':  'mp3',
  'audio/wav':  'wav',
  'audio/ogg':  'ogg',
  'audio/webm': 'webm',
  'video/mp4':  'mp4',
  'video/webm': 'webm',
  'video/ogg':  'ogg',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/json': 'json',
  'text/plain': 'txt'
};
function extFromMime(mime){
  if(!mime) return 'bin';
  if(MIME_EXT[mime]) return MIME_EXT[mime];
  const sub = mime.split('/')[1] || '';
  return sub.split(';')[0].split('+')[0] || 'bin';
}

function base64ToBytes(b64){
  const bin = atob(b64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for(let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Extract base64 data-URLs into media/ files. ~33% smaller than inlining twice.
function extractMediaFromTasks(tasks){
  const mediaFiles = new Map();
  function maybeExtract(value, blockId, key){
    if(typeof value !== 'string' || !value.startsWith('data:')) return value;
    const m = value.match(/^data:([^;,]+)(?:;base64)?,(.+)$/);
    if(!m) return value;
    const mime = m[1].trim();
    const body = m[2];
    // Plain url-encoded data-URLs are usually tiny SVGs; leave them inline.
    const isBase64 = /;base64,/.test(value);
    if(!isBase64) return value;
    const ext = extFromMime(mime);
    const safeId = String(blockId || 'b').replace(/[^A-Za-z0-9_-]/g, '_');
    const safeKey = String(key || 'data').replace(/[^A-Za-z0-9_-]/g, '_');
    const path = 'media/' + safeId + '_' + safeKey + '.' + ext;
    if(!mediaFiles.has(path)){
      mediaFiles.set(path, base64ToBytes(body));
    }
    return path;
  }
  function processBlock(b){
    if(!b || !b.config || typeof b.config !== 'object') return b;
    const newCfg = {};
    for(const k of Object.keys(b.config)){
      newCfg[k] = maybeExtract(b.config[k], b.id, k);
    }
    return Object.assign({}, b, { config: newCfg });
  }
  const out = tasks.map(t => {
    if(t.tabs && Array.isArray(t.tabs) && t.tabs.length){
      return Object.assign({}, t, {
        tabs: t.tabs.map(tb => Object.assign({}, tb, {
          blocks: (tb.blocks || []).map(processBlock)
        }))
      });
    }
    return Object.assign({}, t, { blocks: (t.blocks || []).map(processBlock) });
  });
  return { tasks: out, mediaFiles };
}

async function buildZip(){
  if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return null; }
  if(state.course.tasks.length === 0){
    const ok = await confirmDialog({
      title: 'Leeres Paket erzeugen?',
      message: 'Das SCORM-Paket enthält keine Aufgaben. Beim Import in OLAT erscheint nur ein leerer Kurs. Trotzdem fortfahren?',
      confirmLabel: 'Trotzdem erzeugen'
    });
    if(!ok) return null;
  }
  const used = usedBlockTypes();
  const tmpl = await gatherTemplateFiles(used);
  const manifestTpl = await fetchTextRel('imsmanifest.xml');
  const blockFiles = used.map(b => 'blocks/' + BLOCK_FILES[b]).filter(Boolean);

  // Clean tasks (drop UI-only fields), then extract data-URLs into media/.
  const cleanedTasks = state.course.tasks.map(t => {
    const clean = cleanTaskForExport(t);
    return { id: t.id, title: t.title, ...(clean.tabs ? { tabs: clean.tabs } : { blocks: clean.blocks }) };
  });
  const { tasks: tasksWithPaths, mediaFiles } = extractMediaFromTasks(cleanedTasks);

  const tasksJson = JSON.stringify({
    courseTitle: state.course.courseTitle,
    courseSubtitle: state.course.courseSubtitle,
    passThreshold: state.course.passThreshold,
    tasks: tasksWithPaths
  }, null, 2);
  const themeJson = JSON.stringify(state.theme, null, 2);
  const indexHtml = buildIndexHtml(tmpl['index.html'], blockFiles, themeJson, tasksJson);

  let logoBlob = null, logoFilename = null;
  if(state.theme.logoUrl && !/^(https?:|data:)/i.test(state.theme.logoUrl)){
    logoFilename = state.theme.logoUrl;
    logoBlob = await fetchBinaryRel(logoFilename);
    if(!logoBlob) logoFilename = null;
  }

  const fileList = [
    'index.html', 'styles.css', 'scorm12.js', 'utils.js', 'runtime.js',
    'theme.json', 'tasks.json', 'blocks/_registry.js',
    ...blockFiles, ...katexZipFileList(),
    ...Array.from(mediaFiles.keys()),
    ...(logoFilename ? [logoFilename] : [])
  ];
  const manifestXml = buildManifest(manifestTpl, state.course.courseTitle, fileList);

  const zip = new JSZip();
  zip.file('index.html', indexHtml);
  zip.file('styles.css', tmpl['styles.css']);
  zip.file('scorm12.js', tmpl['scorm12.js']);
  zip.file('utils.js', tmpl['utils.js']);
  zip.file('runtime.js', tmpl['runtime.js']);
  zip.file('theme.json', themeJson);
  zip.file('tasks.json', tasksJson);
  zip.file('imsmanifest.xml', manifestXml);
  zip.file('blocks/_registry.js', tmpl['blocks/_registry.js']);
  used.forEach(b => {
    const rel = 'blocks/' + BLOCK_FILES[b];
    zip.file(rel, tmpl[rel]);
  });
  await addKatexToZip(zip);
  for(const [path, bytes] of mediaFiles){
    zip.file(path, bytes);
  }
  if(logoFilename && logoBlob) zip.file(logoFilename, logoBlob);
  return zip;
}

// Modal listing validation issues; resolves true (proceed) or false (cancel).
function confirmExportWithIssues(report){
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal export-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const courseLines = report.courseIssues.map(c =>
      '<li class="export-gate-issue export-gate-issue-course">' + escapeHtml(c.message) + '</li>'
    ).join('');
    const blockLines = report.issues.map(w =>
      '<li class="export-gate-issue">' +
        '<span class="export-gate-issue-task">' + escapeHtml(w.taskTitle) + '</span>' +
        '<span class="export-gate-issue-block">' + escapeHtml(w.blockLabel) + '</span>' +
        '<span class="export-gate-issue-msg">' + escapeHtml(w.message) + '</span>' +
      '</li>'
    ).join('');
    const total = report.issues.length + report.courseIssues.length;
    overlay.innerHTML = `
      <div class="modal-card export-gate-card">
        <h2>Bereit zum Export?</h2>
        <p>Beim Prüfen wurde${total === 1 ? '' : 'n'} <strong>${total}</strong> Punkt${total === 1 ? '' : 'e'} gefunden, die Sie ansehen sollten:</p>
        <ul class="export-gate-list">
          ${courseLines}${blockLines}
        </ul>
        <p class="hint">Sie können das Paket trotzdem exportieren, die Lerneinheit könnte für Lernende aber unvollständig wirken.</p>
        <div class="modal-actions">
          <button id="exportGateFix" class="btn btn-secondary" type="button">Korrigieren</button>
          <button id="exportGateProceed" class="btn btn-primary" type="button">Trotzdem exportieren</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    function cleanup(result){
      overlay.remove();
      document.removeEventListener('keydown', onKey, true);
      resolve(result);
    }
    function onKey(e){
      if(e.key === 'Escape'){ e.preventDefault(); cleanup(false); }
    }
    overlay.querySelector('#exportGateFix').addEventListener('click', () => cleanup(false));
    overlay.querySelector('#exportGateProceed').addEventListener('click', () => cleanup(true));
    document.addEventListener('keydown', onKey, true);
    overlay.querySelector('#exportGateFix').focus({ preventScroll: true });
  });
}

export async function downloadZip(){
  try {
    const report = validateCourse(state.course);
    if(report.issues.length || report.courseIssues.length){
      const proceed = await confirmExportWithIssues(report);
      if(!proceed) return;
    }

    const filename = sanitizeFilename(state.course.courseTitle || 'scorm') + '.zip';
    // Open the save picker before the slow ZIP work so user-activation is still fresh.
    const fileHandle = await pickSaveTarget(filename);

    toast('Paket wird erzeugt … 0 %');
    const zip = await buildZip();
    if(!zip) return;
    let lastPercent = -1;
    const blob = await zip.generateAsync({ type:'blob' }, (metadata) => {
      const p = metadata && typeof metadata.percent === 'number'
        ? Math.round(metadata.percent) : null;
      if(p == null || p === lastPercent) return;
      lastPercent = p;
      toast('Paket wird erzeugt … ' + p + ' %');
    });

    if(fileHandle){
      const stream = await fileHandle.createWritable();
      await stream.write(blob);
      await stream.close();
      toast('Gespeichert: ' + fileHandle.name);
      // Refresh folder browser so the new ZIP shows up immediately.
      const folderMod = await import('./folder-browser.js').catch(() => null);
      if(folderMod && typeof folderMod.refresh === 'function'){
        folderMod.refresh().catch(() => {});
      }
    } else {
      // Safari/Firefox lack FS Access API: anchor download + a hint for Safari's setting.
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if(isSafari){
        toast('Gespeichert in Downloads. Tipp: Safari > Einstellungen > Allgemein > „Bei jedem Download nachfragen" für Speicherort-Auswahl.');
      } else {
        toast('Download bereit: ' + filename);
      }
    }
  } catch(err){
    if(err && err.name === 'AbortError') return; // user cancelled the picker
    console.error(err);
    toast('Fehler: ' + err.message, 'error');
  }
}

// FS Access "Save as…" dialog. Returns null on unsupported browsers; throws AbortError on cancel.
async function pickSaveTarget(filename){
  if(typeof window.showSaveFilePicker !== 'function') return null;
  const opts = {
    suggestedName: filename,
    types: [{ description: 'SCORM-Paket (ZIP)', accept: { 'application/zip': ['.zip'] } }]
  };
  // Open the dialog in the user's working folder when one is loaded.
  const folderMod = await import('./folder-browser.js').catch(() => null);
  const rootHandle = folderMod && typeof folderMod.getRootHandle === 'function'
    ? folderMod.getRootHandle() : null;
  if(rootHandle) opts.startIn = rootHandle;
  return await window.showSaveFilePicker(opts);
}

// Inverse of extractMediaFromTasks: rebuild data-URLs from media/ paths on import.
async function reembedMediaInTasks(tasks, zip){
  const EXT_MIME = {
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif',
    svg:'image/svg+xml', webp:'image/webp',
    mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg',
    mp4:'video/mp4', webm:'video/webm',
    pdf:'application/pdf', zip:'application/zip', txt:'text/plain'
  };
  async function readAsDataUrl(path){
    const f = zip.file(path);
    if(!f) return null;
    const ext = (path.split('.').pop() || '').toLowerCase();
    const mime = EXT_MIME[ext] || 'application/octet-stream';
    const b64 = await f.async('base64');
    return 'data:' + mime + ';base64,' + b64;
  }
  async function processBlock(b){
    if(!b || !b.config || typeof b.config !== 'object') return b;
    const newCfg = Object.assign({}, b.config);
    for(const k of Object.keys(newCfg)){
      const v = newCfg[k];
      if(typeof v === 'string' && /^media\/.+\.[A-Za-z0-9]+$/.test(v)){
        const dataUrl = await readAsDataUrl(v);
        if(dataUrl) newCfg[k] = dataUrl;
      }
    }
    return Object.assign({}, b, { config: newCfg });
  }
  const out = [];
  for(const t of tasks){
    if(t.tabs && Array.isArray(t.tabs) && t.tabs.length){
      const tabs = [];
      for(const tb of t.tabs){
        const blocks = [];
        for(const b of (tb.blocks || [])) blocks.push(await processBlock(b));
        tabs.push(Object.assign({}, tb, { blocks }));
      }
      out.push(Object.assign({}, t, { tabs }));
    } else {
      const blocks = [];
      for(const b of (t.blocks || [])) blocks.push(await processBlock(b));
      out.push(Object.assign({}, t, { blocks }));
    }
  }
  return out;
}

export async function loadZipFile(file){
  if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return; }
  // Parsing a multi-MB ZIP takes a moment; confirm the click registered.
  toast('Paket wird gelesen …');
  try {
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const tasksFile = zip.file('tasks.json');
    const themeFile = zip.file('theme.json');
    if(!tasksFile){
      const ok = await confirmDialog({
        title: 'Unbekanntes ZIP-Format?',
        message: 'Diese ZIP-Datei enthält keine tasks.json. Wahrscheinlich wurde sie nicht mit dem SCORM Builder erzeugt. Trotzdem versuchen, sie zu laden?',
        confirmLabel: 'Trotzdem versuchen'
      });
      if(!ok) return;
    }
    if(tasksFile){
      toast('Aufgaben werden geladen …');
      const tasksTxt = await tasksFile.async('string');
      const cfg = JSON.parse(tasksTxt);
      const { uid } = await import('./util.js');
      const rawTasks = (cfg.tasks || []).map(t =>
        migrateTaskIfNeeded(Object.assign({id: t.id || uid('t_')}, t))
      );
      toast('Medien werden eingebettet …');
      const tasks = await reembedMediaInTasks(rawTasks, zip);
      state.course = {
        courseTitle: cfg.courseTitle || '',
        courseSubtitle: cfg.courseSubtitle || '',
        passThreshold: cfg.passThreshold != null ? cfg.passThreshold : 0.5,
        tasks
      };
    }
    if(themeFile){
      const themeTxt = await themeFile.async('string');
      state.theme = Object.assign(defaultTheme(), JSON.parse(themeTxt));
    }
    state.selected = {kind:'course'};
    render();
    scheduleAutosave();
    toast('SCORM-Paket geladen.');
  } catch(err){ console.error(err); toast('ZIP-Fehler: ' + err.message, 'error'); }
}

export function exportJson(){
  const courseClean = Object.assign({}, state.course, {
    tasks: (state.course.tasks || []).map(cleanTaskForExport)
  });
  const blob = new Blob([JSON.stringify({course: courseClean, theme: state.theme}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = sanitizeFilename(state.course.courseTitle || 'scorm') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export async function loadJsonFile(file){
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if(parsed.course){ state.course = parsed.course; state.course.tasks = (state.course.tasks || []).map(migrateTaskIfNeeded); }
    if(parsed.theme) state.theme = Object.assign(defaultTheme(), parsed.theme);
    state.selected = {kind:'course'};
    render();
    scheduleAutosave();
    toast('JSON-Konfiguration geladen.');
  } catch(err){ toast('Fehler: ' + err.message, 'error'); }
}

export async function showPreview(){
  try {
    toast('Vorschau wird vorbereitet …');
    const used = usedBlockTypes();
    const tmpl = await gatherTemplateFiles(used);
    const blockScripts = used.map(b => tmpl['blocks/' + BLOCK_FILES[b]]).join('\n;\n');
    const tasksJson = JSON.stringify({
      courseTitle: state.course.courseTitle,
      courseSubtitle: state.course.courseSubtitle,
      passThreshold: state.course.passThreshold,
      tasks: state.course.tasks.map(t => {
        const clean = cleanTaskForExport(t);
        return { id:t.id, title:t.title, ...(clean.tabs ? { tabs: clean.tabs } : { blocks: clean.blocks }) };
      })
    });
    const previewTheme = Object.assign({}, state.theme);
    if(!previewTheme.logoDataUrl && previewTheme.logoUrl && !/^(https?:|data:)/i.test(previewTheme.logoUrl)){
      const blob = await fetchBinaryRel(previewTheme.logoUrl);
      if(blob) previewTheme.logoDataUrl = await blobToDataUrl(blob);
    }
    const themeJson = JSON.stringify(previewTheme);
    let bodyInner = extractBodyInner(tmpl['index.html']);
    bodyInner = bodyInner.replace(/<script[^>]+src=[^>]+><\/script>/gi, '').replace(/<!--\s*BLOCK_SCRIPTS\s*-->/g, '');
    // srcdoc iframes need <base> to resolve relative URLs (local KaTeX, etc.).
    const baseHref = window.location.href.replace(/[^/]*$/, '');
    const html = [
      '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Vorschau</title>',
      '<base href="', baseHref, '" />',
      '<style>', tmpl['styles.css'], '</style>',
      '<link rel="stylesheet" href="lib/katex/katex.min.css" />',
      '<script src="lib/katex/katex.min.js"><\/script>',
      '<script src="lib/katex/contrib/auto-render.min.js"><\/script>',
      '</head><body>', bodyInner,
      '<script>window.__SCORM_THEME__=', themeJson, ';window.__SCORM_TASKS__=', tasksJson, ';<\/script>',
      '<script>', tmpl['scorm12.js'], '<\/script>',
      '<script>', tmpl['utils.js'], '<\/script>',
      '<script>', tmpl['blocks/_registry.js'], '<\/script>',
      '<script>', blockScripts, '<\/script>',
      '<script>', tmpl['runtime.js'], '<\/script>',
      '</body></html>'
    ].join('');
    document.getElementById('previewFrame').srcdoc = html;
    document.getElementById('previewModal').classList.remove('hidden');
  } catch(err){ console.error(err); toast('Vorschau-Fehler: ' + err.message, 'error'); }
}

export function syncJsonEditor(){
  document.getElementById('jsonEditor').value = JSON.stringify({course: state.course, theme: state.theme}, null, 2);
  const s = document.getElementById('jsonStatus'); s.textContent = ''; s.className = 'json-status';
}
export function applyJsonEditor(){
  try {
    const parsed = JSON.parse(document.getElementById('jsonEditor').value);
    if(parsed.course){ state.course = parsed.course; state.course.tasks = (state.course.tasks || []).map(migrateTaskIfNeeded); }
    if(parsed.theme) state.theme = parsed.theme;
    const s = document.getElementById('jsonStatus'); s.textContent = 'Übernommen.'; s.className = 'json-status ok';
    scheduleAutosave();
    // Don't call render(); it would replace the textarea. Refresh the task list only.
    import('./panes.js').then(m => m.renderTaskList());
  } catch(err){
    const s = document.getElementById('jsonStatus'); s.textContent = 'Fehler: ' + err.message; s.className = 'json-status error';
  }
}
