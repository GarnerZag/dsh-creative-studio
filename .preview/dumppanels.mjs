import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1000}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1300);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('Structured handoff'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
const out={};
for(const [name,n] of [['approval',3],['handoff',4]]){
  await page.locator('.cs-steps button').nth(n).click();await page.waitForTimeout(800);
  out[name]=await page.evaluate(()=>{const m=document.querySelector('main.creative-studio-root');const t=m?.innerText??'';return t.slice(0,1400)});
}
console.log(JSON.stringify({...out,errs}));await ctx.close();
