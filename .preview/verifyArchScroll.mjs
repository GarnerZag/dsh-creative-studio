import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1400);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
await page.locator('.cs-steps button').nth(2).click();await page.waitForTimeout(1200);
const before=await page.evaluate(()=>{const b=document.querySelector('foreignObject').closest('div[style*=overflow]');return {top:Math.round(b.scrollTop),left:Math.round(b.scrollLeft)};});
// select the last task row from the list below, then read scroll
await page.getByRole('button',{name:'提案草稿导出',exact:true}).first().click();
await page.waitForTimeout(700);
const after=await page.evaluate(()=>{const b=document.querySelector('foreignObject').closest('div[style*=overflow]');const sel=document.querySelector('foreignObject button[aria-pressed="true"]');const r=sel.getBoundingClientRect();const br=b.getBoundingClientRect();return {top:Math.round(b.scrollTop),left:Math.round(b.scrollLeft),selected:sel.textContent.trim().slice(0,12),visible:r.top>=br.top-2&&r.bottom<=br.bottom+2};});
console.log(JSON.stringify({before,after,errs}));
await ctx.close();
