import {chromium} from 'playwright-core';
const b=await chromium.launch();
for(const theme of ['light','dark']){
 const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.goto(`http://127.0.0.1:8765/${theme}-workspace.html`,{waitUntil:'networkidle'});
 await p.waitForTimeout(600);
 const info=await p.evaluate(()=>{
  const labels=Array.from(document.querySelectorAll('label')).filter(l=>/模型|Model/.test(l.textContent||''));
  return labels.map(l=>{const s=l.querySelector('select');return {text:(l.textContent||'').trim().slice(0,40),options:s?Array.from(s.options).map(o=>({v:o.value,t:o.textContent,group:o.parentElement?.tagName})):[],w:s?getComputedStyle(s).width:null};});
 });
 console.log(theme,JSON.stringify(info).slice(0,900));
 if(theme==='light'){await p.screenshot({path:'shots/model-select-light.png',fullPage:false});}
 await p.close();
}
await b.close();
