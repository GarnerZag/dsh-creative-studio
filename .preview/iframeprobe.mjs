import {chromium} from 'playwright-core';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:390,height:900}});
await p.goto('http://127.0.0.1:8765/light-workspace.html',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const info=await p.evaluate(()=>{
  const frames=Array.from(document.querySelectorAll('.cs-demo-pane iframe'));
  return frames.map(f=>({title:f.title,w:f.getBoundingClientRect().width,h:f.getBoundingClientRect().height,boxH:f.parentElement.getBoundingClientRect().height}));
});
console.log(JSON.stringify(info));
const inner=await p.frames().map(f=>f.name()).length;
console.log('frames',inner);
const texts=[];
for(const f of p.frames()){try{const t=await f.evaluate(()=>document.body.innerText.slice(0,40));texts.push(t);}catch{}}
console.log(JSON.stringify(texts));
await b.close();
