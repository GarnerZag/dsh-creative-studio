import * as React from 'react';
import {recordEdit,historyChange,commitHistory,type RequirementHistory} from './requirement-history.js';
import {ResearchPanel} from './research.js';
import {ReportsPanel} from './reports.js';
import {HandoffPanel,type HandoffActions} from './handoff.js';
import {Workbench,type Stage} from './workbench.js';
import {DemoPanel} from './demo.js';
import {FeaturePanel} from './features.js';
import type {FeatureChange} from '../types.js';
import {ReferencesPanel} from './references.js';
import type {ReferenceChange} from '../types.js';
import { GeneratePanel } from './generate.js';
import { ProposalPanel } from './proposals.js';
import { VersionPanel } from './versions.js';
import type { ProjectHead, ProjectSummary, ProjectSnapshot, RequirementChange } from '../types.js';
import { ArchitectureEditor } from './architecture.js';
import type { ArchitectureChange } from '../types.js';
import { RequirementsEditor } from './requirements.js';

export interface ProjectActions {
  reject(project:ProjectSnapshot,proposalId:string):Promise<ProjectSnapshot>;
  rename(project:ProjectSnapshot,name:string):Promise<ProjectSnapshot>;
  evidence(id:string,jobId:string,callId:string,offset:number):Promise<import('../types.js').ResearchEvidencePage>;
  research(project:ProjectSnapshot,referenceId:string,request:string,workspaceId:string,model?:import('../types.js').ModelChoice):Promise<ProjectSnapshot>;
  acceptReport(project:ProjectSnapshot,reportId:string,accepted:boolean):Promise<ProjectSnapshot>;
  listWorkspaces():Promise<import('../types.js').WorkspaceOption[]>;
  listModels():Promise<import('../types.js').ModelCatalogView>;
  handoff:HandoffActions;
  dispatch:import('./dispatch.js').DispatchActions;
  confirmTasks(project:ProjectSnapshot,versionId:string):Promise<ProjectSnapshot>;
  demo(project:ProjectSnapshot,scene:NonNullable<ProjectSnapshot['demo']>):Promise<ProjectSnapshot>;
  feature(project:ProjectSnapshot,change:FeatureChange):Promise<ProjectSnapshot>;
  reference(project:ProjectSnapshot,change:ReferenceChange):Promise<ProjectSnapshot>;
  generate(project:ProjectSnapshot,request:string,workspaceId:string,model?:import('../types.js').ModelChoice):Promise<ProjectSnapshot>;
  continueProposal(project:ProjectSnapshot,jobId:string,answers:string,confirmed:boolean):Promise<ProjectSnapshot>;
  abandonProposal(project:ProjectSnapshot,jobId:string):Promise<ProjectSnapshot>;
  editBrief(project:ProjectSnapshot,jobId:string,brief:import('../types.js').BriefInfo):Promise<ProjectSnapshot>;
  jobReply(project:ProjectSnapshot,jobId:string):Promise<import('../types.js').JobReply>;
  list(): Promise<ProjectSummary[]>;
  remove(project:ProjectSnapshot):Promise<ProjectSummary[]>;
  adopt(project: ProjectSnapshot, proposalId: string): Promise<ProjectSnapshot>;
  approve(project: ProjectSnapshot, label: string,review:import('../types.js').ApprovalReviewInput): Promise<ProjectSnapshot>;
  create(name: string): Promise<ProjectSnapshot>;
  get(id: string): Promise<ProjectSnapshot>;
  architecture(project: ProjectSnapshot, change: ArchitectureChange): Promise<ProjectSnapshot>;
  edit(project: ProjectSnapshot, change: RequirementChange): Promise<ProjectSnapshot>;
}

