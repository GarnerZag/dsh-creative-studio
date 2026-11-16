import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
const info=await page.evaluate(async()=>{
  const srcs=[...document.querySelectorAll('script[src]')].map(s=>s.src);
  const out=[];
  for(const s of srcs){const r=await fetch(s,{cache:'reload'});const t=await r.text();out.push({src:s.slice(-60),len:t.length,hasNew:t.includes('cs-versions-list'),hasOld:t.includes('cs-toolbar')});}
  return out;
});
console.log(JSON.stringify(info,null,1));
await ctx.close();
