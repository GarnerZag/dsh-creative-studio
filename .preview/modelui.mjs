import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1600,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByText('Creative Studio',{exact:true}).first().click();
await page.waitForTimeout(1500);
const card=page.locator('.cs-project-card').first();
if(await card.count()){await card.click();await page.waitForTimeout(1500);}
const steps=page.locator('.cs-steps button');
const stepCount=await steps.count();
if(stepCount){await steps.first().click();await page.waitForTimeout(1200);}
const selects=page.locator('.creative-studio-root select');
const n=await selects.count();
const lists=[];
for(let i=0;i<n;i++){lists.push(await selects.nth(i).locator('option').allTextContents());}
let found=null;
for(let i=0;i<n;i++){
  if(lists[i].some(o=>o.includes('默认模型'))){found={index:i,count:lists[i].length,sample:lists[i].slice(0,4)};break;}
}
console.log('STEPS',stepCount,'MODEL_SELECT',JSON.stringify(found));
await page.screenshot({path:'.preview/shots/model-select-live.png'});
await ctx.close();
