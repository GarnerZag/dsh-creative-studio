import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByRole('button',{name:'Creative Studio'}).first().click();
await page.waitForTimeout(1200);
await page.screenshot({path:'.preview/review/01-chooser.png',fullPage:false});
const cards=await page.locator('.cs-project-card').count();
console.log('CHOOSER cards=',cards);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
const steps=await page.locator('.cs-steps button').allInnerTexts();
console.log('STEPS',JSON.stringify(steps));
for(let i=0;i<steps.length;i++){
 await page.locator('.cs-steps button').nth(i).click();
 await page.waitForTimeout(700);
 await page.screenshot({path:`.preview/review/0${i+2}-stage-${i}.png`});
 const h=await page.locator('.cs-stage h2, .cs-stage h3').allInnerTexts().catch(()=>[]);
 const btn=await page.locator('.cs-stage button').allInnerTexts().catch(()=>[]);
 console.log(`STAGE${i} heads=${JSON.stringify(h.slice(0,8))} buttons=${JSON.stringify(btn.slice(0,14))}`);
}
await ctx.close();
