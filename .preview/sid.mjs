import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const call=(method,args)=>page.evaluate(async({method,args})=>{
 const rpcId='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});
 const r=await fetch('/api/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId,method,payload:{args}})});
 return (await r.json()).result;
},{method,args});
const heads=(await call('creativeStudio/listProjects',{})).value;
for(const h of heads){const p=(await call('creativeStudio/getProject',{id:h.id})).value;console.log(h.name,'|',p.proposalJob?.sessionId??'-','|',p.proposalJob?.id??'-');}
await ctx.close();
