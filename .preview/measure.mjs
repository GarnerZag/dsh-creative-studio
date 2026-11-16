import { chromium } from 'playwright-core';
const width = Number(process.argv[2] || 2560);
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', {
  executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',
  headless:true, viewport:{width, height:1200},
});
const page = ctx.pages()[0] ?? await ctx.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(5000);
const nav = page.locator('text=Creative Studio');
if (await nav.count()) await nav.first().click();
await page.waitForTimeout(3000);
const btn = page.getByRole('button', { name: 'Studio verification 20261107' });
if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(5000); }
const info = await page.evaluate(() => {
  const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { w: Math.round(r.width), x: Math.round(r.x), display: s.display, maxWidth: s.maxWidth, align: s.alignItems, flex: s.flex }; };
  return {
    viewport: window.innerWidth,
    body: pick('body'),
    main: pick('main'),
    root: pick('[data-testid="creative-studio"]'),
    projects: pick('.cs-projects'),
    workbench: pick('.cs-workbench'),
    grid: pick('.cs-grid'),
    parentOfRoot: (() => { const el = document.querySelector('[data-testid="creative-studio"]'); const p = el && el.parentElement; if (!p) return null; const s = getComputedStyle(p); const r = p.getBoundingClientRect(); return { tag: p.tagName, cls: p.className, w: Math.round(r.width), x: Math.round(r.x), display: s.display, flex: s.flex, align: s.alignItems }; })(),
  };
});
await page.screenshot({ path:`.preview/shots/measure-${width}.png` });
console.log(JSON.stringify(info, null, 2));
await ctx.close();
