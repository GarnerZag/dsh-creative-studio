import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:900},acceptDownloads:true});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1300);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(900);
const btn=page.getByRole('button',{name:'Export as text'});
const count=await btn.count();
let info={count,errs};
if(count){
 const [dl]=await Promise.all([page.waitForEvent('download',{timeout:15000}).catch(()=>null),btn.first().click()]);
 if(dl){const path=await dl.path();const fs=await import('node:fs');const text=fs.readFileSync(path,'utf8');info={count,name:dl.suggestedFilename(),head:text.split('\n').slice(0,12),len:text.length,errs};}
}
console.log(JSON.stringify(info));await ctx.close();
