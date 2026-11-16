import {chromium} from 'playwright-core';
const b=await chromium.launch({args:['--no-sandbox']});
for(const f of ['light-workspace.html','dark-workspace.html']){
 const ctx=await b.newContext({viewport:{width:1440,height:1200},colorScheme:f.startsWith('dark')?'dark':'light'});
 const p=await ctx.newPage();
 await p.goto('http://127.0.0.1:8765/'+f,{waitUntil:'networkidle'});
 await p.locator('.cs-steps button').nth(0).click();
 await p.waitForTimeout(300);
 const box=p.locator('.cs-brief-actions');
 console.log(f, JSON.stringify({present:await box.count(),buttons:await box.locator('button').evaluateAll(bs=>bs.map(x=>({text:x.textContent,disabled:x.disabled}))),textarea:await box.locator('textarea').count()}));
 await p.screenshot({path:'.preview/shots/brief-actions-'+(f.startsWith('dark')?'dark':'light')+'.png'});
 await ctx.close();
}
await b.close();
