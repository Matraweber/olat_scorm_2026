// math-toolbar-data.js: Data for the math-textarea field.
// MATH_CATS: 8 categories of LaTeX snippets.
// FORMULA_FN_BTNS: helper buttons for the formula-text field.
// Item shape: { s: display, t?: tooltip, i: insert-snippet, c?: cursor offset }
// Category labels and tooltips are exposed as getters so a language switch
// after module load is reflected the next time the toolbar is rendered.

import { t } from './i18n.js';

function cat(labelKey, items){
  return { get label(){ return t(labelKey); }, items };
}

function tip(tipKey, base){
  return { ...base, get t(){ return t(tipKey); } };
}

export const MATH_CATS = [
  cat('mathToolbar.categories.fractions', [
    tip('mathToolbar.tips.fraction', { s:'a/b', i:'\\frac{}{} ', c:6 }),
    { s:'½',    i:'\\frac{1}{2} ' }, { s:'⅓', i:'\\frac{1}{3} ' },
    { s:'¼',    i:'\\frac{1}{4} ' }, { s:'¾', i:'\\frac{3}{4} ' },
  ]),
  cat('mathToolbar.categories.roots', [
    tip('mathToolbar.tips.squareRoot', { s:'√',  i:'\\sqrt{} ',    c:6 }),
    tip('mathToolbar.tips.cubeRoot',   { s:'∛',  i:'\\sqrt[3]{} ', c:9 }),
    tip('mathToolbar.tips.nthRoot',    { s:'ⁿ√', i:'\\sqrt[]{} ',  c:6 }),
  ]),
  cat('mathToolbar.categories.exponents', [
    tip('mathToolbar.tips.superscript', { s:'xⁿ', i:'^{} ', c:2 }), { s:'x²', i:'^{2} ' },
    { s:'x³', i:'^{3} ' }, { s:'x⁻¹', i:'^{-1} ' },
    tip('mathToolbar.tips.subscript', { s:'xₙ', i:'_{} ', c:2 }), { s:'xᵢ', i:'_{i} ' },
  ]),
  cat('mathToolbar.categories.greek', [
    { s:'α', i:'\\alpha ' }, { s:'β', i:'\\beta ' }, { s:'γ', i:'\\gamma ' },
    { s:'δ', i:'\\delta ' }, { s:'ε', i:'\\varepsilon ' }, { s:'ζ', i:'\\zeta ' },
    { s:'η', i:'\\eta ' },   { s:'θ', i:'\\theta ' }, { s:'κ', i:'\\kappa ' },
    { s:'λ', i:'\\lambda ' },{ s:'μ', i:'\\mu ' },   { s:'ν', i:'\\nu ' },
    { s:'π', i:'\\pi ' },   { s:'ρ', i:'\\rho ' },  { s:'σ', i:'\\sigma ' },
    { s:'τ', i:'\\tau ' },  { s:'φ', i:'\\varphi ' },{ s:'ω', i:'\\omega ' },
    { s:'Γ', i:'\\Gamma ' },{ s:'Δ', i:'\\Delta ' },{ s:'Θ', i:'\\Theta ' },
    { s:'Λ', i:'\\Lambda ' },{ s:'Π', i:'\\Pi ' },  { s:'Σ', i:'\\Sigma ' },
    { s:'Φ', i:'\\Phi ' },  { s:'Ψ', i:'\\Psi ' }, { s:'Ω', i:'\\Omega ' },
  ]),
  cat('mathToolbar.categories.operators', [
    { s:'·', i:'\\cdot ' }, { s:'×', i:'\\times ' }, { s:'÷', i:'\\div ' },
    { s:'±', i:'\\pm ' },   { s:'∓', i:'\\mp ' },   { s:'≤', i:'\\leq ' },
    { s:'≥', i:'\\geq ' }, { s:'≠', i:'\\neq ' },   { s:'≈', i:'\\approx ' },
    { s:'∞', i:'\\infty ' },{ s:'∝', i:'\\propto ' },{ s:'∈', i:'\\in ' },
    { s:'∉', i:'\\notin ' },{ s:'⊂', i:'\\subset ' },{ s:'∩', i:'\\cap ' },
    { s:'∪', i:'\\cup ' },
  ]),
  cat('mathToolbar.categories.functions', [
    { s:'sin', i:'\\sin ' }, { s:'cos', i:'\\cos ' }, { s:'tan', i:'\\tan ' },
    { s:'arcsin', i:'\\arcsin ' }, { s:'arccos', i:'\\arccos ' }, { s:'arctan', i:'\\arctan ' },
    { s:'log', i:'\\log ' }, { s:'ln', i:'\\ln ' }, { s:'exp', i:'\\exp ' },
    tip('mathToolbar.tips.sum',      { s:'Σ',   i:'\\sum_{i=1}^{n} ' }),
    tip('mathToolbar.tips.product',  { s:'Π',   i:'\\prod_{i=1}^{n} ' }),
    tip('mathToolbar.tips.integral', { s:'∫',   i:'\\int_{a}^{b} ' }),
    { s:'lim', i:'\\lim_{x \\to \\infty} ' },
    tip('mathToolbar.tips.vector', { s:'vec', i:'\\vec{} ', c:5 }),
  ]),
  cat('mathToolbar.categories.sets', [
    { s:'ℝ', i:'\\mathbb{R} ' }, { s:'ℕ', i:'\\mathbb{N} ' },
    { s:'ℤ', i:'\\mathbb{Z} ' }, { s:'ℚ', i:'\\mathbb{Q} ' }, { s:'ℂ', i:'\\mathbb{C} ' },
    { s:'∀', i:'\\forall ' }, { s:'∃', i:'\\exists ' }, { s:'∄', i:'\\nexists ' },
  ]),
  cat('mathToolbar.categories.brackets', [
    tip('mathToolbar.tips.roundBrackets',  { s:'(…)', i:'\\left(  \\right) ',       c:7 }),
    tip('mathToolbar.tips.squareBrackets', { s:'[…]', i:'\\left[  \\right] ',       c:7 }),
    tip('mathToolbar.tips.absoluteValue',  { s:'|…|', i:'\\left|  \\right| ',       c:7 }),
    tip('mathToolbar.tips.curlyBrackets',  { s:'{…}', i:'\\left\\{  \\right\\} ',   c:8 }),
  ]),
];

export const FORMULA_FN_BTNS = [
  { s:'sqrt()',  i:'sqrt()',  c:5 }, { s:'abs()',   i:'abs()',   c:4 },
  { s:'sin()',   i:'sin()',   c:4 }, { s:'cos()',   i:'cos()',   c:4 },
  { s:'tan()',   i:'tan()',   c:4 },
  { s:'arcsin()', i:'arcsin()', c:7 }, { s:'arccos()', i:'arccos()', c:7 },
  { s:'arctan()', i:'arctan()', c:7 }, { s:'atan2(,)',i:'atan2(,)',c:6 },
  { s:'log()',   i:'log()',   c:4 }, { s:'ln()',    i:'log()',   c:4 },
  { s:'exp()',   i:'exp()',   c:4 }, { s:'floor()', i:'floor()', c:6 },
  { s:'ceil()',  i:'ceil()',  c:5 }, { s:'round()', i:'round()', c:6 },
  { s:'pow(,)',  i:'pow(,)',  c:4 }, { s:'min(,)',  i:'min(,)',  c:4 },
  { s:'max(,)',  i:'max(,)',  c:4 },
  { s:'pi',  i:'pi ',  c:null }, { s:'e',   i:'e ',   c:null },
  { s:'^',   i:'^',    c:null },
];
