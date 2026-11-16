import {chromium} from 'playwright-core';
const b=await chromium.launch({args:['--no-sandbox']});
for(const page of ['light-workspace.html','dark-workspace.html']){
 const ctx=await b.newContext({viewport:{width:1440,height:1100},colorScheme:page.startsWith('dark')?'dark':'light'});
 const p=await ctx.newPage();
 await p.goto('http://127.0.0.1:8765/'+page,{waitUntil:'networkidle'});
 await p.locator('.cs-steps button').nth(0).click();
 await p.waitForTimeout(400);
 const editBtn=p.getByRole('button',{name:'修正理解'});
 const present=await editBtn.count();
 if(!present){console.log(page,'NO_EDIT_BUTTON');await ctx.close();continue;}
 await editBtn.first().click();
 await p.waitForTimeout(400);
 const labels=await p.locator('.cs-brief label').evaluateAll(ls=>ls.map(l=>l.querySelector('label')?.textContent??l.textContent.slice(0,10)));
 const fields=await p.locator('.cs-brief form label').evaluateAll(ls=>ls.map(l=>l.textContent.slice(0,12)));
 const restated=await p.locator('.cs-brief form textarea').first().inputValue();
 const intent=await p.locator('.cs-brief form select').first().inputValue();
 console.log(page,JSON.stringify({fields,restated:restated.slice(0,24),intent}));
 await p.screenshot({path:'.preview/shots/brief-edit-'+(page.startsWith('dark')?'dark':'light')+'.png'});
 await ctx.close();
}
await b.close();
