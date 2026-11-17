import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(1200);
const before=await page.evaluate(()=>({btns:[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/Select all changes|Clear all|Approve/i.test(t))}));
const partial=page.locator('label:has-text("Approve selected changes only") input');
if(await partial.count()){await partial.check();await page.waitForTimeout(600);}
const res=await page.evaluate(()=>{
  const list=[...document.querySelectorAll('li input[type=checkbox]')];
  return{items:list.length,checked:list.filter(i=>i.checked).length};
});
const sel=page.getByRole('button',{name:'Select all changes'});
const has=await sel.count();
if(has){await sel.click();await page.waitForTimeout(600);}
const after=await page.evaluate(()=>{
  const list=[...document.querySelectorAll('li input[type=checkbox]')];
  return{items:list.length,checked:list.filter(i=>i.checked).length};
});
const clr=page.getByRole('button',{name:'Clear all'});let cleared=null;
if(await clr.count()){await clr.click();await page.waitForTimeout(500);cleared=await page.evaluate(()=>[...document.querySelectorAll('li input[type=checkbox]')].filter(i=>i.checked).length);}
console.log(JSON.stringify({before,res,after,cleared,hasSel:has,errs}));await ctx.close();
