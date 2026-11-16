import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1200,height:900}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
const u=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('creative-studio/client.js')));
const res=await page.evaluate(async(url)=>{const a=await fetch(url,{cache:'reload'});const t=await a.text();const b=await fetch(url+'&cb='+Date.now(),{cache:'no-store'});const t2=await b.text();return {len:t.length,hasNew:t.includes('cs-versions-list'),len2:t2.length,hasNew2:t2.includes('cs-versions-list')};},u);
console.log(JSON.stringify({u:u.slice(-80),...res}));
await ctx.close();
