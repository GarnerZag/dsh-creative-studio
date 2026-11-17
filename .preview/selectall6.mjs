import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,160)));page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const name='Select all probe '+Date.now();
const rpc=async(method,args)=>page.evaluate(async({method,args})=>{
  const rpcId=Math.random().toString(36).slice(2);
  const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId,method:'creativeStudio/'+method,payload:{args}})});
  return {ok:r.ok,body:await r.json()};
},{method,args});
const created=await rpc('createProject',{name});
console.log('RAW',JSON.stringify(created).slice(0,400));
let snap=(created.body?.result?.value?.project)??created.body?.result?.value ?? created.body?.result;
const id=snap.id, pr=snap.projectRevision, cr=snap.contentRevision;
let r=await rpc('editRequirements',{id,expectedProjectRevision:pr,expectedContentRevision:cr,change:{kind:'add',node:{id:'root',parentId:null,title:'base',kind:'goal',description:'d',priority:'normal',desktopAcceptance:['a'],mobileAcceptance:['a']}}});
let v1=r.body.result.value;let s=v1.project??v1;
let ap=await rpc('approveVersion',{id,expectedProjectRevision:s.projectRevision,expectedContentRevision:s.contentRevision,label:'PROBE',review:{baselineVersionId:null,acknowledgeUnverified:true}});
console.log('AP',JSON.stringify(ap).slice(0,500));
const v2=ap.body.result?.value; s=v2?.project??v2;
const er=await rpc('editRequirements',{id,expectedProjectRevision:s.projectRevision,expectedContentRevision:s.contentRevision,change:{kind:'rename',id:'root',title:'base renamed'}});
console.log('created',JSON.stringify({id,ok:er.body.result.ok}));
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(1500);
const back=page.getByRole('button',{name:'← All projects'});
if(await back.count()){await back.click();await page.waitForTimeout(900);}
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes(name));
console.log('CARD_IDX',idx);
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1600);
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(1200);
await page.locator('label:has-text("Approve selected changes only") input').check();
await page.waitForTimeout(900);
const snapUI=async()=>page.evaluate(()=>{
  const btn=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Select all changes');
  if(!btn)return{noToolbar:true};
  const ul=btn.parentElement.nextElementSibling;
  const list=ul?[...ul.querySelectorAll('input[type=checkbox]')]:[];
  return{items:list.length,checked:list.filter(i=>i.checked).length};});
const before=await snapUI();
await page.getByRole('button',{name:'Select all changes'}).click();await page.waitForTimeout(700);
const after=await snapUI();
await page.getByRole('button',{name:'Clear all'}).click();await page.waitForTimeout(600);
const cleared=await snapUI();
console.log(JSON.stringify({before,after,cleared,errs}));
// cleanup
const cur=(await rpc('getProject',{id})).body.result.value;
await rpc('deleteProject',{id,expectedProjectRevision:cur.projectRevision});
await ctx.close();
