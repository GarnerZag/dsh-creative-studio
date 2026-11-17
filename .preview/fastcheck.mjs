import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', { headless: true, executablePath: '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome', viewport: { width: 1440, height: 950 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', error => errs.push(String(error).slice(0, 160)));
page.on('dialog', dialog => dialog.accept());
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Creative Studio' }).click({ timeout: 60000 });
await page.waitForTimeout(1400);
const cards = await page.locator('.cs-project-card').allTextContents();
const index = cards.findIndex(text => text.includes('考研市场中台开发'));
if (index < 0) { console.log(JSON.stringify({ cards, error: 'no project' })); await ctx.close(); process.exit(0); }
await page.locator('.cs-project-card').nth(index).click();
await page.waitForTimeout(1600);
const ideaBadge = await page.locator('.cs-steps button').first().innerText();
await page.locator('.cs-steps button').nth(1).click();
await page.waitForTimeout(1200);
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
  page.getByRole('button', { name: 'Export as text' }).first().click().catch(() => undefined),
]);
let head = null;
if (download) {
  const { readFileSync } = await import('node:fs');
  const text = readFileSync(await download.path(), 'utf8');
  head = text.split('\n').slice(0, 4);
}
console.log(JSON.stringify({ ideaBadge: ideaBadge.replace(/\n/g, ' | '), exported: Boolean(download), head, errs }));
await ctx.close();
