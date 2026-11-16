// Preview-only: screenshots + runtime checks for the standalone preview pages.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'shots');
await mkdir(out, { recursive: true });

const base = process.env.PREVIEW_BASE ?? 'http://127.0.0.1:8765';
const targets = [
  ['light', 'welcome', 1440], ['light', 'workspace', 1440],
  ['dark', 'welcome', 1440], ['dark', 'workspace', 1440],
  ['light', 'welcome', 390], ['light', 'workspace', 390],
];

const browser = await chromium.launch({ headless: true });
const report = [];
for (const [theme, screen, width] of targets) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  await page.goto(`${base}/${theme}-${screen}.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(screen === 'workspace' ? 900 : 300);
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector('main.creative-studio-root');
    const buttons = [...document.querySelectorAll('button')];
    return {
      scrollWidth: root.scrollWidth, clientWidth: root.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      mainWidth: main ? Math.round(main.getBoundingClientRect().width) : null,
      buttonCount: buttons.length,
      unlabeledButtons: buttons.filter(b => !(b.textContent ?? '').trim() && !b.getAttribute('aria-label')).length,
      hasWorkbench: !!document.querySelector('.cs-projects article'),
      stageColumns: getComputedStyle(document.querySelector('.cs-flow') ?? document.body).gridTemplateColumns.split(' ').length,
    };
  });
  const file = join(out, `${theme}-${screen}-${width}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.push({ theme, screen, width, ...metrics, problems, file });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
