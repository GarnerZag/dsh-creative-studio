import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:900}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1300);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(900);
const info=await page.evaluate(()=>{
  let el=document.querySelector('.cs-steps');const chain=[];
  let n=el.parentElement;
  while(n&&chain.length<8){const cs=getComputedStyle(n);chain.push({tag:n.tagName+'.'+String(n.className).slice(0,28),ov:cs.overflowY,sh:n.scrollHeight,ch:n.clientHeight});n=n.parentElement;}
  return chain;
});
console.log(JSON.stringify(info));await ctx.close();
