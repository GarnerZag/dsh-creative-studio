import * as React from 'react';
import {EvidenceView} from './evidence.js';
import type {ProjectSnapshot,WorkspaceOption} from '../types.js';
export function ResearchPanel({project,busy,t,listWorkspaces,start,refresh,evidence}:{evidence:(id:string,jobId:string,callId:string,offset:number)=>Promise<import('../types.js').ResearchEvidencePage>;project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;listWorkspaces:()=>Promise<WorkspaceOption[]>;start:(referenceId:string,request:string,workspaceId:string)=>void;refresh:()=>void}):React.ReactElement{
 const [referenceId,setReference]=React.useState(''),[workspaceId,setWorkspace]=React.useState(''),[request,setRequest]=React.useState(''),[workspaces,setWorkspaces]=React.useState<WorkspaceOption[]>([]),[error,setError]=React.useState('');
 React.useEffect(()=>{let live=true;void listWorkspaces().then(v=>{if(live)setWorkspaces(v);}).catch(e=>{if(live)setError(String(e));});return()=>{live=false;};},[listWorkspaces]);
 const job=project.researchJob,active=!!job&&!['finished','failed'].includes(job.status);
 return <section><h3>{t('researchTitle')}</h3><p>{t('researchScopeNotice')}</p>{error&&<p role="alert">{error}</p>}
 <form onSubmit={e=>{e.preventDefault();if(window.confirm(t('researchConfirm')))start(referenceId,request,workspaceId);}}>
 <select aria-label={t('researchSource')} value={referenceId} onChange={e=>setReference(e.target.value)} disabled={busy||active}><option value="">{t('researchSource')}</option>{project.references.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>
 <select aria-label={t('researchWorkspace')} value={workspaceId} onChange={e=>setWorkspace(e.target.value)} disabled={busy||active}><option value="">{t('researchWorkspace')}</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.title}</option>)}</select>
 <textarea aria-label={t('researchQuestion')} placeholder={t('researchQuestion')} value={request} onChange={e=>setRequest(e.target.value)} disabled={busy||active}/>
 <button disabled={busy||active||!request.trim()||!project.references.some(r=>r.id===referenceId)||!workspaces.some(w=>w.id===workspaceId)}>{t('researchStart')}</button></form>
 <button type="button" disabled={busy} onClick={refresh}>{t('researchRefresh')}</button>
 {job&&<div><p>{job.reference.name} · {job.status}</p><small>{job.sessionId}</small><p>{t('researchInferenceNotice')}</p>{job.conclusion&&<><p style={{whiteSpace:'pre-wrap'}}>{job.conclusion.summary}</p><ul>{job.conclusion.limitations.map((x,i)=><li key={i}>{x}</li>)}</ul></>}<details><summary>{t('researchEvidence')} ({job.evidence.length})</summary><ul>{job.evidence.map(e=><li key={`${job.id}:${e.callId}`}>{e.tool} · {e.callId}<EvidenceView t={t} read={offset=>evidence(project.id,job.id,e.callId,offset)}/></li>)}</ul></details></div>}
 </section>;
}
