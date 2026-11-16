import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1440,height:1100},locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByRole('button',{name:/Creative Studio|创意工坊/}).first().click();
await page.waitForTimeout(1000);
await page.screenshot({path:'.preview/review/zh-01-chooser.png'});
const head=await page.locator('.cs-welcome').innerText().catch(()=>'');
console.log('WELCOME',head.replace(/\n+/g,' | ').slice(0,300));
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
for(const i of [0,1]){
 await page.locator('.cs-steps button').nth(i).click();
 await page.waitForTimeout(800);
 await page.screenshot({path:`.preview/review/zh-1${i}-stage.png`});
}
await ctx.close();
