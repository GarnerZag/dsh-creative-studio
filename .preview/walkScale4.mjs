import {chromium} from 'playwright-core';
const out=[];
for(const w of [1280,1024]){
 const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:w,height:900}});
 const page=ctx.pages()[0]??await ctx.newPage();
 const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForTimeout(1400);
 await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(800);
 await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1200);
 await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(800);
 const m=await page.evaluate(()=>{
  const svg=document.querySelector('.cs-canvas-column svg');
  const t=svg?svg.querySelector('foreignObject *'):null;
  const col=document.querySelector('.cs-canvas-column');
  return {colW:col?Math.round(col.getBoundingClientRect().width):null,
   svgW:svg?Math.round(svg.getBoundingClientRect().width):null,
   tf:svg?getComputedStyle(svg).transform:null,
   fs:t?getComputedStyle(t).fontSize:null,
   eff:t&&svg?Math.round(parseFloat(getComputedStyle(t).fontSize)*Number((getComputedStyle(svg).transform.match(/matrix\(([\d.]+)/)||[0,1])[1])):null,
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
 });
 out.push({w,...m});
 await ctx.close();
}
console.log(JSON.stringify(out));
