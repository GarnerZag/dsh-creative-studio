import * as React from 'react';
import type {ArchitectureNode} from '../types.js';
export function ArchitectureMap({items,selected,busy,select,t}:{items:ArchitectureNode[];selected:string;busy:boolean;select:(id:string)=>void;t:(key:string)=>string}):React.ReactElement|null{
 const marker=React.useId().replaceAll(':','');
 if(!items.length)return null;
 const kinds=['module','contract','decision','task'] as const;
 const positions=new Map<string,{x:number;y:number}>();let rows=0;
 for(const [column,kind] of kinds.entries()){const group=items.filter(n=>n.kind===kind);rows=Math.max(rows,group.length);group.forEach((n,row)=>positions.set(n.id,{x:20+column*270,y:48+row*108}));}
 const [avail,setAvail]=React.useState(0);
 const box=React.useRef<HTMLDivElement>(null);
 React.useEffect(()=>{const el=box.current;if(!el)return;const ro=new ResizeObserver(()=>setAvail(el.clientWidth));ro.observe(el);setAvail(el.clientWidth);return()=>ro.disconnect();},[]);
 const width=1100,height=Math.max(160,rows*108+60);
 const scale=avail>0?Math.min(1,Math.max(0.85,(avail-2)/width)):1;
 const limit=440;
 const fitRows=Math.max(1,Math.floor((limit/scale-48-76-8)/108)+1);
 const readRows=Math.min(rows,fitRows);
 const maxHeight=Math.min(limit,Math.ceil((48+(readRows-1)*108+76+8)*scale));
 React.useEffect(()=>{const el=box.current;const p=positions.get(selected);if(!el||!p)return;if(!el.clientHeight)return;
  // Only move when the card is actually out of view, so focusing the first row does not clip the last one.
  const left=Math.max(0,p.x*scale-20);const top=Math.max(0,p.y*scale-12);
  const outX=left<el.scrollLeft||left+230>el.scrollLeft+el.clientWidth;
  const outY=top<el.scrollTop||top+80>el.scrollTop+el.clientHeight;
  if(outX||outY)el.scrollTo({left,top,behavior:'smooth'});},[selected,scale]);
 return <div style={{marginBlock:12}}><div ref={box} style={{overflow:'auto',maxHeight}}><div style={{width:Math.ceil(width*scale),height:Math.ceil(height*scale)}}><svg width={width} height={height} style={{display:'block',transform:`scale(${scale})`,transformOrigin:'top left'}} aria-label={t('architectureGraph')} role="group">
 <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
 {kinds.map((kind,i)=><text key={kind} x={20+i*270} y={24} fill="currentColor">{t(`architecture_${kind}`)}</text>)}
 {items.flatMap(n=>n.dependsOn.map(id=>{const a=positions.get(n.id),b=positions.get(id);if(!a||!b)return null;
  // Selected cards keep their own edges prominent; everything else fades so the graph stays readable.
  const related=!selected||selected===n.id||selected===id;
  return <path key={`${n.id}:${id}`} d={`M ${a.x+112} ${a.y+76} C ${a.x+112} ${a.y+100},${b.x+112} ${b.y-24},${b.x+112} ${b.y}`} fill="none" stroke={!selected||related?'var(--cs-accent)':'currentColor'} strokeWidth={related&&selected?2:1} opacity={!selected?0.45:related?0.9:0.12} markerEnd={`url(#${marker})`}><title>{n.title} → {items.find(i=>i.id===id)?.title}</title></path>;}))}
 {items.map(n=>{const p=positions.get(n.id)!;return <foreignObject key={n.id} x={p.x} y={p.y} width={228} height={76}><button disabled={busy} aria-pressed={selected===n.id} title={n.body?`${n.title} — ${n.body}`:n.title} onClick={()=>select(n.id)} style={{width:'100%',height:'100%',overflow:'hidden',textAlign:'left',padding:12,borderRadius:8,border:selected===n.id?'2px solid var(--cs-accent)':'1px solid var(--cs-border)',background:selected===n.id?'var(--cs-soft)':'var(--cs-surface)',color:'inherit'}}>{n.title}<small style={{display:'block'}}>{n.kind==='contract'?(n.contract?(n.contract.notApplicable?t('contractNotApplicable'):n.contract.surface||t('contractStructure')):t('architectureBody')):n.kind==='task'&&n.task?`${n.task.outputs.length} ${t('taskOutputs')} · ${n.task.acceptanceIds.length?`${n.task.acceptanceIds.length} ${t('taskAcceptShort')}`:t('taskAcceptanceNone')}`:`${t('linkedRequirements')}: ${n.requirementIds.length}`}</small></button></foreignObject>;})}
 </svg></div></div>{(width*scale>avail&&avail>0||height*scale>maxHeight)&&<p className="cs-hint">{t('archScrollHint')}</p>}<p>{t('architectureGraphNote')}</p></div>;
}
