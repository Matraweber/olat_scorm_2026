// Multiple choice: single/multi grading, partial credit, deductions,
// limit on the number of selectable answers.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, assertNoErrors, closeAll } from '../lib/setup.mjs';

let page;
before(async () => { page = await openBuilder(); });
after(closeAll);

const mc = extra => Object.assign({ preset: 'custom', question: 'Welche?', shuffle: false, maxPoints: 2,
  choices: [{ text: 'A', correct: true }, { text: 'B', correct: true }, { text: 'C' }, { text: 'D' }] }, extra);

// Tick the given answers (indices), press check, return the last score.
async function answer(cfg, ticks){
  return page.evaluate(async ({ cfg, ticks }) => {
    const m = window.__mount('multiple-choice', cfg);
    const inputs = m.host.querySelectorAll('input');
    ticks.forEach(i => inputs[i].click());
    window.__btn(m.host, /Korrektur/).click();
    return m.last() || null;
  }, { cfg, ticks });
}

test('single choice: right and wrong', async () => {
  const cfg = mc({ choices: [{ text: 'A', correct: true }, { text: 'B' }] });
  assert.equal((await answer(cfg, [0])).points, 2);
  assert.equal((await answer(cfg, [1])).points, 0);
});

test('multi: all correct = full, partial credit, wrong tick deducts', async () => {
  assert.equal((await answer(mc({ multi: true }), [0, 1])).points, 2);
  assert.equal((await answer(mc({ multi: true }), [0])).points, 1);
  // One right (+1) and one wrong (-1 partial point by default) = 0.
  assert.equal((await answer(mc({ multi: true }), [0, 2])).points, 0);
  // Custom deduction of 0.5 per wrong tick.
  assert.equal((await answer(mc({ multi: true, penaltyPoints: 0.5 }), [0, 2])).points, 0.5);
  assert.equal((await answer(mc({ multi: true, penalizeWrong: false }), [0, 2])).points, 1);
});

test('selection limit: further answers locked at the maximum', async () => {
  const r = await page.evaluate(async cfg => {
    const m = window.__mount('multiple-choice', cfg);
    const inputs = [...m.host.querySelectorAll('input')];
    const state = () => inputs.map(i => (i.checked ? 'x' : '-') + (i.disabled ? 'D' : '')).join(' ');
    inputs[0].click(); inputs[1].click();
    const full = state();
    inputs[2].click();
    const blocked = state();
    inputs[0].click();
    const freed = state();
    return { full, blocked, freed, hint: m.host.querySelector('.choice-limit-hint').textContent };
  }, mc({ multi: true, limitSelections: true, maxSelections: 2 }));
  assert.equal(r.full, 'x x -D -D');
  assert.equal(r.blocked, 'x x -D -D');
  assert.equal(r.freed, '- x - -');
  assert.match(r.hint, /1 von 2/);
});

test('validate: limit below the number of correct answers', async () => {
  const w = await page.evaluate(cfg => window.Blocks.get('multiple-choice').validate(cfg),
    mc({ multi: true, limitSelections: true, maxSelections: 1 }));
  assert.ok(w.some(x => /nur 1 Antworten/.test(x)), JSON.stringify(w));
  assertNoErrors(page);
});
