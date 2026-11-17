import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('Structured handoff probe'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(4).click();await page.waitForTimeout(1500);
const btn=page.getByRole('button',{name:/Re-check|Check readiness|重新检查|检查/}).first();
if(await btn.count()){await btn.click();await page.waitForTimeout(2000);}
const out=await page.evaluate(()=>{
  const pane=[...document.querySelectorAll('.cs-pane-scroll')].pop()??document.querySelector('.cs-stage-body');
  return {blockers:[...pane.querySelectorAll('li.cs-blocker')].map(e=>e.innerText.replace(/\s+/g,' ').slice(0,80)),
          warnings:[...pane.querySelectorAll('li.cs-warn')].map(e=>e.innerText.replace(/\s+/g,' ').slice(0,80)),
          warnHeading:pane.querySelector('.cs-warn-item strong')?.textContent??null};
});
console.log(JSON.stringify({...out,errs}));await ctx.close();
