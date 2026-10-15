// test/lib/setup.mjs: shared helpers for the browser tests.
//
//   startServer()        serve.py on TEST_PORT (default 8766); reused if already up
//   openBuilder()        fresh browser context with the builder loaded
//   openRuntime(course)  a SCORM page built from template/index.html like the
//                        ZIP export, with a fake SCORM 1.2 LMS that keeps its
//                        data in localStorage (so page.reload() resumes)
//   closeAll()           browser + server down (register with after())
//
// Pages collect uncaught errors and console errors in page.errors; tests
// call assertNoErrors(page) at the end. Every page gets a fresh browser
// context, so localStorage never leaks between tests.
// Browser: installed Edge (channel msedge), else Chrome; override with
// TEST_BROWSER=chrome|msedge|chromium. Nothing is downloaded.
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PORT = Number(process.env.TEST_PORT) || 8766;
export const BASE = `http://127.0.0.1:${PORT}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- Server ---------------------------------------------------------------
let server = null;
// node:http instead of fetch: undici asserts when serve.py closes the
// connection while a body is left unread.
function serverUp(){
  return new Promise(resolve => {
    const req = http.get(BASE + '/builder/index.html', res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}
// The real interpreter, not the Windows "py" launcher: killing the launcher
// would leave python.exe running on the port.
function pythonExecutable(){
  const tries = process.platform === 'win32'
    ? [['py', ['-3', '-c', 'import sys;print(sys.executable)']], ['python', ['-c', 'import sys;print(sys.executable)']]]
    : [['python3', ['-c', 'import sys;print(sys.executable)']], ['python', ['-c', 'import sys;print(sys.executable)']]];
  for(const [cmd, args] of tries){
    try { return execFileSync(cmd, args, { encoding: 'utf8' }).trim(); } catch {}
  }
  throw new Error('Python 3 not found (needed for serve.py).');
}
export async function startServer(){
  if(await serverUp()) return;
  server = spawn(pythonExecutable(), ['serve.py', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  for(let i = 0; i < 100; i++){
    if(await serverUp()) return;
    await sleep(100);
  }
  throw new Error('serve.py did not start on port ' + PORT);
}

// ---- Browser --------------------------------------------------------------
let browser = null;
async function launchBrowser(){
  if(browser) return browser;
  const channels = process.env.TEST_BROWSER ? [process.env.TEST_BROWSER] : ['msedge', 'chrome'];
  let lastErr = null;
  for(const channel of channels){
    try {
      browser = await chromium.launch(channel === 'chromium' ? { headless: true } : { channel, headless: true });
      return browser;
    } catch(e){ lastErr = e; }
  }
  throw new Error('No Edge/Chrome found (set TEST_BROWSER=msedge|chrome). ' + (lastErr && lastErr.message));
}
export async function newPage(){
  const b = await launchBrowser();
  const context = await b.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if(m.type() !== 'error') return;
    const url = (m.location() && m.location().url) || '';
    if(/favicon/.test(url) || /favicon/.test(m.text())) return;
    page.errors.push('console: ' + m.text() + (url ? ' (' + url + ')' : ''));
  });
  return page;
}
export function assertNoErrors(page){
  assert.deepEqual(page.errors, [], 'errors in the browser console');
}
export async function closeAll(){
  if(browser){ await browser.close().catch(() => {}); browser = null; }
  if(server){ server.kill(); server = null; }
}

// ---- Builder --------------------------------------------------------------
// Test harness inside the page:
//   __mount(type, config, opts) -> { host, inst, scores, init } mounts a block
//     like the runtime does, with an API that records initScore/reportScore
//   __btn(root, regex)  first button whose text matches
//   __sleep(ms)
const HARNESS = `
  window.__sleep = ms => new Promise(r => setTimeout(r, ms));
  window.__btn = (root, re) => [...root.querySelectorAll('button')].find(b => re.test(b.textContent));
  window.__mountN = 0;
  window.__mount = (type, config, opts) => {
    opts = opts || {};
    const host = document.createElement('div');
    host.className = 'test-host';
    host.style.cssText = 'position:relative; width:' + (opts.width || 600) + 'px;';
    document.body.appendChild(host);
    const rec = { host, scores: [], init: null };
    const api = {
      utils: window.BlockUtils,
      blockId: 'test_' + (++window.__mountN),
      regenDefaults: opts.regenDefaults || {},
      initScore(max){ rec.init = max; },
      reportScore(points, max){ rec.scores.push({ points, max }); }
    };
    rec.inst = window.Blocks.get(type).mount(host, JSON.parse(JSON.stringify(config)), api) || {};
    if(window.BlockUtils.renderMath) window.BlockUtils.renderMath(host);
    rec.last = () => rec.scores[rec.scores.length - 1];
    return rec;
  };
