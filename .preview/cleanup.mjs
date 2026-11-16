import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1000);
const out=await page.evaluate(async()=>{
 const rpc=async(method,args)=>{const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'x',method:'creativeStudio/'+method,payload:{args}})});return r.json();};
 const lv=(await rpc('listProjects',{})).result.value;const list=lv.projects||lv;
 const targets=list.filter(p=>/^架构保存反馈 |^首轮体验验证 |^画布收口验证 |^填写验证/.test(p.name));
 const report=[];
 for(const t of targets){let done=false;for(let i=0;i<4&&!done;i++){const snap=(await rpc('getProject',{id:t.id})).result.value;const r=await rpc('deleteProject',{id:t.id,expectedProjectRevision:snap.projectRevision});if(r.result.ok)done=true;else report.push([t.name,r.result.error?.code||'err']);}}
 return {deleted:targets.map(t=>t.name),report,remaining:((await rpc('listProjects',{})).result.value.projects||[]).map(p=>p.name)};
});
console.log(JSON.stringify(out));await ctx.close();
