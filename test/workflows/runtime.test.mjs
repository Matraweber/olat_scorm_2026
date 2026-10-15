// Exported SCORM page end to end (fake LMS): global variables, attempts /
// hint / worked solution, resume after reload, task pools, locale switch,
// final report to the LMS.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { openRuntime, reloadRuntime, assertNoErrors, closeAll, block, task, numeric } from '../lib/setup.mjs';

after(closeAll);

const VAR_A = [{ name: 'a', min: 2, max: 9, integer: true }];
// Inside the page: the cell of a block, its question value, check button.
const H = `
  window.__cell = id => document.querySelector('.canvas-block[data-block-id="' + id + '"]');
  window.__num = (id, re) => Number((window.__cell(id).innerText.match(re) || [])[1]);
  window.__check = (id, value) => {
    const c = window.__cell(id);
    if(value != null) c.querySelector('input').value = String(value);
    window.__btn(c, /Korrektur/).click();
  };
  window.__nav = i => document.querySelectorAll('#topNav .nav-link')[i].click();
`;
async function open(course){
  const page = await openRuntime(course);
  await page.addInitScript(H);
  await page.evaluate(H);
  return page;
}

test('global variables: shared value, local shadowing, regenerate resets tasks', async () => {
  const g = block('numeric-input', numeric('Gegeben F = {F}.', '2*F'));
  const mixed = block('numeric-input', numeric('F = {F}, a = {a}.', 'F + a', { variables: VAR_A }));
  const local = block('numeric-input', numeric('F = {F} lokal.', 'F', { variables: [{ name: 'F', min: 5000, max: 6000, integer: true }] }));
  const page = await open({
    globalVariables: [{ name: 'F', min: 1, max: 100000, integer: true }],
    tasks: [task('Kraft', [g]), task('Gemischt', [mixed]), task('Lokal', [local])]
  });
  const r1 = await page.evaluate(async ids => {
    const F = window.BlockUtils.globalVarValues().F;
    const out = { F, t1: window.__num(ids.g, /F = (\d+)/), btn: !!document.getElementById('globalRegenBtn') };
    window.__check(ids.g, 2 * F);
    await window.__sleep(50);
    out.scoreAfterCheck = window.ScormRuntime.totalScore().pts;
    window.__nav(1); await window.__sleep(100);
    out.t2 = window.__num(ids.mixed, /F = (\d+)/);
    window.__nav(2); await window.__sleep(100);
    out.t3 = window.__num(ids.local, /F = (\d+)/);
    window.__nav(0); await window.__sleep(100);
    document.getElementById('globalRegenBtn').click();
    await window.__sleep(100);
    out.dialog = document.querySelector('.scorm-dialog').innerText;
    window.__btn(document.querySelector('.scorm-dialog'), /Neu generieren/).click();
    await window.__sleep(200);
    out.F2 = window.BlockUtils.globalVarValues().F;
    out.t1After = window.__num(ids.g, /F = (\d+)/);
    out.scoreAfterRegen = window.ScormRuntime.totalScore().pts;
    return out;
  }, { g: g.id, mixed: mixed.id, local: local.id });
  assert.ok(r1.btn, 'header button present');
  assert.equal(r1.t1, r1.F);
  assert.equal(r1.t2, r1.F, 'same global value in another task');
  assert.ok(r1.t3 >= 5000, 'block variable wins over the global one');
  assert.equal(r1.scoreAfterCheck, 1);
  assert.match(r1.dialog, /Kraft/);
  assert.match(r1.dialog, /Gemischt/);
  assert.doesNotMatch(r1.dialog, /Lokal/, 'task with only a shadowing variable is not affected');
  assert.notEqual(r1.F2, r1.F);
  assert.equal(r1.t1After, r1.F2);
  assert.equal(r1.scoreAfterRegen, 0, 'affected task was reset');
  assertNoErrors(page);
});

test('global regenerate is locked after a check when configured', async () => {
  const g = block('numeric-input', numeric('F = {F}', 'F'));
  const page = await open({
    globalVariables: [{ name: 'F', min: 1, max: 9, integer: true }], globalRegenLockAfterCheck: true,
    tasks: [task('A', [g])]
  });
  const r = await page.evaluate(async id => {
    const btn = document.getElementById('globalRegenBtn');
    const before = btn.disabled;
    window.__check(id, 0);
    await window.__sleep(50);
    return { before, after: btn.disabled };
  }, g.id);
  assert.deepEqual(r, { before: false, after: true });
});

