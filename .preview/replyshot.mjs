import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1000}});
const page=await ctx.newPage();page.on('dialog',d=>d.accept());
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1400);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(0).click();await page.waitForTimeout(1200);
const refresh=page.getByRole('button',{name:'Refresh session reply'});
if(await refresh.count()){await refresh.first().click();await page.waitForTimeout(2500);}
const block=page.locator('.cs-reply');
const n=await block.count();
let info={blocks:n};
if(n){const txt=await block.first().innerText();info.len=txt.length;info.head=txt.slice(0,160).replace(/\n+/g,' / ');await block.first().scrollIntoViewIfNeeded();await page.waitForTimeout(400);await block.first().screenshot({path:'review/reply.png'}).catch(()=>{});}
console.log(JSON.stringify(info));await ctx.close();
