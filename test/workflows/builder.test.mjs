// Builder flows: block dialog + own templates, course validation, the
// composition label editor, image shrinking, "Höhe für SCORM anpassen".
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, openRuntime, assertNoErrors, closeAll, task } from '../lib/setup.mjs';

after(closeAll);

// Adds a task and opens it; blocks keep their ids.
const ADD_TASK = (t) => {
  window.state.course.tasks.push(t);
  window.state.selected = { kind: 'task', idx: window.state.course.tasks.length - 1 };
  window.scormBuilderRender();
};

test('block dialog: "Eigene Vorlagen" always listed; task templates insert their blocks', async () => {
  const page = await openBuilder();
  const r = await page.evaluate(async (addTask) => {
    eval('(' + addTask + ')')({ id: 't1', title: 'T', blocks: [{ id: 'b0', type: 'rich-text', config: { html: '<p>x</p>' }, pos: { x: 20, y: 20, w: 600, h: 200 } }] });
    await window.__sleep(400);
    const openDialog = async () => {
      window.__btn(document, /^\+ Block$/).click();
      await window.__sleep(200);
      const cat = [...document.querySelectorAll('#blockCatNav .block-cat-btn')].find(b => /Eigene/.test(b.textContent));
      cat.click();
      await window.__sleep(100);
      return document.getElementById('blockTypeList');
    };
    const out = {};
    let list = await openDialog();
    out.emptyHint = (list.querySelector('.block-picker-empty') || {}).textContent || '';
    document.getElementById('blockTypeModal').classList.add('hidden');
    // A saved task template with two blocks.
    window.state.userTemplates.push({ id: 'utpl_x', label: 'Schnittlast', task: { title: 'S', blocks: [
      { type: 'rich-text', config: { html: '<p>1</p>' }, pos: { x: 20, y: 20, w: 400, h: 100 } },
      { type: 'rich-text', config: { html: '<p>2</p>' }, pos: { x: 20, y: 140, w: 400, h: 100 } }] } });
    list = await openDialog();
    out.rows = [...list.querySelectorAll('.block-type-row')].map(r => r.innerText.replace(/\s+/g, ' '));
    list.querySelector('.block-type-row').click();
    await window.__sleep(300);
    const blocks = window.state.course.tasks[0].blocks;
    out.count = blocks.length;
    out.tops = blocks.map(b => b.pos.y);
    return out;
  }, ADD_TASK.toString());
  assert.match(r.emptyHint, /★/);
  assert.equal(r.rows.length, 1);
  assert.match(r.rows[0], /Schnittlast.*Aufgaben-Vorlage/);
  assert.equal(r.count, 3);
  assert.ok(r.tops[1] >= 220 && r.tops[2] - r.tops[1] === 120, 'inserted below, layout kept: ' + r.tops);
  assertNoErrors(page);
});

test('course validation: global variables and pools', async () => {
  const page = await openBuilder();
  const r = await page.evaluate(async () => {
    const c = window.state.course;
    c.globalVariables = [{ name: 'F', min: 1, max: 9 }, { name: 'k', min: 5, max: 2 }, { name: '2x' }, { name: 'F' }];
    c.pools = [{ id: 'p1', name: 'Statik', draw: 3 }, { id: 'p2', name: 'Leer', draw: 1 }];
    c.tasks.push({ id: 't', title: 'T', pool: 'p1', blocks: [{ id: 'b', type: 'numeric-input', pos: { x: 0, y: 0, w: 600, h: 300 },
      config: { preset: 'custom', questionTemplate: '{F}', formula: 'F', variables: [{ name: 'k', min: 1, max: 2 }] } }] });
    const m = await import('/builder/js/tasks.js');
    const v = m.validateCourse(c);
    return { course: v.courseIssues.map(i => i.message), blocks: v.issues.map(i => i.message) };
  });
  const all = r.course.join('\n');
  assert.match(all, /„k“: Min \(5\) ist größer als Max \(2\)/);
  assert.match(all, /„2x“: Name darf nur/);
  assert.match(all, /„F“ ist mehrfach definiert/);
  assert.match(all, /„k“ wird in keiner Aufgabe verwendet/);
  assert.match(all, /„Statik“: Es sollen 3 Aufgaben gezogen werden, er enthält aber nur 1/);
  assert.match(all, /„Leer“ enthält keine Aufgaben/);
  assert.ok(r.blocks.some(x => /„k“ überdeckt/.test(x)), 'shadowing warning on the block');
  assertNoErrors(page);
});

