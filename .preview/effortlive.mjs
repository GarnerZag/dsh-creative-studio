import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1600,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
await page.getByText('Creative Studio',{exact:true}).first().click();
await page.waitForTimeout(1500);
const card=page.locator('.cs-project-card').first();
if(await card.count()){await card.click();await page.waitForTimeout(1800);}
const dump=async()=>page.evaluate(()=>[...document.querySelectorAll('.creative-studio-root label')].filter(l=>l.querySelector('select')).map(l=>({label:l.textContent.slice(0,24),options:[...l.querySelector('select').options].map(o=>o.textContent).slice(0,6),value:l.querySelector('select').value})));
console.log('BEFORE',JSON.stringify(await dump()));
const effort=page.locator('.creative-studio-root label',{hasText:'思考强度'}).first();
if(await effort.count()){
  const sel=effort.locator('select');
  const vals=await sel.locator('option').evaluateAll(os=>os.map(o=>o.value));
  const pickVals=vals.filter(v=>v);
  if(pickVals.length){
    const target=pickVals[pickVals.length-1];
    await sel.selectOption(target);
    await page.waitForTimeout(400);
    console.log('PICKED',target);
  }
}
console.log('AFTER',JSON.stringify(await dump()));
await page.screenshot({path:'.preview/shots/effort-live.png'});
await ctx.close();
