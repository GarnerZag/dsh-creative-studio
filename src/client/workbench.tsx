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
 return <section>
 <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
 <button aria-pressed={!layout.compare} onClick={()=>change({...layout,compare:false})}>{t('layoutExplore')}</button><button aria-pressed={layout.compare} onClick={()=>change({...layout,compare:true})}>{t('layoutCompare')}</button>
 <label>{t('layoutWidth')}<input type="range" min="30" max="70" value={split} onChange={e=>change({...layout,split:Number(e.target.value)})}/></label>
 <button aria-pressed={focus} onClick={()=>setFocus(!focus)}>{t('layoutFocus')}</button></div>
 <div ref={grid} style={{display:'grid',gridTemplateColumns:focus?'minmax(0,1fr)':`minmax(0,${split}fr) 10px minmax(0,${100-split}fr)`,gap:8,marginTop:12,alignItems:'start'}}>
 <div hidden={focus} style={{minWidth:0,display:focus?'none':'grid',gridTemplateRows:layout.compare?'minmax(220px,40vh) auto minmax(220px,40vh)':'auto auto auto',gap:8}}>
 <section hidden={layout.compare} style={{gridRow:1,maxHeight:'40vh',overflow:'auto',padding:8,border:'1px solid var(--dsw-alias-border-default, #d7dbe4)'}}>{idea}</section>
 <nav style={{gridRow:2,display:'flex',gap:6,flexWrap:'wrap'}}>{panels.filter(p=>!layout.compare||p.id!=='requirements').map(p=><button key={p.id} aria-pressed={visibleTab===p.id} onClick={()=>setTab(p.id)}>{p.label}</button>)}</nav>
 {panels.map(p=>{const top=layout.compare&&p.id==='requirements';return <div key={p.id} hidden={!top&&visibleTab!==p.id} style={{gridRow:top?1:3,minHeight:0,maxHeight:layout.compare?'40vh':'70vh',overflow:'auto',border:layout.compare?'1px solid var(--dsw-alias-border-default, #d7dbe4)':undefined}}>{p.content}</div>;})}
 </div>
 <div hidden={focus} role="separator" aria-label={t('layoutWidth')} aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(split)} tabIndex={focus?-1:0}
 onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();change({...layout,split:Math.max(30,Math.min(70,split+(e.key==='ArrowRight'?2:-2)))});}}}
 onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);resize(e.clientX);}}
 onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))resize(e.clientX);}}
 onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 style={{alignSelf:'stretch',minHeight:240,cursor:'col-resize',touchAction:'none',background:'var(--dsw-alias-border-default, #d7dbe4)',borderRadius:5}}/>
 <div style={{minWidth:0,position:'sticky',top:12}}>{demo(layout.compare)}</div>
 </div></section>;
}
