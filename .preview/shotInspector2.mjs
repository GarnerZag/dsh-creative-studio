import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1200);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(1200);
await page.evaluate(()=>{const b=[...document.querySelectorAll('.cs-stage-body button')].find(x=>x.textContent.trim()==='会话接入与定位');if(b)b.click();});await page.waitForTimeout(900);
await page.locator('.cs-inspector').first().screenshot({path:'.preview/review/inspector.png'});
const data=await page.evaluate(()=>{
 return {fields:[...document.querySelectorAll('.cs-inspector label')].map(l=>l.textContent.trim().slice(0,26)),
  parentOpts:[...document.querySelectorAll('.cs-inspector select')].map(sel=>[...sel.options].slice(0,8).map(o=>JSON.stringify(o.textContent)))};
});
console.log(JSON.stringify(data));console.log(JSON.stringify({errs}));
await ctx.close();
