import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1024,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1600);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(900);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1600);
const rows=[];
for(const [i,label] of [[0,'想法'],[1,'需求'],[2,'架构'],[3,'审批'],[4,'交接']]){
 await page.locator('.cs-steps button').nth(i).click();
 await page.waitForTimeout(800);
 const m=await page.evaluate(()=>{const d=document.documentElement;const wide=[...document.querySelectorAll('.creative-studio-root *')].filter(el=>el.getBoundingClientRect().right>innerWidth+4).slice(0,3).map(el=>el.className||el.tagName);return {overflow:d.scrollWidth-d.clientWidth,wide};});
 rows.push({label,...m});
}
await page.screenshot({path:'.preview/review/zh35-1024-idea.png'});
console.log(JSON.stringify({rows,errs}));
await ctx.close();
