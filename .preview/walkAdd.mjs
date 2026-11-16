import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const made=await page.evaluate(async()=>{
 const rpc=async(method,args)=>{const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+method,payload:{args}})});return (await r.json()).result;};
 const p=await rpc('createProject',{name:'自动选中验证 '+Date.now()});
 return {id:p.value.id,rev:p.value.projectRevision,cRev:p.value.contentRevision};
});
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(600);
await page.getByRole('button',{name:/刷新|Refresh/}).first().click().catch(()=>{});
await page.waitForTimeout(600);
await page.getByRole('button',{name:/自动选中验证/}).first().click();await page.waitForTimeout(1200);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(800);
const before=await page.locator('.cs-inspector').innerText();
await page.getByRole('button',{name:'添加根节点'}).first().click();await page.waitForTimeout(1400);
const after=await page.locator('.cs-inspector').innerText();
const pressed=await page.locator('.cs-tree button[aria-pressed=true]').count();
const treeText=await page.locator('.cs-tree').innerText().catch(()=>'');
console.log(JSON.stringify({before:before.slice(0,40),after:after.slice(0,60),pressed,treeText:treeText.replace(/\n/g,'|').slice(0,60),errs}));
// cleanup
const del=await page.evaluate(async({id})=>{
 const rpc=async(method,args)=>{const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+method,payload:{args}})});return (await r.json()).result;};
 let list=await rpc('listProjects',{});const t=(list.value||[]).find(p=>p.id===id);
 const g=await rpc('getProject',{id});const rev=g.value.projectRevision;
 const r=await rpc('deleteProject',{id,expectedProjectRevision:rev});
 return {ok:r.ok,left:(await rpc('listProjects',{})).value.map(p=>p.name)};
},{id:made.id});
console.log(JSON.stringify({del}));
await ctx.close();
