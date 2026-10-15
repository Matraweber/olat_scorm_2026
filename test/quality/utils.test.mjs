// BlockUtils helpers shared by all blocks: formula evaluation, LaTeX ->
// formula, variable display, global variables.
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, assertNoErrors, closeAll } from '../lib/setup.mjs';

let page;
before(async () => { page = await openBuilder(); });
after(closeAll);
const run = fn => page.evaluate(fn);

test('safeMathExpr: variables, constants, degree trig', async () => {
  const r = await run(() => {
    const U = window.BlockUtils;
    return {
      // A variable named like a constant (e, pi) must win over the constant.
      eAsVariable: U.safeMathExpr('a/e', { a: 6, e: 3 }),
      eConstant: Math.round(U.safeMathExpr('e', {}) * 1000) / 1000,
      sinDeg: U.safeMathExpr(U.applyAngleUnit('sin(30)', 'deg'), {}),
      sinRad: U.safeMathExpr(U.applyAngleUnit('sin(pi/6)', 'rad'), {}),
      arcsinDeg: U.safeMathExpr(U.applyAngleUnit('arcsin(0.5)', 'deg'), {}),
      power: U.safeMathExpr('a^2 + b^2', { a: 3, b: 4 }),
      invalid: U.safeMathExpr('sqrt(-1)', {})
    };
  });
  assert.equal(r.eAsVariable, 2);
  assert.equal(r.eConstant, 2.718);
  assert.ok(Math.abs(r.sinDeg - 0.5) < 1e-9);
  assert.ok(Math.abs(r.sinRad - 0.5) < 1e-9);
  assert.ok(Math.abs(r.arcsinDeg - 30) < 1e-9);
  assert.equal(r.power, 25);
  assert.ok(!Number.isFinite(r.invalid), 'sqrt(-1) is not a finite number');
});

test('latexToAscii: nested fractions with variables', async () => {
  const r = await run(() => {
    const U = window.BlockUtils;
    const bs = String.fromCharCode(92);
    const ev = (tex, vars) => U.safeMathExpr(U.latexToAscii(tex), vars);
    // {a} placeholders stay braces here; numeric-input's deriveFormula
    // turns the leftover {x} into (x) afterwards.
    const unwrap = s => s.replace(/\{([^{}]*)\}/g, '($1)');
    return {
      frac: U.safeMathExpr(unwrap(U.latexToAscii(bs + 'frac{{a}}{{b}}')), { a: 6, b: 3 }),
      dfrac: ev(bs + 'dfrac{a}{b}', { a: 6, b: 3 }),
      nested: ev(bs + 'frac{' + bs + 'frac{a}{b}}{2}', { a: 6, b: 3 }),
      sqrt: ev(bs + 'sqrt{a^2+b^2}', { a: 3, b: 4 })
    };
  });
  assert.deepEqual(r, { frac: 2, dfrac: 2, nested: 1, sqrt: 5 });
});

test('fillMathTemplate + formatVarValue', async () => {
  const r = await run(() => {
    const U = window.BlockUtils;
    return {
      inMath: U.fillMathTemplate('Seite $a = {a}$', { a: 3 }),
      plain: U.fillMathTemplate('a = {a}, b = {b}', { a: 3, b: 0.5 }),
      negative: U.fillMathTemplate('$x ' + String.fromCharCode(92) + 'cdot {a}$', { a: -2 }),
      unknown: U.fillMathTemplate('{z}', { a: 1 }),
      fraction: U.formatVarValue(0.75, { display: 'fraction', decimals: 2 }),
      decimal: U.formatVarValue(0.75, { display: 'decimal', decimals: 2 }),
      autoHalf: U.formatVarValue(0.5, { display: 'auto', decimals: 2 }),
      rounded: U.formatVarValue(1.23456, { display: 'decimal', decimals: 2 })
    };
  });
  assert.equal(r.inMath, 'Seite $a = {3}$');
  assert.equal(r.plain, 'a = 3, b = 1/2');
  assert.match(r.negative, /\(-2\)/);
  assert.equal(r.unknown, '{z}');
  assert.equal(r.fraction, '3/4');
  assert.equal(r.decimal, '0.75');
  assert.equal(r.autoHalf, '1/2');
  assert.equal(r.rounded, '1.23');
});

test('global variables: usage detection, shadowing, merge', async () => {
  const r = await run(() => {
    const U = window.BlockUtils;
    const defs = [{ name: 'F', min: 1, max: 9, integer: true }, { name: 'k', min: 0, max: 1 }];
    U.setGlobalVarDefs(defs, {});
    U.setGlobalVarValues({ F: 5, k: 0.5 });
    const out = {
      inText: U.globalVarsUsedBy({ questionTemplate: 'F = {F}' }),
      inFormula: U.globalVarsUsedBy({ formula: 'F*2 + k' }),
      inNestedFormula: U.globalVarsUsedBy({ extraAnswers: [{ formula: 'F' }] }),
      notInPlainText: U.globalVarsUsedBy({ questionTemplate: 'Force F' }),
      shadowed: U.globalVarsUsedBy({ formula: 'F', variables: [{ name: 'F' }] }),
      latexCommand: U.globalVarsUsedBy({ formula: String.fromCharCode(92) + 'k' }),
      merged: U.withGlobalVars({ a: 1, F: 7 }, [{ name: 'F' }]),
      formats: U.varFormats([], {})
    };
    U.setGlobalVarDefs([], {});
    U.setGlobalVarValues({});
    return out;
  });
  assert.deepEqual(r.inText, ['F']);
  assert.deepEqual(r.inFormula, ['F', 'k']);
  assert.deepEqual(r.inNestedFormula, ['F']);
  assert.deepEqual(r.notInPlainText, []);
  assert.deepEqual(r.shadowed, []);
  assert.deepEqual(r.latexCommand, []);
  assert.deepEqual(r.merged, { k: 0.5, a: 1, F: 7 });
  assert.deepEqual(Object.keys(r.formats).sort(), ['F', 'k']);
});

test('isWholeNumber and penalty helpers', async () => {
  const r = await run(() => {
    const U = window.BlockUtils;
    return { whole: U.isWholeNumber(3), almost: U.isWholeNumber(2.9999999999), frac: U.isWholeNumber(2.5), nan: U.isWholeNumber(NaN) };
  });
  assert.deepEqual(r, { whole: true, almost: true, frac: false, nan: false });
  assertNoErrors(page);
});
