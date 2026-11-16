import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
const id=await page.evaluate(async()=>{
 const rpc=async(m,a)=>(await (await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})})).json()).result;
 const p=await rpc('createProject',{name:'架构保存反馈 '+Date.now()});
 const pid=p.value.id;
 const g=await rpc('getProject',{id:pid});
 const r=await rpc('editArchitecture',{id:pid,expectedProjectRevision:g.value.projectRevision,expectedContentRevision:g.value.contentRevision,change:{kind:'save',item:{id:'mod-a',kind:'module',title:'搜索模块',body:'负责查询',requirementIds:[],dependsOn:[]}}});
 return r.ok?pid:null;});
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/架构保存反馈/}).first().click();await page.waitForTimeout(1300);
await page.locator('.cs-steps button').nth(2).click();await page.waitForTimeout(900);
const titleInput=page.locator('.cs-stage-body input:not([type=checkbox])').first();
await titleInput.fill('搜索模块 v2');await page.waitForTimeout(400);
await page.getByRole('button',{name:'保存详情'}).first().click();await page.waitForTimeout(1200);
const status=[];for(let i=0;i<6;i++){status.push(await page.locator('[role=status]').allInnerTexts());if(status.at(-1).length)break;await page.waitForTimeout(400);}
const errText=await page.locator('.cs-error').allInnerTexts().catch(()=>[]);
const rev=await page.locator('.cs-stage-body').innerText().catch(()=>'');
const del=await page.evaluate(async({id})=>{const rpc=async(m,a)=>(await (await fetch('/api/creativeStudio/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:Math.random().toString(36).slice(2),method:'creativeStudio/'+m,payload:{args:a}})})).json()).result;const g=await rpc('getProject',{id});return (await rpc('deleteProject',{id,expectedProjectRevision:g.value.projectRevision})).ok;},{id});
console.log(JSON.stringify({status,errText,revHint:rev.match(/内容第\s*\d+\s*次变更[^\n]*/)?.[0]??null,deleted:del}));
await ctx.close();
