import * as React from 'react';
import {researchSeed} from './research-seed.js';
import {ModelSelect} from './model-picker.js';
import { AttachmentsPanel, type AttachmentActions } from './attachments.js';
import type {WorkspaceOption,ProjectSnapshot,ModelCatalogView,ModelChoice,BriefInfo,JobReply} from '../types.js';
function BriefCard({brief,t}:{brief:BriefInfo;t:(key:string)=>string}):React.ReactElement {
 const list=(label:string,items:string[],ordered=false):React.ReactElement|null=>items.length===0?null:<><dt>{label}</dt><dd>{ordered?<ol className="cs-brief-list">{items.map((text,i)=><li key={i}>{text}</li>)}</ol>:<ul className="cs-brief-list">{items.map((text,i)=><li key={i}>{text}</li>)}</ul>}</dd></>;
 const details=brief.goals.length+brief.users.length+brief.scenarios.length+brief.constraints.length+brief.unknowns.length+brief.needs.length>0;
 return <section className="cs-brief" aria-label={t('briefTitle')}>
  <h4>{t('briefTitle')}<span className={`cs-intent cs-intent-${brief.intent}`}>{t('intent_'+brief.intent)}</span></h4>
  {brief.questions.length>0&&<p className="cs-hint">{t('briefPendingPrefix')}{brief.questions.length}{t('briefPendingSuffix')}</p>}
  <p className="cs-brief-restated">{brief.restated}</p>
  {brief.interpretation&&<details className="cs-advanced"><summary>{t('briefInterpretationLabel')}</summary><p className="cs-hint">{brief.interpretation}</p></details>}
  {brief.questions.length>0&&<div className="cs-brief-ask"><p className="cs-brief-ask-title">{t('briefQuestions')}</p><ol className="cs-brief-list">{brief.questions.map((text,i)=><li key={i}>{text}</li>)}</ol></div>}
  {details&&<details className="cs-advanced"><summary>{t('briefMore')}</summary><dl className="cs-pairs">
   {list(t('briefGoals'),brief.goals)}
   {list(t('briefUsers'),brief.users)}
   {list(t('briefScenarios'),brief.scenarios)}
   {list(t('briefConstraints'),brief.constraints)}
   {list(t('briefUnknowns'),brief.unknowns)}
   {list(t('briefNeeds'),brief.needs)}
  </dl></details>}
  {brief.intent!=='product'&&<p role="status" className="cs-hint">{t('briefNotProduct')}</p>}
 </section>;
}
const listFields=['goals','users','scenarios','constraints','unknowns','needs','questions'] as const;
type ListField=typeof listFields[number];
function BriefEditor({brief,busy,t,save,cancel}:{brief:BriefInfo;busy:boolean;t:(key:string)=>string;save:(brief:BriefInfo)=>void;cancel:()=>void}):React.ReactElement {
 const [intent,setIntent]=React.useState(brief.intent);
 const [restated,setRestated]=React.useState(brief.restated);
 const [interpretation,setInterpretation]=React.useState(brief.interpretation);
 const [lines,setLines]=React.useState<Record<ListField,string>>(()=>Object.fromEntries(listFields.map(k=>[k,brief[k].join('\n')])) as Record<ListField,string>);
 const split=(text:string)=>text.split('\n').map(line=>line.trim()).filter(Boolean);
 return <section className="cs-brief" aria-label={t('briefEdit')}>
  <h4>{t('briefEdit')}</h4>
  <p className="cs-hint">{t('briefEditHint')}</p>
  <form className="cs-brief-form" onSubmit={e=>{e.preventDefault();if(restated.trim())save({...brief,intent,restated:restated.trim(),interpretation,...Object.fromEntries(listFields.map(k=>[k,split(lines[k])])) as Record<ListField,string[]>});}}>
   <label>{t('briefIntentLabel')}<select value={intent} disabled={busy} onChange={e=>setIntent(e.target.value as BriefInfo['intent'])}>{(['product','operation','unclear'] as const).map(k=><option key={k} value={k}>{t('intent_'+k)}</option>)}</select></label>
   <label>{t('briefRestatedLabel')}<textarea rows={3} value={restated} disabled={busy} onChange={e=>setRestated(e.target.value)}/></label>
   <label>{t('briefInterpretationLabel')}<textarea rows={2} value={interpretation} disabled={busy} onChange={e=>setInterpretation(e.target.value)}/></label>
   {listFields.map(k=><label key={k}>{t('brief'+k.charAt(0).toUpperCase()+k.slice(1))}<textarea rows={2} value={lines[k]} placeholder={t('briefListHint')} disabled={busy} onChange={e=>setLines(current=>({...current,[k]:e.target.value}))}/></label>)}
   <div className="cs-row-actions">
    <button disabled={busy||!restated.trim()}>{t('briefSave')}</button>
    <button type="button" className="cs-quiet" disabled={busy} onClick={cancel}>{t('briefCancel')}</button>
   </div>
  </form>
 </section>;
}
// Session replies are plain Markdown from the model: show bold and inline code instead of raw asterisks.
function renderReply(text:string):React.ReactNode[]{
 return text.split('\n').map((line,index)=>{
  const parts=line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(part=>part.length>0).map((part,key)=>{
   if(part.startsWith('**')&&part.endsWith('**')&&part.length>4)return <strong key={key}>{part.slice(2,-2)}</strong>;
   if(part.startsWith('`')&&part.endsWith('`')&&part.length>2)return <code key={key}>{part.slice(1,-1)}</code>;
   return <React.Fragment key={key}>{part}</React.Fragment>;
  });
  return <p key={index}>{parts.length>0?parts:'\u00a0'}</p>;
 });
}
function JobReplyBlock({jobId,active,t,load,refreshKey,canEnd,endAttempt}:{jobId:string;active:boolean;t:(key:string)=>string;load:(jobId:string)=>Promise<JobReply>;refreshKey:number;canEnd:boolean;endAttempt:()=>void}):React.ReactElement {
 const [reply,setReply]=React.useState<JobReply|null>(null),[error,setError]=React.useState(''),[unavailable,setUnavailable]=React.useState(false),[loading,setLoading]=React.useState(false);
 // An older Host process answers 404 for this method: say so plainly instead of showing a transport stack.
 const fetchReply=React.useCallback(()=>{setLoading(true);setError('');void load(jobId).then(value=>{setReply(value);setUnavailable(false);}).catch(e=>{const message=e instanceof Error?e.message:String(e);if(/HTTP 404|not found|unknown method/i.test(message))setUnavailable(true);else setError(message);}).finally(()=>setLoading(false));},[jobId,load]);
 React.useEffect(()=>{fetchReply();},[fetchReply,refreshKey]);
 return <section className="cs-reply" aria-label={t('jobReply')}>
  <h4>{t('jobReply')}<button type="button" className="cs-quiet" disabled={loading} onClick={fetchReply}>{t('jobReplyRefresh')}</button></h4>
  {unavailable?<p className="cs-hint">{t('jobReplyNeedsRestart')}</p>:error?<p role="alert" className="cs-error">{error}</p>:reply?.text?<div className="cs-reply-text">{renderReply(reply.text)}{reply.truncated&&<span className="cs-hint"> {t('jobReplyTruncated')}</span>}</div>:<p className="cs-hint">{loading?t('jobReplyLoading'):active&&!(reply&&!reply.running)?t('jobReplyWaiting'):reply&&(reply.records??0)===0?t('jobReplyNoRecords'):t('jobReplyEmpty')}</p>}
  {reply&&(reply.text||reply.running)&&<p className="cs-hint">{reply.running?t('jobReplyRunning'):t('jobReplyEnded')}</p>}
  {canEnd&&!reply?.running&&<div className="cs-row-actions"><button type="button" className="cs-quiet" disabled={loading} onClick={endAttempt}>{t('jobReplyEndAttempt')}</button><small className="cs-hint">{t('jobReplyEndHint')}</small></div>}
 </section>;
}
export function GeneratePanel({project,busy,t,generate,refresh,listWorkspaces,listModels,continueJob,abandonJob,editBrief,readReply,attachments,onProject}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;listWorkspaces:()=>Promise<WorkspaceOption[]>;listModels:()=>Promise<ModelCatalogView>;generate:(request:string,workspaceId:string,model:ModelChoice|undefined)=>void;refresh:()=>void;continueJob:(jobId:string,answers:string,confirmed:boolean)=>Promise<ProjectSnapshot>;abandonJob:(jobId:string)=>Promise<ProjectSnapshot>;editBrief:(jobId:string,brief:BriefInfo)=>Promise<ProjectSnapshot>;readReply:(jobId:string)=>Promise<JobReply>;attachments:AttachmentActions;onProject:(next:ProjectSnapshot)=>void}):React.ReactElement {
 const [request,setRequest]=React.useState(''),[workspace,setWorkspace]=React.useState(''),[model,setModel]=React.useState<ModelChoice|undefined>(undefined);
 const [workspaces,setWorkspaces]=React.useState<WorkspaceOption[]>([]),[workspaceError,setWorkspaceError]=React.useState(''),[refreshKey,setRefreshKey]=React.useState(0);
 const [answers,setAnswers]=React.useState(''),[lastProject,setLastProject]=React.useState<ProjectSnapshot>(project),[busyLocal,setBusyLocal]=React.useState(false),[error,setError]=React.useState(''),[editOpen,setEditOpen]=React.useState(false);
 if(project.projectRevision!==lastProject.projectRevision){setLastProject(project);setError('');}
 const act=async(operation:()=>Promise<ProjectSnapshot>):Promise<void>=>{setBusyLocal(true);setError('');try{setLastProject(await operation());refresh();}catch(e){setError(e instanceof Error?e.message:t('briefContinueStale'));}finally{setBusyLocal(false);}};
 React.useEffect(()=>{let live=true;setWorkspaceError('');void listWorkspaces().then(items=>{if(live){setWorkspaces(items);setWorkspace(id=>{if(items.some(w=>w.id===id))return id;let remembered='';try{remembered=localStorage.getItem('cs.workspaceId')??'';}catch{remembered='';}if(remembered&&items.some(w=>w.id===remembered))return remembered;return items.length===1?items[0]!.id:'';});}}).catch(e=>{if(live){setWorkspaceError(String(e));setWorkspaces([]);setWorkspace('');}});return()=>{live=false;};},[listWorkspaces,refreshKey]);
 const job=project.proposalJob,active=job&&!['finished','failed'].includes(job.status);
 return <section><p className="cs-lead">{t('generateNotice')}</p>
 <AttachmentsPanel project={project} t={t} busy={busy} actions={{upload:async(p,f)=>{const next=await attachments.upload(p,f);onProject(next);return next;},remove:async(p,id)=>{const next=await attachments.remove(p,id);onProject(next);return next;},read:attachments.read}}/>
 <form onSubmit={e=>{e.preventDefault();if(request.trim()&&workspace.trim()&&window.confirm(t('generateConfirm')))generate(request.trim(),workspace.trim(),model);}}>
 <label>{t('roughIdea')}<textarea rows={5} value={request} onChange={e=>setRequest(e.target.value)} placeholder={t('roughIdeaHint')} disabled={busy||!!active} onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();(e.currentTarget.form as HTMLFormElement|null)?.requestSubmit();}}}/><small className="cs-hint">{t('ideaShortcutHint')}</small></label>
 {project.researchJob?.status==='finished'&&project.researchJob.conclusion&&<div className="cs-row-actions"><button type="button" className="cs-quiet" disabled={busy||!!active} onClick={()=>{if(window.confirm(t('researchSeedConfirm')))setRequest(researchSeed(project.researchJob));}}>{t('researchSeed')}</button></div>}
 <details className="cs-advanced"><summary>{t('generateSettings')}{(()=>{if(!model)return ` · ${t('generateSettingsDefault')}`;const effort=model.reasoningEffort??'';const suffix=effort?` / ${t(`effort${effort.slice(0,1).toUpperCase()}${effort.slice(1)}`)}`:'';return ` · ${model.model.split('/').pop()}${suffix}`;})()}</summary><p className="cs-hint">{t('generateSettingsHint')}</p>
  <label>{t('workspaceId')}<select value={workspace} onChange={e=>{setWorkspace(e.target.value);try{localStorage.setItem('cs.workspaceId',e.target.value);}catch{}}} disabled={busy||!!active}><option value="">{t('selectWorkspace')}</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.title} · {w.path}</option>)}</select><button type="button" className="cs-quiet" disabled={busy||!!active} onClick={()=>setRefreshKey(x=>x+1)}>{t('refreshWorkspaces')}</button>{workspaceError&&<span role="alert" className="cs-error">{workspaceError}</span>}{!workspaceError&&workspaces.length===0&&<span className="cs-hint">{t('workspaceEmpty')}</span>}</label>
  <ModelSelect value={model} onChange={setModel} disabled={busy||!!active} t={t} load={listModels}/>
 </details>
 {(()=>{const note=active?(job?.status==='unknown'?t('ideaBlockedByUnknown'):t('ideaBlockedByActive')):!request.trim()?t('ideaRequired'):!workspace.trim()?t('workspaceRequired'):'';return <>{note&&<p className="cs-hint cs-submit-note">{note}</p>}<div className="cs-row-actions"><button disabled={busy||!!active||!request.trim()||!workspace.trim()}>{t('generateProposal')}</button></div></>;})()}
 </form>{job&&<div role="status" className="cs-job-status"><p className="cs-status"><span className="cs-status-dot" aria-hidden="true"/>{t('jobProgress')}{t('labelSep')}{t('job_'+job.status)}</p>{job.status==='unknown'&&<p className="cs-hint">{t('unknownJob')}</p>}<details className="cs-advanced"><summary>{t('techDetails')}</summary><small>{t('sessionId')}{t('labelSep')}{job.sessionId}</small><br/><small>{t('jobIdLabel')}{t('labelSep')}{job.id}</small></details></div>}
 {job&&<JobReplyBlock jobId={job.id} active={!!active} t={t} load={readReply} refreshKey={project.projectRevision} canEnd={!!active&&!job?.brief} endAttempt={()=>{if(window.confirm(t('jobReplyEndConfirm')))void act(()=>abandonJob(job.id));}}/>}
 {job?.brief&&(editOpen?<BriefEditor brief={job.brief} busy={busy||busyLocal} t={t} cancel={()=>setEditOpen(false)} save={brief=>{void (async()=>{await act(()=>editBrief(job.id,brief));setEditOpen(false);})();}}/>:<>
  <BriefCard brief={job.brief} t={t}/>
  {active&&<div className="cs-row-actions"><button type="button" className="cs-quiet" disabled={busy||busyLocal} onClick={()=>setEditOpen(true)}>{t('briefEdit')}</button></div>}
 </>)}
 {job&&active&&job.brief&&<div className="cs-brief-actions">
  <label>{t('briefAnswers')}<textarea rows={3} value={answers} onChange={e=>setAnswers(e.target.value)} placeholder={t('briefAnswersHint')} disabled={busy||busyLocal}/></label>
  <div className="cs-row-actions">
   {job.brief.intent==='product'
    ? <button type="button" disabled={busy||busyLocal||!!job.briefConfirmedAt} onClick={()=>{if(window.confirm(t('briefConfirmConfirm')))void act(()=>continueJob(job.id,answers.trim(),true));}}>{job.briefConfirmedAt?t('briefConfirmed'):t('briefConfirm')}</button>
    : <button type="button" disabled={busy||busyLocal||!answers.trim()} onClick={()=>{if(window.confirm(t('briefContinueConfirm')))void act(()=>continueJob(job.id,answers.trim(),false));}}>{t('briefContinue')}</button>}
   <button type="button" className="cs-quiet" disabled={busy||busyLocal} onClick={()=>{if(window.confirm(t('briefAbandonConfirm')))void act(()=>abandonJob(job.id));}}>{t('briefAbandon')}</button>
  </div>
  {error&&<p role="alert" className="cs-error">{error}</p>}
 </div>}
 <button type="button" disabled={busy} onClick={refresh}>{t('refreshProposal')}</button>
 </section>;
}
