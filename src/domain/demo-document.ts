import {validateScene,type DemoScene} from './demo.js';
/** Trusted runtime only. Scene values enter textContent/value, never markup. */
function runtime(){
 const scene=JSON.parse(document.getElementById('scene')!.textContent!) as DemoScene;
 let state={...scene.state},cursor=0,timer:ReturnType<typeof setInterval>|undefined;
 const root=document.getElementById('root')!;
 const execute=(id:string)=>{const action=scene.actions.find(a=>a.id===id);if(action)for(const c of action.changes)state[c.key]=c.value;render();};
 function render(){
  for(const c of scene.components){
   let box=root.querySelector<HTMLElement>(`[data-component="${CSS.escape(c.id)}"]`);
   if(!box){box=document.createElement('section');box.dataset.component=c.id;root.append(box);}
   if(c.kind==='input'&&box.querySelector('input')){const input=box.querySelector('input')!;const value=String(state[c.binding]);if(input.value!==value)input.value=value;continue;}
   box.replaceChildren();box.hidden=c.kind==='notice'&&!state[c.binding];
   if(box.hidden)continue;
   const label=document.createElement('label');label.textContent=c.label;box.append(label);
   if(c.kind==='input'){const input=document.createElement('input');input.value=String(state[c.binding]);input.setAttribute('aria-label',c.label);input.oninput=()=>{state[c.binding]=input.value;render();};box.append(input);}
   if(c.kind==='button'){const button=document.createElement('button');button.textContent=c.label;label.remove();button.onclick=()=>execute(c.actionId);box.append(button);}
   if(c.kind==='list'){const list=document.createElement('ul');const query=String(state[c.binding]).toLocaleLowerCase();for(const row of c.rows.filter(row=>row.toLocaleLowerCase().includes(query))){const li=document.createElement('li');li.textContent=row;list.append(li);}box.append(list);}
  }
 }
 const pause=()=>{if(timer!==undefined)clearInterval(timer);timer=undefined;};
 document.getElementById('play')!.onclick=()=>{pause();timer=setInterval(()=>{const step=scene.steps[cursor++];if(!step){pause();return;}if('actionId'in step)execute(step.actionId);else{const c=scene.components.find(c=>c.id===step.componentId);if(c?.kind==='input')state[c.binding]=step.value;render();}document.getElementById('progress')!.textContent=`${cursor} / ${scene.steps.length}`;},900);};
 document.getElementById('pause')!.onclick=pause;
 document.getElementById('reset')!.onclick=()=>{pause();cursor=0;state={...scene.state};render();document.getElementById('progress')!.textContent='0';};
 window.addEventListener('pagehide',pause);
 document.getElementById('title')!.textContent=scene.title;render();
}
export function demoDocument(input:unknown,nonce:string):string{
 const scene=validateScene(input);
 if(!/^[a-zA-Z0-9_-]+$/.test(nonce))throw new Error('INVALID_NONCE');
 const data=JSON.stringify(scene).replace(/</g,'\\u003c');
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'"><style>body{font:16px system-ui;margin:0;background:#f4f5fa;color:#172033;padding:24px}header{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#root{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px}section{background:white;border:1px solid #dde1ed;border-radius:12px;padding:16px;animation:enter .2s ease}input{display:block;box-sizing:border-box;width:100%;padding:12px;margin-top:8px}button{padding:10px 16px;border:0;border-radius:8px;background:#534ddd;color:white;cursor:pointer}li{padding:12px;border-bottom:1px solid #eee}label{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:600px){body{padding:12px}#root{grid-template-columns:1fr}button{min-height:44px}}@keyframes enter{from{opacity:.6;transform:translateY(3px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){section{animation:none}}</style></head><body><h2 id="title"></h2><p>交互原型 · 模拟数据 / Prototype · mock data</p><header><button id="play">播放 / Play</button><button id="pause">暂停 / Pause</button><button id="reset">重置 / Reset</button><span id="progress">0</span></header><main id="root"></main><script type="application/json" id="scene">${data}</script><script nonce="${nonce}">(${runtime.toString()})();</script></body></html>`;
}
