import {chromium} from 'playwright-core';
const b=await chromium.launch({args:['--no-sandbox']});
for(const [file,scheme] of [['light-workspace.html','light'],['dark-workspace.html','dark']]){
 const ctx=await b.newContext({viewport:{width:1440,height:1200},colorScheme:scheme});
 const p=await ctx.newPage();
 await p.goto('http://127.0.0.1:8765/'+file,{waitUntil:'networkidle'});
 await p.locator('.cs-steps button').nth(0).click();
 await p.waitForTimeout(600);
 const info=await p.evaluate(()=>{
   const r=document.querySelector('.cs-reply');
   if(!r)return {found:false};
   return {found:true,heading:r.querySelector('h4')?.textContent,chars:(r.querySelector('.cs-reply-text')?.textContent||'').length,hint:[...r.querySelectorAll('.cs-hint')].map(h=>h.textContent).join(' | '),width:Math.round(r.getBoundingClientRect().width)};
 });
 console.log(scheme,JSON.stringify(info));
 await p.screenshot({path:'.preview/shots/reply-'+scheme+'.png'});
 await ctx.close();
}
await b.close();