test('composition label editor: multi-line text with live preview', async () => {
  const page = await openBuilder();
  const r = await page.evaluate(async (addTask) => {
    eval('(' + addTask + ')')({ id: 'tc', title: 'K', blocks: [{ id: 'bc', type: 'composition', pos: { x: 20, y: 20, w: 900, h: 520 },
      config: { gradingMode: 'fillblanks', canvasWidth: 700, canvasHeight: 360, variables: [{ name: 'a', min: 2, max: 8, integer: true }],
        shapes: [{ type: 'label', x: 60, y: 80, text: 'Kraft a = {a} N<br>Lösung: {1}', fontSize: 20, formulas: { 1: { formula: '2*a' } } }] } }] });
    await window.__sleep(700);
    document.querySelector('svg.comp-canvas [data-shape-idx="0"]').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await window.__sleep(300);
    const ta = document.querySelector('.comp-inline-edit textarea');
    const out = { editValue: ta.value };
    ta.value += '\n$' + String.fromCharCode(92) + 'frac{a}{2}$ <b>fett</b>';
    ta.dispatchEvent(new Event('input'));
    await window.__sleep(300);
    const pv = document.querySelector('.comp-inline-preview');
    out.preview = pv.innerText;
    out.katex = pv.querySelectorAll('.katex').length;
    out.slots = pv.querySelectorAll('[data-cslot]').length;
    out.bold = pv.querySelectorAll('b').length;
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await window.__sleep(300);
    out.saved = window.state.course.tasks[window.state.course.tasks.length - 1].blocks[0].config.shapes[0].text;
    return out;
  }, ADD_TASK.toString());
  assert.equal(r.editValue, 'Kraft a = {a} N\nLösung: {1}', 'line breaks edited as real lines');
  assert.match(r.preview, /Kraft a = \d N/, 'variable shown with a sample value');
  assert.equal(r.katex, 1);
  assert.equal(r.slots, 1, 'answer field as a box, {a} in the formula is not one');
  assert.equal(r.bold, 1);
  assert.match(r.saved, /<br>Lösung: \{1\}<br>\$/, 'saved with <br>');
  assertNoErrors(page);
});

test('image upload: big photos are shrunk to 2000 px', async () => {
  const page = await openBuilder();
  const r = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 4000; c.height = 3000;
    const x = c.getContext('2d');
    const img = x.createImageData(4000, 3000);
    for(let i = 0; i < img.data.length; i += 4){ img.data[i] = (i * 7) % 255; img.data[i + 1] = (i * 13) % 255; img.data[i + 2] = (i / 4) % 255; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    const big = c.toDataURL('image/jpeg', 0.95);
    const small = await window.ScormBuilderShrinkImage(big);
    const kept = await window.ScormBuilderShrinkImage(big, { keepOriginal: true });
    const size = await new Promise(res => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.src = small; });
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg"/>');
    return { ratio: small.length / big.length, size, keptSame: kept === big, svgSame: (await window.ScormBuilderShrinkImage(svg)) === svg };
  });
  assert.deepEqual(r.size, [2000, 1500]);
  assert.ok(r.ratio < 0.3, 'much smaller: ' + r.ratio);
  assert.ok(r.keptSame, '"Original behalten" keeps the upload');
  assert.ok(r.svgSame, 'SVG untouched');
  assertNoErrors(page);
});

test('"Höhe für SCORM anpassen": the fitted block does not scroll in the runtime', async () => {
  const page = await openBuilder();
  const blocks = await page.evaluate(async (addTask) => {
    const types = ['multiple-choice', 'numeric-input', 'rich-text', 'cloze', 'sort-list'];
    const blocks = types.map((type, i) => {
      const def = window.Blocks.get(type);
      const config = type === 'rich-text'
        ? { html: '<h3>Titel</h3>' + '<p>Ein langer Absatz, der mehrere Zeilen füllt und umbrechen muss.</p>'.repeat(6) }
        : (def.previewConfig ? def.previewConfig() : def.defaultConfig('de'));
      return { id: 'f' + i, type, config, pos: { x: 20, y: 20 + i * 140, w: i % 2 ? 600 : 800, h: 120 } };
    });
    eval('(' + addTask + ')')({ id: 'tf', title: 'Fit', blocks });
    await window.__sleep(800);
    for(const b of blocks){
      const card = document.querySelector('.canvas-block-card[data-block-id="' + b.id + '"]');
      window.__btn(card, /^⇳$/).click();
      for(let i = 0; i < 80 && b.pos.h === 120; i++) await window.__sleep(100);
    }
    // Stack them so they don't overlap in the runtime.
    let y = 20;
    blocks.forEach(b => { b.pos.y = y; y += b.pos.h + 20; });
    return JSON.parse(JSON.stringify(blocks));
  }, ADD_TASK.toString());
  assert.ok(blocks.every(b => b.pos.h > 120), 'every block grew: ' + blocks.map(b => b.pos.h));
  const rt = await openRuntime({ tasks: [task('Fit', blocks)] });
  await rt.waitForTimeout(800);
  const scrolling = await rt.evaluate(() => [...document.querySelectorAll('.canvas-block')]
    .filter(c => c.scrollHeight > c.clientHeight + 1).map(c => c.dataset.blockId + ' ' + c.scrollHeight + '>' + c.clientHeight));
  assert.deepEqual(scrolling, []);
});

