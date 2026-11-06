import { build } from 'esbuild';
import { WorkspaceTypertGenerator, writePackageArtifacts } from '@deepseek-ai/dsh-typert-generator';
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
// The official compiler discovers packages under a workspace. Stage this one
// package for compilation only; no hand-written Remote descriptors or Host edits.
const workspace = await mkdtemp(join(tmpdir(), 'creative-studio-typert-'));
const packageRoot = join(workspace, 'packages/studio');
await mkdir(packageRoot, { recursive: true });
await symlink(join(root, 'node_modules'), join(workspace, 'node_modules'), 'dir');
for (const file of ['package.json', 'tsconfig.json', 'tsconfig.host.json']) await cp(join(root, file), join(packageRoot, file));
await cp(join(root, 'src'), join(packageRoot, 'src'), { recursive: true });
// This compiler version recognizes decorator symbols by registered package
// ownership. Register an unchanged copy of the published protocol declarations.
const protocolRoot = join(workspace, 'packages/protocol');
await mkdir(protocolRoot, { recursive: true });
await cp(join(root, 'node_modules/@deepseek-ai/dsh-typert-protocol/lib/types'), join(protocolRoot, 'declarations'), { recursive: true });
const protocolManifest = JSON.parse(await readFile(join(root, 'node_modules/@deepseek-ai/dsh-typert-protocol/package.json'), 'utf8'));
await writeFile(join(protocolRoot, 'package.json'), JSON.stringify({ ...protocolManifest, exports: { '.': './declarations/index.d.ts', './types': './declarations/types.d.ts', './remote-info': './declarations/remote-info.d.ts' } }));
const stagedConfig = JSON.parse(await readFile(join(packageRoot, 'tsconfig.json'), 'utf8'));
stagedConfig.compilerOptions.paths = { '@deepseek-ai/dsh-typert-protocol': ['../protocol/declarations/index.d.ts'] };
await writeFile(join(packageRoot, 'tsconfig.json'), JSON.stringify(stagedConfig));
await writeFile(join(protocolRoot, 'tsconfig.host.json'), JSON.stringify({ compilerOptions: stagedConfig.compilerOptions, include: ['declarations/**/*.d.ts'] }));
await writeFile(join(workspace, 'tsconfig.host.json'), JSON.stringify({ compilerOptions: { ...stagedConfig.compilerOptions, paths: { '@deepseek-ai/dsh-typert-protocol': ['./packages/protocol/declarations/index.d.ts'] } }, files: [], references: [{ path: './packages/studio/tsconfig.host.json' }, { path: './packages/protocol/tsconfig.host.json' }] }));
const generator = new WorkspaceTypertGenerator(workspace);
const artifacts = generator.generate(['@garnerzag/dsh-creative-studio'], ['host']);
if (!artifacts.length) throw new Error('Official compiler produced no Host contribution');
writePackageArtifacts(root, artifacts);
await build({ entryPoints: [join(root, 'src/index.ts')], outfile: join(root, 'lib/index.js'), bundle: true, platform: 'node', format: 'esm', target: 'node24', packages: 'external' });
const declarations = spawnSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(root, 'tsconfig.host.json')], { stdio: 'inherit', cwd: root });
if (declarations.status !== 0) process.exit(declarations.status ?? 1);
await build({
  entryPoints: [join(root, 'src/client.ts')], outfile: join(root, 'lib/client.js'),
  bundle: true, platform: 'browser', format: 'cjs', target: 'es2022', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: 'window.__ModuleLoader__.load({id:"@garnerzag/dsh-creative-studio",factory(require){const module={exports:{}};const exports=module.exports;' },
  footer: { js: 'return module.exports;}});' },
});
console.log('Built Host, official Typert artifacts, and lazy Client factory.');
