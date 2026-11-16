import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const res=await page.evaluate(async()=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'p'+Math.random().toString(16).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();if(!j.result?.ok)return {error:String(j.result?.error??'')};return j.result.value;};
 let list=await call('listProjects',{});if(!Array.isArray(list))list=list.projects??[];
 const targets=list.filter(x=>/^(HS\d{6}|交接摘要校验 )/.test(x.name));
 for(const t of targets){const full=await call('getProject',{id:t.id});const del=await call('deleteProject',{id:t.id,expectedProjectRevision:full.projectRevision});if(del?.error)return {failed:t.name,error:del.error};}
 list=await call('listProjects',{});if(!Array.isArray(list))list=list.projects??[];
 return {deleted:targets.length,left:list.map(x=>x.name)};
});
console.log(JSON.stringify(res));
await ctx.close();
