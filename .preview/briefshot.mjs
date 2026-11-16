import {chromium} from 'playwright-core';
const theme=process.argv[2]??'light';
const width=Number(process.argv[3]??1440);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width,height:1100},colorScheme:theme});
await page.goto(`http://127.0.0.1:8765/${theme}-workspace.html`,{waitUntil:'networkidle'});
await page.waitForTimeout(600);
const info=await page.evaluate(()=>{
 const brief=document.querySelector('.cs-brief');
 if(!brief)return {found:false};
 const rect=brief.getBoundingClientRect();
 return {found:true,intent:brief.querySelector('.cs-intent')?.textContent,
  notes:brief.querySelector('[role=status]')?.textContent??'',
  items:brief.querySelectorAll('.cs-brief-list li').length,
  width:Math.round(rect.width),top:Math.round(rect.top+window.scrollY)};
});
console.log(theme,width,JSON.stringify(info));
await page.locator('.cs-brief').scrollIntoViewIfNeeded().catch(()=>{});
if(theme==='light'&&width===1440)await page.screenshot({path:'.preview/shots/brief-light.png',fullPage:false});
await browser.close();
