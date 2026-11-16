import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1400);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1200);
console.log(await page.evaluate(()=>{
 const found=[];for(const s of document.styleSheets){let rules;try{rules=s.cssRules}catch{continue}for(const r of rules){if(r.cssText&&r.cssText.includes('cs-back'))found.push(r.cssText.slice(0,200));}}
 return {count:found.length,found:found.slice(0,3),btn:document.querySelector('.cs-back')?.outerHTML.slice(0,200)};
}));
await ctx.close();
