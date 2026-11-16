import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{viewport:{width:2000,height:1200},headless:true});
const p=ctx.pages()[0]??await ctx.newPage();
await p.goto('http://192.168.31.188:3080/dsh/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2500);
const nav=await p.evaluate(()=>Array.from(document.querySelectorAll('button,a')).find(x=>/Creative Studio|创意工坊/.test(x.textContent||''))?.textContent||null);
if(nav){const el=await p.evaluateHandle(()=>Array.from(document.querySelectorAll('button,a')).find(x=>/Creative Studio|创意工坊/.test(x.textContent||'')));await el.asElement().click();await p.waitForTimeout(2500);}
const info=await p.evaluate(()=>({chooser:!!document.querySelector('.cs-chooser'),cards:document.querySelectorAll('.cs-project-card').length,rail:document.querySelectorAll('.cs-rail').length,title:document.querySelector('.cs-project-title')?.textContent??null}));
console.log('after nav',JSON.stringify(info));
const card=await p.$('.cs-project-card');
if(card){await card.click();await p.waitForTimeout(2000);
 const info2=await p.evaluate(()=>({chooser:!!document.querySelector('.cs-chooser'),rail:document.querySelectorAll('.cs-rail').length,title:document.querySelector('.cs-project-title')?.textContent??null,steps:document.querySelectorAll('.cs-steps button').length,all:document.querySelector('.cs-project-head button')?.textContent??null}));
 console.log('in project',JSON.stringify(info2));
 await p.screenshot({path:'shots/real-gui-no-rail.png',fullPage:false});
}
await ctx.close();
