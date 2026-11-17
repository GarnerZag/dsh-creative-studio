import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(1200);
await page.locator('svg button[aria-pressed]').nth(2).click();await page.waitForTimeout(900);
// scroll so the textarea is visible, then read save button position
await page.locator('.cs-editor textarea').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
const out=await page.evaluate(()=>{
  const bar=document.querySelector('.cs-save-bar');
  const btn=bar?.querySelector('button');
  const r=btn?.getBoundingClientRect();
  const cs=bar?getComputedStyle(bar):null;
  return{pos:cs?.position,bg:cs?.backgroundColor,btnVisible:!!r&&r.top>0&&r.bottom<innerHeight,top:r?Math.round(r.top):null,vh:innerHeight};
});
console.log(JSON.stringify({...out,errs}));await ctx.close();
