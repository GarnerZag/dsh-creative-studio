import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1366,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1200);
console.log(JSON.stringify(await page.evaluate(()=>{const el=document.querySelector('.cs-narrow-hint');if(!el)return {missing:true};
 const cs=getComputedStyle(el);const rect=el.getBoundingClientRect();
 return {maxW:cs.maxWidth,width2:cs.width,tag:el.tagName,flex:cs.flex,flexBasis:cs.flexBasis,display:cs.display,width:Math.round(rect.width),x:Math.round(rect.x),y:Math.round(rect.y),
  sheetHit:[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.cssText.includes('cs-narrow-hint'))}catch{return false}})};})));
await ctx.close();
