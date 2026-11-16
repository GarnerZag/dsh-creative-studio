import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const rpc=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'x',method:'creativeStudio/'+m,payload:{args:a}})});return r.json();};
 let list=(await rpc('listProjects',{})).result.value;
 const targets=list.filter(p=>/^首轮体验 /.test(p.name));
 for(const t of targets){const snap=(await rpc('getProject',{id:t.id})).result.value;await rpc('deleteProject',{id:t.id,expectedProjectRevision:snap.projectRevision});}
 list=(await rpc('listProjects',{})).result.value;
 return {deleted:targets.map(t=>t.name),left:list.map(p=>p.name)};
});
console.log(JSON.stringify(out));await ctx.close();
