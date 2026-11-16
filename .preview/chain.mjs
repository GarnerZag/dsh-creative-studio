import { chromium } from 'playwright-core';
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', {
  executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',
  headless:true, viewport:{width:2560, height:1200},
});
const page = ctx.pages()[0] ?? await ctx.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(5000);
const nav = page.locator('text=Creative Studio');
if (await nav.count()) await nav.first().click();
await page.waitForTimeout(3000);
const btn = page.getByRole('button', { name: 'Studio verification 20261107' });
if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(5000); }
const chain = await page.evaluate(() => {
  const out = [];
  let el = document.querySelector('.cs-workbench');
  while (el && out.length < 8) {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    out.push({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className : '', testid: el.getAttribute('data-testid'), w: Math.round(r.width), x: Math.round(r.x), display: s.display, flexDirection: s.flexDirection, align: s.alignItems, justify: s.justifyContent, maxWidth: s.maxWidth, width: s.width, margin: s.margin, padding: s.padding, alignSelf: s.alignSelf, flexGrow: s.flexGrow });
    el = el.parentElement;
  }
  return out;
});
console.log(JSON.stringify(chain, null, 2));
await ctx.close();
