import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1600,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByText('Creative Studio',{exact:true}).first().click();
await page.waitForTimeout(1500);
const card=page.locator('.cs-project-card').first();
if(await card.count()){await card.click();await page.waitForTimeout(1800);}
const info=await page.evaluate(()=>{
  const sels=[...document.querySelectorAll('.creative-studio-root select')];
  return sels.map((s,i)=>({i,aria:s.getAttribute('aria-label'),opts:[...s.options].map(o=>o.textContent).slice(0,5),parent:s.closest('label')?.textContent?.slice(0,30)??null}));
});
console.log(JSON.stringify(info,null,1).slice(0,1200));
await page.screenshot({path:'.preview/shots/model-select-live.png'});
await ctx.close();
