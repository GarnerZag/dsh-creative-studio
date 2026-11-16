import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1400);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
const report=[];
for(const [i,label] of [[0,'想法'],[1,'需求'],[2,'架构'],[3,'审批'],[4,'交接']]){
 await page.locator('.cs-steps button').nth(i).click();await page.waitForTimeout(900);
 const bad=await page.evaluate(()=>{
  const named=(e)=>{const aria=e.getAttribute('aria-label');const byLabel=e.labels&&e.labels[0]?e.labels[0].textContent:'';const title=e.getAttribute('title');return (aria||byLabel||title||'').trim();};
  const ctrls=[...document.querySelectorAll('input,select,textarea')].filter(e=>e.offsetParent!==null);
  const unnamed=ctrls.filter(e=>!named(e)).map(e=>({tag:e.tagName,type:e.getAttribute('type'),cls:e.className,ph:e.getAttribute('placeholder')}));
  const btns=[...document.querySelectorAll('button')].filter(e=>e.offsetParent!==null&&!e.textContent.trim()&&!e.getAttribute('aria-label'));
  return {unnamed,emptyButtons:btns.map(b=>b.className)};
 });
 report.push({stage:label,...bad});
}
console.log(JSON.stringify(report,null,1));
await ctx.close();
