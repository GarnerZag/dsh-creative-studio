import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1200}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1600);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(900);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
for(const i of [1,2]){
 await page.locator('.cs-steps button').nth(i).click();
 await page.waitForTimeout(900);
 const t=await page.locator('.cs-stage-body').innerText();
 console.log('=== STAGE',i,'===',t.replace(/\n+/g,' | ').slice(0,1200));
}
await ctx.close();
