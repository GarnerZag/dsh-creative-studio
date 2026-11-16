import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://127.0.0.1:8765/'+process.argv[2]);
await p.waitForTimeout(400);
const out=await p.evaluate(()=>{
 const bad=[];
 for(const el of document.querySelectorAll('*')){
  const s=getComputedStyle(el);
  const vals={};
  for(const k of ['marginTop','marginBottom','marginLeft','marginRight','paddingTop','paddingBottom','paddingLeft','paddingRight','rowGap','columnGap']){
   const v=parseFloat(s[k]); if(!Number.isFinite(v)||v===0)continue;
   if(Math.abs(v/4-Math.round(v/4))>0.001)vals[k]=Math.round(v*100)/100;
  }
  if(Object.keys(vals).length)bad.push({tag:el.tagName.toLowerCase(),cls:el.className&&String(el.className).slice(0,40),vals});
 }
 return bad.slice(0,25);
});
console.log(JSON.stringify(out,null,1));
await b.close();
