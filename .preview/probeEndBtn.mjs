import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1366,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
console.log(JSON.stringify(await page.evaluate(()=>({end:[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t.includes('结束')),
 note:[...document.querySelectorAll('.cs-submit-note')].map(n=>n.textContent.trim()),
 reply:document.querySelector('.cs-reply')?.innerText.slice(0,200)}))));
await ctx.close();
