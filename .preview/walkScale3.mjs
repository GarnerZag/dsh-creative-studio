import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(800);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(900);
const chain=await page.evaluate(()=>{
 let el=document.querySelector('.cs-canvas-column svg');const out=[];
 for(let i=0;i<4&&el;i++){const cs=getComputedStyle(el);out.push({tag:el.tagName.toLowerCase(),cls:String(el.className).slice(0,30),cw:el.clientWidth,sw:el.scrollWidth,ox:cs.overflowX});el=el.parentElement;}
 return out;
});
console.log(JSON.stringify(chain));
await ctx.close();
