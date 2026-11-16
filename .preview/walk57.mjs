import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1200}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1600);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(900);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1400);
const out={};
for(const [i,name] of [[0,'idea'],[1,'req'],[2,'arch'],[3,'appr'],[4,'hand']]){
 await page.locator('.cs-steps button').nth(i).click();
 await page.waitForTimeout(900);
 const found=await page.evaluate(()=>{
   const root=document.querySelector('.creative-studio-root');const set=new Set();
   const walk=(n)=>{for(const c of n.childNodes){if(c.nodeType===3){const t=c.textContent.trim();if(/^[A-Za-z][A-Za-z0-9_.\- ]{3,}$/.test(t))set.add(t);}else if(c.nodeType===1)walk(c);}};
   walk(root);return [...set];
 });
 out[name]=found;
}
console.log(JSON.stringify(out));
await ctx.close();
