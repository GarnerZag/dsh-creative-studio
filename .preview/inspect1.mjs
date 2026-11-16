import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const call=(method,args)=>page.evaluate(async({method,args})=>{
 const rpcId='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});
 const r=await fetch('/api/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId,method,payload:{args}})});
 return (await r.json()).result;
},{method,args});
const heads=(await call('creativeStudio/listProjects',{})).value;
console.log('PROJECTS',heads.length);
for(const h of heads){
  const p=(await call('creativeStudio/getProject',{id:h.id})).value;
  const job=p.proposalJob;
  console.log(JSON.stringify({name:h.name,rev:p.projectRevision,content:p.contentRevision,nodes:p.nodes.length,proposals:p.proposals.length,versions:p.versions.length,
    job:job?{status:job.status,hasBrief:!!job.brief,intent:job.brief?.intent??null,confirmedAt:job.briefConfirmedAt??null,request:(job.request||'').slice(0,40)}:null,
    research: p.researchJob?{status:p.researchJob.status}:null}));
}
await ctx.close();
