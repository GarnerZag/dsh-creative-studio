import * as React from 'react';
import {parseLayout} from './layout.js';
export function Workbench({projectId,idea,panels,demo,t}:{projectId:string;idea:React.ReactNode;panels:{id:string;label:string;content:React.ReactNode}[];demo:(compare:boolean)=>React.ReactNode;t:(key:string)=>string}):React.ReactElement{
 const key=`creative-studio-layout:${projectId}`;
 const [layout,setLayout]=React.useState(()=>{try{return parseLayout(localStorage.getItem(key));}catch{return parseLayout(null);}});
 const [tab,setTab]=React.useState('requirements');const [focus,setFocus]=React.useState(false);
 const grid=React.useRef<HTMLDivElement>(null);
 const split=layout.split;
 const change=(next:typeof layout)=>{setLayout(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{/* storage is optional */}};
 const resize=(x:number)=>{const box=grid.current?.getBoundingClientRect();if(box&&box.width>0)change({...layout,split:Math.max(30,Math.min(70,(x-box.left)/box.width*100))});};
 const compareTab=tab==='requirements'?(panels.find(p=>p.id==='references')?.id??panels.find(p=>p.id!=='requirements')?.id):tab;
 const visibleTab=layout.compare?compareTab:tab;
 return <section className="cs-workbench">
 <div className="cs-toolbar">
 <button type="button" aria-pressed={!layout.compare} onClick={()=>change({...layout,compare:false})}>{t('layoutExplore')}</button><button type="button" aria-pressed={layout.compare} onClick={()=>change({...layout,compare:true})}>{t('layoutCompare')}</button>
 <label className="cs-inline-field"><span>{t('layoutWidth')}</span><input type="range" min="30" max="70" value={split} onChange={e=>change({...layout,split:Number(e.target.value)})}/></label>
 <button type="button" aria-pressed={focus} onClick={()=>setFocus(!focus)}>{t('layoutFocus')}</button></div>
 <div ref={grid} className="cs-grid" style={{gridTemplateColumns:focus?'minmax(0,1fr)':`minmax(0,${split}fr) 12px minmax(0,${100-split}fr)`,gap:12,marginTop:12,alignItems:'start'}}>
 <div hidden={focus} className="cs-left" style={{minWidth:0,display:focus?'none':'grid',gridTemplateRows:layout.compare?'minmax(220px,40vh) auto minmax(220px,40vh)':'auto auto auto',gap:12}}>
 <section hidden={layout.compare} className="cs-pane" style={{gridRow:1,maxHeight:'40vh',overflow:'auto'}}>{idea}</section>
 <nav className="cs-tabs" style={{gridRow:2}}>{panels.filter(p=>!layout.compare||p.id!=='requirements').map(p=><button type="button" key={p.id} aria-pressed={visibleTab===p.id} onClick={()=>setTab(p.id)}>{p.label}</button>)}</nav>
 {panels.map(p=>{const top=layout.compare&&p.id==='requirements';return <div key={p.id} hidden={!top&&visibleTab!==p.id} className={layout.compare?'cs-pane':undefined} style={{gridRow:top?1:3,minHeight:0,maxHeight:layout.compare?'40vh':'70vh',overflow:'auto'}}>{p.content}</div>;})}
 </div>
 <div hidden={focus} role="separator" aria-label={t('layoutWidth')} aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(split)} tabIndex={focus?-1:0}
 onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();change({...layout,split:Math.max(30,Math.min(70,split+(e.key==='ArrowRight'?2:-2)))});}}}
 onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);resize(e.clientX);}}
 onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))resize(e.clientX);}}
 onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 className="cs-split"/>
 <div className="cs-demo-pane" style={{minWidth:0,position:'sticky',top:12}}>{demo(layout.compare)}</div>
 </div></section>;
}
