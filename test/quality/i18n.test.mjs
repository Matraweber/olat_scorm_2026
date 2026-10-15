// i18n bundles: no key defined twice in the same object (the later one
// silently replaces the earlier one, e.g. a new `help: {}` wiping the
// block help box texts), and German/English define the same keys.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../lib/setup.mjs';

const BUNDLES = {
  builder:  { de: 'builder/i18n/de.js', en: 'builder/i18n/en.js' },
  template: { de: 'builder/template/i18n/de.js', en: 'builder/template/i18n/en.js' }
};

// Duplicate keys per object scope. The bundles use one key per line with
// consistent indentation, so indentation identifies the scope.
const KEY = /^(\s*)(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$-]*))\s*:/;
function duplicateKeys(file){
  const out = [];
  const stack = [];
  readFileSync(path.join(ROOT, file), 'utf8').split('\n').forEach((line, i) => {
    const m = KEY.exec(line);
    if(!m) return;
    const ind = m[1].length;
    const key = m[2] || m[3] || m[4];
    while(stack.length && stack[stack.length - 1].ind > ind) stack.pop();
    if(!stack.length || stack[stack.length - 1].ind < ind) stack.push({ ind, seen: new Map() });
    const scope = stack[stack.length - 1];
    if(scope.seen.has(key)) out.push(file + ':' + (i + 1) + ' "' + key + '" (first in line ' + scope.seen.get(key) + ')');
    scope.seen.set(key, i + 1);
  });
  return out;
}

// Control characters in texts are almost always a lost backslash: a
// "\frac" written with one backslash becomes form feed + "rac" in JS.
function controlChars(obj, prefix, out){
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    const key = prefix ? prefix + '.' + k : k;
    if(v && typeof v === 'object') controlChars(v, key, out);
    // eslint-disable-next-line no-control-regex -- looking for exactly these
    else if(typeof v === 'string' && /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v)) out.push(key + ': ' + JSON.stringify(v.slice(0, 80)));
  });
  return out;
}

function flatten(obj, prefix, out){
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    const key = prefix ? prefix + '.' + k : k;
    if(v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.add(key);
  });
  return out;
}
async function loadBuilder(file){
  return (await import(pathToFileURL(path.join(ROOT, file)).href)).default;
}
function loadTemplate(file){
  const got = {};
  const window = { BlockUtils: { registerLocale(code, bundle){ got.bundle = bundle; } } };
  vm.runInNewContext(readFileSync(path.join(ROOT, file), 'utf8'), { window });
  return got.bundle;
}

for(const [kind, files] of Object.entries(BUNDLES)){
  test(kind + ' bundles: no duplicate keys', () => {
    assert.deepEqual([...duplicateKeys(files.de), ...duplicateKeys(files.en)], []);
  });
  test(kind + ' bundles: de and en define the same keys', async () => {
    const load = kind === 'builder' ? loadBuilder : loadTemplate;
    const de = flatten(await load(files.de), '', new Set());
    const en = flatten(await load(files.en), '', new Set());
    assert.ok(de.size > 100, 'bundle loaded');
    const missingEn = [...de].filter(k => !en.has(k)).sort();
    const missingDe = [...en].filter(k => !de.has(k)).sort();
    assert.deepEqual({ missingEn, missingDe }, { missingEn: [], missingDe: [] });
  });
  test(kind + ' bundles: no control characters (lost backslashes)', async () => {
    const load = kind === 'builder' ? loadBuilder : loadTemplate;
    const bad = [...controlChars(await load(files.de), 'de', []), ...controlChars(await load(files.en), 'en', [])];
    assert.deepEqual(bad, []);
  });
}
