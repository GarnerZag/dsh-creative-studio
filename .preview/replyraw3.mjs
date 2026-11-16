import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1200,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const out=await page.evaluate(async()=>{
  const call=async(method,args)=>{const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'x'+Math.random().toString(36).slice(2),method:'creativeStudio/'+method,payload:{args}})});return JSON.parse(await r.text());};
  const snap=await call('getProject',{id:'30b6d0ec-6338-428a-8047-503ac812bb71'});
  const p=snap.result?.value;
  const job=p?.proposalJob;
  const reply=job?await call('readJobReply',{id:p.id,jobId:job.id}):null;
  return {job:job&&{id:job.id,sessionId:job.sessionId,status:job.status,created:p.createdAt},reply:reply?.result};
});
console.log(JSON.stringify(out).slice(0,900));
await ctx.close();
