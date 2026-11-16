import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();return j.result?.value;};
 let removed=[];
 for(let i=0;i<6;i++){
  const list=await call('listProjects',{});
  const targets=list.filter(p=>/^(工作区记忆|快捷键验证|部分批准校验|版本时间校验|HS\d{6}|交接摘要校验)/.test(p.name));
  if(!targets.length)break;
  for(const t of targets){await call('deleteProject',{id:t.id,expectedProjectRevision:t.projectRevision});removed.push(t.name);}
 }
 const left=(await call('listProjects',{})).map(p=>p.name);
 return {removed,left};
});
console.log(JSON.stringify(out));
await ctx.close();
