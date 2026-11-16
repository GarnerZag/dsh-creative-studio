// Preview-only build: bundles the client panel with mock data into standalone
// HTML pages so the rendered UI can be audited/screenshotted outside the host.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// 1. Extract the zh dictionary from src/client.ts (single source of truth for copy).
const clientSource = await readFile(join(root, 'src/client.ts'), 'utf8');
const match = clientSource.match(/zh:\s*\{([\s\S]*?)\n  \},\n  en:\s*\{/);
if (!match) throw new Error('Could not locate the zh dictionary in src/client.ts');
const dict = new Function(`return {${match[1]}}`)();
await writeFile(join(here, 'dict.json'), JSON.stringify(dict, null, 2));

// 2. Resolve TypeScript sources imported with .js specifiers (NodeNext style).
const tsResolve = {
  name: 'ts-resolve',
  setup(b) {
    b.onResolve({ filter: /^\.{1,2}\/.*\.js$/ }, args => {
      const base = resolve(args.resolveDir, args.path);
      for (const candidate of [base.replace(/\.js$/, '.tsx'), base.replace(/\.js$/, '.ts')]) {
        if (existsSync(candidate)) return { path: candidate };
      }
      return null;
    });
  },
};

await build({
  entryPoints: [join(here, 'entry.tsx')],
  outfile: join(here, 'bundle.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2022',
  jsx: 'automatic',
  loader: { '.json': 'json' },
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [tsResolve],
  logLevel: 'info',
});

// 3. Host-like shells. The panel inherits font/color from the host, so the
//    shell must look like the DSH web app for the audit to be meaningful.
const shell = (theme, screen, status) => `<!doctype html>
<html lang="zh-CN" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Creative Studio preview · ${theme} · ${screen}</title>
<style>
  :root { color-scheme: ${theme === 'dark' ? 'dark' : 'light'}; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-size: 14px; line-height: 1.5;
    background: ${theme === 'dark' ? '#111214' : '#ffffff'};
    color: ${theme === 'dark' ? '#e6e7e9' : '#1a1a1a'};
  }
  #root { min-height: 100vh; }
</style>
</head>
<body>
<div id="root"></div>
<script>window.__PREVIEW__ = { screen: ${JSON.stringify(screen)}, status: ${JSON.stringify(status)} };</script>
<script src="./bundle.js"></script>
</body>
</html>`;

await mkdir(here, { recursive: true });
for (const theme of ['light', 'dark']) {
  for (const screen of ['welcome', 'workspace']) {
    await writeFile(join(here, `${theme}-${screen}.html`), shell(theme, screen, 'connected'));
  }
}
await writeFile(join(here, 'light-error.html'), shell('light', 'welcome', 'error'));
console.log('Preview pages written to', here);
