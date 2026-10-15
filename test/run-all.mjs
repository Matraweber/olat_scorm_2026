// test/run-all.mjs: finds every *.test.mjs under test/ and runs them with
// Node's built-in test runner, one file at a time (they share the server
// port). Arguments filter by path: `npm test -- blocks` runs test/blocks/*.
// Each file also runs on its own: `node test/blocks/cloze.test.mjs`.
import { readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKIP = new Set(['lib', 'visual', 'node_modules']);

function find(dir){
  const out = [];
  for(const name of readdirSync(dir).sort()){
    const p = path.join(dir, name);
    if(statSync(p).isDirectory()){ if(!SKIP.has(name)) out.push(...find(p)); }
    else if(name.endsWith('.test.mjs')) out.push(p);
  }
  return out;
}

const filters = process.argv.slice(2);
const files = find(TEST_DIR).filter(f => !filters.length || filters.some(x => f.replace(/\\/g, '/').includes(x)));
if(!files.length){
  console.error('No test files found' + (filters.length ? ' for: ' + filters.join(', ') : '') + '.');
  process.exit(1);
}
const res = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], { stdio: 'inherit' });
process.exit(res.status == null ? 1 : res.status);
