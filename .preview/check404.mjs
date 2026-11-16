import {chromium} from 'playwright-core';
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage();
p.on('response',r=>{if(r.status()>=400)console.log(r.status(),r.url());});
await p.goto('http://127.0.0.1:8765/light-workspace.html',{waitUntil:'networkidle'});
await b.close();
