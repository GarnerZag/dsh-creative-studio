import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1366,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/Structured handoff probe/}).first().click();await page.waitForTimeout(1200);
await page.locator('.cs-steps button').nth(4).click();await page.waitForTimeout(1000);
console.log(JSON.stringify(await page.evaluate(()=>({
 blocks:[...document.querySelectorAll('.cs-block')].map(b=>b.getAttribute('aria-label')),
 selects:[...document.querySelectorAll('.cs-stage-body select')].map(s=>s.getAttribute('aria-label')),
 options:[...document.querySelectorAll('.cs-stage-body select option')].map(o=>o.textContent.trim()),
 buttons:[...document.querySelectorAll('.cs-stage-body button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,8)}))));
console.log(JSON.stringify({errs}));
await ctx.close();
