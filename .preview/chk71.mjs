import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1200}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(900);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(3).click();
await page.waitForTimeout(1200);
const order=await page.evaluate(()=>{
  const sec=[...document.querySelectorAll('.cs-stage-body section')][0];
  return sec? [...sec.querySelectorAll('h3,legend,label,ol')].slice(0,10).map(e=>(e.tagName+':'+(e.innerText||'').slice(0,30).replace(/\n/g,'|'))) : ['none'];
});
await page.screenshot({path:'.preview/review/zh62-approve.png'});
console.log(JSON.stringify(order,null,1));
await ctx.close();
