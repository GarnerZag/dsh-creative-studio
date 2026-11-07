import * as React from 'react';
import {orderedChildren} from '../domain/requirement-order.js';
import {canReparent} from './requirement-drag.js';
import type { RequirementNode } from '../types.js';

export function MindMap({ nodes, selected, select, disabled, move, t }: { nodes: RequirementNode[]; selected: string | null; select: (id: string) => void; disabled: boolean; move:(id:string,parentId:string|null)=>void; t:(key:string)=>string }): React.ReactElement {
  const root=React.useRef<HTMLDivElement>(null);
  const dragging=React.useRef<{id:string;pointerId:number;x:number;y:number}|null>(null);
  const start=(event:React.PointerEvent<HTMLButtonElement>,id:string)=>{if(disabled||event.button!==0)return;event.preventDefault();dragging.current={id,pointerId:event.pointerId,x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);};
  const finish=(event:React.PointerEvent<HTMLButtonElement>)=>{
    const drag=dragging.current;dragging.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(disabled||!drag||drag.pointerId!==event.pointerId||Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cs-parent]');
    if(!target||!root.current?.contains(target))return;
    const parentId=target.getAttribute('data-cs-parent')||null;
    if(canReparent(nodes,drag.id,parentId)&&window.confirm(t('confirmNodeDrop')))move(drag.id,parentId);
  };
  const positions = new Map<string, { x: number; y: number }>();
  let row = 0;
  const visit = (parent: string | null, depth: number) => {
    for (const node of orderedChildren(nodes,parent)) {
      positions.set(node.id, { x: depth * 240 + 20, y: row++ * 66 + 20 });
      visit(node.id, depth + 1);
    }
  };
  visit(null, 0);
  const width = Math.max(480, ...Array.from(positions.values(), p => p.x + 225));
  return <div ref={root} style={{minWidth:0}}>
    <p>{t('nodeDragHint')}</p><div role="note" data-cs-parent="" style={{position:'sticky',top:0,zIndex:1,background:'var(--cs-bg, #fff)',padding:10,border:'1px dashed var(--cs-border)'}}>{t('nodeDropRoot')}</div>
    <div style={{overflow:'auto',maxHeight:520,border:'1px solid var(--cs-border)',borderRadius:12}}><svg width={width} height={Math.max(180, row * 66 + 35)} style={{ display: 'block' }}>
      {nodes.map(node => {
        const p = positions.get(node.id); const parent = node.parentId ? positions.get(node.parentId) : undefined;
        if (!p || !parent) return null;
        return <path key={node.id} d={`M ${parent.x + 200} ${parent.y + 22} C ${parent.x + 222} ${parent.y + 22}, ${p.x - 22} ${p.y + 22}, ${p.x} ${p.y + 22}`} fill="none" stroke="var(--cs-accent)" opacity={0.45}/>;
      })}
      {nodes.map(node => {
        const p = positions.get(node.id); if (!p) return null;
        return <g key={node.id} transform={`translate(${p.x},${p.y})`}>
          <rect width={200} height={44} rx={9} fill="var(--cs-soft)" stroke={selected === node.id ? 'var(--cs-accent)' : 'var(--cs-border)'}/>
          <foreignObject width={200} height={44}><div data-cs-parent={node.id} style={{display:'flex',height:'100%'}}><button type="button" disabled={disabled} aria-label={`${t('dragRequirement')} ${node.title}`} title={t('dragRequirement')} onPointerDown={e=>start(e,node.id)} onPointerUp={finish} onPointerCancel={()=>{dragging.current=null;}} onLostPointerCapture={()=>{dragging.current=null;}} style={{flex:'0 0 28px',margin:0,padding:0,border:0,cursor:'grab',touchAction:'none',userSelect:'none'}}>⠿</button><button type="button" disabled={disabled} aria-pressed={selected === node.id} onClick={() => select(node.id)} title={node.title} style={{ width: '100%', height: '100%', margin: 0, border: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{node.title}</button></div></foreignObject>
        </g>;
      })}
    </svg></div>
  </div>;
}
