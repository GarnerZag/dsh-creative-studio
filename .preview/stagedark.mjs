import {chromium} from 'playwright-core';
const browser=await chromium.launch();
for(const [name,scheme,w] of [['dark',true,1440],['light390',false,390]]){
  const page=await browser.newPage({viewport:{width:w,height:1000},deviceScaleFactor:2,colorScheme:scheme?'dark':'light'});
  await page.goto(`http://127.0.0.1:8765/${scheme?'dark':'light'}-workspace.html`,{waitUntil:'networkidle'});
  await page.waitForTimeout(700);
  await page.locator('.cs-steps button',{hasText:'需求'}).first().click();
  await page.waitForTimeout(400);
  const m=await page.evaluate(()=>{const c=document.querySelector('.cs-canvas-column'),i=document.querySelector('.cs-inspector');return{canvas:c?Math.round(c.getBoundingClientRect().width):null,inspector:i?Math.round(i.getBoundingClientRect().width):null,scrollW:document.documentElement.scrollWidth,inner:innerWidth};});
  console.log(name,JSON.stringify(m));
  await page.screenshot({path:`shots/stage-req-${name}.png`,fullPage:true});
  await page.close();
}
await browser.close();
