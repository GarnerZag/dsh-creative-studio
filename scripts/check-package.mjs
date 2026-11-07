import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Inspect npm's actual publish inventory without publishing or running lifecycle scripts.
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const [packed] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}));
assert.equal(packed.name, manifest.name);
assert.equal(packed.version, manifest.version);
const paths = new Set(packed.files.map(file => file.path));
function requireTarget(target) {
  assert.ok(target.startsWith('./'), `Non-local package target: ${target}`);
  const path = target.slice(2);
  if (path.includes('*')) {
    const [prefix, suffix] = path.split('*');
    assert.equal(path.split('*').length, 2, 'Only a single export wildcard is supported');
    assert.ok([...paths].some(item => item.startsWith(prefix) && item.endsWith(suffix)), `Empty export: ${target}`);
  } else assert.ok(paths.has(path), `Missing packed target: ${target}. Run npm run build first.`);
}
function visitExports(value) {
  if (typeof value === 'string') requireTarget(value);
  else for (const nested of Object.values(value)) visitExports(nested);
}
visitExports(manifest.exports);
requireTarget(manifest.dsh.bundle.patch);
for (const name of ['package.json', 'LICENSE', 'README.md', 'icon.svg']) {
  assert.ok(paths.has(name), `Missing distribution resource: ${name}`);
}
for (const path of paths) {
  assert.ok(!/(^|\/)(?:node_modules|\.git|\.env[^/]*|test-results|playwright-report|\.test-build)(\/|$)/.test(path), `Unexpected private/development file: ${path}`);
}
console.log(JSON.stringify({ name: packed.name, version: packed.version, files: paths.size, exportsPresent: true, published: false }));
