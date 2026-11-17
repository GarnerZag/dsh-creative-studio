import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx<0?0:idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(900);
const m=await page.evaluate(()=>{
  const box=[...document.querySelectorAll('div')].find(d=>d.style.maskImage!==undefined&&d.style.maxHeight);
  const pane=box?.closest('.cs-pane-scroll');
  const r=(el)=>el?{top:Math.round(el.getBoundingClientRect().top),bottom:Math.round(el.getBoundingClientRect().bottom),h:el.clientHeight,scrollH:el.scrollHeight}:null;
  return {box:r(box),pane:r(pane),mask:box?.style.maskImage??null,paneMax:getComputedStyle(pane).maxHeight};
});
console.log(JSON.stringify(m));await ctx.close();
