import * as React from 'react';
import type { ProjectSnapshot } from '../types.js';
import { diffContent } from '../domain/versions.js';
export function VersionPanel({project,busy,approve,t,confirmTasks}:{confirmTasks:(id:string)=>void;project:ProjectSnapshot;busy:boolean;approve:(label:string)=>void;t:(key:string)=>string}):React.ReactElement {
  const [base,setBase]=React.useState(project.versions.at(-1)?.id ?? '');
  const [target,setTarget]=React.useState('draft');
  const [label,setLabel]=React.useState('');
  const before=project.versions.find(v=>v.id===base);
  const after=target==='draft'?project:project.versions.find(v=>v.id===target);
  const differences=before&&after?diffContent(before,after):[];
  const options=project.versions.map(v=><option key={v.id} value={v.id}>{v.label} · r{v.contentRevision}</option>);
  return <section aria-label={t('versions')}><h3>{t('versions')}</h3>
    <p>{t('approvalScope')}</p>
    <form onSubmit={event=>{event.preventDefault();if(label.trim()&&window.confirm(`${t('confirmApproval')} r${project.contentRevision}`)) approve(label.trim());}}>
      <input aria-label={t('versionLabel')} value={label} onChange={e=>setLabel(e.target.value)} disabled={busy} placeholder={t('versionLabel')}/><button disabled={busy||!label.trim()||project.nodes.length===0}>{t('approveVersion')}</button>
    </form>
    <label>{t('compareFrom')}<select value={base} onChange={e=>setBase(e.target.value)}><option value="">{t('selectVersion')}</option>{options}</select></label>
    <label>{t('compareTo')}<select value={target} onChange={e=>setTarget(e.target.value)}><option value="draft">{t('currentDraft')}</option>{options}</select></label>
    {before&&after&&<><p>{differences.length===0?t('noDifferences'):`${t('differences')}: ${differences.length}`}</p><ul>{differences.map(change=><li key={`${change.collection}-${change.id}`}><strong>{t(change.kind)} · {change.title}</strong><span> — {change.collection==='nodes'?t('requirements'):t('architecture')} {change.fields.join(', ')}</span></li>)}</ul></>}
    <ol>{[...project.versions].reverse().map(v=><li key={v.id}>{v.label} · r{v.contentRevision} · <time dateTime={v.createdAt}>{v.createdAt}</time> · {v.nodes.length} {t('requirements')} / {v.architecture.length} {t('architecture')}<details><summary>{t('taskPlanReview')}</summary><ol>{v.architecture.filter(a=>a.kind==='task').map(a=><li key={a.id}><strong>{a.title}</strong><pre style={{whiteSpace:'pre-wrap'}}>{a.body}</pre><small>{a.requirementIds.join(', ')} · {a.dependsOn.join(', ')}</small></li>)}</ol><button disabled={busy||v.taskPlanConfirmed||!v.architecture.some(a=>a.kind==='task')} onClick={()=>{if(window.confirm(t('confirmTasksNotice')))confirmTasks(v.id);}}>{v.taskPlanConfirmed?t('tasksConfirmed'):t('confirmTasks')}</button></details></li>)}</ol>
  </section>;
}
