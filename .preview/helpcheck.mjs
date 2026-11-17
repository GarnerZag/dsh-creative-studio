import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1000}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1300);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(800);
const s=page.locator('.cs-help summary');
const out={count:await s.count(),open0:await page.locator('.cs-help').evaluate(e=>e.open)};
if(out.count){await s.click();await page.waitForTimeout(300);out.open1=await page.locator('.cs-help').evaluate(e=>e.open);out.text=(await page.locator('.cs-help').innerText()).replace(/\n+/g,' | ').slice(0,200);}
out.hintCount=await page.locator('.cs-hint').count();
console.log(JSON.stringify({...out,errs}));await ctx.close();
