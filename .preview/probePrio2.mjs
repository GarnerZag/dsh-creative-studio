import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
const out=await page.evaluate(async()=>{
 const call=async(method,args)=>{const r=await fetch(`/api/creativeStudio/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'x',method:`creativeStudio/${method}`,payload:{args}})});return (await r.json()).result;};
 const list=await call('listProjects',{});const p=(list.value.projects??list.value).find(x=>x.name==='考研市场中台');
 const snap=await call('getProject',{id:p.id});
 const counts={};for(const n of snap.value.nodes)counts[n.priority]=(counts[n.priority]||0)+1;
 return {counts,titles:snap.value.nodes.slice(0,4).map(n=>[n.title.slice(0,10),n.priority])};
});
console.log(JSON.stringify(out));await ctx.close();
