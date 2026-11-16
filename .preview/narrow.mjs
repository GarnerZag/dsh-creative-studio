import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:390,height:844}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const info=await page.evaluate(()=>({scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth}));
await page.screenshot({path:'.preview/review/narrow-chooser.png'});
const btns=await page.getByRole('button',{name:'创意工坊'}).count();
if(btns){await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(900);
 await page.screenshot({path:'.preview/review/narrow-studio.png'});
 const s2=await page.evaluate(()=>({scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth,stage:!!document.querySelector('.cs-stage-body')}));
 console.log(JSON.stringify({info,s2,errs}));}
else console.log(JSON.stringify({info,btns,errs}));
await ctx.close();
