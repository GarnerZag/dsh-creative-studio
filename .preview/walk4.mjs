import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1200}});
const page=ctx.pages()[0]??await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1800);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(1000);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
const steps=await page.locator('.cs-steps button').allInnerTexts();
const out={steps,errs};
for(const [i,name] of steps.entries()){
  await page.locator('.cs-steps button').nth(i).click();
  await page.waitForTimeout(900);
  await page.screenshot({path:`.preview/review/zh3-${i+1}-${['idea','req','arch','approve','handoff'][i]}.png`});
  out[name]=await page.locator('.cs-stage-body').innerText().then(t=>t.slice(0,400)).catch(()=>'');
}
console.log(JSON.stringify(out).slice(0,2000));
await ctx.close();
