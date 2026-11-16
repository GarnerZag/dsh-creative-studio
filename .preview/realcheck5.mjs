import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{viewport:{width:2000,height:1200},headless:true});
const p=ctx.pages()[0]??await ctx.newPage();
await p.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(3500);
const labels=await p.evaluate(()=>Array.from(document.querySelectorAll('button,a')).map(x=>(x.textContent||'').trim().slice(0,24)).filter(Boolean).slice(0,50));
console.log('url',p.url(),JSON.stringify(labels));
await p.screenshot({path:'shots/real-gui-root.png'});
await ctx.close();
