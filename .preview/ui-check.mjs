import { chromium } from 'playwright-core';
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', {
  executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',
  headless:true, viewport:{width:1440,height:1000},
});
const page = ctx.pages()[0] ?? await ctx.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(5000);
const title = await page.title();
const nav = await page.locator('text=Creative Studio').count();
if (nav) await page.locator('text=Creative Studio').first().click();
await page.waitForTimeout(3000);
const root = page.locator('[data-testid="creative-studio"]');
const visible = await root.count();
let info = null;
if (visible) {
  info = await root.evaluate((el) => {
    const set = new Set();
    el.querySelectorAll('*').forEach((n) => { if (n.textContent.trim()) set.add(getComputedStyle(n).fontSize); });
    const inputs = [...el.querySelectorAll('input,select,textarea')].slice(0, 5).map((i) => ({ tag: i.tagName, h: Math.round(i.getBoundingClientRect().height) }));
    const h1 = el.querySelector('h1');
    return { sizes: [...set].sort(), inputs, h1: h1 ? h1.textContent : null };
  });
}
await page.screenshot({ path:'.preview/shots/real-gui-1440.png' });
console.log(JSON.stringify({ title, url: page.url(), navCount: nav, rootVisible: visible, info }, null, 2));
await ctx.close();
