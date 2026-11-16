import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1200);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(1200);
console.log(JSON.stringify(await page.evaluate(()=>({
 legend:[...document.querySelectorAll('.cs-stage-body .cs-hint')].map(p=>p.textContent.trim()).filter(t=>t.includes('色条')),
 strips:document.querySelectorAll('svg rect[rx="1.5"]').length,
 cards:document.querySelectorAll('svg g[transform] rect').length}))));
console.log(JSON.stringify({errs}));await ctx.close();
