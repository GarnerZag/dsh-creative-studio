import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const out=await page.evaluate(async()=>{
 const rpcId='11111111-2222-4333-8444-555555555555';
 const body={type:'client-request',rpcId,method:'sessionController/events',payload:{args:{address:{kind:'session',sessionId:'31e876b8-1ae9-4217-b9ec-2733d2d180f6'},maxMessages:6}}};
 const r=await fetch('/api/sessionController/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const text=await r.text();
 return {status:r.status,head:text.slice(0,300)};
});
console.log(JSON.stringify(out,null,1));
await ctx.close();
