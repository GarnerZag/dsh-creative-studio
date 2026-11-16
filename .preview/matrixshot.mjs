import {chromium} from 'playwright-core';
const b=await chromium.launch();
for(const [theme,file] of [['light','light-workspace.html'],['dark','dark-workspace.html']]){
 const p=await b.newPage({viewport:{width:1440,height:1200}});
 await p.goto(`http://127.0.0.1:8765/${file}`,{waitUntil:'networkidle'});
 await p.waitForTimeout(700);
 const info=await p.evaluate(()=>{
  const refs=document.querySelector('.cs-table-refs');
  const matrix=document.querySelector('.cs-table-matrix');
  const disp=document.querySelector('.cs-disclosure');
  return {refsRows:refs?refs.querySelectorAll('tbody tr').length:0,
          matrixRows:matrix?matrix.querySelectorAll('tbody tr').length:0,
          matrixCols:matrix?matrix.querySelectorAll('thead th').length:0,
          disclosuresOpen:Array.from(document.querySelectorAll('.cs-disclosure')).filter(d=>d.open).length,
          open:disp?disp.open:null};
 });
 console.log(theme,JSON.stringify(info));
 await p.screenshot({path:`shots/matrix-${theme}.png`,fullPage:true});
 await p.close();
}
await b.close();
