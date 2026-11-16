import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(900);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1600);
const probe=async(label)=>{
 const res=await page.evaluate(()=>{
  const nameOf=(el)=>{const al=el.getAttribute('aria-label');if(al)return al.trim();
   if(el.id){const l=document.querySelector(`label[for="${el.id}"]`);if(l)return (l.textContent||'').trim();}
   const wrap=el.closest('label');if(wrap)return (wrap.textContent||'').trim().slice(0,40);
   const t=(el.textContent||'').trim();if(t)return t.slice(0,40);
   const title=el.getAttribute('title');return title?title.trim():'';};
  return [...document.querySelectorAll('.creative-studio-root button,.creative-studio-root input,.creative-studio-root select,.creative-studio-root textarea')]
   .filter(el=>!el.closest('[hidden]')&&el.offsetParent!==null)
   .map(el=>({tag:el.tagName.toLowerCase(),name:nameOf(el),raw:/^[a-z]+[A-Z]/.test(nameOf(el))}))
   .filter(x=>!x.name||x.raw);
 });
 return {label,name:res};
};
const out={};
for(const [i,label] of [[0,'想法'],[1,'需求'],[2,'架构'],[3,'审批'],[4,'交接']]){
 await page.locator('.cs-steps button').nth(i).click();
 await page.waitForTimeout(900);
 out[label]=await probe(label);
}
console.log(JSON.stringify({out,errs}).slice(0,2500));
await ctx.close();
