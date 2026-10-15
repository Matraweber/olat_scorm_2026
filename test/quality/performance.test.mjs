// Time limits for the slow paths, so a change that makes them noticeably
// slower turns the suite red instead of needing a separate benchmark:
//   runtime start with many tasks + global variables ("Nur ganzzahlige
//   Lösungen" makes the start search for fitting values), global
//   regenerate, the worst case of whole-number conditions that no global
//   value can meet, builder rendering a task with many blocks, ZIP export
//   with images. Limits are several times the times measured on a normal
//   laptop (runtime start 0.5–1.2 s incl. cold script loading, regenerate
//   0.1–0.25 s, worst case 0.7 s, builder 0.05 s, export 0.35 s);
//   TEST_PERF_FACTOR=2 doubles them on slow machines. Measured times are
//   printed as test diagnostics (ℹ lines).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, openRuntime, assertNoErrors, closeAll, block, task, numeric } from '../lib/setup.mjs';

after(closeAll);

const FACTOR = Number(process.env.TEST_PERF_FACTOR) || 1;
const LIMITS = { runtimeStart: 4000, globalRegen: 1500, worstCaseStart: 5000, builderRender: 1500, zipExport: 5000 };
function within(t, name, ms){
  const limit = LIMITS[name] * FACTOR;
  t.diagnostic(name + ': ' + Math.round(ms) + ' ms (limit ' + limit + ' ms)');
  assert.ok(ms < limit, name + ' took ' + Math.round(ms) + ' ms, limit ' + limit + ' ms');
}

// 30 tasks with two blocks each, all using the global F with whole-number
// solutions; the global values must fit every block.
function bigCourse(){
  const tasks = [];
  for(let i = 1; i <= 30; i++){
    tasks.push(task('Aufgabe ' + i, [
      block('numeric-input', numeric('F = {F}, a = {a}. Berechne F / a.', 'F/a', {
        variables: [{ name: 'a', min: 2, max: 9, integer: true }], integerAnswers: true })),
      block('numeric-input', numeric('F = {F}. Berechne F/' + (i % 5 + 2) + '.', 'F/' + (i % 5 + 2), { integerAnswers: true }), { y: 440 })
    ]));
  }
  return { globalVariables: [{ name: 'F', min: 1, max: 1000, integer: true }], tasks };
}

test('runtime: start and global regenerate with 30 tasks', async t => {
  const page = await openRuntime(bigCourse());
  // performance.now() counts from the start of the navigation.
  within(t, 'runtimeStart', await page.evaluate(() => performance.now()));
  const regen = await page.evaluate(async () => {
    document.getElementById('globalRegenBtn').click();
    await window.__sleep(50);
    const t0 = performance.now();
    window.__btn(document.querySelector('.scorm-dialog'), /Neu generieren/).click();
    return performance.now() - t0;
  });
  within(t, 'globalRegen', regen);
  assertNoErrors(page);
});

// No global value can make F/a + 0.1 whole (a = 2…9): the start tries all
// candidate sets before giving up, which must stay quick.
test('runtime: start when no global value fits the whole-number condition', async t => {
  const tasks = [];
  for(let i = 1; i <= 5; i++){
    tasks.push(task('Unerfüllbar ' + i, [block('numeric-input', numeric('F = {F}, a = {a}', 'F/a + 0.1', {
      variables: [{ name: 'a', min: 2, max: 9, integer: true }], integerAnswers: true }))]));
  }
  const page = await openRuntime({ globalVariables: [{ name: 'F', min: 1, max: 1000, integer: true }], tasks });
  within(t, 'worstCaseStart', await page.evaluate(() => performance.now()));
});

test('builder: render a task with 60 blocks', async t => {
  const page = await openBuilder();
  const ms = await page.evaluate(async () => {
    const blocks = [];
    const types = ['numeric-input', 'multiple-choice', 'rich-text', 'table', 'cloze', 'composition'];
    for(let i = 0; i < 60; i++){
      const type = types[i % types.length];
      const def = window.Blocks.get(type);
      blocks.push({ id: 'p' + i, type, config: def.previewConfig ? def.previewConfig() : def.defaultConfig('de'),
        pos: { x: 20, y: 20 + i * 420, w: 900, h: 400 } });
    }
    window.state.course.tasks.push({ id: 'big', title: 'Groß', blocks });
    window.state.selected = { kind: 'task', idx: window.state.course.tasks.length - 1 };
    const t0 = performance.now();
    window.scormBuilderRender();
    while(document.querySelectorAll('.canvas-block-card').length < 60) await window.__sleep(10);
    return performance.now() - t0;
  });
  within(t, 'builderRender', ms);
  assertNoErrors(page);
});

test('builder: ZIP export of 30 tasks with images', async t => {
  const page = await openBuilder();
  await page.evaluate(async () => {
    // Photo-like JPEGs (~0.5 MB each), as they would be after shrinking.
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 1200;
    const x = c.getContext('2d');
    const imgs = [];
    for(let k = 0; k < 8; k++){
      const d = x.createImageData(1600, 1200);
      for(let i = 0; i < d.data.length; i += 4){ d.data[i] = (i * (k + 3)) % 255; d.data[i + 1] = (i >> 5) % 255; d.data[i + 2] = (i * 11) % 255; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0);
      imgs.push(c.toDataURL('image/jpeg', 0.85));
    }
    const s = window.state;
    s.course.courseTitle = 'Export';
    for(let i = 0; i < 30; i++){
      const blocks = [{ id: 'n' + i, type: 'numeric-input', pos: { x: 20, y: 20, w: 600, h: 380 },
        config: { preset: 'custom', questionTemplate: 'a = {a}', variables: [{ name: 'a', min: 1, max: 9, integer: true }], formula: 'a', maxPoints: 1 } }];
      if(i < imgs.length) blocks.push({ id: 'i' + i, type: 'image', pos: { x: 20, y: 420, w: 600, h: 400 }, config: { src: imgs[i], alt: 'Bild' } });
      s.course.tasks.push({ id: 'e' + i, title: 'Aufgabe ' + (i + 1), blocks });
    }
    // Without the save dialog the export falls back to a browser download.
    delete window.showSaveFilePicker;
    window.showSaveFilePicker = undefined;
  });
  const t0 = Date.now();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: LIMITS.zipExport * FACTOR + 5000 }),
    page.evaluate(() => import('/builder/js/io.js').then(m => m.downloadZip()))
  ]);
  within(t, 'zipExport', Date.now() - t0);
  assert.match(download.suggestedFilename(), /\.zip$/);
  assertNoErrors(page);
});
