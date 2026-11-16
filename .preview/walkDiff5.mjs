import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1200}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1600);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(900);
const cards=page.locator('button').filter({hasText:/^版本差异验证/});
const n=await cards.count();
let info=null;
for(let i=0;i<n;i++){
 const name=(await cards.nth(i).innerText()).split('\n')[0];
 await cards.nth(i).click();await page.waitForTimeout(1200);
 const body=await page.locator('.cs-stage-body').innerText().catch(()=> '');
 if(body.includes('差异')){await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(1000);info={name,hasDiff:true};break;}
 await page.getByRole('button',{name:'全部项目'}).click().catch(()=>{});
 await page.waitForTimeout(800);
}
const stages=await page.locator('.cs-steps button').allInnerTexts();
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(1100);
const shifts=await page.locator('.cs-diff-shift').allInnerTexts();
await page.screenshot({path:'.preview/review/zh74-diff-shift.png',fullPage:true});
console.log(JSON.stringify({info,stages,shifts,errs}));
await ctx.close();
