import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1000}});
const page=await ctx.newPage();page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1400);
const r=await page.evaluate(async()=>{
 const call=async(method,args)=>{const rpcId='x'+Math.random().toString(36).slice(2);
  const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId,method:'creativeStudio/'+method,payload:{args}})});
  return (await r.json()).result;};
 const list=await call('listProjects',{});
 const target=(list.value||[]).find(p=>p.name==='考研市场中台');
 if(!target)return{deleted:false,reason:'not found',names:(list.value||[]).map(p=>p.name)};
 const full=await call('getProject',{id:target.id});
 const rev=full.value&&full.value.projectRevision;
 const res=await call('deleteProject',{id:target.id,expectedProjectRevision:rev});
 const after=await call('listProjects',{});
 return{deleted:!res.error,error:res.error&&res.error.message,remaining:(after.value||[]).map(p=>p.name)};
});
console.log(JSON.stringify(r));await ctx.close();
