// Composition (fill-in-the-blanks): formula slots with variables,
// whole-number draws, solution refill, global-variable acceptance.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, assertNoErrors, closeAll } from '../lib/setup.mjs';

let page;
before(async () => { page = await openBuilder(); });
after(closeAll);

const comp = extra => Object.assign({
  gradingMode: 'fillblanks', canvasWidth: 600, canvasHeight: 300, maxPoints: 1,
  variables: [{ name: 'a', min: 1, max: 40, integer: true }, { name: 'b', min: 2, max: 9, integer: true }],
  shapes: [{ type: 'label', x: 40, y: 60, text: 'q = {1}', fontSize: 20, formulas: { 1: { formula: 'a/b' } } }]
}, extra);

test('slot with a formula: correct value gets full points', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('composition', cfg, { width: 700 });
    const v = m.inst.getVars();
    const inp = m.host.querySelector('.comp-blank-input');
    inp.value = String(Math.round(v.a / v.b * 1000) / 1000);
    window.__btn(m.host, /Korrektur/).click();
    return m.last();
  }, comp());
  assert.equal(r.points, 1);
});

test('"Nur ganzzahlige Lösungen" draws whole slot results', async () => {
  const whole = await page.evaluate(async cfg => {
    let n = 0;
    for(let i = 0; i < 25; i++){
      const v = window.__mount('composition', cfg, { width: 700 }).inst.getVars();
      if(Number.isInteger(v.a / v.b)) n++;
    }
    return n;
  }, comp({ integerAnswers: true }));
  assert.equal(whole, 25);
});

test('showSolution fills the slots and grades as correct', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('composition', cfg, { width: 700 });
    m.inst.showSolution();
    return { value: m.host.querySelector('.comp-blank-input').value, text: m.host.innerText.includes('Bereits gelöst') };
  }, comp({ integerAnswers: true }));
  assert.match(r.value, /^\d+$/);
  assert.ok(r.text);
});

test('acceptsGlobals: whole-number check with global values', async () => {
  const r = await page.evaluate(async () => {
    const def = window.Blocks.get('composition');
    const cfg = { gradingMode: 'fillblanks', integerAnswers: true, variables: [],
      shapes: [{ type: 'label', text: '{1}', formulas: { 1: { formula: 'F/7' } } }] };
    return { divisible: def.acceptsGlobals(cfg, { F: 14 }), notDivisible: def.acceptsGlobals(cfg, { F: 15 }),
      withoutSwitch: def.acceptsGlobals(Object.assign({}, cfg, { integerAnswers: false }), { F: 15 }) };
  });
  assert.deepEqual(r, { divisible: true, notDivisible: false, withoutSwitch: true });
  assertNoErrors(page);
});
