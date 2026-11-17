import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1300);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(1000);
const out=await page.evaluate(()=>{
  const opts=(sel)=>[...document.querySelectorAll(sel)].map(o=>o.textContent.trim());
  const all=opts('select[aria-label="Parent"] option');
  const btns=[...document.querySelectorAll('svg button[aria-pressed]')];
  const res=[];
  for(const b of btns.slice(0,4)){b.click();}
  return{all:all.slice(0,12)};
});
// select a non-root node then read options
await page.locator('svg button[aria-pressed]').nth(1).click();await page.waitForTimeout(700);
const rootOut=await page.evaluate(()=>[...document.querySelectorAll('select[aria-label="Parent"] option')].map(o=>o.textContent.trim()).length);
const out2=await page.evaluate(()=>{
  const title=document.querySelector('[data-cs-title-input]')?.value;
  const opts=[...document.querySelectorAll('select[aria-label="Parent"] option')].map(o=>o.textContent.trim());
  return{title,count:opts.length,opts:opts.slice(0,14)};
});
console.log(JSON.stringify({rootOut,out2,errs}));
await ctx.close();
