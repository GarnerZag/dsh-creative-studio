import {chromium} from 'playwright-core';
const rid=()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1600,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
const call=async(method,args)=>page.evaluate(async({method,args,rid})=>{
 const r=await fetch('/api/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:rid,method,payload:{args}})});
 const t=await r.text();let j=null;try{j=JSON.parse(t);}catch{}
 return j?.result??null;
},{method,args,rid:rid()});
const models=await call('creativeStudio/listModels',{});
console.log('MODELS', JSON.stringify(models)?.slice(0,200));
const spaces=await call('creativeStudio/listWorkspaces',{});
console.log('SPACES', JSON.stringify(spaces)?.slice(0,300));
const projects=(await call('creativeStudio/listProjects',{}))?.value??[];
const p=projects[0];
console.log('PROJ', p.id, p.projectRevision);
const spaceList=spaces?.value??[];
if(spaceList.length){
  const r=await call('creativeStudio/generateProposal',{id:p.id,expectedProjectRevision:p.projectRevision,request:'wire probe from agent: ignore',workspaceId:spaceList[0].id,model:{provider:'deepseek',model:'__nonexistent_model__'}});
  console.log('GEN', JSON.stringify(r)?.slice(0,400));
}
await ctx.close();
