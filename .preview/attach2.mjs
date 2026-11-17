import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1000}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1500);
const cards=await page.locator('.cs-project-card').allTextContents();
const out={cards,errs};
if(cards.length){
 await page.locator('.cs-project-card').first().click();await page.waitForTimeout(1500);
 await page.locator('.cs-steps button').nth(0).click();await page.waitForTimeout(1000);
 const panel=page.locator('.cs-attachments');
 out.panel=await panel.count();
 if(out.panel){out.text=(await panel.innerText()).slice(0,200).replace(/\n/g,' | ');
  await page.locator('.cs-attachments input[type=file]').setInputFiles({name:'too-big.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(4*1024*1024,65)});
  await page.waitForTimeout(1200);
  out.alert=await page.locator('.cs-attachments [role=alert]').innerText().catch(()=>null);
 }}
console.log(JSON.stringify(out));await ctx.close();
