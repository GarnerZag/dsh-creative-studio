import * as React from 'react';
import {newId} from './id.js';
import { MindMap } from './mind-map.js';
import type { ProjectSnapshot, RequirementChange } from '../types.js';

export function RequirementsEditor({ project, save, busy, t }: { project: ProjectSnapshot; save: (change: RequirementChange) => void; busy: boolean; t: (key: string) => string }): React.ReactElement {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [desktop, setDesktop] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const node = project.nodes.find(n => n.id === selected);
  React.useEffect(() => {
    setTitle(node?.title ?? ''); setDescription(node?.description ?? '');
    setDesktop(node?.desktopAcceptance.join('\n') ?? ''); setMobile(node?.mobileAcceptance.join('\n') ?? '');
  }, [node?.id]);
  const choose = (id: string | null) => {
    const dirty = node && (title !== node.title || description !== node.description || desktop !== node.desktopAcceptance.join('\n') || mobile !== node.mobileAcceptance.join('\n'));
    if (id === selected || !dirty || window.confirm(t('discardEdits'))) setSelected(id);
  };
  const rows: Array<{ id: string; depth: number }> = [];
  const visit = (parent: string | null, depth: number) => {
    for (const n of project.nodes.filter(n => n.parentId === parent)) { rows.push({ id: n.id, depth }); visit(n.id, depth + 1); }
  };
  visit(null, 0);
  const lines = (text: string) => text.split('\n').map(s => s.trim()).filter(Boolean);
  return <section className="cs-editor">
    <style>{`.creative-studio-root .cs-editor{display:grid;grid-template-columns:minmax(240px,1fr) minmax(260px,1fr);gap:24px;margin-top:20px}.creative-studio-root input,.creative-studio-root textarea,.creative-studio-root select{font:inherit;background:transparent;color:inherit;border:1px solid var(--cs-border);border-radius:7px;padding:9px;max-width:100%}.creative-studio-root .cs-editor label{display:block;font-size:12px;margin-top:12px}.creative-studio-root .cs-editor textarea,.creative-studio-root .cs-editor label input{display:block;width:100%;margin-top:5px}.creative-studio-root .cs-tree{overflow:auto;max-height:540px}.creative-studio-root .cs-tree button[aria-pressed=true]{border-color:var(--cs-accent);background:var(--cs-soft)}@media(max-width:850px){.creative-studio-root .cs-editor{grid-template-columns:1fr}}`}</style>
    <div>
      <button disabled={busy} onClick={() => save({ kind: 'add', node: { id: newId(), parentId: selected, title: t('newRequirement'), kind: 'feature', description: '', priority: 'normal', desktopAcceptance: [], mobileAcceptance: [] } })}>{selected ? t('addChild') : t('addRoot')}</button>
      <button disabled={busy} onClick={() => choose(null)}>{t('selectRoot')}</button>
      <MindMap nodes={project.nodes} selected={selected} select={choose} disabled={busy}/>
      <div className="cs-tree" aria-label={t('requirements')}>{rows.map(row => <div key={row.id} style={{ paddingLeft: row.depth * 22 }}><button disabled={busy} aria-pressed={selected === row.id} onClick={() => choose(row.id)}>{project.nodes.find(n => n.id === row.id)?.title}</button></div>)}</div>
    </div>
    {node ? <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <form onSubmit={e => { e.preventDefault(); if (title.trim()) save({ kind: 'rename', id: node.id, title }); }}><label>{t('nodeTitle')}<input value={title} onChange={e => setTitle(e.target.value)} /></label><button disabled={!title.trim()}>{t('rename')}</button></form>
      <label>{t('parentNode')}<select value={node.parentId ?? ''} onChange={e => save({ kind: 'move', id: node.id, parentId: e.target.value || null })}><option value="">{t('selectRoot')}</option>{project.nodes.filter(n => n.id !== node.id).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
      <form onSubmit={e => { e.preventDefault(); save({ kind: 'details', id: node.id, description, priority: node.priority, desktopAcceptance: lines(desktop), mobileAcceptance: lines(mobile) }); }}>
        <label>{t('nodeDescription')}<textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}/></label>
        <label>{t('desktopAcceptance')}<textarea rows={3} value={desktop} onChange={e => setDesktop(e.target.value)}/></label>
        <label>{t('mobileAcceptance')}<textarea rows={3} value={mobile} onChange={e => setMobile(e.target.value)}/></label>
        <button>{t('saveDetails')}</button>
      </form>
      <button onClick={() => { if (window.confirm(t('confirmRemove'))) save({ kind: 'remove', id: node.id }); }}>{t('removeNode')}</button>
    </fieldset> : <p>{t('selectNode')}</p>}
  </section>;
}
