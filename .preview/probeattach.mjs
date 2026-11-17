import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1280,height:900}});
const page=await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const call=async(method,args)=>{const rpcId='x'+Math.random().toString(36).slice(2);
  const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId,method:'creativeStudio/'+method,payload:{args}})});
  const j=await r.json();return {status:r.status,result:j.result};};
 const list=await call('listProjects',{});
 const id=list.result&&list.result.ok&&list.result.value[0]?list.result.value[0].id:null;
 const up=id?await call('uploadAttachment',{id,expectedProjectRevision:1,expectedContentRevision:0,input:{name:'a.md',mime:'text/markdown',base64:'aGk='}}):null;
 return {projects:list.result&&list.result.value&&list.result.value.length,id,upload:up&&JSON.stringify(up).slice(0,220)};});
console.log(JSON.stringify(out));await ctx.close();
