import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1366,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
const names=['想法','需求','架构','审批','交接'];
for(let i=0;i<5;i++){
 await page.locator('.cs-steps button').nth(i).click();await page.waitForTimeout(1200);
 await page.screenshot({path:`.preview/review/s1366-${i}.png`});
}
console.log(JSON.stringify({errs,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)}));
await ctx.close();
