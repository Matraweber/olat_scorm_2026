// folder-browser.js: Header dropdown listing .zip files in a picked folder.
// Chromium uses FS Access API; Firefox/Safari fall back to <input webkitdirectory>.
import { el, toast, confirmDialog } from './util.js';
import { loadZipFile } from './io.js';

// Tree node: { name, kind:'dir'|'file', handle?, file?, path, parent, children?, expanded? }
let root = null;
let activePath = null;    // currently-loaded zip, for highlighting
let dropdownOpen = false; // header-anchored popover visible?

const SUPPORTS_FS_ACCESS = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export function isOpen(){ return !!root; }

// Test-only: inject a virtual folder tree. Not exposed to the UI.
export function _testInject(tree){
  root = tree;
  dropdownOpen = true;
  renderDropdown();
}
if(typeof window !== 'undefined'){
  window._folderBrowserTest = { inject: _testInject, close: closeFolder };
}

export async function pickFolder(){
  // FS Access API on Chromium enables live folder syncing.
  if(SUPPORTS_FS_ACCESS){
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      root = await buildTreeFromHandle(handle, '', null);
      await persistHandle(handle).catch(() => {});
      dropdownOpen = true;
      renderDropdown();
      toast('Ordner „' + handle.name + '" geöffnet.');
    } catch(e){
      if(e && e.name !== 'AbortError') toast('Ordner konnte nicht geöffnet werden: ' + e.message, 'error');
    }
    return;
  }
  // Fallback for browsers without FS Access API: read-only, no write-back.
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.multiple = true;
  inp.webkitdirectory = true;
  inp.style.display = 'none';
  inp.addEventListener('change', () => {
    const files = Array.from(inp.files || []);
    inp.remove();
    if(files.length === 0) return;
    root = buildTreeFromFiles(files);
    dropdownOpen = true;
    renderDropdown();
    toast('Ordner „' + root.name + '" geöffnet.');
  });
  document.body.appendChild(inp);
  inp.click();
}

export function closeFolder(){
  root = null;
  activePath = null;
  dropdownOpen = false;
  // × forgets the handle; outside-click / ESC just hide the dropdown.
  clearPersistedHandle().catch(() => {});
  renderDropdown();
}

export function toggleDropdown(){
  if(!root){ pickFolder(); return; }
  dropdownOpen = !dropdownOpen;
  renderDropdown();
}

// IndexedDB persistence: handles are not JSON-serialisable.
const IDB_NAME = 'scormBuilder';
const IDB_STORE = 'folders';
const IDB_KEY = 'lastDirectoryHandle';

