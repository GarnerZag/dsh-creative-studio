import * as React from 'react';
import {newId} from './id.js';
import {ArchitectureMap} from './architecture-map.js';
import type { ArchitectureNode, ArchitectureChange, ProjectSnapshot } from '../types.js';

export function ArchitectureEditor({project,busy,save,t}:{project:ProjectSnapshot;busy:boolean;save:(change:ArchitectureChange)=>void;t:(key:string)=>string}):React.ReactElement {
  const [selected,setSelected]=React.useState(()=>project.architecture[0]?.id ?? newId());
  const [dirty,setDirty]=React.useState(false);
  const choose=(id:string)=>{if(id===selected || !dirty || window.confirm(t('discardEdits'))){setDirty(false);setSelected(id);}};
  const current=project.architecture.find(item=>item.id===selected);
  return <section aria-label={t('architecture')}>
    <h3>{t('architecture')}</h3>
    <ArchitectureMap items={project.architecture} selected={selected} busy={busy} select={choose} t={t}/>
    <nav style={{display:'flex',gap:8,flexWrap:'wrap'}}>{project.architecture.map(item=><button key={item.id} disabled={busy} aria-pressed={selected===item.id} onClick={()=>choose(item.id)}>{t(`architecture_${item.kind}`)} · {item.title}</button>)}<button disabled={busy} onClick={()=>choose(newId())}>{t('addArchitecture')}</button></nav>
    <ArchitectureForm key={selected} id={selected} current={current} project={project} busy={busy} save={save} t={t} dirty={setDirty}/>
    <ul aria-label={t('dependencies')}>{project.architecture.filter(item=>item.dependsOn.length>0).map(item=><li key={item.id}>{item.title} → {item.dependsOn.map(id=>project.architecture.find(other=>other.id===id)?.title ?? id).join(' · ')}</li>)}</ul>
  </section>;
}
function ArchitectureForm({id,current,project,busy,save,t,dirty}:{id:string;current:ArchitectureNode|undefined;project:ProjectSnapshot;busy:boolean;save:(change:ArchitectureChange)=>void;t:(key:string)=>string;dirty:(value:boolean)=>void}):React.ReactElement {
  const [item,setItem]=React.useState<ArchitectureNode>(()=>current ?? {id,kind:'module',title:'',body:'',requirementIds:[],dependsOn:[]});
  const patch=(changes:Partial<ArchitectureNode>)=>{setItem(old=>({...old,...changes}));dirty(true);};
  React.useEffect(()=>{if(current && JSON.stringify(current)===JSON.stringify(item)) dirty(false);},[current,item,dirty]);
  const toggle=(field:'requirementIds'|'dependsOn',value:string)=>patch({[field]:item[field].includes(value)?item[field].filter(v=>v!==value):[...item[field],value]});
  return <form onSubmit={e=>{e.preventDefault();save({kind:'save',item});}} style={{display:'grid',gap:12,marginTop:16}}>
    <label>{t('architectureType')}<select disabled={busy} value={item.kind} onChange={e=>patch({kind:e.target.value as ArchitectureNode['kind']})}>{(['module','contract','decision','task'] as const).map(kind=><option key={kind} value={kind}>{t(`architecture_${kind}`)}</option>)}</select></label>
    <label>{t('architectureTitle')}<input disabled={busy} value={item.title} onChange={e=>patch({title:e.target.value})}/></label>
    <label>{t('architectureBody')}<textarea disabled={busy} rows={7} value={item.body} placeholder={t(`hint_${item.kind}`)} onChange={e=>patch({body:e.target.value})}/></label>
    <fieldset disabled={busy}><legend>{t('linkedRequirements')}</legend>{project.nodes.map(node=><label key={node.id} style={{display:'block'}}><input type="checkbox" checked={item.requirementIds.includes(node.id)} onChange={()=>toggle('requirementIds',node.id)}/>{node.title}</label>)}</fieldset>
    <fieldset disabled={busy}><legend>{t('dependencies')}</legend>{project.architecture.filter(other=>other.id!==id).map(other=><label key={other.id} style={{display:'block'}}><input type="checkbox" checked={item.dependsOn.includes(other.id)} onChange={()=>toggle('dependsOn',other.id)}/>{other.title}</label>)}</fieldset>
    <div><button type="submit" disabled={busy || !item.title.trim()}>{t('saveDetails')}</button>{current && <button type="button" disabled={busy} onClick={()=>{if(window.confirm(t('removeArchitecture'))) save({kind:'remove',id});}}>{t('removeNode')}</button>}</div>
  </form>;
}
