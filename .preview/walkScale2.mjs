import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(800);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(900);
const r=await page.evaluate(()=>{
 const box=document.querySelector('.cs-mindmap-scroll')||document.querySelector('.cs-canvas-column div[style*="overflow"]');
 const el=[...document.querySelectorAll('div')].find(d=>getComputedStyle(d).overflowX==='auto'&&d.querySelector('svg'));
 const d=document.documentElement;
 const hint=[...document.querySelectorAll('.cs-hint')].map(p=>p.textContent).filter(t=>t&&t.includes('滚动'));
 return {frameOverflow:d.scrollWidth-d.clientWidth,
  scroller:el?{cw:el.clientWidth,sw:el.scrollWidth}:null,hint};
});
console.log(JSON.stringify(r));
await page.screenshot({path:'.preview/review/zh98-canvas-085.png'});
await ctx.close();
