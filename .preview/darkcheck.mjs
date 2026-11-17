import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:1440,height:1000}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.emulateMedia({colorScheme:'dark'});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});await page.waitForTimeout(1300);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('考研市场中台'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(800);
const search=page.locator('.cs-canvas-search input');
if(await search.count()){await search.fill('会话');await page.waitForTimeout(600);}
await page.locator('main.creative-studio-root').evaluate(el=>{el.scrollTop=420;});
await page.waitForTimeout(500);
await page.screenshot({path:'review/dark-canvas.png',clip:{x:300,y:60,width:1140,height:900}});
console.log(JSON.stringify({errs}));await ctx.close();
