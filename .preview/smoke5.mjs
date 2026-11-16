import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(800);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1400);
const rows=[];
for(const [i,label] of [[0,'想法'],[1,'需求'],[2,'架构'],[3,'审批'],[4,'交接']]){
 await page.locator('.cs-steps button').nth(i).click();await page.waitForTimeout(800);
 const body=await page.locator('.cs-stage-body').innerText();
 rows.push({label,chars:body.length,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
 await page.screenshot({path:`.preview/review/zh90-${label}.png`});
}
console.log(JSON.stringify({rows,errs}));
await ctx.close();
