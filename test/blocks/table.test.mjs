// Table block: true/false statements, free table (grid) grading and
// whole-number draws, value table with whole-number answer columns.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, assertNoErrors, closeAll } from '../lib/setup.mjs';

let page;
before(async () => { page = await openBuilder(); });
after(closeAll);

const VARS = [{ name: 'a', min: 1, max: 40, integer: true }, { name: 'b', min: 2, max: 9, integer: true }];
const grid = extra => Object.assign({ preset: 'custom', mode: 'grid', maxPoints: 1, variables: VARS,
  grid: { rows: [{ id: 'r1' }], cols: [{ id: 'c1', kind: 'numeric' }], cells: { 'r1|c1': { formula: 'a/b' } } } }, extra);

test('true/false: per-statement points, wrong answers deduct', async () => {
  const r = await page.evaluate(async () => {
    const cfg = { preset: 'custom', mode: 'truefalse', maxPoints: 2,
      statements: [{ text: 'A', correct: 'true' }, { text: 'B', correct: 'false' }] };
    const run = (picks, extra) => {
      const m = window.__mount('table', Object.assign({}, cfg, extra || {}));
      const rows = m.host.querySelectorAll('tbody tr');
      picks.forEach((p, i) => rows[i].querySelector('input[value="' + p + '"]').click());
      window.__btn(m.host, /Korrektur/).click();
      return m.last().points;
    };
    return { allRight: run(['true', 'false']), oneWrong: run(['true', 'true']), oneWrongPenalty: run(['true', 'true'], { penalizeWrong: true }) };
  });
  assert.deepEqual(r, { allRight: 2, oneWrong: 1, oneWrongPenalty: 0 });
});

test('free table: correct number cell gets full points', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('table', cfg);
    const v = m.inst.getVars();
    m.host.querySelector('.grid-table input').value = String(v.a / v.b);
    window.__btn(m.host, /Korrektur/).click();
    return m.last();
  }, grid());
  assert.equal(r.points, 1);
});

test('free table: "Nur ganzzahlige Lösungen" + showSolution', async () => {
  const r = await page.evaluate(async cfg => {
    let whole = 0;
    for(let i = 0; i < 25; i++){
      const v = window.__mount('table', cfg).inst.getVars();
      if(Number.isInteger(v.a / v.b)) whole++;
    }
    const m = window.__mount('table', cfg);
    m.inst.showSolution();
    window.__btn(m.host, /Korrektur/).click();
    return { whole, solvedScore: m.last().points };
  }, grid({ integerAnswers: true }));
  assert.equal(r.whole, 25);
  assert.equal(r.solvedScore, 1);
});

test('value table: whole-number answer columns per row', async () => {
  // Each row ends with exactly one whole a/b result (earlier non-whole
  // draws of the same row are discarded).
  const ok = await page.evaluate(async () => {
    const U = window.BlockUtils;
    const orig = U.safeMathExpr;
    let log = [];
    U.safeMathExpr = function(){ const r = orig.apply(this, arguments); log.push(r); return r; };
    let ok = 0;
    try {
      for(let i = 0; i < 20; i++){
        log = [];
        window.__mount('table', { preset: 'custom', mode: 'values', integerAnswers: true, rowCount: 4,
          variables: [{ name: 'a', min: 1, max: 40, integer: true }, { name: 'b', min: 2, max: 9, integer: true }],
          columns: [{ key: 'q', type: 'answer', label: 'q', formula: 'a/b' }] });
        if(log.filter(r => Number.isInteger(r)).length === 4 && Number.isInteger(log[log.length - 1])) ok++;
      }
    } finally { U.safeMathExpr = orig; }
    return ok;
  });
  assert.equal(ok, 20);
  assertNoErrors(page);
});
