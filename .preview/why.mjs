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
const out = await page.evaluate(() => {
  const el = document.querySelector('.cs-projects');
  const root = document.querySelector('[data-testid="creative-studio"]');
  const s = getComputedStyle(el);
  const rs = getComputedStyle(root);
  const before = { marginLeft: s.marginLeft, marginRight: s.marginRight, width: s.width, maxWidth: s.maxWidth, flexBasis: s.flexBasis, alignSelf: s.alignSelf, rootAlign: rs.alignItems, rootDisplay: rs.display, rootWidth: rs.width };
  // experiment: force stretch+no cap
  el.style.width = '100%'; el.style.maxWidth = 'none';
  const stretched = { w: Math.round(el.getBoundingClientRect().width), x: Math.round(el.getBoundingClientRect().x) };
  el.style.maxWidth = ''; el.style.width = '';
  return { before, stretched, sheetCount: document.styleSheets.length };
});
console.log(JSON.stringify(out, null, 2));
await ctx.close();
