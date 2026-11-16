import * as React from 'react';
import {researchSeed} from './research-seed.js';
import {ModelSelect} from './model-picker.js';
import type {WorkspaceOption,ProjectSnapshot,ModelCatalogView,ModelChoice,BriefInfo} from '../types.js';
function BriefCard({brief,t}:{brief:BriefInfo;t:(key:string)=>string}):React.ReactElement {
 const list=(label:string,items:string[],ordered=false):React.ReactElement|null=>items.length===0?null:<>
  <dt>{label}</dt>
  <dd>{ordered?<ol className="cs-brief-list">{items.map((text,i)=><li key={i}>{text}</li>)}</ol>:<ul className="cs-brief-list">{items.map((text,i)=><li key={i}>{text}</li>)}</ul>}</dd>
 </>;
 return <section className="cs-brief" aria-label={t('briefTitle')}>
  <h4>{t('briefTitle')}<span className={`cs-intent cs-intent-${brief.intent}`}>{t('intent_'+brief.intent)}</span></h4>
  <p className="cs-brief-restated">{brief.restated}</p>
  {brief.interpretation&&<p className="cs-hint">{brief.interpretation}</p>}
  <dl className="cs-pairs">
   {list(t('briefGoals'),brief.goals)}
   {list(t('briefUsers'),brief.users)}
   {list(t('briefScenarios'),brief.scenarios)}
   {list(t('briefConstraints'),brief.constraints)}
   {list(t('briefUnknowns'),brief.unknowns)}
   {list(t('briefNeeds'),brief.needs)}
   {list(t('briefQuestions'),brief.questions,true)}
  </dl>
  {brief.intent!=='product'&&<p role="status" className="cs-hint">{t('briefNotProduct')}</p>}
 </section>;
}
export function GeneratePanel({project,busy,t,generate,refresh,listWorkspaces,listModels,continueJob,abandonJob}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;listWorkspaces:()=>Promise<WorkspaceOption[]>;listModels:()=>Promise<ModelCatalogView>;generate:(request:string,workspaceId:string,model:ModelChoice|undefined)=>void;refresh:()=>void;continueJob:(jobId:string,answers:string)=>Promise<ProjectSnapshot>;abandonJob:(jobId:string)=>Promise<ProjectSnapshot>}):React.ReactElement {
 const [request,setRequest]=React.useState(''),[workspace,setWorkspace]=React.useState(''),[model,setModel]=React.useState<ModelChoice|undefined>(undefined);
 const [workspaces,setWorkspaces]=React.useState<WorkspaceOption[]>([]),[workspaceError,setWorkspaceError]=React.useState(''),[refreshKey,setRefreshKey]=React.useState(0);
 const [answers,setAnswers]=React.useState(''),[lastProject,setLastProject]=React.useState<ProjectSnapshot>(project),[busyLocal,setBusyLocal]=React.useState(false),[error,setError]=React.useState('');
 if(project.projectRevision!==lastProject.projectRevision){setLastProject(project);setError('');}
 const act=async(operation:()=>Promise<ProjectSnapshot>):Promise<void>=>{setBusyLocal(true);setError('');try{setLastProject(await operation());}catch(e){setError(e instanceof Error?e.message:t('briefContinueStale'));}finally{setBusyLocal(false);}};
 React.useEffect(()=>{let live=true;setWorkspaceError('');void listWorkspaces().then(items=>{if(live){setWorkspaces(items);setWorkspace(id=>items.some(w=>w.id===id)?id:'');}}).catch(e=>{if(live){setWorkspaceError(String(e));setWorkspaces([]);setWorkspace('');}});return()=>{live=false;};},[listWorkspaces,refreshKey]);
 const job=project.proposalJob,active=job&&!['finished','failed'].includes(job.status);
 return <section><h3>{t('generateTitle')}</h3><p>{t('generateNotice')}</p>
 <form onSubmit={e=>{e.preventDefault();if(request.trim()&&workspace.trim()&&window.confirm(t('generateConfirm')))generate(request.trim(),workspace.trim(),model);}}>
 <label>{t('workspaceId')}<select value={workspace} onChange={e=>setWorkspace(e.target.value)} disabled={busy||!!active}><option value="">{t('selectWorkspace')}</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.title} · {w.path}</option>)}</select><button type="button" disabled={busy||!!active} onClick={()=>setRefreshKey(x=>x+1)}>{t('refreshWorkspaces')}</button>{workspaceError&&<span role="alert">{workspaceError}</span>}</label>
 <ModelSelect value={model} onChange={setModel} disabled={busy||!!active} t={t} load={listModels}/>
 {project.researchJob?.status==='finished'&&project.researchJob.conclusion&&<button type="button" disabled={busy||!!active} onClick={()=>{if(window.confirm(t('researchSeedConfirm')))setRequest(researchSeed(project.researchJob));}}>{t('researchSeed')}</button>}
  <label>{t('roughIdea')}<textarea rows={4} value={request} onChange={e=>setRequest(e.target.value)} disabled={busy||!!active}/></label>
 <button disabled={busy||!!active||!request.trim()||!workspace.trim()}>{t('generateProposal')}</button>
 </form>{job&&<div role="status"><p>{t('jobStatus')}: {t('job_'+job.status)}</p><small>{t('sessionId')}: {job.sessionId}</small>{job.status==='unknown'&&<p>{t('unknownJob')}</p>}</div>}
 {job?.brief&&<BriefCard brief={job.brief} t={t}/>}
 {job&&active&&job.brief&&job.brief.intent!=='product'&&<div className="cs-brief-actions">
  <label>{t('briefAnswers')}<textarea rows={3} value={answers} onChange={e=>setAnswers(e.target.value)} placeholder={t('briefAnswersHint')} disabled={busy||busyLocal}/></label>
  <div className="cs-row-actions">
   <button type="button" disabled={busy||busyLocal||!answers.trim()} onClick={()=>{if(window.confirm(t('briefContinueConfirm')))void act(()=>continueJob(job.id,answers.trim()));}}>{t('briefContinue')}</button>
   <button type="button" className="cs-quiet" disabled={busy||busyLocal} onClick={()=>{if(window.confirm(t('briefAbandonConfirm')))void act(()=>abandonJob(job.id));}}>{t('briefAbandon')}</button>
  </div>
  {error&&<p role="alert" className="cs-error">{error}</p>}
 </div>}
 <button type="button" disabled={busy} onClick={refresh}>{t('refreshProposal')}</button>
 </section>;
}
