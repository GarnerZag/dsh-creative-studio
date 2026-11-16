import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1200}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1600);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(900);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
for(const [i,name] of [[0,'idea'],[1,'req'],[3,'approve']]){
 await page.locator('.cs-steps button').nth(i).click();
 await page.waitForTimeout(1000);
 await page.screenshot({path:`.preview/review/zh61-${name}.png`});
}
await ctx.close();console.log('ok');
