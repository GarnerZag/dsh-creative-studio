import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'en-US',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'Creative Studio'}).first().click();await page.waitForTimeout(800);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
const bad=[];
for(const i of [0,1,2,3,4]){
 await page.locator('.cs-steps button').nth(i).click();await page.waitForTimeout(700);
 const raw=await page.evaluate(()=>{
  const out=[];
  for(const el of document.querySelectorAll('.creative-studio-root *')){
   const own=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ');
   if(/^[a-z][A-Za-z0-9]{6,}$/.test(own)) out.push(own);
  }
  return [...new Set(out)].slice(0,10);
 });
 if(raw.length)bad.push({stage:i,raw});
}
console.log(JSON.stringify({bad,errs}));
await ctx.close();
