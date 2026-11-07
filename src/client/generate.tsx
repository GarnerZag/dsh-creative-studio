import * as React from 'react';
import {researchSeed} from './research-seed.js';
import type {WorkspaceOption,ProjectSnapshot} from '../types.js';
export function GeneratePanel({project,busy,t,generate,refresh,listWorkspaces}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;listWorkspaces:()=>Promise<WorkspaceOption[]>;generate:(request:string,workspaceId:string)=>void;refresh:()=>void}):React.ReactElement {
 const [request,setRequest]=React.useState(''),[workspace,setWorkspace]=React.useState('');
 const [workspaces,setWorkspaces]=React.useState<WorkspaceOption[]>([]),[workspaceError,setWorkspaceError]=React.useState(''),[refreshKey,setRefreshKey]=React.useState(0);
 React.useEffect(()=>{let live=true;setWorkspaceError('');void listWorkspaces().then(items=>{if(live){setWorkspaces(items);setWorkspace(id=>items.some(w=>w.id===id)?id:'');}}).catch(e=>{if(live){setWorkspaceError(String(e));setWorkspaces([]);setWorkspace('');}});return()=>{live=false;};},[listWorkspaces,refreshKey]);
 const job=project.proposalJob,active=job&&!['finished','failed'].includes(job.status);
 return <section><h3>{t('generateTitle')}</h3><p>{t('generateNotice')}</p>
 <form onSubmit={e=>{e.preventDefault();if(request.trim()&&workspace.trim()&&window.confirm(t('generateConfirm')))generate(request.trim(),workspace.trim());}}>
 <label>{t('workspaceId')}<select value={workspace} onChange={e=>setWorkspace(e.target.value)} disabled={busy||!!active}><option value="">{t('selectWorkspace')}</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.title} · {w.path}</option>)}</select><button type="button" disabled={busy||!!active} onClick={()=>setRefreshKey(x=>x+1)}>{t('refreshWorkspaces')}</button>{workspaceError&&<span role="alert">{workspaceError}</span>}</label>
 {project.researchJob?.status==='finished'&&project.researchJob.conclusion&&<button type="button" disabled={busy||!!active} onClick={()=>{if(window.confirm(t('researchSeedConfirm')))setRequest(researchSeed(project.researchJob));}}>{t('researchSeed')}</button>}
  <label>{t('roughIdea')}<textarea rows={4} value={request} onChange={e=>setRequest(e.target.value)} disabled={busy||!!active}/></label>
 <button disabled={busy||!!active||!request.trim()||!workspace.trim()}>{t('generateProposal')}</button>
 </form>{job&&<div role="status"><p>{t('jobStatus')}: {t('job_'+job.status)}</p><small>{t('sessionId')}: {job.sessionId}</small>{job.status==='unknown'&&<p>{t('unknownJob')}</p>}</div>}
 <button type="button" disabled={busy} onClick={refresh}>{t('refreshProposal')}</button>
 </section>;
}
