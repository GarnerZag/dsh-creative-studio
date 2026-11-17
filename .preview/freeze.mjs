import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('Structured handoff probe'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(1500);
const out=await page.evaluate(()=>{
  const hint=[...document.querySelectorAll('.cs-hint')].map(e=>e.textContent.trim()).filter(t=>t.startsWith('Will freeze'));
  const ver=[...document.querySelectorAll('.cs-versions-list li')].map(e=>e.innerText.split('\n')[0].slice(0,80));
  return{hint,ver};
});
console.log(JSON.stringify({...out,errs}));await ctx.close();
