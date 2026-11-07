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
  const contract=item.contract ?? {surface:'',inputs:[],outputs:[],errors:[],permissions:'',notApplicable:false};
  const task=item.task ?? {inputs:[],outputs:[],acceptanceIds:[]};
  const patchContract=(changes:Partial<typeof contract>)=>patch({contract:{...contract,...changes}});
  const patchTask=(changes:Partial<typeof task>)=>patch({task:{...task,...changes}});
  const acceptance=project.nodes.flatMap(node=>[
    ...node.desktopAcceptance.map((text,index)=>({id:`${node.id}:desktop:${index+1}`,text:`${node.title} · 桌面 · ${text}`})),
    ...node.mobileAcceptance.map((text,index)=>({id:`${node.id}:mobile:${index+1}`,text:`${node.title} · 手机 · ${text}`})),
  ]);
  const fieldList=(key:'inputs'|'outputs',label:string)=><fieldset className={`cs-${key}`} disabled={busy}><legend>{label}</legend>
    {contract[key].map((field,index)=><div key={index} style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
      <input aria-label={t('contractFieldName')} value={field.name} onChange={e=>patchContract({[key]:contract[key].map((f,i)=>i===index?{...f,name:e.target.value}:f)})}/>
      <input aria-label={t('contractFieldType')} value={field.type} onChange={e=>patchContract({[key]:contract[key].map((f,i)=>i===index?{...f,type:e.target.value}:f)})}/>
      <input aria-label={t('contractFieldNotes')} value={field.notes} onChange={e=>patchContract({[key]:contract[key].map((f,i)=>i===index?{...f,notes:e.target.value}:f)})}/>
      <label><input type="checkbox" checked={field.required} onChange={e=>patchContract({[key]:contract[key].map((f,i)=>i===index?{...f,required:e.target.checked}:f)})}/>{t('contractFieldRequired')}</label>
      <button type="button" onClick={()=>patchContract({[key]:contract[key].filter((_,i)=>i!==index)})}>{t('removeNode')}</button>
    </div>)}
    <button type="button" disabled={busy} onClick={()=>patchContract({[key]:[...contract[key],{name:'',type:'string',required:true,notes:''}]})}>{t('addContractField')}</button>
  </fieldset>;
  return <form onSubmit={e=>{e.preventDefault();save({kind:'save',item});}} style={{display:'grid',gap:12,marginTop:16}}>
    <label>{t('architectureType')}<select disabled={busy} value={item.kind} onChange={e=>patch({kind:e.target.value as ArchitectureNode['kind']})}>{(['module','contract','decision','task'] as const).map(kind=><option key={kind} value={kind}>{t(`architecture_${kind}`)}</option>)}</select></label>
    <label>{t('architectureTitle')}<input disabled={busy} value={item.title} onChange={e=>patch({title:e.target.value})}/></label>
    <label>{t('architectureBody')}<textarea disabled={busy} rows={5} value={item.body} placeholder={t(`hint_${item.kind}`)} onChange={e=>patch({body:e.target.value})}/></label>
    {item.kind==='contract' && <fieldset className="cs-contract" disabled={busy}><legend>{t('contractStructure')}</legend>
      <label><input type="checkbox" checked={contract.notApplicable} onChange={e=>patchContract({notApplicable:e.target.checked})}/>{t('contractNotApplicable')}</label>
      {!contract.notApplicable && <>
        <label>{t('contractSurface')}<input value={contract.surface} onChange={e=>patchContract({surface:e.target.value})} placeholder={t('hint_contractSurface')}/></label>
        {fieldList('inputs',t('contractInputs'))}
        {fieldList('outputs',t('contractOutputs'))}
        <label>{t('contractErrors')}<textarea rows={3} value={contract.errors.join('\n')} onChange={e=>patchContract({errors:e.target.value.split('\n').filter(line=>line.trim()!=='').map(line=>line.trim())})} placeholder={t('hint_contractErrors')}/></label>
        <label>{t('contractPermissions')}<textarea rows={2} value={contract.permissions} onChange={e=>patchContract({permissions:e.target.value})} placeholder={t('hint_contractPermissions')}/></label>
      </>}
    </fieldset>}
    {item.kind==='task' && <fieldset className="cs-task" disabled={busy}><legend>{t('taskStructure')}</legend>
      <label>{t('taskInputs')}<textarea rows={3} value={task.inputs.join('\n')} onChange={e=>patchTask({inputs:e.target.value.split('\n').filter(line=>line.trim()!=='').map(line=>line.trim())})} placeholder={t('hint_taskInputs')}/></label>
      <label>{t('taskOutputs')}<textarea rows={3} value={task.outputs.join('\n')} onChange={e=>patchTask({outputs:e.target.value.split('\n').filter(line=>line.trim()!=='').map(line=>line.trim())})} placeholder={t('hint_taskOutputs')}/></label>
      <fieldset className="cs-task-acceptance"><legend>{t('taskAcceptance')}</legend>
        {acceptance.length===0 && <p>{t('taskAcceptanceEmpty')}</p>}
        {acceptance.map(entry=><label key={entry.id} style={{display:'block'}}><input type="checkbox" checked={task.acceptanceIds.includes(entry.id)} onChange={()=>patchTask({acceptanceIds:task.acceptanceIds.includes(entry.id)?task.acceptanceIds.filter(v=>v!==entry.id):[...task.acceptanceIds,entry.id]})}/>{entry.text}</label>)}
      </fieldset>
    </fieldset>}
    <fieldset disabled={busy}><legend>{t('linkedRequirements')}</legend>{project.nodes.map(node=><label key={node.id} style={{display:'block'}}><input type="checkbox" checked={item.requirementIds.includes(node.id)} onChange={()=>toggle('requirementIds',node.id)}/>{node.title}</label>)}</fieldset>
    <fieldset disabled={busy}><legend>{t('dependencies')}</legend>{project.architecture.filter(other=>other.id!==id).map(other=><label key={other.id} style={{display:'block'}}><input type="checkbox" checked={item.dependsOn.includes(other.id)} onChange={()=>toggle('dependsOn',other.id)}/>{other.title}</label>)}</fieldset>
    <div><button type="submit" disabled={busy || !item.title.trim()}>{t('saveDetails')}</button>{current && <button type="button" disabled={busy} onClick={()=>{if(window.confirm(t('removeArchitecture'))) save({kind:'remove',id});}}>{t('removeNode')}</button>}</div>
  </form>;
}
