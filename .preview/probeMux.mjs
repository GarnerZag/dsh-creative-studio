import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1200,height:800}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const out=await page.evaluate(async()=>{
 const tryCall=async(method,args)=>{
  const body={type:'client-request',rpcId:'probe-'+Math.random().toString(36).slice(2),method,payload:{args}};
  const r=await fetch('/api/remote.mux',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const t=await r.text();return {status:r.status,body:t.slice(0,240)};
 };
 return {page:await tryCall('sessionController/page',{address:{kind:'session',sessionId:'31e876b8-1ae9-4217-b9ec-2733d2d180f6'},maxMessages:4}), events:await tryCall('sessionController/events',{address:{kind:'session',sessionId:'31e876b8-1ae9-4217-b9ec-2733d2d180f6'},maxMessages:4})};
});
console.log(JSON.stringify(out));
await ctx.close();
