import * as React from 'react';
import type {ArchitectureNode} from '../types.js';
export function ArchitectureMap({items,selected,busy,select,t}:{items:ArchitectureNode[];selected:string;busy:boolean;select:(id:string)=>void;t:(key:string)=>string}):React.ReactElement|null{
 const marker=React.useId().replaceAll(':','');
 if(!items.length)return null;
 const kinds=['module','contract','decision','task'] as const;
 const positions=new Map<string,{x:number;y:number}>();let rows=0;
 for(const [column,kind] of kinds.entries()){const group=items.filter(n=>n.kind===kind);rows=Math.max(rows,group.length);group.forEach((n,row)=>positions.set(n.id,{x:20+column*270,y:48+row*108}));}
 return <div style={{overflow:'auto',maxHeight:440,marginBlock:12}}><svg width={1100} height={Math.max(160,rows*108+60)} aria-label={t('architectureGraph')} role="group">
 <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
 {kinds.map((kind,i)=><text key={kind} x={20+i*270} y={24} fill="currentColor">{t(`architecture_${kind}`)}</text>)}
 {items.flatMap(n=>n.dependsOn.map(id=>{const a=positions.get(n.id),b=positions.get(id);if(!a||!b)return null;return <path key={`${n.id}:${id}`} d={`M ${a.x+112} ${a.y+76} C ${a.x+112} ${a.y+100},${b.x+112} ${b.y-24},${b.x+112} ${b.y}`} fill="none" stroke="currentColor" opacity="0.45" markerEnd={`url(#${marker})`}><title>{n.title} → {items.find(i=>i.id===id)?.title}</title></path>;}))}
 {items.map(n=>{const p=positions.get(n.id)!;return <foreignObject key={n.id} x={p.x} y={p.y} width={228} height={76}><button disabled={busy} aria-pressed={selected===n.id} onClick={()=>select(n.id)} style={{width:'100%',height:'100%',overflow:'hidden',textAlign:'left',padding:10,borderRadius:8,border:selected===n.id?'2px solid #7274e8':'1px solid var(--dsw-alias-border-default, #aab)',background:'var(--dsw-alias-background-default, #fff)',color:'inherit'}}>{n.title}<small style={{display:'block'}}>{n.kind==='contract'?(n.contract?(n.contract.notApplicable?t('contractNotApplicable'):n.contract.surface||t('contractStructure')):t('architectureBody')):n.kind==='task'&&n.task?`${n.task.outputs.length} ${t('taskOutputs')} · ${n.task.acceptanceIds.length} ${t('taskAcceptance')}`:`${t('linkedRequirements')}: ${n.requirementIds.length}`}</small></button></foreignObject>;})}
 </svg><p>{t('architectureGraphNote')}</p></div>;
}
