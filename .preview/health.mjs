import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1280,height:900}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{const call=async m=>{const r=await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'h'+Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:{}}})});return (await r.json()).result;};
 return {health:JSON.stringify(await call('health')).slice(0,200),projects:JSON.stringify(await call('listProjects')).slice(0,120)};});
console.log(JSON.stringify({...out,errs}));await ctx.close();