test('attempts, deduction, hint and worked solution', async () => {
  const b1 = block('numeric-input', numeric('a = {a}. Berechne 2a.', '2*a', { variables: VAR_A,
    attemptsLimit: true, maxAttempts: 2, attemptPenalty: 50,
    hintEnabled: true, hintText: 'Verdopple $a = {a}$.', hintAfter: 1, hintPenalty: 0.25 }));
  const b2 = block('numeric-input', numeric('a = {a}. Berechne 3a.', '3*a', { variables: VAR_A,
    attemptsLimit: true, maxAttempts: 2, solutionEnabled: true, solutionText: 'Lösung: 3 · {a}' }), { y: 440 });
  const page = await open({ tasks: [task('Versuche', [b1, b2])] });
  const r = await page.evaluate(async ids => {
    const bars = () => document.querySelectorAll('.block-help');
    const out = {};
    out.chipStart = bars()[0].querySelector('.block-help-attempts').textContent;
    out.hintHiddenStart = bars()[0].querySelectorAll('.block-help-btn')[0].hidden;
    window.__check(ids.b1, 999);
    await window.__sleep(50);
    out.chipAfterFail = bars()[0].querySelector('.block-help-attempts').textContent;
    bars()[0].querySelectorAll('.block-help-btn')[0].click();
    const panel = document.querySelector('.block-help-panel');
    out.confirm = panel.innerText;
    window.__btn(panel, /Anzeigen/).click();
    await window.__sleep(100);
    const a = window.__num(ids.b1, /a = (\d+)/);
    out.hintHasValue = panel.innerText.includes(String(a));
    out.hintKatex = panel.querySelectorAll('.katex').length;
    window.__check(ids.b1, 2 * a);
    await window.__sleep(50);
    out.score = window.ScormRuntime.totalScore().pts;
    out.b1Locked = window.__cell(ids.b1).querySelector('input').disabled;
    window.__check(ids.b2, 999); await window.__sleep(30);
    window.__check(ids.b2, 999); await window.__sleep(50);
    out.chipUsed = bars()[1].querySelector('.block-help-attempts').textContent;
    out.b2Locked = window.__cell(ids.b2).querySelector('input').disabled;
    out.solutionVisible = !bars()[1].querySelectorAll('.block-help-btn')[1].hidden;
    return out;
  }, { b1: b1.id, b2: b2.id });
  assert.equal(r.chipStart, 'Versuch 1 / 2');
  assert.equal(r.hintHiddenStart, true);
  assert.equal(r.chipAfterFail, 'Versuch 2 / 2');
  assert.match(r.confirm, /0.25 Punkt/);
  assert.ok(r.hintHasValue, 'hint shows the current value of a');
  assert.ok(r.hintKatex >= 1, 'hint math rendered');
  assert.equal(r.score, 0.25, '2nd attempt: 1 point × 50 % − 0.25 hint');
  assert.equal(r.b1Locked, true, 'all attempts used');
  assert.equal(r.chipUsed, 'Keine Versuche mehr');
  assert.equal(r.b2Locked, true);
  assert.equal(r.solutionVisible, true);
  assertNoErrors(page);
});

