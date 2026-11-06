import * as React from 'react';
import type { RequirementNode } from '../types.js';

export function MindMap({ nodes, selected, select, disabled }: { nodes: RequirementNode[]; selected: string | null; select: (id: string) => void; disabled: boolean }): React.ReactElement {
  const positions = new Map<string, { x: number; y: number }>();
  let row = 0;
  const visit = (parent: string | null, depth: number) => {
    for (const node of nodes.filter(n => n.parentId === parent)) {
      positions.set(node.id, { x: depth * 240 + 20, y: row++ * 66 + 20 });
      visit(node.id, depth + 1);
    }
  };
  visit(null, 0);
  const width = Math.max(480, ...Array.from(positions.values(), p => p.x + 225));
  return <div style={{ overflow: 'auto', maxHeight: 520, border: '1px solid var(--cs-border)', borderRadius: 12 }}>
    <svg width={width} height={Math.max(180, row * 66 + 35)} style={{ display: 'block' }}>
      {nodes.map(node => {
        const p = positions.get(node.id); const parent = node.parentId ? positions.get(node.parentId) : undefined;
        if (!p || !parent) return null;
        return <path key={node.id} d={`M ${parent.x + 200} ${parent.y + 22} C ${parent.x + 222} ${parent.y + 22}, ${p.x - 22} ${p.y + 22}, ${p.x} ${p.y + 22}`} fill="none" stroke="var(--cs-accent)" opacity={0.45}/>;
      })}
      {nodes.map(node => {
        const p = positions.get(node.id); if (!p) return null;
        return <g key={node.id} transform={`translate(${p.x},${p.y})`}>
          <rect width={200} height={44} rx={9} fill="var(--cs-soft)" stroke={selected === node.id ? 'var(--cs-accent)' : 'var(--cs-border)'}/>
          <foreignObject width={200} height={44}><button type="button" disabled={disabled} aria-pressed={selected === node.id} onClick={() => select(node.id)} title={node.title} style={{ width: '100%', height: '100%', margin: 0, border: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{node.title}</button></foreignObject>
        </g>;
      })}
    </svg>
  </div>;
}
