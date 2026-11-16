import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN'});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const out=await page.evaluate(async()=>{
 const call=async(method,args)=>{
  const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:'c-'+Math.random().toString(36).slice(2),method:'creativeStudio/'+method,payload:{args}})});
  const j=await r.json(); if(!j.result||!j.result.ok) throw new Error(method+': '+JSON.stringify(j.result?.error??j).slice(0,160));
  return j.result.value;
 };
 const log=[];
 const list=await call('listProjects',{});
 const temp=list.filter(p=>p.name.startsWith('E2E 功能巡检'));
 log.push({projects:list.length,temp:temp.map(t=>({name:t.name,req:t.requirementCount,arch:t.architectureCount}))});
 for(const t of temp){const full=await call('getProject',{id:t.id});await call('deleteProject',{id:t.id,expectedProjectRevision:full.projectRevision});log.push({deleted:t.name});}
 const after=await call('listProjects',{});
 log.push({after:after.length,names:after.map(p=>p.name)});
 return log;
}).catch(e=>({error:String(e).slice(0,300)}));
console.log(JSON.stringify(out));
await ctx.close();
