import {chromium} from 'playwright-core';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
await page.goto('http://127.0.0.1:8765/light-workspace.html',{waitUntil:'networkidle'});
await page.waitForTimeout(800);
const out=[];
for(const label of ['需求','架构','审批','交接']){
  const btn=page.locator('.cs-steps button',{hasText:label}).first();
  await btn.click();
  await page.waitForTimeout(400);
  const info=await page.evaluate(()=>({steps:Array.from(document.querySelectorAll('.cs-steps button')).map(b=>({text:b.textContent,current:b.getAttribute('aria-current')})),blocks:document.querySelectorAll('.cs-block').length}));
  out.push({label,...info});
  await page.screenshot({path:`shots/stage-${label}.png`,fullPage:true});
}
console.log(JSON.stringify(out,null,1));
await browser.close();
