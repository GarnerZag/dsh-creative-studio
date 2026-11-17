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
const out=await page.evaluate(()=>{
  const pane=[...document.querySelectorAll('.cs-pane-scroll')].pop()??document.querySelector('.cs-stage-body');
  const t=pane.innerText;
  const i=t.indexOf('Reference');
  return {snippet:i>=0?t.slice(i,i+900):t.slice(0,900)};
});
console.log(JSON.stringify({...out,errs}));await ctx.close();
