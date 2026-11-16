import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(3000);
const urls=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(u=>/creative|client|\.js/.test(u)).slice(0,20));
console.log(JSON.stringify(urls,null,1));
await ctx.close();
