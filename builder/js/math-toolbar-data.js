// math-toolbar-data.js: Data for the math-textarea field.
// MATH_CATS: 8 categories of LaTeX snippets.
// FORMULA_FN_BTNS: helper buttons for the formula-text field.
// Item shape: { s: display, t?: tooltip, i: insert-snippet, c?: cursor offset }

export const MATH_CATS = [
  { label:'Brüche', items:[
    { s:'a/b',  t:'Bruch',         i:'\\frac{}{} ', c:6 },
    { s:'½',    i:'\\frac{1}{2} ' }, { s:'⅓', i:'\\frac{1}{3} ' },
    { s:'¼',    i:'\\frac{1}{4} ' }, { s:'¾', i:'\\frac{3}{4} ' },
  ]},
  { label:'Wurzeln', items:[
    { s:'√',  t:'Quadratwurzel', i:'\\sqrt{} ',     c:6 },
    { s:'∛',  t:'Kubikwurzel',   i:'\\sqrt[3]{} ',  c:9 },
    { s:'ⁿ√', t:'n-te Wurzel',   i:'\\sqrt[]{} ',   c:6 },
  ]},
  { label:'Potenzen', items:[
    { s:'xⁿ', t:'Hochstellen', i:'^{} ', c:2 }, { s:'x²', i:'^{2} ' },
    { s:'x³', i:'^{3} ' }, { s:'x⁻¹', i:'^{-1} ' },
    { s:'xₙ', t:'Tiefstellen', i:'_{} ', c:2 }, { s:'xᵢ', i:'_{i} ' },
  ]},
  { label:'Griechisch', items:[
    { s:'α', i:'\\alpha ' }, { s:'β', i:'\\beta ' }, { s:'γ', i:'\\gamma ' },
    { s:'δ', i:'\\delta ' }, { s:'ε', i:'\\varepsilon ' }, { s:'ζ', i:'\\zeta ' },
    { s:'η', i:'\\eta ' },   { s:'θ', i:'\\theta ' }, { s:'κ', i:'\\kappa ' },
    { s:'λ', i:'\\lambda ' },{ s:'μ', i:'\\mu ' },   { s:'ν', i:'\\nu ' },
    { s:'π', i:'\\pi ' },   { s:'ρ', i:'\\rho ' },  { s:'σ', i:'\\sigma ' },
    { s:'τ', i:'\\tau ' },  { s:'φ', i:'\\varphi ' },{ s:'ω', i:'\\omega ' },
    { s:'Γ', i:'\\Gamma ' },{ s:'Δ', i:'\\Delta ' },{ s:'Θ', i:'\\Theta ' },
    { s:'Λ', i:'\\Lambda ' },{ s:'Π', i:'\\Pi ' },  { s:'Σ', i:'\\Sigma ' },
    { s:'Φ', i:'\\Phi ' },  { s:'Ψ', i:'\\Psi ' }, { s:'Ω', i:'\\Omega ' },
  ]},
  { label:'Operatoren', items:[
    { s:'·', i:'\\cdot ' }, { s:'×', i:'\\times ' }, { s:'÷', i:'\\div ' },
    { s:'±', i:'\\pm ' },   { s:'∓', i:'\\mp ' },   { s:'≤', i:'\\leq ' },
    { s:'≥', i:'\\geq ' }, { s:'≠', i:'\\neq ' },   { s:'≈', i:'\\approx ' },
    { s:'∞', i:'\\infty ' },{ s:'∝', i:'\\propto ' },{ s:'∈', i:'\\in ' },
    { s:'∉', i:'\\notin ' },{ s:'⊂', i:'\\subset ' },{ s:'∩', i:'\\cap ' },
    { s:'∪', i:'\\cup ' },
  ]},
  { label:'Funktionen', items:[
    { s:'sin', i:'\\sin ' }, { s:'cos', i:'\\cos ' }, { s:'tan', i:'\\tan ' },
    { s:'arcsin', i:'\\arcsin ' }, { s:'arccos', i:'\\arccos ' }, { s:'arctan', i:'\\arctan ' },
    { s:'log', i:'\\log ' }, { s:'ln', i:'\\ln ' }, { s:'exp', i:'\\exp ' },
    { s:'Σ', t:'Summe',    i:'\\sum_{i=1}^{n} ' },
    { s:'Π', t:'Produkt',  i:'\\prod_{i=1}^{n} ' },
    { s:'∫', t:'Integral', i:'\\int_{a}^{b} ' },
    { s:'lim', i:'\\lim_{x \\to \\infty} ' },
    { s:'vec', t:'Vektor', i:'\\vec{} ', c:5 },
  ]},
  { label:'Mengen', items:[
    { s:'ℝ', i:'\\mathbb{R} ' }, { s:'ℕ', i:'\\mathbb{N} ' },
    { s:'ℤ', i:'\\mathbb{Z} ' }, { s:'ℚ', i:'\\mathbb{Q} ' }, { s:'ℂ', i:'\\mathbb{C} ' },
    { s:'∀', i:'\\forall ' }, { s:'∃', i:'\\exists ' }, { s:'∄', i:'\\nexists ' },
  ]},
  { label:'Klammern', items:[
    { s:'(…)', t:'runde Klammern',       i:'\\left(  \\right) ', c:7 },
    { s:'[…]', t:'eckige Klammern',       i:'\\left[  \\right] ', c:7 },
    { s:'|…|', t:'Betrag',                i:'\\left|  \\right| ', c:7 },
    { s:'{…}', t:'geschweifte Klammern',  i:'\\left\\{  \\right\\} ', c:8 },
  ]},
];

export const FORMULA_FN_BTNS = [
  { s:'sqrt()',  i:'sqrt()',  c:5 }, { s:'abs()',   i:'abs()',   c:4 },
  { s:'sin()',   i:'sin()',   c:4 }, { s:'cos()',   i:'cos()',   c:4 },
  { s:'tan()',   i:'tan()',   c:4 }, { s:'atan2(,)',i:'atan2(,)',c:6 },
  { s:'log()',   i:'log()',   c:4 }, { s:'ln()',    i:'log()',   c:4 },
  { s:'exp()',   i:'exp()',   c:4 }, { s:'floor()', i:'floor()', c:6 },
  { s:'ceil()',  i:'ceil()',  c:5 }, { s:'round()', i:'round()', c:6 },
  { s:'pow(,)',  i:'pow(,)',  c:4 }, { s:'min(,)',  i:'min(,)',  c:4 },
  { s:'max(,)',  i:'max(,)',  c:4 },
  { s:'pi',  i:'pi ',  c:null }, { s:'e',   i:'e ',   c:null },
  { s:'^',   i:'^',    c:null },
];
