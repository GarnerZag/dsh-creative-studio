import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1400,height:1000}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1300);
const cards=await page.locator('.cs-project-card').count();
let info={cards,errs};
if(cards){await page.locator('.cs-project-card').first().click();await page.waitForTimeout(1500);
 await page.locator('.cs-steps button').nth(0).click();await page.waitForTimeout(900);
 info.panel=await page.locator('.cs-attachments').count();
 info.label=info.panel?await page.locator('.cs-attachments').first().innerText():'';
 info.fileInput=await page.locator('.cs-attachments input[type=file]').count();}
console.log(JSON.stringify(info));await ctx.close();
