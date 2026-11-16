import {chromium} from 'playwright-core';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://127.0.0.1:8765/light-workspace.html',{waitUntil:'networkidle'});
await page.waitForTimeout(600);
const info=await page.evaluate(()=>{
  const b=document.querySelector('.cs-rail-list button:not([aria-pressed="true"])');
  const s=b?getComputedStyle(b):null;
  return b&&s?{text:b.textContent,background:s.backgroundColor,backgroundImage:s.backgroundImage,border:s.borderColor,boxShadow:s.boxShadow,borderRadius:s.borderRadius}:null;
});
console.log(JSON.stringify(info,null,2));
await browser.close();
