import { chromium } from 'playwright-core';
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', {
  executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',
  headless:true, viewport:{width:1440,height:1000}, colorScheme:'dark',
});
const page = ctx.pages()[0] ?? await ctx.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(5000);
const nav = await page.locator('text=Creative Studio').count();
if (nav) await page.locator('text=Creative Studio').first().click();
await page.waitForTimeout(3000);
const root = page.locator('[data-testid="creative-studio"]');
const visible = await root.count();
if (visible) {
  const projects = root.locator('.cs-projects button, .cs-projects [role=button]');
  // dark tokens are currentColor-mixed, so just capture; also enter first project to see the workbench
  const first = page.getByRole('button', { name: 'Studio verification 20261107' });
  if (await first.count()) { await first.click(); await page.waitForTimeout(5000); }
}
await page.screenshot({ path:'.preview/shots/real-gui-dark-workbench.png' });
console.log(JSON.stringify({ rootVisible: visible }));
await ctx.close();
