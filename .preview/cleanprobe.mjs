import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const out=await page.evaluate(async()=>{
 const call=async(method,args)=>{const rpcId='x'+Math.random().toString(36).slice(2);
  const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId,method:'creativeStudio/'+method,payload:{args}})});
  return (await r.json()).result;};
 const list=(await call('listProjects',{})).value;
 const targets=list.filter(p=>p.name.startsWith('Select all probe'));
 const removed=[];
 for(const p of targets){const cur=(await call('getProject',{id:p.id})).value; const rv=cur.projectRevision;
   const d=await call('deleteProject',{id:p.id,expectedProjectRevision:rv}); removed.push([p.name,d.ok]);}
 return removed;
});
console.log(JSON.stringify(out));await ctx.close();