export function ProjectWorkspace({ api, t }: { api: ProjectActions; t: (key: string) => string }): React.ReactElement {
  const [projects, setProjects] = React.useState<ProjectSummary[]>([]);
  const [project, setProject] = React.useState<ProjectSnapshot>();
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [editorEpoch,setEditorEpoch]=React.useState(0);
  const [history,setHistory]=React.useState<RequirementHistory>();
  const historyCurrent=history&&project&&history.projectId===project.id&&history.revision===project.contentRevision;
  const [selectedRequirement,setSelectedRequirement]=React.useState<string|null>(null);
  const errorText=(message:string):string=>{
    const rule=(pattern:RegExp,key:string)=>{
      const m=message.match(pattern);
      return m?`${t(key as Parameters<typeof t>[0])} ${m.slice(1).filter(Boolean).join(' ')}`.trim():undefined;
    };
    return rule(/^REQUIREMENT_DEPENDENCY_CYCLE: (.*)$/,'errorDependencyCycle')
      ?? rule(/^REQUIREMENT_DEPENDENCY_NOT_FOUND: (.*)$/,'errorDependencyMissing')
      ?? rule(/^DUPLICATE_REQUIREMENT_DEPENDENCY: (.*)$/,'errorDependencyDuplicate')
      ?? (message==='DUPLICATE_ID'?t('errorDuplicateId'):undefined)
      ?? (message==='CONTRACT_STRUCTURE_REQUIRED'?t('errorContractStructure'):undefined)
      ?? (message==='TASK_STRUCTURE_REQUIRED'?t('errorTaskStructure'):undefined)
      ?? (message==='ARCHITECTURE_PAYLOAD_KIND'?t('errorArchitecturePayloadKind'):undefined)
      ?? rule(/^ACCEPTANCE_NOT_FOUND(?:: (.*))?$/,'errorAcceptanceMissing')
      ?? rule(/^ACCEPTANCE_TEXT_CHANGED(?:: (.*))?$/,'errorAcceptanceTextChanged')
      ?? rule(/^ACCEPTANCE_NOT_LINKED(?:: (.*))?$/,'errorAcceptanceNotLinked')
      ?? rule(/^REQUIREMENT_NOT_FOUND(?:: (.*))?$/,'errorRequirementMissing')
      ?? rule(/^ARCHITECTURE_DEPENDENCY_NOT_FOUND(?:: (.*))?$/,'errorArchitectureDependencyMissing')
      ?? message;
  };
  const generation = React.useRef(0);
  React.useEffect(() => {
    const token = ++generation.current;
    void api.list().then(items => { if (generation.current === token) setProjects(items); }).catch(e => { if (generation.current === token) setError(String(e)); });
    return () => { generation.current++; };
  }, [api]);
  const busyRef = React.useRef(false);
  const run = async (operation: () => Promise<ProjectSnapshot>, resetEditors=false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const token = ++generation.current;
    setBusy(true); setError('');
    try {
      const next = await operation();
      if (generation.current !== token) return;
      setProject(next);
      if(resetEditors) setEditorEpoch(epoch=>epoch+1);
       if(resetEditors||next.id!==project?.id)setHistory(undefined);
      const items = await api.list();
      if (generation.current === token) setProjects(items);
    } catch (e) { if (generation.current === token) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (generation.current === token) setBusy(false); busyRef.current = false; }
  };
  const removeProject=async()=>{
    if(!project||busyRef.current||!window.confirm(t('confirmDeleteProject')))return;
    busyRef.current=true;
    generation.current++;
    setBusy(true);setError('');
    try{
      const items=await api.remove(project);
      setProjects(items);
      setProject(undefined);
      setHistory(undefined);
      setSelectedRequirement(null);
    }catch(e){
      const message=e instanceof Error?e.message:String(e);
      setError(message.includes('PROJECT_NOT_FOUND')?t('errorProjectMissing'):message);
    }
    finally{setBusy(false);busyRef.current=false;}
  };
  const restore=(direction:'undo'|'redo')=>{
    if(!project||!history||!historyCurrent||busy||!window.confirm(t('historyConfirm')))return;
    void run(async()=>{
      const change=historyChange(history,project,direction);
      const next=await api.edit(project,change);
      try{setHistory(commitHistory(history,project,next,direction));}
      catch{setHistory(undefined);setError(t('historyDesync'));}
      setEditorEpoch(epoch=>epoch+1);
      return next;
    });
  };
  const stages:Stage[]=project?[
    {id:'idea',label:t('stageIdea'),hint:t('stageHintIdea'),badge:project.proposalJob?.status==='submitted'?t('badgeAwaitingModel'):project.proposals.length?`${project.proposals.length}${t('badgeCandidates')}`:undefined,blocks:[
      {id:'generate',label:t('generateTitle'),content:<GeneratePanel listWorkspaces={api.listWorkspaces} listModels={api.listModels} key={`generate-${project.id}`} project={project} busy={busy} t={t} generate={(request,workspaceId,model)=>{void run(()=>api.generate(project,request,workspaceId,model));}} refresh={()=>{void run(()=>api.get(project.id));}} continueJob={async(jobId,answers,confirmed)=>api.continueProposal(project,jobId,answers,confirmed)} abandonJob={async jobId=>api.abandonProposal(project,jobId)} editBrief={async(jobId,brief)=>api.editBrief(project,jobId,brief)} readReply={async jobId=>api.jobReply(project,jobId)}/>},
      {id:'proposals',label:t('proposals'),content:<ProposalPanel registerReference={reference=>{void run(()=>api.reference(project,{kind:'save',reference}));}} reject={id=>{void run(()=>api.reject(project,id));}} key={`proposals-${project.id}`} project={project} busy={busy} t={t} adopt={id=>{void run(()=>api.adopt(project,id),true);}}/>},
    ]},
    {id:'requirements',label:t('stageRequirements'),hint:t('stageHintRequirements'),badge:`${project.nodes.length}${t('badgeRequirements')}`,blocks:[
      {id:'requirements',label:t('layoutRequirements'),content:<RequirementsEditor onSelect={setSelectedRequirement} key={`${project.id}-${editorEpoch}`} project={project} busy={busy} t={t} save={change => { void run(async() => {const next=await api.edit(project,change);setHistory(h=>{try{return recordEdit(h,project,next);}catch{setError(t('historyDesync'));return undefined;}});return next;}); }}/>},
      {id:'references',label:t('layoutReferences'),content:<><ReferencesPanel key={`references-${project.id}`} project={project} busy={busy} t={t} save={change=>{void run(()=>api.reference(project,change));}}/><FeaturePanel key={`features-${project.id}`} project={project} busy={busy} t={t} save={change=>{void run(()=>api.feature(project,change));}}/></>},
    ]},
    {id:'architecture',label:t('stageArchitecture'),hint:t('stageHintArchitecture'),badge:`${project.architecture.length}${t('badgeArchitecture')}`,blocks:[
      {id:'architecture',label:t('layoutArchitecture'),content:<ArchitectureEditor key={`architecture-${project.id}-${editorEpoch}`} project={project} busy={busy} t={t} save={change=>{void run(async()=>{const next=await api.architecture(project,change);if(history){setHistory(undefined);setError(t('historyDesync'));}return next;});}}/>},
    ]},
    {id:'approval',label:t('stageApproval'),hint:t('stageHintApproval'),badge:project.versions.length?`v${project.versions.length}`:t('badgeUnfrozen'),blocks:[
      {id:'versions',label:t('versions'),content:<VersionPanel key={`versions-${project.id}`} project={project} busy={busy} t={t} confirmTasks={id=>{void run(()=>api.confirmTasks(project,id));}} approve={(label,review)=>{void run(()=>api.approve(project,label,review));}}/>},
      {id:'research',label:t('researchTitle'),content:<ResearchPanel evidence={api.evidence} project={project} busy={busy} t={t} listWorkspaces={api.listWorkspaces} listModels={api.listModels} start={(referenceId,request,workspaceId,model)=>void run(()=>api.research(project,referenceId,request,workspaceId,model))} refresh={()=>void run(()=>api.get(project.id))}/>},
    ]},
    {id:'handoff',label:t('stageHandoff'),hint:t('stageHintHandoff'),badge:project.reports.length?`${project.reports.length}${t('badgeReports')}`:undefined,blocks:[
      {id:'handoff',label:t('handoffTitle'),content:<HandoffPanel key={`handoff-${project.id}`} project={project} api={api.handoff} dispatch={api.dispatch} onProject={next=>setProject(current=>current?.id===next.id&&next.projectRevision>=current.projectRevision?next:current)} t={t}/>},
      {id:'reports',label:t('reportsTitle'),content:<ReportsPanel project={project} busy={busy} t={t} refresh={()=>void run(()=>api.get(project.id))} accept={(id,value)=>void run(()=>api.acceptReport(project,id,value))}/>},
    ]},
  ]:[];
  if(!project) return <section className="cs-projects cs-chooser" aria-label={t('projects')}>
    <div className="cs-chooser-head"><h2 className="cs-chooser-title">{t('projects')}</h2><small className="cs-hint">{t('chooserHint')}</small></div>
    <form className="cs-form" onSubmit={e => { e.preventDefault(); if (name.trim()) void run(() => api.create(name.trim())); }}>
      <div className="cs-field"><label htmlFor="cs-project-name">{t('projectName')}</label><input id="cs-project-name" aria-label={t('projectName')} placeholder={t('projectName')} value={name} onChange={e => setName(e.target.value)} disabled={busy} /></div>
      <button disabled={busy || !name.trim()} type="submit">{busy ? t('working') : t('newProject')}</button>
    </form>
    {error && <p role="alert" className="cs-error">{errorText(error)}</p>}
    <ol className="cs-onboarding" aria-label={t('chooserSteps')}>
      <li><strong>{t('chooserStep1Title')}</strong><span>{t('chooserStep1Body')}</span></li>
      <li><strong>{t('chooserStep2Title')}</strong><span>{t('chooserStep2Body')}</span></li>
      <li><strong>{t('chooserStep3Title')}</strong><span>{t('chooserStep3Body')}</span></li>
    </ol>
    <nav className="cs-project-list" aria-label={t('projects')}>{projects.map(p => <button type="button" className="cs-project-card" key={p.id} disabled={busy} onClick={() => void run(() => api.get(p.id))}><strong>{p.name}</strong><small className="cs-hint">{t('draftRevision')} {p.contentRevision}{typeof p.requirementCount==='number'?` · ${p.requirementCount} ${t('chooserRequirements')} · ${p.architectureCount??0} ${t('chooserModules')}`:''}</small>{p.proposalStatus==='submitted'&&<small className="cs-hint cs-card-flag">{t('chooserAwaitingModel')}</small>}</button>)}</nav>
    {!projects.length && <p className="cs-hint">{t('railEmptyHint')}</p>}
  </section>;
  return <section className="cs-projects" aria-label={t('projects')}>
    <article>
      <div className="cs-project-head">
        <h2 className="cs-project-title">{project.name}</h2>
        <small className="cs-hint">{t('draftRevision')} {project.contentRevision}</small>
        <details className="cs-advanced cs-project-menu">
          <summary>{t('projectSettings')}</summary>
          <div className="cs-row-actions">
            <button type="button" className="cs-quiet" disabled={busy} onClick={() => { if(window.confirm(t('confirmProjectChange'))) { setProject(undefined); setHistory(undefined); setSelectedRequirement(null); } }}>{t('allProjects')}</button>
            <button type="button" className="cs-quiet" disabled={busy} onClick={()=>{const next=window.prompt(t('renameProject'),project.name);if(next?.trim()&&next.trim()!==project.name)void run(()=>api.rename(project,next.trim()));}}>{t('renameProject')}</button>
            <button type="button" className="cs-danger" disabled={busy} onClick={()=>{void removeProject();}}>{t('deleteProject')}</button>
          </div>
          <p className="cs-hint">{t('projectSettingsHint')}</p>
        </details>
      </div>
      <div className="cs-toolbar" aria-label={t('requirementHistory')}><button type="button" disabled={busy||!historyCurrent||!history?.past.length} onClick={()=>restore('undo')}>{t('undoRequirements')}</button><button type="button" disabled={busy||!historyCurrent||!history?.future.length} onClick={()=>restore('redo')}>{t('redoRequirements')}</button>{!historyCurrent&&<small className="cs-hint" title={t('historyScope')}>{t('historyUnavailable')}</small>}</div>
      {error && <p role="alert" className="cs-error">{errorText(error)}</p>}
      <Workbench key={project.id} projectId={project.id} t={t} stages={stages}
        demo={compare=><DemoPanel selectedRequirement={selectedRequirement} key={`demo-${project.id}-${editorEpoch}`} project={project} t={t} stacked={compare} busy={busy} save={scene=>{void run(()=>api.demo(project,scene));}}/>}
      />
    </article>
  </section>;
}
