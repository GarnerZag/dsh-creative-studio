import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1400);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
const res={};
for(const name of ['考研市场中台','Structured handoff probe 20261107']){
 await page.getByRole('button',{name:new RegExp(name)}).first().click();await page.waitForTimeout(1200);
 await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(900);
 res[name]=await page.evaluate(()=>{const sec=document.querySelector('[aria-label="版本与审批"]')??document.querySelector('section');return {selects:[...document.querySelectorAll('section select')].length,labels:[...document.querySelectorAll('section label')].map(l=>l.textContent.slice(0,6)),hint:(document.body.textContent.includes('这个项目还没有冻结过版本')?1:0)};});
 await page.locator('.cs-project-title button, button:has-text("返回")').first().click().catch(()=>{});
 await page.waitForTimeout(900);
}
console.log(JSON.stringify(res));
await ctx.close();
