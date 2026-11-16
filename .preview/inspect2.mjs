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
const target=heads.find(h=>h.name.includes('考研'));
const p=(await call('creativeStudio/getProject',{id:target.id})).value;
console.log('JOB',JSON.stringify({id:p.proposalJob.id,sessionId:p.proposalJob.sessionId,status:p.proposalJob.status,request:p.proposalJob.request,base:p.proposalJob.baseContentRevision,confirmedAt:p.proposalJob.briefConfirmedAt},null,1));
console.log('BRIEF',JSON.stringify(p.proposalJob.brief,null,1));
console.log('PROPOSAL0',JSON.stringify(p.proposals[0]?{id:p.proposals[0].id,title:p.proposals[0].title,status:p.proposals[0].status,base:p.proposals[0].baseContentRevision}:null));
await ctx.close();
