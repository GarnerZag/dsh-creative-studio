import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';
const compile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.test.json'], { stdio: 'inherit' });
if (compile.status !== 0) process.exit(compile.status ?? 1);
const requested = process.argv.slice(2).filter(a => !a.startsWith('--'));
const files = requested.length ? requested.map(f => `.test-build/${f.replace(/\.ts$/, '.js')}`) : [...globSync('.test-build/test/**/*.test.js')];
if (!files.length) throw new Error('No tests selected');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
