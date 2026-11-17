import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', { headless: true, executablePath: '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome', viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', error => errs.push(String(error).slice(0, 200)));
page.on('dialog', dialog => dialog.accept());
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Creative Studio' }).click({ timeout: 60000 });
await page.waitForTimeout(1400);
const cards = await page.locator('.cs-project-card').allTextContents();
const index = cards.findIndex(text => text.includes('考研市场中台开发'));
await page.locator('.cs-project-card').nth(index).click();
await page.waitForTimeout(2500);
const probe = await page.evaluate(() => ({
  steps: document.querySelectorAll('.cs-steps button').length,
  title: document.querySelector('.cs-project-title')?.textContent ?? null,
  main: (document.querySelector('main.creative-studio-root')?.innerText ?? '').slice(0, 300),
}));
console.log(JSON.stringify({ cards, index, probe, errs }));
await ctx.close();
