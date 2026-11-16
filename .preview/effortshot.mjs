import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1600,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
await page.getByText('Creative Studio',{exact:true}).first().click().catch(()=>{});
await page.waitForTimeout(2000);
const card=page.locator('.cs-project-card').first();
if(await card.count()){await card.click();await page.waitForTimeout(2500);}
const panel=page.locator('.creative-studio-root label',{hasText:'Reasoning effort'}).first();
if(await panel.count()){
  await panel.scrollIntoViewIfNeeded();
  await panel.locator('select').selectOption('max').catch(async()=>{await panel.locator('select').selectOption('low');});
  await page.waitForTimeout(400);
  const v=await panel.locator('select').inputValue();
  console.log('EFFORT_SET',v);
  await panel.screenshot({path:'.preview/shots/effort-live.png'});
}
await ctx.close();
