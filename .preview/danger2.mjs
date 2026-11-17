import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(1200);
await page.locator('svg button[aria-pressed]').nth(1).click();await page.waitForTimeout(700);
const out=await page.evaluate(()=>{
  const btn=[...document.querySelectorAll('.cs-row-actions .cs-danger')].find(b=>b.textContent.includes('Delete node'));
  if(!btn)return{missing:true};
  const cs=getComputedStyle(btn);
  return{color:cs.color,border:cs.borderColor,bg:cs.backgroundColor,h:Math.round(btn.getBoundingClientRect().height)};
});
console.log(JSON.stringify(out));await ctx.close();
