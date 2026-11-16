import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'p'+Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();return j.result?.ok?j.result.value:String(j.result?.error?.message).slice(0,120);};
 let list=await call('listProjects',{});
 for(let round=0;round<10;round++){
  const targets=list.filter(x=>/参考来源巡检|Demo 自动重播巡检|想法必填提示巡检|空需求状态巡检/.test(x.name));
  if(!targets.length)break;
  const p=targets[0];const snap=await call('getProject',{id:p.id});
  await call('deleteProject',{id:p.id,expectedProjectRevision:snap.projectRevision});
  list=await call('listProjects',{});
 }
 return list.map(x=>x.name);
});
console.log(JSON.stringify(out));
await ctx.close();
