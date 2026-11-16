import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'p'+Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();return j.result?.ok?j.result.value:String(j.result?.error?.message).slice(0,120);};
 let list=await call('listProjects',{});
 for(const p of list.filter(x=>/Demo 自动重播巡检/.test(x.name))){
  const snap=await call('getProject',{id:p.id});
  list=await call('deleteProject',{id:p.id,expectedProjectRevision:snap.projectRevision});
  if(!Array.isArray(list))list=await call('listProjects',{});
 }
 return list.map(x=>x.name);
});
console.log(JSON.stringify(out));
await ctx.close();
