import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('Structured handoff probe'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(0).click();await page.waitForTimeout(1200);
const out=await page.evaluate(()=>{
  const p=[...document.querySelectorAll('.cs-pane-scroll')].pop()??document.querySelector('.cs-stage-body');
  const status=[...p.querySelectorAll('.cs-job-status p')].map(e=>e.innerText.trim());
  const notes=[...p.querySelectorAll('.cs-submit-note')].map(e=>e.innerText.trim());
  return{status,notes};
});
console.log(JSON.stringify({...out,errs}));await ctx.close();
