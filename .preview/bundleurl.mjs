import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
const urls=[];
page.on('response',r=>{const u=r.url();if(/creative|plugin/i.test(u))urls.push(r.status()+' '+u.slice(0,160));});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
await page.getByText('Creative Studio',{exact:true}).first().click().catch(()=>{});
await page.waitForTimeout(2500);
const card=page.locator('.cs-project-card').first();
if(await card.count()){await card.click();await page.waitForTimeout(2500);}
console.log(urls.slice(0,12).join('\n'));
await ctx.close();
