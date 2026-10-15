// ESLint (flat config). Three kinds of code:
//   builder/js, builder/i18n   ES modules in the builder page
//   builder/template           classic scripts (IIFEs) of the SCORM runtime
//   test                       Node scripts; page.evaluate callbacks run in
//                              the browser, hence browser globals too
// Vendor bundles in builder/lib are not linted.
import js from '@eslint/js';
import globals from 'globals';

const shared = {
  // Globals the runtime scripts share through window.
  Blocks: 'readonly', BlockUtils: 'readonly', BlockIcons: 'readonly',
  Scorm12: 'readonly', ScormRuntime: 'readonly',
  katex: 'readonly', renderMathInElement: 'readonly', JSZip: 'readonly'
};
const rules = {
  ...js.configs.recommended.rules,
  // Deliberate in this code base: `catch {}` around optional browser APIs.
  'no-empty': ['error', { allowEmptyCatch: true }],
  // '<\/script>' in strings is deliberate (inline HTML must not close early).
  'no-useless-escape': 'off',
  // Style hints, not bugs: shown as warnings, `npm run lint` stays green.
  'no-useless-assignment': 'warn',
  'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }]
};

export default [
  { ignores: ['builder/lib/**', 'node_modules/**', 'test-results/**', 'test/visual/**'] },
  {
    files: ['builder/js/**/*.js', 'builder/i18n/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...shared } },
    rules
  },
  {
    files: ['builder/template/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, ...shared } },
    rules
  },
  {
    files: ['test/**/*.mjs', '*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser, ...shared } },
    rules
  }
];
