import * as React from 'react';
import {orderedChildren} from '../domain/requirement-order.js';
import {newId} from './id.js';
import {openEditor,refreshEditor,editorDirty} from './editor-state.js';
import { MindMap } from './mind-map.js';
import type { ProjectSnapshot, RequirementChange } from '../types.js';

type stringFields={title:string;description:string;desktop:string;mobile:string};
export function RequirementsEditor({ project, save, busy, t, onSelect }: { onSelect?:(id:string|null)=>void; project: ProjectSnapshot; save: (change: RequirementChange) => void; busy: boolean; t: (key: string) => string }): React.ReactElement {
  const [selected, setSelected] = React.useState<string | null>(null);
  const node = project.nodes.find(n => n.id === selected);
  const siblings=node?orderedChildren(project.nodes,node.parentId):[];
  const position=siblings.findIndex(n=>n.id===selected);
  React.useEffect(()=>{onSelect?.(node?.id??null);},[node?.id,onSelect]);
  const snapshot=()=>({title:node?.title??'',description:node?.description??'',desktop:node?.desktopAcceptance.join('\n')??'',mobile:node?.mobileAcceptance.join('\n')??''});
  const [editor,setEditor]=React.useState(()=>openEditor<stringFields>(null,{title:'',description:'',desktop:'',mobile:''}));
  const {title,description,desktop,mobile}=editor.values;
  const field=(key:keyof stringFields,value:string)=>setEditor(current=>({...current,values:{...current.values,[key]:value}}));
  const setTitle=(v:string)=>field('title',v),setDescription=(v:string)=>field('description',v),setDesktop=(v:string)=>field('desktop',v),setMobile=(v:string)=>field('mobile',v);
  React.useEffect(()=>{setEditor(current=>refreshEditor(current,node?.id??null,snapshot()));},[node]);
  const [dependencyState,setDependencyState]=React.useState<{id:string|null;ids:string[]}>({id:null,ids:[]});
  const dependencyDraft=dependencyState.id===(node?.id??null)?dependencyState.ids:(node?.dependsOn??[]);
  const setDependencyDraft=(ids:string[])=>setDependencyState({id:node?.id??null,ids});
  const dependenciesChanged=(()=>{const a=[...dependencyDraft].sort(),b=[...(node?.dependsOn??[])].sort();return JSON.stringify(a)!==JSON.stringify(b);})();
  const choose = (id: string | null) => {
    const dirty = editorDirty(editor) || dependenciesChanged;
    if (id === selected || !dirty || window.confirm(t('discardEdits'))) setSelected(id);
  };
  const rows: Array<{ id: string; depth: number }> = [];
  const visit = (parent: string | null, depth: number) => {
    for (const n of orderedChildren(project.nodes,parent)) { rows.push({ id: n.id, depth }); visit(n.id, depth + 1); }
  };
  visit(null, 0);
  const lines = (text: string) => text.split('\n').map(s => s.trim()).filter(Boolean);
  return <section className="cs-editor">
    <style>{`.creative-studio-root .cs-editor{display:grid;grid-template-columns:minmax(240px,1fr) minmax(260px,1fr);gap:24px;margin-top:20px}.creative-studio-root input,.creative-studio-root textarea,.creative-studio-root select{font:inherit;background:transparent;color:inherit;border:1px solid var(--cs-border);border-radius:7px;padding:9px;max-width:100%}.creative-studio-root .cs-editor label{display:block;font-size:12px;margin-top:12px}.creative-studio-root .cs-editor textarea,.creative-studio-root .cs-editor label input{display:block;width:100%;margin-top:5px}.creative-studio-root .cs-tree{overflow:auto;max-height:540px}.creative-studio-root .cs-tree button[aria-pressed=true]{border-color:var(--cs-accent);background:var(--cs-soft)}@media(max-width:850px){.creative-studio-root .cs-editor{grid-template-columns:1fr}}`}</style>
    <div>
      <button disabled={busy} onClick={() => save({ kind: 'add', node: { id: newId(), parentId: selected, title: t('newRequirement'), kind: 'feature', description: '', priority: 'normal', dependsOn: [], desktopAcceptance: [], mobileAcceptance: [] } })}>{selected ? t('addChild') : t('addRoot')}</button>
      <button disabled={busy} onClick={() => choose(null)}>{t('selectRoot')}</button>
      <MindMap t={t} move={(id,parentId)=>save({kind:'move',id,parentId})} nodes={project.nodes} selected={selected} select={choose} disabled={busy}/>
      <div className="cs-tree" aria-label={t('requirements')}>{rows.map(row => <div key={row.id} style={{ paddingLeft: row.depth * 22 }}><button disabled={busy} aria-pressed={selected === row.id} onClick={() => choose(row.id)}>{project.nodes.find(n => n.id === row.id)?.title}</button></div>)}</div>
    </div>
    {editor.conflicts.length>0&&<p role="alert">{t('editorConflict')} <button disabled={busy} onClick={()=>{if(window.confirm(t('discardEdits')))setEditor(openEditor(node?.id??null,snapshot()));}}>{t('editorReload')}</button></p>}
    {node ? <fieldset disabled={busy||editor.conflicts.length>0} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <div><button type="button" disabled={position<=0} onClick={()=>save({kind:'reorder',id:node.id,beforeId:siblings[position-1]!.id})}>{t('moveEarlier')}</button><button type="button" disabled={position<0||position>=siblings.length-1} onClick={()=>save({kind:'reorder',id:node.id,beforeId:siblings[position+2]?.id??null})}>{t('moveLater')}</button></div>
      <form onSubmit={e => { e.preventDefault(); if (title.trim()) save({ kind: 'rename', id: node.id, title }); }}><label>{t('nodeTitle')}<input value={title} onChange={e => setTitle(e.target.value)} /></label><button disabled={!title.trim()}>{t('rename')}</button></form>
      <label>{t('parentNode')}<select aria-label={t('parentNode')} value={node.parentId ?? ''} onChange={e => save({ kind: 'move', id: node.id, parentId: e.target.value || null })}><option value="">{t('selectRoot')}</option>{project.nodes.filter(n => n.id !== node.id).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
      <fieldset className="cs-deps" style={{ border: 0, padding: 0, minWidth: 0 }}>
        <legend style={{ fontSize: 12 }}>{t('requirementDependencies')}</legend>
        <p style={{ fontSize: 11, margin: '2px 0 6px' }}>{t('requirementDependencyHint')}</p>
        {project.nodes.filter(n => n.id !== node.id).map(n => <label key={n.id} style={{ display: 'inline-flex', gap: 6, margin: '4px 14px 0 0', alignItems: 'center' }}><input type="checkbox" checked={dependencyDraft.includes(n.id)} onChange={e => setDependencyDraft(e.target.checked ? [...dependencyDraft, n.id] : dependencyDraft.filter(id => id !== n.id))} />{n.title}</label>)}
        <div><button type="button" disabled={busy || !dependenciesChanged} onClick={() => save({ kind: 'dependencies', id: node.id, dependsOn: dependencyDraft })}>{t('saveRequirementDependencies')}</button></div>
      </fieldset>
      <form onSubmit={e => { e.preventDefault(); save({ kind: 'details', id: node.id, description, priority: node.priority, desktopAcceptance: lines(desktop), mobileAcceptance: lines(mobile) }); }}>
        <label>{t('nodeDescription')}<textarea aria-label={t('nodeDescription')} rows={4} value={description} onChange={e => setDescription(e.target.value)}/></label>
        <label>{t('desktopAcceptance')}<textarea aria-label={t('desktopAcceptance')} rows={3} value={desktop} onChange={e => setDesktop(e.target.value)}/></label>
        <label>{t('mobileAcceptance')}<textarea aria-label={t('mobileAcceptance')} rows={3} value={mobile} onChange={e => setMobile(e.target.value)}/></label>
        <button>{t('saveDetails')}</button>
      </form>
      <button onClick={() => { if (window.confirm(t('confirmRemove'))) save({ kind: 'remove', id: node.id }); }}>{t('removeNode')}</button>
    </fieldset> : <p>{t('selectNode')}</p>}
  </section>;
}
