// Numeric input: grading, several answer fields, whole-number solutions,
// "X" for impossible tasks, solution refill (resume), formula checks.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, assertNoErrors, closeAll, numeric } from '../lib/setup.mjs';

let page;
before(async () => { page = await openBuilder(); });
after(closeAll);

const VARS = [{ name: 'a', min: 2, max: 9, integer: true }];

test('correct answer gets full points, wrong gets 0', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('numeric-input', cfg);
    const inp = m.host.querySelector('input');
    const a = m.inst.getVars().a;
    inp.value = '999';
    window.__btn(m.host, /Korrektur/).click();
    const wrong = m.last();
    inp.value = String(2 * a);
    window.__btn(m.host, /Korrektur/).click();
    return { init: m.init, wrong, right: m.last(), question: m.host.innerText.includes('a = ' + a) };
  }, numeric('a = {a}. Berechne 2a.', '2*a', { variables: VARS, maxPoints: 2 }));
  assert.equal(r.init, 2);
  assert.equal(r.wrong.points, 0);
  assert.equal(r.right.points, 2);
  assert.ok(r.question, 'question shows the drawn value');
});

test('several answer fields: partial credit per field', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('numeric-input', cfg);
    const a = m.inst.getVars().a;
    const inputs = m.host.querySelectorAll('input');
    inputs[0].value = String(a + 1);
    inputs[1].value = '0';
    window.__btn(m.host, /Korrektur/).click();
    return { fields: inputs.length, score: m.last() };
  }, numeric('a = {a}', 'a + 1', { variables: VARS, extraAnswers: [{ formula: 'a - 1', prefix: 'y =' }], maxPoints: 2 }));
  assert.equal(r.fields, 2);
  assert.equal(r.score.points, 1);
});

test('"Nur ganzzahlige Lösungen" only draws whole results', async () => {
  const r = await page.evaluate(async cfg => {
    let whole = 0;
    for(let i = 0; i < 30; i++){
      const v = window.__mount('numeric-input', cfg).inst.getVars();
      if(Number.isInteger(v.a / v.b)) whole++;
    }
    return whole;
  }, numeric('{a}/{b}', 'a/b', { variables: [{ name: 'a', min: 1, max: 40, integer: true }, { name: 'b', min: 2, max: 9, integer: true }], integerAnswers: true }));
  assert.equal(r, 30);
});

test('impossible task: "X" is the correct answer', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('numeric-input', cfg);
    m.host.querySelector('input').value = 'x';
    window.__btn(m.host, /Korrektur/).click();
    return m.last();
  }, numeric('sqrt(-a)', 'sqrt(-a)', { variables: VARS, allowImpossible: true }));
  assert.equal(r.points, 1);
});

test('showSolution fills in the expected value (resume of a solved block)', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('numeric-input', cfg);
    m.inst.showSolution();
    const val = m.host.querySelector('input').value;
    const text = m.host.innerText.includes('Bereits gelöst');
    window.__btn(m.host, /Korrektur/).click();
    return { val, a: m.inst.getVars().a, score: m.last(), text };
  }, numeric('a = {a}', '3*a', { variables: VARS }));
  assert.equal(Number(r.val), 3 * r.a);
  assert.equal(r.score.points, 1, 'the filled-in solution grades as correct');
  assert.ok(r.text);
});

test('validate: warns about formulas that always fail', async () => {
  const w = await page.evaluate(cfg => window.Blocks.get('numeric-input').validate(cfg),
    numeric('{a}', 'a/0', { variables: VARS }));
  assert.ok(w.some(x => /IMMER|ungültig/i.test(x)), JSON.stringify(w));
  assertNoErrors(page);
});
