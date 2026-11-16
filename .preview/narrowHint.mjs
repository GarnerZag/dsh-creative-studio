import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1366,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
const out={};for(const w of [1366,1440]){
 await page.setViewportSize({width:w,height:900});await page.waitForTimeout(800);
 out[w]=await page.evaluate(()=>({toolbar:[...document.querySelectorAll('.cs-toolbar button')].map(b=>b.textContent.trim()),
  hint:[...document.querySelectorAll('.cs-toolbar .cs-hint')].map(n=>n.textContent.trim()),
  split:!!document.querySelector('.cs-split')&&getComputedStyle(document.querySelector('.cs-split')).display}));}
console.log(JSON.stringify({out,errs}));
await ctx.close();
