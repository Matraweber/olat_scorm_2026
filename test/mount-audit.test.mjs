// Smoke test: every registered block type mounts (runtime) and renders its
// builder preview without throwing and without console errors.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { openBuilder, assertNoErrors, closeAll } from './lib/setup.mjs';

after(closeAll);

test('every block type mounts and previews without errors', async () => {
  const page = await openBuilder();
  const result = await page.evaluate(async () => {
    const out = { types: [], failures: [] };
    for(const def of window.Blocks.all()){
      out.types.push(def.id);
      const cfg = typeof def.previewConfig === 'function' ? def.previewConfig()
        : (typeof def.defaultConfig === 'function' ? def.defaultConfig('de') : {});
      try { window.__mount(def.id, cfg || {}); }
      catch(e){ out.failures.push(def.id + ' mount: ' + e.message); }
      if(typeof def.preview === 'function'){
        try { def.preview(document.createElement('div'), cfg || {}); }
        catch(e){ out.failures.push(def.id + ' preview: ' + e.message); }
      }
      if(typeof def.validate === 'function'){
        try { def.validate(cfg || {}); }
        catch(e){ out.failures.push(def.id + ' validate: ' + e.message); }
      }
    }
    await window.__sleep(300);
    return out;
  });
  assert.ok(result.types.length >= 25, 'all blocks registered (' + result.types.length + ')');
  assert.deepEqual(result.failures, []);
  assertNoErrors(page);
});
