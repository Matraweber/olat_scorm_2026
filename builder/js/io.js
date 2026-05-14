// ============================================================================
// io.js - Import/export: JSON config, SCORM-1.2 ZIP packaging, and the
// in-browser preview iframe construction.
// ============================================================================
import {
  el, escapeXml, sanitizeFilename, withBust, blobToDataUrl, extractBodyInner, toast
} from './util.js';
import { state, render, defaultTheme } from './state.js';
import { migrateTaskIfNeeded, cleanTaskForExport } from './tasks.js';
import { BLOCK_FILES, usedBlockTypes } from './canvas.js';

// ---- Template-file fetchers (cache-busted) ----
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

// ---- Manifest/index builders ----
function buildManifest(template, courseTitle, fileList){
  const id = 'man_' + Date.now().toString(36);
  const fileXml = fileList.map(f => '      <file href="' + f + '"/>').join('\n');
  return template
    .replace(/__MANIFEST_ID__/g, id)
    .replace(/__COURSE_TITLE__/g, escapeXml(courseTitle || 'SCORM Lerneinheit'))
    .replace('__RESOURCE_FILES__', fileXml);
}
function buildIndexHtml(template, blockFiles){
  const tags = blockFiles.map(f => '  <script src="' + f + '"></script>').join('\n');
  return template.replace('<!-- BLOCK_SCRIPTS -->', tags);
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

// ---- ZIP build / download / load ----
async function buildZip(){
  if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return null; }
  if(state.course.tasks.length === 0){
    if(!confirm('Das Paket enthält keine Aufgaben. Trotzdem erzeugen?')) return null;
  }
  const used = usedBlockTypes();
  const tmpl = await gatherTemplateFiles(used);
  const manifestTpl = await fetchTextRel('imsmanifest.xml');
  const blockFiles = used.map(b => 'blocks/' + BLOCK_FILES[b]).filter(Boolean);
  const indexHtml = buildIndexHtml(tmpl['index.html'], blockFiles);
  const tasksJson = JSON.stringify({
    courseTitle: state.course.courseTitle,
    courseSubtitle: state.course.courseSubtitle,
    passThreshold: state.course.passThreshold,
    tasks: state.course.tasks.map(t => {
      const clean = cleanTaskForExport(t);
      return { id: t.id, title: t.title, ...(clean.tabs ? { tabs: clean.tabs } : { blocks: clean.blocks }) };
    })
  }, null, 2);
  const themeJson = JSON.stringify(state.theme, null, 2);

  let logoBlob = null, logoFilename = null;
  if(state.theme.logoUrl && !/^(https?:|data:)/i.test(state.theme.logoUrl)){
    logoFilename = state.theme.logoUrl;
    logoBlob = await fetchBinaryRel(logoFilename);
    if(!logoBlob) logoFilename = null;
  }

  const fileList = [
    'index.html', 'styles.css', 'scorm12.js', 'utils.js', 'runtime.js',
    'theme.json', 'tasks.json', 'blocks/_registry.js',
    ...blockFiles, ...(logoFilename ? [logoFilename] : [])
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
  if(logoFilename && logoBlob) zip.file(logoFilename, logoBlob);
  return zip;
}

export async function downloadZip(){
  try {
    toast('Paket wird erzeugt …');
    const zip = await buildZip();
    if(!zip) return;
    const blob = await zip.generateAsync({type:'blob'});
    const filename = sanitizeFilename(state.course.courseTitle || 'scorm') + '.zip';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Download bereit: ' + filename);
  } catch(err){
    console.error(err);
    toast('Fehler: ' + err.message, 'error');
  }
}

export async function loadZipFile(file){
  if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return; }
  try {
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const tasksFile = zip.file('tasks.json');
    const themeFile = zip.file('theme.json');
    if(!tasksFile){
      if(!confirm('Diese ZIP enthält keine tasks.json. Trotzdem versuchen?')) return;
    }
    if(tasksFile){
      const tasksTxt = await tasksFile.async('string');
      const cfg = JSON.parse(tasksTxt);
      const { uid } = await import('./util.js');
      state.course = {
        courseTitle: cfg.courseTitle || '',
        courseSubtitle: cfg.courseSubtitle || '',
        passThreshold: cfg.passThreshold != null ? cfg.passThreshold : 0.5,
        tasks: (cfg.tasks || []).map(t => migrateTaskIfNeeded(Object.assign({id: t.id || uid('t_')}, t)))
      };
    }
    if(themeFile){
      const themeTxt = await themeFile.async('string');
      state.theme = Object.assign(defaultTheme(), JSON.parse(themeTxt));
    }
    state.selected = {kind:'course'};
    render();
    toast('SCORM-Paket geladen.');
  } catch(err){ console.error(err); toast('ZIP-Fehler: ' + err.message, 'error'); }
}

// ---- JSON export / import ----
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
    toast('JSON-Konfiguration geladen.');
  } catch(err){ toast('Fehler: ' + err.message, 'error'); }
}

// ---- Preview iframe ----
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
    const html = [
      '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Vorschau</title>',
      '<style>', tmpl['styles.css'], '</style>',
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css" crossorigin="anonymous" />',
      '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js" crossorigin="anonymous"><\/script>',
      '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js" crossorigin="anonymous"><\/script>',
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

// ---- JSON-editor mode (textarea-based) ----
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
    // render() would replace the textarea; use renderActivePane-equivalent indirectly via state-only update
    import('./panes.js').then(m => m.renderTaskList());
  } catch(err){
    const s = document.getElementById('jsonStatus'); s.textContent = 'Fehler: ' + err.message; s.className = 'json-status error';
  }
}