test('welcome page: KaTeX chapter renders every example and links the command list', async () => {
  const page = await openBuilder();
  await page.waitForSelector('.welcome-katex-table');
  const r = await page.evaluate(() => {
    const ch = document.querySelector('.welcome-katex-table').closest('section');
    const rows = [...ch.querySelectorAll('.welcome-katex-table tr')].slice(1);
    const tex = row => (row.querySelector('annotation') || {}).textContent || '';
    return {
      rows: rows.length,
      rendered: rows.filter(row => row.querySelector('.welcome-katex-out .katex')).length,
      errors: ch.querySelectorAll('.katex-error').length,
      fraction: tex(rows[0]),
      variables: tex(rows.find(row => /A = \{a\}/.test(row.querySelector('code').textContent))),
      link: ch.querySelector('a[href="https://katex.org/docs/supported"]') ? ch.querySelector('a[href="https://katex.org/docs/supported"]').target : null,
      inRail: [...document.querySelectorAll('.welcome-rail-text')].some(e => /KaTeX/.test(e.textContent))
    };
  });
  assert.equal(r.rendered, r.rows);
  assert.ok(r.rows >= 8);
  assert.equal(r.errors, 0);
  assert.match(r.fraction, /frac\{a\}\{b\}/, 'letters stay letters outside the variables example');
  assert.match(r.variables, /3.*4/, 'variables example shows sample values');
  assert.equal(r.link, '_blank');
  assert.ok(r.inRail, 'chapter listed in the chapter rail');
  assertNoErrors(page);
});

test('welcome page: every chapter has its texts (no raw i18n keys)', async () => {
  const page = await openBuilder();
  await page.waitForSelector('.welcome-katex-table');
  const r = await page.evaluate(() => ({
    rail: [...document.querySelectorAll('.welcome-rail-text')].map(e => e.textContent),
    raw: (document.getElementById('formPane').innerText.match(/\b(welcome|blockHelp)\.[\w.]+/g) || []),
    examples: document.querySelectorAll('.welcome-example').length
  }));
  for(const title of ['Zufallsvariablen', 'Bewertung und Punkte', 'Kopfdaten: Standard für alle Aufgaben', 'Aufgabenpools',
    'Vorlagen', 'Speichern und Sichern', 'In OLAT: Was Lernende erleben', 'Formeln mit KaTeX', 'Tastaturkürzel']){
    assert.ok(r.rail.includes(title), 'chapter missing: ' + title);
  }
  assert.deepEqual(r.raw, []);
  assert.equal(r.examples, 3);
  assertNoErrors(page);
});

test('block help: every block has a help box; graded blocks add the shared note', async () => {
  const page = await openBuilder();
  const rows = await page.evaluate(async () => {
    const out = [];
    for(const def of window.Blocks.all()){
      window.state.course.tasks = [{ id: 't', title: 'T', _uiSelectedBlockIds: ['b'],
        blocks: [{ id: 'b', type: def.id, config: def.defaultConfig ? def.defaultConfig('de') : {}, pos: { x: 20, y: 20, w: 600, h: 300 } }] }];
      window.state.selected = { kind: 'task', idx: 0 };
      window.scormBuilderRender();
      await window.__sleep(80);
      const box = document.querySelector('.block-help');
      const text = box ? box.innerText : '';
      out.push({ id: def.id, graded: !!def.graded, hasBox: !!box, steps: box ? box.querySelectorAll('ol li').length : 0,
        common: !!(box && box.querySelector('.block-help-common')), raw: /blockHelp\./.test(text) });
    }
    return out;
  });
  const problems = rows.filter(r => !r.hasBox || r.steps === 0 || r.raw || r.common !== r.graded)
    .map(r => r.id + (r.hasBox ? '' : ' no box') + (r.steps ? '' : ' no steps') + (r.raw ? ' raw keys' : '') + (r.common !== r.graded ? ' shared note ' + r.common : ''));
  assert.deepEqual(problems, []);
  assertNoErrors(page);
});
