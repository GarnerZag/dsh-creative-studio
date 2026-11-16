import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
const out={};
for(const w of [1440,1366,1280,1152]){
 await page.setViewportSize({width:w,height:900});await page.waitForTimeout(700);
 out[w]=await page.evaluate(()=>{const wb=document.querySelector('.cs-workbench');const g=document.querySelector('.cs-grid');
  return {container:Math.round(wb.clientWidth),cols:getComputedStyle(g).gridTemplateColumns,stacked:getComputedStyle(g).gridTemplateColumns.split(' ').length===1};});
}
console.log(JSON.stringify({out,errs}));
await ctx.close();
