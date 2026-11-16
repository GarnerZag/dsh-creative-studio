import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1200,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const out=await page.evaluate(async()=>{
  const call=async(method,args)=>{const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+method,payload:{args}})});const t=await r.text();try{return JSON.parse(t);}catch{return {raw:t.slice(0,200)};}};
  const list=await call('listProjects',{});
  const ls=list.result?.value??list.value??list;const arr=Array.isArray(ls)?ls:ls.projects;
  if(!arr) return {listRaw:JSON.stringify(list).slice(0,300)};
  const p=arr.find(x=>x.name&&x.name.includes('考研'))??arr[0];
  const snap=await call('getProject',{id:p.id,projectRevision:p.projectRevision});const full=(snap.result?.value??snap.value)?.project??(snap.result?.value??snap.value);const job=full.proposalJob;
  if(!job) return {names:arr.map(x=>x.name),error:'no job'};
  const reply=await call('readJobReply',{id:p.id,jobId:job.id});
  return {name:p.name,sessionId:job.sessionId,status:job.status,reply:reply.result?.value??reply.result};
});
console.log(JSON.stringify(out).slice(0,1200));
await ctx.close();
