import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx<0?0:idx).click();
await page.waitForTimeout(1500);
const steps=page.locator('.cs-steps button');
const n=await steps.count();
const out=[];
for(let i=0;i<n;i++){await steps.nth(i).click();await page.waitForTimeout(900);
  await page.screenshot({path:`review/st${i+1}.png`});
  out.push({i:i+1,label:(await steps.nth(i).textContent())?.trim(),texts:(await page.locator('.cs-stage-body').innerText()).slice(0,300)});}
console.log(JSON.stringify({stages:out.length,errs}));
await ctx.close();
