import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1024,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const out={};
for(const w of [1024,900,1280]){
 await page.setViewportSize({width:w,height:900});await page.waitForTimeout(600);
 if(!await page.locator('.cs-stage-body').count()){await page.getByRole('button',{name:'创意工坊'}).first().click().catch(()=>{});await page.waitForTimeout(700);
  await page.getByRole('button',{name:/考研市场中台/}).first().click().catch(()=>{});await page.waitForTimeout(1200);}
 out[w]=await page.evaluate(()=>{const body=document.querySelector('.cs-stage-body');const cols=body?getComputedStyle(body).gridTemplateColumns:null;
  const box=document.querySelector('foreignObject')?.closest('div[style*=overflow]');
  return {cols, pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth, canvasBoxW:box?Math.round(box.clientWidth):null};});
}
console.log(JSON.stringify({out,errs}));
await page.setViewportSize({width:1024,height:900});await page.waitForTimeout(500);
await page.screenshot({path:'.preview/review/w1024-req.png'});
await ctx.close();
