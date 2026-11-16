import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1440,height:1300}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByRole('button',{name:'Creative Studio'}).first().click();
await page.waitForTimeout(1200);
const card=page.getByRole('button',{name:/考研市场中台/}).first();
await card.click();
await page.waitForTimeout(1500);
const info=await page.evaluate(()=>{
 const r=document.querySelector('.cs-reply');
 return {replyBlock:!!r,text:r?.textContent?.slice(0,220)??null,alert:document.querySelector('.cs-error')?.textContent??null};
});
console.log(JSON.stringify(info,null,1));
await ctx.close();
