import {chromium} from 'playwright-core';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:1200}});
await p.goto('http://127.0.0.1:8765/light-workspace.html',{waitUntil:'networkidle'});
await p.waitForTimeout(500);
console.log('steps',await p.$$eval('.cs-steps button',bs=>bs.map(b=>b.textContent)));
await p.click('.cs-steps button >> nth=1');
await p.waitForTimeout(700);
const info=await p.evaluate(()=>{
 const refs=document.querySelector('.cs-table-refs');
 const matrix=document.querySelector('.cs-table-matrix');
 return {refs:refs?{rows:refs.querySelectorAll('tbody tr').length,cols:refs.querySelectorAll('thead th').length}:null,
         matrix:matrix?{rows:matrix.querySelectorAll('tbody tr').length,cols:matrix.querySelectorAll('thead th').length}:null,
         chips:document.querySelectorAll('.cs-chip').length};
});
console.log(JSON.stringify(info));
await p.screenshot({path:'shots/matrix-light.png',fullPage:true});
await b.close();
