import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,160)));page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(1200);
const out=await page.evaluate(()=>{
  const sec=[...document.querySelectorAll('section')].find(s=>s.textContent.includes('Approve and freeze'));
  const scope=sec??document.body;
  const labels=[...scope.querySelectorAll('label')].map(l=>l.textContent.trim().slice(0,80));
  const partial=[...scope.querySelectorAll('input[type=checkbox]')].length;
  return{found:!!sec,labels,boxes:partial};
});
console.log(JSON.stringify(out));await ctx.close();
