import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'p-'+Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();if(!j.result?.ok)throw new Error(m+':'+JSON.stringify(j.result?.error).slice(0,120));return j.result.value;};
 const list=await call('listProjects',{});
 const stale=list.filter(p=>p.name.startsWith('空需求状态巡检'));
 const deleted=[];
 for(const p of stale){const full=await call('getProject',{id:p.id});await call('deleteProject',{id:p.id,expectedProjectRevision:full.projectRevision});deleted.push(p.name+'#'+p.id.slice(0,8));}
 return {deleted,remaining:(await call('listProjects',{})).map(p=>p.name)};
});
console.log(JSON.stringify(out));
await ctx.close();
