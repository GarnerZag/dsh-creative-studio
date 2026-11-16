import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1280,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const name='快捷键验证 '+Date.now();
const created=await page.evaluate(async(n)=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();return j.result;};
 const c=await call('createProject',{name:n});return {id:c.value?.project?.id??c.value?.id,rev:c.value?.project?.projectRevision??c.value?.projectRevision};
},name);
await page.waitForTimeout(500);
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(800);
await page.getByRole('button',{name:new RegExp(name)}).first().click();await page.waitForTimeout(1200);
const ta=page.locator('textarea').first();
await ta.fill('快捷键验证用的一句想法');
const dp=page.waitForEvent('dialog',{timeout:5000}).catch(()=>null);
await ta.press('Control+Enter');
const d=await dp;
if(d)await d.dismiss();
await page.waitForTimeout(300);
const del=await page.evaluate(async({id,rev})=>{
 const r=await fetch('/api/creativeStudio/deleteProject',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/deleteProject',payload:{args:{id,expectedProjectRevision:rev}}})});
 const j=await r.json();return j.result?.ok??String(j).slice(0,80);
},created);
console.log(JSON.stringify({created,dialog:d?d.message():null,deleted:del,errs}));
await ctx.close();