function openIdb(){
  return new Promise((resolve, reject) => {
    if(typeof indexedDB === 'undefined'){ reject(new Error('no indexeddb')); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function persistHandle(handle){
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function loadPersistedHandle(){
  const db = await openIdb();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror   = () => { db.close(); resolve(null); };
  });
}
async function clearPersistedHandle(){
  try {
    const db = await openIdb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch(e){ /* IDB unavailable, nothing to clear */ }
}

// Silent restore on page load. Permission prompts need a user gesture,
// so if permission has lapsed we wait for the user to click "Ordner".
export async function tryRestoreFolder(){
  if(!SUPPORTS_FS_ACCESS) return false;
  let handle;
  try { handle = await loadPersistedHandle(); } catch(e){ return false; }
  if(!handle) return false;
  try {
    const perm = await handle.queryPermission({ mode: 'read' });
    if(perm !== 'granted') return false;
    root = await buildTreeFromHandle(handle, '', null);
    return true;
  } catch(e){
    await clearPersistedHandle();
    return false;
  }
}


// Currently-loaded ZIP path, used for tree highlighting.
export function markActive(path){
  activePath = path;
  renderDropdown();
}

// Root directory handle (Chromium-only). Lets other modules save into the open folder.
export function getRootHandle(){
  return (root && root.handle && typeof root.handle.getFileHandle === 'function') ? root.handle : null;
}

export function getRootName(){
  return root ? root.name : null;
}

// Re-scan the open folder so a freshly-saved ZIP shows up.
export async function refresh(){
  if(!root || !root.handle) return;
  const wasOpen = dropdownOpen;
  try {
    root = await buildTreeFromHandle(root.handle, '', null);
  } catch(e){
    return;
  }
  dropdownOpen = wasOpen;
  renderDropdown();
}

// Build tree from FS-Access handles (Chromium).
async function buildTreeFromHandle(dirHandle, basePath, parent){
  const node = {
    kind: 'dir',
    name: dirHandle.name,
    handle: dirHandle,
    path: basePath ? basePath + '/' + dirHandle.name : dirHandle.name,
    parent,
    children: [],
    expanded: basePath === '' // root expanded by default
  };
  for await (const entry of dirHandle.values()){
    if(entry.kind === 'directory'){
      const child = await buildTreeFromHandle(entry, node.path, node);
      // Skip empty directories.
      if(child.children.length > 0) node.children.push(child);
    } else if(entry.kind === 'file' && entry.name.toLowerCase().endsWith('.zip')){
      node.children.push({
        kind: 'file',
        name: entry.name,
        handle: entry,
        path: node.path + '/' + entry.name,
        parent: node
      });
    }
  }
  sortChildren(node);
  return node;
}

// Build tree from a flat File list (fallback).
function buildTreeFromFiles(files){
  const rootName = (files[0].webkitRelativePath || files[0].name).split('/')[0];
  const node = { kind:'dir', name: rootName, path: rootName, parent: null, children: [], expanded: true };
  const byPath = { [rootName]: node };
  files.forEach(f => {
    const rel = f.webkitRelativePath || f.name;
    if(!rel.toLowerCase().endsWith('.zip')) return;
    const parts = rel.split('/');
    let parent = node;
    for(let i = 1; i < parts.length - 1; i++){
      const subPath = parts.slice(0, i + 1).join('/');
      let dir = byPath[subPath];
      if(!dir){
        dir = { kind:'dir', name: parts[i], path: subPath, parent, children: [], expanded: false };
        byPath[subPath] = dir;
        parent.children.push(dir);
      }
      parent = dir;
    }
    parent.children.push({
      kind:'file',
      name: parts[parts.length - 1],
      path: rel,
      file: f,
      parent
    });
  });
  function prune(n){
    n.children = n.children.filter(c => c.kind === 'file' || (prune(c), c.children.length > 0));
    sortChildren(n);
    return n;
  }
  return prune(node);
}

function sortChildren(node){
  if(!node.children) return;
  // Dirs first, then files; alphabetical within each.
  node.children.sort((a, b) => {
    if(a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, 'de');
  });
}

// Load a zip entry into the builder.
async function openFileEntry(entry){
  try {
    let file;
    if(entry.file){
      file = entry.file;
    } else if(entry.handle){
      file = await entry.handle.getFile();
    } else {
      toast('Datei konnte nicht gelesen werden.', 'error');
      return;
    }
    await loadZipFile(file);
    markActive(entry.path);
    // Keep open so author can switch between sibling ZIPs.
  } catch(e){
    toast('Fehler beim Laden: ' + e.message, 'error');
  }
}


// Header-anchored dropdown. Closes on outside-click, ESC, or ×.
let _activeOutsideClick = null;
let _activeKeydown = null;

function renderDropdown(){
  // Render is the single source of truth - remove the previous instance first.
  const existing = document.getElementById('folderDropdown');
  if(existing) existing.remove();
  if(_activeOutsideClick){
    document.removeEventListener('mousedown', _activeOutsideClick, true);
    _activeOutsideClick = null;
  }
  if(_activeKeydown){
    document.removeEventListener('keydown', _activeKeydown, true);
    _activeKeydown = null;
  }
  document.documentElement.classList.remove('folder-dropdown-open');

  if(!root || !dropdownOpen) return;

  const anchor = document.getElementById('btnOpenFolder');
  if(!anchor) return;

  const host = el('div', { id:'folderDropdown', className:'folder-dropdown' });
  host.addEventListener('mousedown', e => e.stopPropagation()); // don't trigger outside-close

  // Header (title + ×)
  const head = el('div', { className:'folder-dropdown-head' });
  const title = el('div', { className:'folder-dropdown-title' });
  title.innerHTML =
    '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M2 5 L8 5 L9.5 7 L18 7 L18 16 L2 16 Z"/>' +
    '</svg>' +
    '<span>' + escapeHtml(root.name) + '</span>';
  head.appendChild(title);
  const closeBtn = el('button', {
    className:'folder-dropdown-close icon-btn',
    attrs:{ type:'button', title:'Ordner schließen (vergisst den Pfad)',
      'aria-label':'Ordner schließen' },
    text:'×'
  });
  closeBtn.addEventListener('click', e => { e.stopPropagation(); closeFolder(); });
  head.appendChild(closeBtn);
  host.appendChild(head);

  // Tree
  const list = el('ul', { className:'folder-tree' });
  renderEntry(list, root, 0);
  host.appendChild(list);

  // Footer hint
  const hint = el('div', { className:'folder-dropdown-hint',
    text: SUPPORTS_FS_ACCESS
      ? 'Datei klicken zum Laden. Bleibt offen, bis Sie woanders klicken.'
      : 'Read-only (Browser ohne File-System-API).' });
  host.appendChild(hint);

  document.body.appendChild(host);
  document.documentElement.classList.add('folder-dropdown-open');

  // Position under the anchor; clamp if it would overflow the viewport.
  const r = anchor.getBoundingClientRect();
  host.style.top  = (r.bottom + 6) + 'px';
  const desiredWidth = host.offsetWidth || 380;
  let left = r.left;
  if(left + desiredWidth > window.innerWidth - 8){
    left = window.innerWidth - desiredWidth - 8;
  }
  host.style.left = Math.max(8, left) + 'px';

  // Outside-click closes; inside-click stays open for tree navigation.
  _activeOutsideClick = e => {
    if(!host.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)){
      dropdownOpen = false;
      renderDropdown();
    }
  };
  _activeKeydown = e => {
    if(e.key === 'Escape'){
      dropdownOpen = false;
      renderDropdown();
    }
  };
  setTimeout(() => {
    document.addEventListener('mousedown', _activeOutsideClick, true);
    document.addEventListener('keydown', _activeKeydown, true);
  }, 0);
}

function renderEntry(parentList, entry, depth){
  if(entry === root){
    // Root header is in panel-head; render only its children here.
    entry.children.forEach(c => renderEntry(parentList, c, 0));
    return;
  }
  const li = el('li', { className:'folder-tree-item folder-tree-item-' + entry.kind });
  const row = el('div', { className:'folder-tree-row' });
  row.style.paddingLeft = (depth * 0.9 + 0.4) + 'rem';
  if(entry.kind === 'dir'){
    const caret = el('span', { className:'folder-tree-caret', text: entry.expanded ? '▾' : '▸' });
    row.appendChild(caret);
    const icon = el('span', { className:'folder-tree-icon' });
    icon.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">' +
      '<path d="M1.5 4 L6.5 4 L7.7 5.5 L14.5 5.5 L14.5 13 L1.5 13 Z"/>' +
    '</svg>';
    row.appendChild(icon);
    row.appendChild(el('span', { className:'folder-tree-name', text: entry.name }));
    row.appendChild(el('span', { className:'folder-tree-meta', text: entry.children.length + '' }));
    row.addEventListener('click', () => {
      // Root-level accordion: expanding one collapses siblings.
      const willExpand = !entry.expanded;
      if(willExpand && entry.parent && entry.parent === root){
        (entry.parent.children || []).forEach(sib => {
          if(sib !== entry && sib.kind === 'dir') sib.expanded = false;
        });
      }
      entry.expanded = willExpand;
      renderDropdown();
    });
  } else {
    row.appendChild(el('span', { className:'folder-tree-caret folder-tree-caret-placeholder' }));
    const icon = el('span', { className:'folder-tree-icon folder-tree-icon-file' });
    icon.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 1.5 L10 1.5 L13 4.5 L13 14.5 L3 14.5 Z M10 1.5 L10 4.5 L13 4.5"/>' +
    '</svg>';
    row.appendChild(icon);
    row.appendChild(el('span', { className:'folder-tree-name', text: stripZipExt(entry.name) }));
    if(activePath === entry.path) li.classList.add('is-active');
    row.addEventListener('click', () => openFileEntry(entry));
  }
  li.appendChild(row);
  parentList.appendChild(li);
  if(entry.kind === 'dir' && entry.expanded){
    const sub = el('ul', { className:'folder-tree-sub' });
    entry.children.forEach(c => renderEntry(sub, c, depth + 1));
    li.appendChild(sub);
  }
}

function stripZipExt(name){ return name.replace(/\.zip$/i, ''); }
function escapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
