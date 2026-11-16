import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const rpc=async(method,args)=>{const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'x',method:'creativeStudio/'+method,payload:{args}})});return r.json();};
 const list=await rpc('listProjects',{});
 const items=(list.result&&list.result.value&&(list.result.value.projects||list.result.value))||[];
 const proj=items.find(p=>p.name==='考研市场中台'); if(!proj) return {error:'no project',names:items.map(p=>p.name)};
 const snap=(await rpc('getProject',{id:proj.id})).result.value;
 const job=snap.proposalJob; if(!job) return {error:'no job'};
 const rep=await rpc('readJobReply',{id:proj.id,jobId:job.id});
 return {keys:Object.keys(rep.result.value||{}),value:rep.result.value};
});
console.log(JSON.stringify(out).slice(0,600));await ctx.close();
