import {chromium} from 'playwright-core';
const browser=await chromium.launch({headless:true});
for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width:1440,height:1100},colorScheme:theme});
 await page.goto(`http://127.0.0.1:8765/${theme}-workspace.html`,{waitUntil:'networkidle'});
 await page.waitForTimeout(400);
 const info=await page.evaluate(()=>{
  const box=document.querySelector('.cs-brief-actions');
  if(!box)return {found:false};
  const btn=[...box.querySelectorAll('button')].map(b=>({text:b.textContent,disabled:b.disabled}));
  return {found:true,buttons:btn,textarea:!!box.querySelector('textarea'),hint:box.querySelector('textarea')?.placeholder};
 });
 console.log(theme,JSON.stringify(info));
 if(theme==='light'){await page.locator('.cs-brief-actions').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await page.screenshot({path:'.preview/shots/brief-actions.png'});}
 await page.close();
}
await browser.close();
