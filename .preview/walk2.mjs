import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1440,height:1000}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2000);
await page.getByRole('button',{name:'Creative Studio'}).first().click();
await page.waitForTimeout(1000);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
const info=await page.evaluate(()=>{
 const root=document.querySelector('.cs-root')??document.body;
 const classes=new Set();
 root.querySelectorAll('*').forEach(el=>{for(const c of el.classList)if(c.startsWith('cs-'))classes.add(c)});
 const sections=[...root.querySelectorAll('section,article,aside,main')].slice(0,40).map(el=>({tag:el.tagName,cls:el.className,aria:el.getAttribute('aria-label'),h:(el.querySelector('h2,h3,h4')?.textContent??'').slice(0,40)}));
 return {classes:[...classes].sort(),sections};
});
console.log(JSON.stringify(info.sections,null,1).slice(0,2500));
console.log('CLASSES',info.classes.join(' '));
await ctx.close();
