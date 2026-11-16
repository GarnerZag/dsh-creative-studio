import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const id=await page.evaluate(async()=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'x'+Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();if(!j.result?.ok)throw new Error(m+':'+String(j.result?.error?.message).slice(0,140));return j.result.value;};
 const s=await call('createProject',{name:'Demo 自动重播巡检'});return s.id;
});
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(1700);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(800);
await page.getByRole('button',{name:/Demo 自动重播巡检/}).first().click();
await page.waitForTimeout(1400);
await page.locator('.cs-steps button').nth(1).click();
await page.waitForTimeout(900);
const iframesBefore=await page.locator('.cs-demo-pane iframe').count();
await page.getByRole('button',{name:'添加根节点'}).first().click();
await page.waitForTimeout(1800);
const note=await page.getByText('Demo 已自动重播').count();
await page.screenshot({path:'.preview/review/zh36-demo-autoplay.png'});
const cleanup=await page.evaluate(async(pid)=>{
 const call=async(m,a)=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'y'+Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})});const j=await r.json();return j.result?.ok?j.result.value:String(j.result?.error?.message).slice(0,120);};
 const shots=[];
 for(let i=0;i<3;i++){const snap=await call('getProject',{id:pid});const r=await call('deleteProject',{id:pid,expectedProjectRevision:snap.projectRevision});if(Array.isArray(r))return r.map(p=>p.name);shots.push(r);}
 return shots;
},id);
console.log(JSON.stringify({iframesBefore,note,cleanup,errs}));
await ctx.close();
