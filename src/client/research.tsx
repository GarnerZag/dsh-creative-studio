import * as React from 'react';
import {EvidenceView} from './evidence.js';
import {ModelSelect} from './model-picker.js';
import type {ProjectSnapshot,WorkspaceOption,ModelCatalogView,ModelChoice} from '../types.js';
export function ResearchPanel({project,busy,t,listWorkspaces,listModels,start,refresh,evidence}:{evidence:(id:string,jobId:string,callId:string,offset:number)=>Promise<import('../types.js').ResearchEvidencePage>;project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;listWorkspaces:()=>Promise<WorkspaceOption[]>;listModels:()=>Promise<ModelCatalogView>;start:(referenceId:string,request:string,workspaceId:string,model:ModelChoice|undefined)=>void;refresh:()=>void}):React.ReactElement{
 const [referenceId,setReference]=React.useState(''),[workspaceId,setWorkspace]=React.useState(''),[request,setRequest]=React.useState(''),[model,setModel]=React.useState<ModelChoice|undefined>(undefined),[workspaces,setWorkspaces]=React.useState<WorkspaceOption[]>([]),[error,setError]=React.useState('');
 React.useEffect(()=>{let live=true;void listWorkspaces().then(v=>{if(live)setWorkspaces(v);}).catch(e=>{if(live)setError(String(e));});return()=>{live=false;};},[listWorkspaces]);
 const job=project.researchJob,active=!!job&&!['finished','failed'].includes(job.status);
 return <section><h3>{t('researchTitle')}</h3><p>{t('researchScopeNotice')}</p>{error&&<p role="alert">{error}</p>}
 <details className="cs-disclosure" open={active}><summary>{t('researchToggle')}</summary>
 <form onSubmit={e=>{e.preventDefault();if(window.confirm(t('researchConfirm')))start(referenceId,request,workspaceId,model);}}>
 <label>{t('researchSource')}<select aria-label={t('researchSource')} value={referenceId} onChange={e=>setReference(e.target.value)} disabled={busy||active}><option value="">{t('researchSource')}</option>{project.references.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
 <label>{t('researchWorkspace')}<select aria-label={t('researchWorkspace')} value={workspaceId} onChange={e=>setWorkspace(e.target.value)} disabled={busy||active}><option value="">{t('researchWorkspace')}</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.title}</option>)}</select></label>
 <ModelSelect value={model} onChange={setModel} disabled={busy||active} t={t} load={listModels}/>
 <label>{t('researchQuestion')}<textarea aria-label={t('researchQuestion')} placeholder={t('researchQuestion')} rows={3} value={request} onChange={e=>setRequest(e.target.value)} disabled={busy||active}/></label>
 <button disabled={busy||active||!request.trim()||!project.references.some(r=>r.id===referenceId)||!workspaces.some(w=>w.id===workspaceId)}>{t('researchStart')}</button></form>
 </details>
 <button type="button" disabled={busy} onClick={refresh}>{t('researchRefresh')}</button>
 {job&&<div><p>{job.reference.name} · {(()=>{const k='job_'+job.status;const v=t(k);return v===k?job.status:v;})()}</p><details className="cs-advanced"><summary>{t('techDetails')}</summary><small>{t('sessionId')}: {job.sessionId}</small></details><p>{t('researchInferenceNotice')}</p>{job.conclusion&&<><p style={{whiteSpace:'pre-wrap'}}>{job.conclusion.summary}</p><ul>{job.conclusion.limitations.map((x,i)=><li key={i}>{x}</li>)}</ul></>}<details><summary>{t('researchEvidence')} ({job.evidence.length})</summary><ul>{job.evidence.map(e=><li key={`${job.id}:${e.callId}`}><span title={e.callId}>{e.tool}</span><EvidenceView t={t} read={offset=>evidence(project.id,job.id,e.callId,offset)}/></li>)}</ul></details></div>}
 </section>;
}
