import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
const out=await page.evaluate(async()=>{
 const rpc=async(m,a)=>{try{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});return await r.json();}catch(e){return {err:String(e)};}};
 const list=await rpc('listProjects',{});
 const pid=(list.result?.value||[]).find(p=>p.name==='考研市场中台')?.id;
 const g=await rpc('getProject',{id:pid});
 const job=g.result?.value?.proposalJob??null;
 const reply=job?await rpc('readJobReply',{id:pid,jobId:job.id}):null;
 return {pid,job:job&&{id:job.id,status:job.status,sessionId:job.sessionId,briefConfirmedAt:job.briefConfirmedAt},replyRaw:JSON.stringify(reply).slice(0,600)};
});
console.log(JSON.stringify(out,null,1));
await ctx.close();
