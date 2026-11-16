import {chromium} from 'playwright-core';
const exe='/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
const browser=await chromium.launch({executablePath:exe});
for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:1440,height:1400}});
  await page.goto(`http://127.0.0.1:8765/${theme}-workspace.html`,{waitUntil:'networkidle'});
  await page.waitForTimeout(600);
  const info=await page.evaluate(()=>{
    const labels=[...document.querySelectorAll('.creative-studio-root label')];
    const effort=labels.find(l=>l.textContent.startsWith('思考强度'));
    if(!effort)return {found:false};
    const sel=effort.querySelector('select');
    return {found:true,options:[...sel.options].map(o=>`${o.value||'(model default)'}=${o.textContent}`),value:sel.value};
  });
  console.log(theme,JSON.stringify(info));
  await page.screenshot({path:`shots/effort-${theme}.png`});
  await page.close();
}
await browser.close();