`;
export async function openBuilder(){
  await startServer();
  const page = await newPage();
  await page.addInitScript(HARNESS);
  await page.goto(BASE + '/builder/index.html');
  await page.waitForFunction(() => window.state && window.Blocks && window.BlockUtils && window.scormBuilderRender
    && typeof window.renderMathInElement === 'function');
  return page;
}

// ---- Runtime (exported SCORM page) -------------------------------------------
// Block scripts in the order the export packs them (BLOCK_FILES in canvas.js).
function blockFiles(){
  const src = readFileSync(path.join(ROOT, 'builder/js/canvas.js'), 'utf8');
  const m = /export const BLOCK_FILES = \{([\s\S]*?)\n\};/.exec(src);
  if(!m) throw new Error('BLOCK_FILES not found in canvas.js');
  return [...m[1].matchAll(/'([\w-]+\.js)'/g)].map(x => 'blocks/' + x[1]);
}
const FAKE_LMS = `
  (function(){
    const KEY = 'fake-lms';
    let data = {};
    try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){}
    window.__lms = { data, commits: 0, finished: false };
    window.API = {
      LMSInitialize(){ return 'true'; },
      LMSFinish(){ window.__lms.finished = true; return 'true'; },
      LMSGetValue(k){
        if(k === 'cmi.core.entry') return data['cmi.suspend_data'] ? 'resume' : 'ab-initio';
        return data[k] == null ? '' : String(data[k]);
      },
      LMSSetValue(k, v){ data[k] = String(v); return 'true'; },
      LMSCommit(){ window.__lms.commits++; localStorage.setItem(KEY, JSON.stringify(data)); return 'true'; },
      LMSGetLastError(){ return '0'; }, LMSGetErrorString(){ return ''; }, LMSGetDiagnostic(){ return ''; }
    };
  })();
`;
export function runtimeHtml(course, theme){
  const tpl = readFileSync(path.join(ROOT, 'builder/template/index.html'), 'utf8');
  const cfg = Object.assign({ courseTitle: 'Test', locales: ['de', 'en'], defaultLocale: 'de' }, course);
  const data = '<script>' + FAKE_LMS + 'window.__SCORM_THEME__=' + JSON.stringify(theme || {}) +
    ';window.__SCORM_TASKS__=' + JSON.stringify(cfg) + ';<\/script>';
  return tpl
    // Relative template paths resolve against builder/template/; KaTeX is
    // copied into the ZIP from builder/lib/katex/.
    .replace('<head>', '<head><base href="/builder/template/">')
    .replace(/(["'])katex\//g, '$1/builder/lib/katex/')
    .replace('<!-- BLOCK_SCRIPTS -->', blockFiles().map(f => '<script src="' + f + '"></script>').join('\n'))
    .replace('<!-- I18N_SCRIPTS -->', cfg.locales.map(l => '<script src="i18n/' + l + '.js"></script>').join('\n'))
    .replace('<!-- DATA_SCRIPT -->', data);
}
// course: tasks.json content (tasks, pools, globalVariables, …). Reloading
// the returned page resumes the attempt through the fake LMS.
export async function openRuntime(course, theme){
  await startServer();
  const page = await newPage();
  await page.addInitScript(HARNESS);
  const url = BASE + '/__test__/runtime.html';
  await page.route(url, route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: runtimeHtml(course, theme) }));
  await page.goto(url);
  await waitForRuntime(page);
  return page;
}
export async function waitForRuntime(page){
  await page.waitForFunction(() => window.ScormRuntime && document.querySelector('#topNav .nav-link')
    && document.querySelector('#taskContainer .canvas-block'));
}
// Reload and wait until the resumed page is rendered (saves are debounced
// by 1.5 s, so give pending saves time first).
export async function reloadRuntime(page){
  await sleep(1800);
  await page.reload();
  await waitForRuntime(page);
}

// ---- Course builders --------------------------------------------------------
let blockSeq = 0;
export function block(type, config, pos){
  return { id: 'b' + (++blockSeq), type, config, pos: Object.assign({ x: 20, y: 20, w: 600, h: 400 }, pos || {}) };
}
export function task(title, blocks, extra){
  return Object.assign({ id: 't_' + title.replace(/\W+/g, '_'), title, blocks }, extra || {});
}
export function numeric(questionTemplate, formula, extra){
  return Object.assign({ preset: 'custom', blockTitle: '', questionTemplate, variables: [], formula,
    tolerance: 0.01, maxPoints: 1 }, extra || {});
}
