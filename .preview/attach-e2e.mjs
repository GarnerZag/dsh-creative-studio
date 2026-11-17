import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1000}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,160)));page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1500);
const cards=await page.locator('.cs-project-card').allTextContents();
const target=cards.findIndex(t=>t.includes('考研市场中台开发'));
const idx=target>=0?target:0;
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1600);
await page.locator('.cs-steps button').nth(0).click();await page.waitForTimeout(900);
const out={project:cards[idx].slice(0,30),errs};
const md='# 需求文档\n\n希望支持批量导出，并且能按模块筛选。\n';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
const input=page.locator('.cs-attachments input[type=file]');
await input.setInputFiles({name:'需求草稿.md',mimeType:'text/markdown',buffer:Buffer.from(md)});
await page.waitForTimeout(2500);
await input.setInputFiles({name:'首页截图.png',mimeType:'image/png',buffer:png});
await page.waitForTimeout(3000);
const items=page.locator('.cs-attachment-list li');
out.count=await items.count();
out.names=await items.locator('.cs-attachment-name').allTextContents();
out.thumbs=await page.locator('.cs-attachment-list img').count();
const alertText=await page.locator('.cs-attachments [role=alert]').innerText().catch(()=>null);
if(alertText)out.alert=alertText;
// expand the image preview
const imgBtn=items.filter({hasText:'首页截图.png'}).locator('.cs-attachment-open');
if(await imgBtn.count()){await imgBtn.first().click();await page.waitForTimeout(800);out.preview=await page.locator('.cs-attachment-preview').count();}
await page.screenshot({path:'review/attachments-e2e.png'}).catch(()=>{});
// remove the markdown file
const mdItem=items.filter({hasText:'需求草稿.md'});
const rm=mdItem.locator('button.cs-quiet');
if(await rm.count()){await rm.first().click();await page.waitForTimeout(2500);}
out.afterRemove=await page.locator('.cs-attachment-list li').count();
const snap=await page.evaluate(async()=>{const call=async(method,args)=>{const rpcId='x'+Math.random().toString(36).slice(2);const r=await fetch('/api/creativeStudio/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId,method:'creativeStudio/'+method,payload:{args}})});return (await r.json()).result;};
 const list=await call('listProjects',{});const id=list.value[0]&&list.value[0].id;const full=await call('getProject',{id});
 return {revision:full.value&&full.value.projectRevision,attachments:(full.value&&full.value.attachments||[]).map(a=>[a.name,a.kind,a.size])};});
out.snapshot=snap;
console.log(JSON.stringify(out));await ctx.close();
