import {chromium} from 'playwright-core';
const rid=()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1600,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
const call=async(method,args)=>page.evaluate(async({method,args,rid})=>{
 const r=await fetch('/api/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:rid,method,payload:{args}})});
 const t=await r.text();
 let j=null;try{j=JSON.parse(t);}catch{}
 return {status:r.status,result:j?.result??null,raw:t.slice(0,300)};
},{method,args,rid:rid()});
const list=await call('creativeStudio/listProjects',{});
const projects=list.result?.ok?list.result.value:[];
console.log('projects',projects.length);
const target=projects[0];
const bogus='00000000-0000-4000-8000-000000000000';
const probe=await call('creativeStudio/generateProposal',{id:bogus,expectedProjectRevision:0,request:'probe question',workspaceId:'probe-workspace',model:{provider:"deepseek",model:"deepseek-chat"}});
console.log('PROBE',JSON.stringify(probe).slice(0,600));
const research=await call('creativeStudio/researchReference',{id:bogus,expectedProjectRevision:0,referenceId:'x',request:'probe question',workspaceId:'probe-workspace',model:{provider:"deepseek",model:"deepseek-chat"},confirmed:false});
console.log('RESEARCH',JSON.stringify(research).slice(0,600));
await ctx.close();
