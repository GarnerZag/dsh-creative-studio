import {chromium} from 'playwright';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',viewport:{width:390,height:900}});
const page=await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'Creative Studio'}).click({timeout:60000});
await page.waitForTimeout(1200);
const idx=(await page.locator('.cs-project-card').allTextContents()).findIndex(t=>t.includes('Structured handoff probe'));
await page.locator('.cs-project-card').nth(idx).click();await page.waitForTimeout(1500);
const over=async(label)=>{const r=await page.evaluate(()=>{const de=document.documentElement;const bad=[...document.querySelectorAll('button,input,select,textarea,.cs-card,article,section')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>window.innerWidth+1||b.left<-1);}).slice(0,4).map(e=>`${e.tagName}.${(e.className||'').toString().slice(0,20)}`);return{w:de.scrollWidth,vw:window.innerWidth,bad};});return{label,...r};};
const out=[];
for(const [i,name] of [[3,'approval'],[4,'handoff']]){await page.locator('.cs-steps button').nth(i).click();await page.waitForTimeout(1200);await page.screenshot({path:'review/m390-'+name+'.png',fullPage:false});out.push(await over(name));}
console.log(JSON.stringify({out,errs}));await ctx.close();
