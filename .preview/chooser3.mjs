import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1150}});
const page=await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1400);
const out=await page.evaluate(()=>{
  const raw=[...document.querySelectorAll('.creative-studio-root *')].map(e=>e.textContent??'').join(' ');
  const cards=[...document.querySelectorAll('.cs-projects article, .cs-projects .cs-card, .cs-steps-guide div')].map(e=>e.innerText.replace(/\n+/g,' | ')).slice(0,5);
  return{hasRawKey:raw.includes('chooserStep'),cards};
});
console.log(JSON.stringify({...out,errs}));await ctx.close();
