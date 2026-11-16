import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const names=await page.evaluate(async()=>{const r=await fetch('/api/creativeStudio/listProjects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'l1',method:'creativeStudio/listProjects',payload:{args:{}}})});const j=await r.json();return j.result.value.map(p=>p.name);});
console.log(JSON.stringify(names));
await ctx.close();
