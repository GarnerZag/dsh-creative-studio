import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1500,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByText('Creative Studio',{exact:true}).first().click().catch(()=>{});
await page.waitForTimeout(1500);
const card=page.locator('.cs-project-card').first();
if(await card.count()){await card.click();await page.waitForTimeout(2000);}
const sel=page.locator('.creative-studio-root select').nth(1);
console.log('MODEL_VALUE',await sel.inputValue());
const effort=page.locator('.creative-studio-root select').nth(2);
console.log('EFFORT_VALUE',await effort.inputValue());
await effort.selectOption('max').catch(()=>effort.selectOption('low'));
console.log('EFFORT_AFTER',await effort.inputValue());
await page.screenshot({path:'.preview/shots/effort-live.png',fullPage:false});
await ctx.close();
