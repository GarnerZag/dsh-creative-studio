import * as React from 'react';
import {ApprovalForm} from './approval.js';
import {ApprovalReceipt} from './approval-record.js';
import type { ApprovalReviewInput, ProjectSnapshot } from '../types.js';
import { diffContent, structuredFieldChanges } from '../domain/versions.js';
export function VersionPanel({project,busy,approve,t,confirmTasks}:{confirmTasks:(id:string)=>void;project:ProjectSnapshot;busy:boolean;approve:(label:string,review:ApprovalReviewInput)=>void;t:(key:string)=>string}):React.ReactElement {
  const [base,setBase]=React.useState(project.versions.at(-1)?.id ?? '');
  const [target,setTarget]=React.useState('draft');
  const before=project.versions.find(v=>v.id===base);
  const after=target==='draft'?project:project.versions.find(v=>v.id===target);
  const differences=before&&after?diffContent(before,after):[];
  const options=project.versions.map(v=><option key={v.id} value={v.id}>{v.label} · r{v.contentRevision}</option>);
  return <section aria-label={t('versions')}><h3>{t('versions')}</h3>
    <p>{t('approvalScope')}</p>
    <ApprovalForm project={project} busy={busy} approve={approve} t={t}/>
    <label>{t('compareFrom')}<select value={base} onChange={e=>setBase(e.target.value)}><option value="">{t('selectVersion')}</option>{options}</select></label>
    <label>{t('compareTo')}<select value={target} onChange={e=>setTarget(e.target.value)}><option value="draft">{t('currentDraft')}</option>{options}</select></label>
    {before&&after&&<><p>{differences.length===0?t('noDifferences'):`${t('differences')}: ${differences.length}`}</p><ul>{differences.map(change=>{
      const oldItem=change.collection==='architecture'?before.architecture.find(item=>item.id===change.id):undefined;
      const newItem=change.collection==='architecture'?after.architecture.find(item=>item.id===change.id):undefined;
      const nested=(change.collection==='architecture'&&(change.fields.includes('contract')||change.fields.includes('task')))?structuredFieldChanges(oldItem,newItem):[];
      return <li key={`${change.collection}-${change.id}`}><strong>{t(change.kind)} · {change.title}</strong><span> — {change.collection==='nodes'?t('requirements'):t('architecture')} {change.fields.map(field=>fieldLabel(field,t)).join(', ')}</span>
        {nested.length>0&&<ul>{nested.map(entry=><li key={entry.path}>{t(entry.state)} · <code>{entry.path}</code></li>)}</ul>}
      </li>;
    })}</ul></>}
    <ol>{[...project.versions].reverse().map(v=><li key={v.id}>{v.label} · r{v.contentRevision} · <time dateTime={v.createdAt}>{v.createdAt}</time> · {v.nodes.length} {t('requirements')} / {v.architecture.length} {t('architecture')}<ApprovalReceipt record={v.approval} t={t}/><details><summary>{t('taskPlanReview')}</summary><ol>{v.architecture.filter(a=>a.kind==='task').map(a=><li key={a.id}><strong>{a.title}</strong><pre style={{whiteSpace:'pre-wrap'}}>{a.body}</pre>{a.task&&<ul><li>{t('taskInputs')}: {a.task.inputs.join(' / ')||'—'}</li><li>{t('taskOutputs')}: {a.task.outputs.join(' / ')||'—'}</li><li>{t('taskAcceptance')}: {a.task.acceptanceIds.join(' / ')||'—'}</li></ul>}<small>{a.requirementIds.join(', ')} · {a.dependsOn.join(', ')}</small></li>)}</ol><button disabled={busy||v.taskPlanConfirmed||!v.architecture.some(a=>a.kind==='task')} onClick={()=>{if(window.confirm(t('confirmTasksNotice')))confirmTasks(v.id);}}>{v.taskPlanConfirmed?t('tasksConfirmed'):t('confirmTasks')}</button></details></li>)}</ol>
  </section>;
}

function fieldLabel(field:string,t:(key:string)=>string):string{
  const labels:Record<string,string>={title:'architectureTitle',body:'architectureBody',kind:'architectureType',requirementIds:'linkedRequirements',dependsOn:'dependencies',contract:'diffContract',task:'diffTask'};
  return labels[field]?t(labels[field]!):field;
}
