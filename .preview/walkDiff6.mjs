import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1200}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1600);
const call=async(m,a)=>page.evaluate(async({m,a})=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();return j.result;},{m,a});
const list=(await call('listProjects',{})).value;
const target=list.find(p=>p.id.startsWith('a1d9131e'))??list.find(p=>p.name.startsWith('版本差异验证'));
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(900);
await page.getByRole('button',{name:target.name}).first().click();await page.waitForTimeout(1400);
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(1200);
const shifts=await page.locator('.cs-diff-shift').allInnerTexts();
await page.screenshot({path:'.preview/review/zh75-diff-shift.png',fullPage:true});
// cleanup all fixtures
const removed=[];
for(let i=0;i<5;i++){
 const cur=(await call('listProjects',{})).value.filter(p=>/^(工作区记忆|版本差异验证)/.test(p.name));
 if(!cur.length)break;
 for(const p of cur){await call('deleteProject',{id:p.id,expectedProjectRevision:p.projectRevision});removed.push(p.name);}
}
const left=(await call('listProjects',{})).value.map(p=>p.name);
console.log(JSON.stringify({target:target.name,shifts:shifts.slice(0,3),removed,left,errs}));
await ctx.close();
