import * as React from 'react';
import {parseLayout} from './layout.js';

export interface StageBlock { id: string; label: string; content: React.ReactNode }
export interface Stage { id: string; label: string; hint: string; blocks: StageBlock[] }

export function Workbench({projectId,stages,demo,t}:{projectId:string;stages:Stage[];demo:(compare:boolean)=>React.ReactNode;t:(key:string)=>string}):React.ReactElement{
  const key=`creative-studio-layout:${projectId}`;
  const [layout,setLayout]=React.useState(()=>{try{return parseLayout(localStorage.getItem(key));}catch{return parseLayout(null);}});
  const [stage,setStage]=React.useState(stages[0]?.id??'');
  const [focus,setFocus]=React.useState(false);
  const grid=React.useRef<HTMLDivElement>(null);
  const split=layout.split;
  const change=(next:typeof layout)=>{setLayout(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{/* storage is optional */}};
  const resize=(x:number)=>{const box=grid.current?.getBoundingClientRect();if(box&&box.width>0)change({...layout,split:Math.max(30,Math.min(70,(x-box.left)/box.width*100))});};
  const active=stages.find(s=>s.id===stage)??stages[0]??{id:'',label:'',hint:'',blocks:[]};
  const requirementStage=stages.find(s=>s.id==='requirements');
  const compare=layout.compare;
  const showRequirementPane=compare&&Boolean(requirementStage);
  const showStagePane=!compare||active.id!=='requirements';
  const blocks=(list:StageBlock[])=>list.map(block=><section key={block.id} className="cs-block" aria-label={block.label}>{block.content}</section>);
  return <section className="cs-workbench">
    <ol className="cs-steps" aria-label={t('stages')}>{stages.map((item,index)=><li key={item.id}><button type="button" aria-current={active.id===item.id?'step':undefined} onClick={()=>setStage(item.id)}><span className="cs-step-index" aria-hidden="true">{index+1}</span>{item.label}</button></li>)}</ol>
    <div className="cs-toolbar">
      <button type="button" aria-pressed={!compare} onClick={()=>change({...layout,compare:false})}>{t('layoutExplore')}</button>
      <button type="button" aria-pressed={compare} onClick={()=>change({...layout,compare:true})}>{t('layoutCompare')}</button>
      <label className="cs-inline-field"><span>{t('layoutWidth')}</span><input type="range" min="30" max="70" value={split} onChange={e=>change({...layout,split:Number(e.target.value)})}/></label>
      <button type="button" aria-pressed={focus} onClick={()=>setFocus(!focus)}>{t('layoutFocus')}</button>
    </div>
    {!compare&&<p className="cs-hint cs-stage-hint">{active.hint}</p>}
    <div ref={grid} className="cs-grid" style={{gridTemplateColumns:focus?'minmax(0,1fr)':`minmax(0,${split}fr) 24px minmax(0,${100-split}fr)`,gap:12,marginTop:12,alignItems:'start'}}>
      <div hidden={focus} className="cs-stage-body" style={{display:focus?'none':'grid',gridTemplateRows:compare?'minmax(200px,1fr) minmax(200px,1fr)':'auto',gap:12,minWidth:0}}>
        {showRequirementPane&&requirementStage&&<section className="cs-pane cs-pane-scroll" style={{gridRow:1}} aria-label={requirementStage.label}>{blocks(requirementStage.blocks)}</section>}
        {showStagePane&&(!compare?<div style={{gridRow:1,minWidth:0}}>{blocks(active.blocks)}</div>:<section className="cs-pane cs-pane-scroll" style={{gridRow:2}} aria-label={active.label}>{blocks(active.blocks)}</section>)}
      </div>
      <div hidden={focus} role="separator" aria-label={t('layoutWidth')} aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(split)} tabIndex={focus?-1:0}
        onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();change({...layout,split:Math.max(30,Math.min(70,split+(e.key==='ArrowRight'?2:-2)))});}}}
        onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);resize(e.clientX);}}
        onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))resize(e.clientX);}}
        onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
        className="cs-split"/>
      <div className="cs-demo-pane" style={{minWidth:0,position:'sticky',top:12}}>{demo(compare)}</div>
    </div>
  </section>;
}
