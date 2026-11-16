import * as React from 'react';
import {orderedChildren} from '../domain/requirement-order.js';
import {canReparent} from './requirement-drag.js';
import type { RequirementNode } from '../types.js';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 56;
const ROW_GAP = 72;
const COLUMN_GAP = 248;
const OFFSET = 20;

/** Six-dot grip: an icon set glyph, not a font character. */
function GripIcon(): React.ReactElement {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="6" cy="4" r="1.3"/><circle cx="10" cy="4" r="1.3"/><circle cx="6" cy="8" r="1.3"/><circle cx="10" cy="8" r="1.3"/><circle cx="6" cy="12" r="1.3"/><circle cx="10" cy="12" r="1.3"/></svg>;
}

export function MindMap({ nodes, selected, select, disabled, move, t }: { nodes: RequirementNode[]; selected: string | null; select: (id: string) => void; disabled: boolean; move:(id:string,parentId:string|null)=>void; t:(key:string)=>string }): React.ReactElement {
  const root=React.useRef<HTMLDivElement>(null);
  const dragging=React.useRef<{id:string;pointerId:number;x:number;y:number}|null>(null);
  const [dragActive,setDragActive]=React.useState(false);
  const start=(event:React.PointerEvent<HTMLButtonElement>,id:string)=>{if(disabled||event.button!==0)return;event.preventDefault();dragging.current={id,pointerId:event.pointerId,x:event.clientX,y:event.clientY};setDragActive(true);event.currentTarget.setPointerCapture(event.pointerId);};
  const finish=(event:React.PointerEvent<HTMLButtonElement>)=>{
    const drag=dragging.current;dragging.current=null;setDragActive(false);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(disabled||!drag||drag.pointerId!==event.pointerId||Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cs-parent]');
    if(!target||!root.current?.contains(target))return;
    const parentId=target.getAttribute('data-cs-parent')||null;
    if(canReparent(nodes,drag.id,parentId)&&window.confirm(t('confirmNodeDrop')))move(drag.id,parentId);
  };
  const hasMixed = nodes.some(n=>n.priority==='high') && nodes.some(n=>n.priority!=='high');
  const positions = new Map<string, { x: number; y: number }>();
  let row = 0;
  const visit = (parent: string | null, depth: number) => {
    for (const node of orderedChildren(nodes,parent)) {
      positions.set(node.id, { x: depth * COLUMN_GAP + OFFSET, y: row++ * ROW_GAP + OFFSET });
      visit(node.id, depth + 1);
    }
  };
  visit(null, 0);
  const width = Math.max(480, ...Array.from(positions.values(), p => p.x + CARD_WIDTH + OFFSET));
  const height = Math.max(180, row * ROW_GAP + OFFSET * 2);
  const [avail,setAvail]=React.useState(0);
  const box=React.useRef<HTMLDivElement>(null);
  React.useEffect(()=>{const el=box.current;if(!el)return;const ro=new ResizeObserver(()=>setAvail(el.clientWidth));ro.observe(el);setAvail(el.clientWidth);return()=>ro.disconnect();},[]);
  // Fit wide trees without shrinking text past comfortable reading size.
  const scale=avail>0?Math.min(1,Math.max(0.85,(avail-2)/width)):1;
  // Fit as many whole rows as the box allows: a half-cut card row reads as broken.
  const limit=560;
  const fitRows=Math.max(1,Math.floor((limit/scale-OFFSET-CARD_HEIGHT-12)/ROW_GAP)+1);
  const readRows=Math.min(row,fitRows);
  const maxHeight=Math.min(limit,Math.ceil((OFFSET+(readRows-1)*ROW_GAP+CARD_HEIGHT+12)*scale));
  React.useEffect(()=>{const el=box.current;if(!el||!selected)return;const p=positions.get(selected);if(!p)return;if(!el.clientHeight)return;
  // Only move when the card is actually out of view, so focusing the first row does not clip the last one.
  const left=Math.max(0,p.x*scale-40);const top=Math.max(0,p.y*scale-20);
  const outX=left<el.scrollLeft||left+CARD_WIDTH*scale>el.scrollLeft+el.clientWidth;
  const outY=top<el.scrollTop||top+CARD_HEIGHT*scale>el.scrollTop+el.clientHeight;
  if(outX||outY)el.scrollTo({left,top,behavior:'smooth'});},[selected,scale]);
  return <div ref={root} style={{minWidth:0}}>
    <p className="cs-hint">{t('nodeDragHint')}</p>
    {dragActive&&<div role="note" data-cs-parent="" style={{padding:8,marginBottom:12,border:'1px dashed var(--cs-accent)',borderRadius:10,background:'var(--cs-soft)',fontSize:'var(--cs-text-sm)',lineHeight:'20px'}}>{t('nodeDropRoot')}</div>}
    <div ref={box} style={{overflow:'auto',maxHeight, border:'1px solid var(--cs-border)',borderRadius:12}}><div style={{width:Math.ceil(width*scale),height:Math.ceil(height*scale)}}><svg width={width} height={height} style={{ display: 'block', transform:`scale(${scale})`, transformOrigin:'top left' }}>
      {nodes.map(node => {
        const p = positions.get(node.id); const parent = node.parentId ? positions.get(node.parentId) : undefined;
        if (!p || !parent) return null;
        return <path key={node.id} d={`M ${parent.x + CARD_WIDTH} ${parent.y + CARD_HEIGHT / 2} C ${parent.x + CARD_WIDTH + 24} ${parent.y + CARD_HEIGHT / 2}, ${p.x - 24} ${p.y + CARD_HEIGHT / 2}, ${p.x} ${p.y + CARD_HEIGHT / 2}`} fill="none" stroke="var(--cs-accent)" strokeWidth={1.5} opacity={0.45}/>;
      })}
      {nodes.map(node => {
        const p = positions.get(node.id); if (!p) return null;
        const active = selected === node.id;
        return <g key={node.id} transform={`translate(${p.x},${p.y})`}>
          <rect width={CARD_WIDTH} height={CARD_HEIGHT} rx={8} fill={active ? 'var(--cs-soft)' : 'var(--cs-surface)'} stroke={active ? 'var(--cs-accent)' : 'var(--cs-border)'} strokeWidth={active ? 2 : 1}/>
          {hasMixed&&node.priority==='high'&&<rect x={1} y={6} width={3} height={CARD_HEIGHT-12} rx={1.5} fill="var(--cs-accent)"><title>{t('priorityHigh')}</title></rect>}
          <foreignObject width={CARD_WIDTH} height={CARD_HEIGHT}><div data-cs-parent={node.id} style={{display:'flex',height:'100%',alignItems:'stretch'}}>
            <button type="button" className="cs-quiet" disabled={disabled} aria-label={`${t('dragRequirement')} ${node.title}`} title={t('dragRequirement')} onPointerDown={e=>start(e,node.id)} onPointerUp={finish} onPointerCancel={()=>{dragging.current=null;}} onLostPointerCapture={()=>{dragging.current=null;}} style={{flex:'0 0 24px',margin:0,padding:0,border:0,minHeight:0,background:'transparent',cursor:'grab',touchAction:'none',userSelect:'none',display:'grid',placeItems:'center',color:'var(--cs-muted)'}}><GripIcon/></button>
            <button type="button" className="cs-quiet" disabled={disabled} aria-pressed={active} onClick={() => select(node.id)} title={node.title} style={{flex:'1 1 auto',minWidth:0,height:'100%',margin:0,padding:'0 8px',border:0,minHeight:0,background:'transparent',color:'inherit',overflow:'hidden',textAlign:'left',fontSize:'var(--cs-text-sm)',lineHeight:'18px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',whiteSpace:'normal',alignContent:'center'}}>{node.title}</button>
          </div></foreignObject>
        </g>;
      })}
    </svg></div></div>{height*scale>maxHeight&&<p className="cs-hint">{t('canvasScrollHint')}</p>}{hasMixed&&<p className="cs-hint">{t('priorityLegend')}</p>}
  </div>;
}
