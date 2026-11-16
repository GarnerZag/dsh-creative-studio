import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(800);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(900);
const info=await page.evaluate(()=>{
 const inner=document.querySelector('.cs-mindmap-inner')||document.querySelector('.cs-mind-map')||document.querySelector('svg');
 const svg=document.querySelector('.cs-canvas-column svg');
 const t=svg?svg.querySelector('foreignObject div, text'):null;
 const col=document.querySelector('.cs-canvas-column');
 return {colW:col?Math.round(col.getBoundingClientRect().width):null,
  svgW:svg?Math.round(svg.getBoundingClientRect().width):null,
  transform:svg?getComputedStyle(svg).transform:null,
  textSize:t?getComputedStyle(t).fontSize:null};
});
console.log(JSON.stringify(info));
await page.screenshot({path:'.preview/review/zh97-canvas-scale.png'});
await ctx.close();
