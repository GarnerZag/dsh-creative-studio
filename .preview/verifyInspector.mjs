import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1400);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(1000);
const before=await page.evaluate(()=>({inspector:document.querySelectorAll('.cs-inspector').length,
 hint:[...document.querySelectorAll('p')].some(p=>p.textContent.includes('点一下画布里的需求卡片')),
 rootBtn:[...document.querySelectorAll('.cs-toolbar button')].filter(b=>b.textContent.trim()==='项目根').map(b=>b.disabled),
 cols:getComputedStyle(document.querySelector('.cs-editor')).gridTemplateColumns.split(' ').length}));
const dbg=await page.evaluate(()=>({tree:document.querySelectorAll('.cs-tree').length,pressed:document.querySelectorAll('button[aria-pressed]').length,stages:[...document.querySelectorAll('.cs-steps button')].map(b=>b.textContent.trim().slice(0,4))}));console.log('DBG',JSON.stringify(dbg));
await page.getByRole('button',{name:'会话接入与定位',exact:true}).first().click();await page.waitForTimeout(800);
const after=await page.evaluate(()=>({inspector:document.querySelectorAll('.cs-inspector').length,
 cols:getComputedStyle(document.querySelector('.cs-editor')).gridTemplateColumns.split(' ').length,
 hasTitle:!!document.querySelector('.cs-inspector-title'),
 saved:!!document.querySelector('[role=status]')}));
console.log(JSON.stringify({before,after,errs}));
await ctx.close();