test('resume: answers, solved blocks, locks, pool selection, global values', async () => {
  const solved = block('numeric-input', numeric('a = {a}', '2*a', { variables: VAR_A }));
  const typed = block('numeric-input', numeric('a = {a}', '3*a', { variables: VAR_A }), { y: 440 });
  const choice = block('multiple-choice', { preset: 'custom', question: 'Welche?', multi: true, shuffle: false,
    choices: [{ text: 'A', correct: true }, { text: 'B' }, { text: 'C' }] });
  const pooled = n => task('Pool ' + n, [block('numeric-input', numeric('P' + n, 'F'))], { pool: 'p' });
  const page = await open({
    globalVariables: [{ name: 'F', min: 1, max: 100000, integer: true }],
    pools: [{ id: 'p', name: 'P', draw: 1 }],
    tasks: [task('Eins', [solved, typed]), task('Zwei', [choice]), pooled(1), pooled(2), pooled(3), task('Frei', [block('numeric-input', numeric('x', '1'))])]
  });
  const before = await page.evaluate(async ids => {
    const a = window.__num(ids.solved, /a = (\d+)/);
    window.__check(ids.solved, 2 * a);
    window.__cell(ids.typed).querySelector('input').value = '12345';
    window.__cell(ids.typed).querySelector('input').dispatchEvent(new Event('input', { bubbles: true }));
    window.__nav(1); await window.__sleep(100);
    window.__cell(ids.choice).querySelector('input').click();
    return { a, nav: [...document.querySelectorAll('#topNav .nav-link')].map(b => b.textContent),
      F: window.BlockUtils.globalVarValues().F, score: window.ScormRuntime.totalScore() };
  }, { solved: solved.id, typed: typed.id, choice: choice.id });
  assert.equal(before.nav.length, 4, 'pool draws 1 of 3 tasks');
  await reloadRuntime(page);
  await page.evaluate(H);
  const after = await page.evaluate(async ids => {
    const out = { nav: [...document.querySelectorAll('#topNav .nav-link')].map(b => b.textContent),
      F: window.BlockUtils.globalVarValues().F, score: window.ScormRuntime.totalScore() };
    // The resumed page is the one that was open (task 2).
    out.choice = [...window.__cell(ids.choice).querySelectorAll('input')].map(i => i.checked);
    window.__nav(0); await window.__sleep(150);
    out.solvedValue = window.__cell(ids.solved).querySelector('input').value;
    out.solvedText = window.__cell(ids.solved).innerText.includes('Bereits gelöst');
    out.a = window.__num(ids.solved, /a = (\d+)/);
    out.typed = window.__cell(ids.typed).querySelector('input').value;
    return out;
  }, { solved: solved.id, typed: typed.id, choice: choice.id });
  assert.deepEqual(after.nav, before.nav, 'same pool selection');
  assert.equal(after.F, before.F, 'same global values');
  assert.deepEqual(after.score, before.score);
  assert.deepEqual(after.choice, [true, false, false], 'ticked answer restored');
  assert.equal(after.a, before.a, 'same random values');
  assert.equal(Number(after.solvedValue), 2 * before.a, 'solved block shows its solution');
  assert.ok(after.solvedText);
  assert.equal(after.typed, '12345', 'typed answer restored');
  assertNoErrors(page);
});

test('locale switch keeps values and typed answers', async () => {
  const b = block('numeric-input', numeric({ __i18n: true, de: 'a = {a} (de)', en: 'a = {a} (en)' }, '2*a', { variables: VAR_A }));
  const page = await open({ tasks: [task('Eins', [b])] });
  const r = await page.evaluate(async id => {
    const a = window.__num(id, /a = (\d+)/);
    const inp = window.__cell(id).querySelector('input');
    inp.value = '77';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    window.__btn(document.getElementById('scormLangSwitcher'), /EN/).click();
    await window.__sleep(200);
    return { a, aAfter: window.__num(id, /a = (\d+)/), en: window.__cell(id).innerText.includes('(en)'),
      typed: window.__cell(id).querySelector('input').value };
  }, b.id);
  assert.equal(r.aAfter, r.a);
  assert.ok(r.en, 'content switched to English');
  assert.equal(r.typed, '77');
  assertNoErrors(page);
});

test('finishing reports score, status and time to the LMS', async () => {
  const b = block('numeric-input', numeric('a = {a}', 'a', { variables: VAR_A, maxPoints: 2 }));
  const page = await open({ passThreshold: 0.5, tasks: [task('Eins', [b])] });
  const lms = await page.evaluate(async id => {
    window.__check(id, window.__num(id, /a = (\d+)/));
    await window.__sleep(50);
    window.__btn(document.querySelector('.task-page-foot'), /beenden/i).click();
    await window.__sleep(100);
    return window.__lms.data;
  }, b.id);
  assert.equal(lms['cmi.core.score.raw'], '2.00');
  assert.equal(lms['cmi.core.score.max'], '2');
  assert.equal(lms['cmi.core.lesson_status'], 'passed');
  assert.match(lms['cmi.core.session_time'], /^\d{2,4}:\d{2}:\d{2}$/);
  assert.equal(lms['cmi.suspend_data'], '', 'no resume state after finishing');
  assertNoErrors(page);
});
