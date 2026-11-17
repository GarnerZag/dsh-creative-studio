import * as React from 'react';
import {parseLayout} from './layout.js';
import {hasUnsavedEdits} from './dirty.js';

export interface StageBlock { id: string; label: string; content: React.ReactNode }
export interface Stage { id: string; label: string; hint: string; blocks: StageBlock[]; badge?: string }

export function Workbench({projectId,stages,demo,t}:{projectId:string;stages:Stage[];demo:(compare:boolean)=>React.ReactNode;t:(key:string)=>string}):React.ReactElement{
  const key=`creative-studio-layout:${projectId}`;
  const [layout,setLayout]=React.useState(()=>{try{return parseLayout(localStorage.getItem(key));}catch{return parseLayout(null);}});
  const stageKey=`creative-studio-stage:${projectId}`;
  const [stage,setStage]=React.useState(()=>{try{const saved=localStorage.getItem(stageKey);return stages.some(s=>s.id===saved)?String(saved):stages[0]?.id??'';}catch{return stages[0]?.id??'';}});
  const [focus,setFocus]=React.useState(false);
  const grid=React.useRef<HTMLDivElement>(null);
  const shell=React.useRef<HTMLElement>(null);
  const [narrow,setNarrow]=React.useState(false);
  React.useEffect(()=>{const el=shell.current;if(!el)return;const observer=new ResizeObserver(()=>setNarrow(el.clientWidth<1080));observer.observe(el);setNarrow(el.clientWidth<1080);return()=>observer.disconnect();},[]);
  const split=layout.split;
  const goStage=(id:string)=>{setStage(id);try{localStorage.setItem(stageKey,id);}catch{/* storage is optional */}};
  const change=(next:typeof layout)=>{setLayout(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{/* storage is optional */}};
  const resize=(x:number)=>{const box=grid.current?.getBoundingClientRect();if(box&&box.width>0)change({...layout,split:Math.max(30,Math.min(70,(x-box.left)/box.width*100))});};
  const active=stages.find(s=>s.id===stage)??stages[0]??{id:'',label:'',hint:'',blocks:[]};
  const requirementStage=stages.find(s=>s.id==='requirements');
  const compare=layout.compare;
  const showRequirementPane=compare&&Boolean(requirementStage);
  const showStagePane=!compare||active.id!=='requirements';
  const singlePane=!(showRequirementPane&&showStagePane);
  const paneClass=`cs-pane cs-pane-scroll${singlePane?' cs-pane-single':''}`;
  const scrollTo=(id:string)=>{const el=document.getElementById('cs-block-'+id);if(!el)return;const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;el.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});};
  // In-stage jump links: a stage can stack several blocks and the editor alone is taller than the viewport.
  const blocks=(list:StageBlock[],withNav=false)=><>
    {withNav&&list.length>1&&<nav className="cs-block-nav" aria-label={t('blocksNav')}><span className="cs-block-nav-label">{t('blocksNav')}{t('labelSep')}</span>{list.map(block=><button key={block.id} type="button" className="cs-quiet" onClick={()=>scrollTo(block.id)}>{block.label}</button>)}</nav>}
    {list.map(block=><section key={block.id} id={withNav?`cs-block-${block.id}`:undefined} className="cs-block" aria-label={block.label}>{block.content}</section>)}
  </>;
  return <section className="cs-workbench" ref={shell}>
    <ol className="cs-steps" aria-label={t('stages')}>{stages.map((item,index)=><li key={item.id}><button type="button" aria-current={active.id===item.id?'step':undefined} onClick={()=>{if(item.id!==stage&&hasUnsavedEdits()&&!window.confirm(t('discardStageEdit')))return;goStage(item.id);}}><span className="cs-step-index" aria-hidden="true">{index+1}</span>{item.label}{item.badge&&<small className="cs-step-badge">{item.badge}</small>}</button></li>)}</ol>
    <div className="cs-toolbar">
      {!narrow&&<button type="button" title={t('layoutExploreHint')} aria-pressed={!compare} onClick={()=>change({...layout,compare:false})}>{t('layoutExplore')}</button>}
      {!narrow&&<button type="button" title={t('layoutCompareHint')} aria-pressed={compare} onClick={()=>change({...layout,compare:true})}>{t('layoutCompare')}</button>}
      {!narrow&&!compare&&!focus&&<label className="cs-inline-field" title={t('layoutWidthHint')}><span>{t('layoutWidth')}</span><input type="range" min="30" max="70" value={split} onChange={e=>change({...layout,split:Number(e.target.value)})}/></label>}
      <button type="button" title={t('layoutFocusHint')} aria-pressed={focus} onClick={()=>setFocus(!focus)}>{t('layoutFocus')}</button>
      {narrow&&!focus&&<span className="cs-hint cs-narrow-hint">{t('layoutNarrowHint')}</span>}
    </div>
    {!compare&&<p className="cs-hint cs-stage-hint">{active.hint}</p>}
    <div ref={grid} className="cs-grid" style={{gridTemplateColumns:focus||compare?'minmax(0,1fr)':`minmax(0,${split}fr) 24px minmax(0,${100-split}fr)`,gap:12,marginTop:12,alignItems:'start'}}>
      <div className="cs-stage-body" style={{display:'grid',gridTemplateRows:compare&&!focus?'auto auto':'auto',gap:12,minWidth:0}}>
        {showStagePane&&(!compare?<div style={{gridRow:1,minWidth:0}}>{blocks(active.blocks,true)}</div>:<section className={paneClass} style={{gridRow:1}} aria-label={active.label}>{compare&&<p className="cs-pane-label">{t('paneCurrent')}{t('labelSep')}{active.label}</p>}{blocks(active.blocks)}</section>)}
        {showRequirementPane&&requirementStage&&<section className={paneClass} style={{gridRow:2}} aria-label={requirementStage.label}>{compare&&active.id!=='requirements'&&<p className="cs-pane-label">{t('paneCompareReference')}</p>}{blocks(requirementStage.blocks)}</section>}
      </div>
      <div hidden={focus||compare} role="separator" aria-label={t('layoutWidth')} aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(split)} tabIndex={focus?-1:0}
        onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();change({...layout,split:Math.max(30,Math.min(70,split+(e.key==='ArrowRight'?2:-2)))});}}}
        onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);resize(e.clientX);}}
        onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))resize(e.clientX);}}
        onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
        className="cs-split"/>
      <div hidden={focus} className="cs-demo-pane" style={{minWidth:0,position:compare?'static':'sticky',top:12,gridColumn:compare?1:undefined}}>{demo(compare)}</div>
    </div>
  </section>;
}
