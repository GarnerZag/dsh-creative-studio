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
  const subtreeCount=(id:string)=>{const seen=new Set([id]);let grew=true;while(grew){grew=false;for(const item of project.nodes){if(item.parentId!==null&&seen.has(item.parentId)&&!seen.has(item.id)){seen.add(item.id);grew=true;}}}return seen.size-1;};
  const removePrompt=()=>{if(!node)return t('confirmRemove');const kids=subtreeCount(node.id);if(kids===0)return t('confirmRemove');return t('confirmRemoveBranch').replace('{title}',node.title).replace('{children}',String(kids)).replace('{total}',String(kids+1));};
  const lastRev = React.useRef(project.contentRevision);
  const [savedRev, setSavedRev] = React.useState<number|null>(null);
  React.useEffect(() => {
    if (project.contentRevision === lastRev.current) return;
    lastRev.current = project.contentRevision;
    setSavedRev(project.contentRevision);
    const timer = setTimeout(() => setSavedRev(null), 2600);
    return () => clearTimeout(timer);
  }, [project.contentRevision]);
  const [view,setView]=React.useState<'canvas'|'outline'>('canvas');
  const [dependencyState,setDependencyState]=React.useState<{id:string|null;ids:string[]}>({id:null,ids:[]});
  const dependencyDraft=dependencyState.id===(node?.id??null)?dependencyState.ids:(node?.dependsOn??[]);
  const setDependencyDraft=(ids:string[])=>setDependencyState({id:node?.id??null,ids});
  const [priorityState,setPriorityState]=React.useState<{id:string|null;value:'low'|'normal'|'high'}>({id:null,value:'normal'});
  const priority=priorityState.id===(node?.id??null)?priorityState.value:(node?.priority??'normal');
  const setPriorityDraft=(value:'low'|'normal'|'high')=>setPriorityState({id:node?.id??null,value});
  const priorityChanged=!!node&&priority!==node.priority;
  const dependenciesChanged=(()=>{const a=[...dependencyDraft].sort(),b=[...(node?.dependsOn??[])].sort();return JSON.stringify(a)!==JSON.stringify(b);})();
  const choose = (id: string | null) => {
    if (id === selected) { setSelected(id); return; }
    const dirty = editorDirty(editor) || dependenciesChanged || priorityChanged;
    if (!dirty || window.confirm(t('discardEdits'))) { setDependencyState({ id: null, ids: [] }); setSelected(id); }
  };
  const addNode = (parentId: string | null) => {
    const dirty = editorDirty(editor) || dependenciesChanged || priorityChanged;
    if (dirty && !window.confirm(t('discardEdits'))) return;
    const id = newId();
    setDependencyState({ id: null, ids: [] });
    setSelected(id);
    save({ kind: 'add', node: { id, parentId, title: t('newRequirement'), kind: 'feature', description: '', priority: 'normal', dependsOn: [], desktopAcceptance: [], mobileAcceptance: [] } });
  };
  const rows: Array<{ id: string; depth: number; label: string }> = [];
  const visit = (parent: string | null, depth: number, prefix: string) => {
    let index = 0;
    for (const n of orderedChildren(project.nodes,parent)) {
      index += 1;
      const label = prefix ? `${prefix}.${index}` : `${index}`;
      rows.push({ id: n.id, depth, label });
      visit(n.id, depth + 1, label);
    }
  };
  visit(null, 0, '');
  const lines = (text: string) => text.split('\n').map(s => s.trim()).filter(Boolean);
  return <section className={`cs-editor ${view === 'canvas' ? 'cs-editor-canvas' : 'cs-editor-outline'}`}>
    <style>{`.creative-studio-root .cs-editor{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;align-items:start;margin-top:16px}@container (min-width:820px){.creative-studio-root .cs-editor-canvas{grid-template-columns:minmax(0,2fr) minmax(280px,1fr)}.creative-studio-root .cs-editor-outline{grid-template-columns:minmax(240px,1fr) minmax(260px,1fr)}}.creative-studio-root .cs-tree{overflow:auto;max-height:540px}.creative-studio-root .cs-tree button[aria-pressed=true]{border-color:var(--cs-accent);background:var(--cs-soft)}.creative-studio-root .cs-segmented{display:flex;gap:4px;margin-left:auto}.creative-studio-root .cs-outline-no{display:inline-block;min-width:32px;text-align:right;margin-right:8px;color:var(--cs-muted);font-size:var(--cs-text-xs);font-variant-numeric:tabular-nums}.creative-studio-root .cs-inspector-title{margin:0 0 8px}@media(max-width:1024px){.creative-studio-root .cs-editor{grid-template-columns:minmax(0,1fr)}}`}</style>
    <div className="cs-canvas-column">
      {project.nodes.length===0&&<p className="cs-empty-start">{t('requirementsEmptyHint')}</p>}
      <div className="cs-toolbar">
        <button type="button" className="cs-primary" disabled={busy} onClick={() => addNode(selected)}>{selected ? t('addChild') : t('addRoot')}</button>
        <button type="button" disabled={busy} title={t('selectRootHint')} onClick={() => choose(null)}>{selected ? t('clearSelection') : t('selectRoot')}</button>
        <div className="cs-segmented" role="group" aria-label={t('requirementView')}>
          <button type="button" aria-pressed={view === 'canvas'} onClick={() => setView('canvas')}>{t('canvasView')}</button>
          <button type="button" aria-pressed={view === 'outline'} onClick={() => setView('outline')}>{t('outlineView')}</button>
        </div>
      </div>
      {view === 'canvas'
        ? <MindMap t={t} move={(id,parentId)=>save({kind:'move',id,parentId})} nodes={project.nodes} selected={selected} select={choose} disabled={busy}/>
        : <div className="cs-tree" aria-label={t('requirements')}>{rows.map(row => <div key={row.id} style={{ paddingLeft: row.depth * 24 }}><button type="button" disabled={busy} aria-pressed={selected === row.id} onClick={() => choose(row.id)}><span className="cs-outline-no" aria-hidden="true">{row.label}</span>{project.nodes.find(n => n.id === row.id)?.title}</button></div>)}</div>}
      {view === 'outline'&&<p className="cs-hint">{t('outlineHint')}</p>}
    </div>
    {editor.conflicts.length>0&&<p role="alert">{t('editorConflict')} <button type="button" disabled={busy} onClick={()=>{if(window.confirm(t('discardEdits')))setEditor(openEditor(node?.id??null,snapshot()));}}>{t('editorReload')}</button></p>}
    <div className="cs-inspector">
      <h4 className="cs-inspector-title">{t('inspectorTitle')}</h4>
      {savedRev!==null&&<p role="status" className="cs-hint">{t('savedNotice').replace('{rev}',String(savedRev))}</p>}
    {node ? <fieldset disabled={busy||editor.conflicts.length>0} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <legend className="cs-visually-hidden">{t('nodeDetails')}</legend>
      <div className="cs-toolbar"><button type="button" disabled={position<=0} onClick={()=>save({kind:'reorder',id:node.id,beforeId:siblings[position-1]!.id})}>{t('moveEarlier')}</button><button type="button" disabled={position<0||position>=siblings.length-1} onClick={()=>save({kind:'reorder',id:node.id,beforeId:siblings[position+2]?.id??null})}>{t('moveLater')}</button><button type="button" disabled={busy} onClick={()=>choose(node.parentId)}>{t('selectParent')}</button></div>
      <p className="cs-hint">{t('dragAlternativeHint')}</p>
      <form onSubmit={e => { e.preventDefault(); if (title.trim()) save({ kind: 'rename', id: node.id, title }); }}><label>{t('nodeTitle')}<input value={title} onChange={e => setTitle(e.target.value)} /></label><button disabled={!title.trim()||title.trim()===node.title}>{t('rename')}</button>{title.trim()!==node.title&&<p className="cs-hint" role="status">{t('renameDirty')}</p>}</form>
      <label>{t('parentNode')}<select aria-label={t('parentNode')} value={node.parentId ?? ''} onChange={e => save({ kind: 'move', id: node.id, parentId: e.target.value || null })}><option value="">{t('selectRoot')}</option>{project.nodes.filter(n => n.id !== node.id).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
      <fieldset className="cs-deps" style={{ border: 0, padding: 0, minWidth: 0 }}>
        <legend>{t('requirementDependencies')}</legend>
        <p className="cs-hint">{t('requirementDependencyHint')}</p>
        <div className="cs-checks">{project.nodes.filter(n => n.id !== node.id).map(n => <label key={n.id}><input type="checkbox" checked={dependencyDraft.includes(n.id)} onChange={e => setDependencyDraft(e.target.checked ? [...dependencyDraft, n.id] : dependencyDraft.filter(id => id !== n.id))} />{n.title}</label>)}</div>
        <div className="cs-toolbar"><button type="button" disabled={busy || !dependenciesChanged} onClick={() => save({ kind: 'dependencies', id: node.id, dependsOn: dependencyDraft })}>{t('saveRequirementDependencies')}</button></div>
      </fieldset>
      <form onSubmit={e => { e.preventDefault(); save({ kind: 'details', id: node.id, description, priority, desktopAcceptance: lines(desktop), mobileAcceptance: lines(mobile) }); }}>
        <label>{t('requirementPriority')}<select value={priority} onChange={e => setPriorityDraft(e.target.value as 'low'|'normal'|'high')}><option value="high">{t('priorityHigh')}</option><option value="normal">{t('priorityNormal')}</option><option value="low">{t('priorityLow')}</option></select></label>
        <label>{t('nodeDescription')}<textarea aria-label={t('nodeDescription')} rows={4} value={description} onChange={e => setDescription(e.target.value)}/></label>
        <label>{t('desktopAcceptance')}<textarea aria-label={t('desktopAcceptance')} rows={3} value={desktop} onChange={e => setDesktop(e.target.value)}/></label>
        <label>{t('mobileAcceptance')}<textarea aria-label={t('mobileAcceptance')} rows={3} value={mobile} onChange={e => setMobile(e.target.value)}/></label>
        <button disabled={busy}>{busy ? t('working') : t('saveDetails')}</button>
        {(priorityChanged||description!==node.description||lines(desktop).join('\n')!==node.desktopAcceptance.join('\n')||lines(mobile).join('\n')!==node.mobileAcceptance.join('\n'))&&<p className="cs-hint" role="status">{t('detailsDirty')}</p>}
      </form>
      <button type="button" onClick={() => { if (window.confirm(removePrompt())) save({ kind: 'remove', id: node.id }); }}>{t('removeNode')}</button>
    </fieldset> : <p className="cs-hint">{t('selectNode')}</p>}
    </div>
  </section>;
}
