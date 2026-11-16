import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{viewport:{width:2000,height:1200},headless:true});
const p=ctx.pages()[0]??await ctx.newPage();
await p.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2500);
const h=await p.evaluateHandle(()=>Array.from(document.querySelectorAll('button,a')).find(x=>/Creative Studio/.test(x.textContent||'')));
await h.asElement().click();
await p.waitForTimeout(3000);
const s1=await p.evaluate(()=>({chooser:!!document.querySelector('.cs-chooser'),cards:document.querySelectorAll('.cs-project-card').length,rail:document.querySelectorAll('.cs-rail').length,model:document.querySelectorAll('select').length}));
console.log('after nav',JSON.stringify(s1));
const card=await p.$('.cs-project-card');
if(card){
 await card.click(); await p.waitForTimeout(2500);
 const s2=await p.evaluate(()=>({chooser:!!document.querySelector('.cs-chooser'),rail:document.querySelectorAll('.cs-rail').length,title:document.querySelector('.cs-project-title')?.textContent??null,steps:document.querySelectorAll('.cs-steps button').length,modelSelects:Array.from(document.querySelectorAll('label')).filter(l=>/模型/.test(l.textContent||'')).length}));
 console.log('in project',JSON.stringify(s2));
 await p.screenshot({path:'.preview/shots/real-gui-no-rail.png'});
}
await ctx.close();
