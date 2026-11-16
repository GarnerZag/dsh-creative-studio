import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{
 const call=async(m,a)=>{const res=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'w-'+Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await res.json();if(!j.result?.ok)throw new Error(m+':'+JSON.stringify(j.result?.error).slice(0,120));return j.result.value;};
 const snap=await call('createProject',{name:'空架构状态巡检'});
 return {id:snap.id,rev:snap.projectRevision};
});
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(800);
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(700);
await page.getByRole('button',{name:/空架构状态巡检/}).first().click();
await page.waitForTimeout(1400);
await page.locator('.cs-steps button').nth(2).click();
await page.waitForTimeout(900);
const hint=await page.locator('.cs-empty-start').first().innerText().catch(()=>'(none)');
await page.screenshot({path:'.preview/review/zh28-arch-empty.png'});
const del=await page.evaluate(async({id,rev})=>{
 const res=await fetch('/api/creativeStudio/deleteProject',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'d'+Math.random().toString(36).slice(2),method:'creativeStudio/deleteProject',payload:{args:{id,expectedProjectRevision:rev}}})});
 const j=await res.json();return j.result?.ok?j.result.value.map(p=>p.name):JSON.stringify(j.result?.error).slice(0,120);
},{id:r.id,rev:r.rev});
console.log(JSON.stringify({hint,after:del,errs}));
await ctx.close();
