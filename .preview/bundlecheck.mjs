import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
const out=await page.evaluate(async()=>{
 const url='/plugins/\u003f\u003f@garnerzag/dsh-creative-studio/client.js';
 const r=await fetch(url);
 const t=await r.text();
 return {status:r.status,len:t.length,hasEffort:t.includes('跟随模型推荐'),hasReasoning:t.includes('reasoningEffort'),snippet:t.includes('reasoningEffort')?t.slice(t.indexOf('reasoningEffort')-60,t.indexOf('reasoningEffort')+80):null};
});
console.log(JSON.stringify(out));
await ctx.close();
