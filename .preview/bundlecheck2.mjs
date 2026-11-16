import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true});
const page=ctx.pages()[0]??await ctx.newPage();
let target=null;
page.on('response',r=>{const u=r.url();if(u.includes('creative-studio'))target=u;});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
if(!target){await page.getByText('Creative Studio',{exact:true}).first().click().catch(()=>{});await page.waitForTimeout(3000);}
console.log('URL',target?target.slice(0,80):'NONE','...len',target?.length??0);
if(target){
 const out=await page.evaluate(async({url})=>{const r=await fetch(url);const t=await r.text();return {status:r.status,len:t.length,effortLabel:t.includes('思考强度'),reasoning:t.includes('reasoningEffort'),modelDefault:t.includes('默认模型')};},{url:target});
 console.log(JSON.stringify(out));
}
await ctx.close();
