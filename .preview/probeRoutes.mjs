import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const out=await page.evaluate(async()=>{
 const names=['session/events','sessions/events','session.page','session/events/page','dsh-session/events','sessionController/page','sessionController/wait'];
 const args={address:{kind:'session',sessionId:'31e876b8-1ae9-4217-b9ec-2733d2d180f6'},maxMessages:6};
 const result={};
 for(const method of names){
  const r=await fetch('/api/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'11111111-2222-4333-8444-555555555555',method,payload:{args}})});
  const text=await r.text();
  result[method]={status:r.status,head:text.slice(0,120)};
 }
 return result;
});
console.log(JSON.stringify(out,null,1));
await ctx.close();
