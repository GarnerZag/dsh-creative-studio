import * as React from 'react';
import {recordEdit,historyChange,commitHistory,type RequirementHistory} from './requirement-history.js';
import {ResearchPanel} from './research.js';
import {ReportsPanel} from './reports.js';
import {HandoffPanel,type HandoffActions} from './handoff.js';
import {Workbench} from './workbench.js';
import {DemoPanel} from './demo.js';
import {FeaturePanel} from './features.js';
import type {FeatureChange} from '../types.js';
import {ReferencesPanel} from './references.js';
import type {ReferenceChange} from '../types.js';
import { GeneratePanel } from './generate.js';
import { ProposalPanel } from './proposals.js';
import { VersionPanel } from './versions.js';
import type { ProjectHead, ProjectSnapshot, RequirementChange } from '../types.js';
import { ArchitectureEditor } from './architecture.js';
import type { ArchitectureChange } from '../types.js';
import { RequirementsEditor } from './requirements.js';

export interface ProjectActions {
  reject(project:ProjectSnapshot,proposalId:string):Promise<ProjectSnapshot>;
  rename(project:ProjectSnapshot,name:string):Promise<ProjectSnapshot>;
  evidence(id:string,jobId:string,callId:string,offset:number):Promise<import('../types.js').ResearchEvidencePage>;
  research(project:ProjectSnapshot,referenceId:string,request:string,workspaceId:string):Promise<ProjectSnapshot>;
  acceptReport(project:ProjectSnapshot,reportId:string,accepted:boolean):Promise<ProjectSnapshot>;
  listWorkspaces():Promise<import('../types.js').WorkspaceOption[]>;
  handoff:HandoffActions;
  dispatch:import('./dispatch.js').DispatchActions;
  confirmTasks(project:ProjectSnapshot,versionId:string):Promise<ProjectSnapshot>;
  demo(project:ProjectSnapshot,scene:NonNullable<ProjectSnapshot['demo']>):Promise<ProjectSnapshot>;
  feature(project:ProjectSnapshot,change:FeatureChange):Promise<ProjectSnapshot>;
  reference(project:ProjectSnapshot,change:ReferenceChange):Promise<ProjectSnapshot>;
  generate(project:ProjectSnapshot,request:string,workspaceId:string):Promise<ProjectSnapshot>;
  list(): Promise<ProjectHead[]>;
  adopt(project: ProjectSnapshot, proposalId: string): Promise<ProjectSnapshot>;
  approve(project: ProjectSnapshot, label: string,review:import('../types.js').ApprovalReviewInput): Promise<ProjectSnapshot>;
  create(name: string): Promise<ProjectSnapshot>;
  get(id: string): Promise<ProjectSnapshot>;
  architecture(project: ProjectSnapshot, change: ArchitectureChange): Promise<ProjectSnapshot>;
  edit(project: ProjectSnapshot, change: RequirementChange): Promise<ProjectSnapshot>;
}

export function ProjectWorkspace({ api, t }: { api: ProjectActions; t: (key: string) => string }): React.ReactElement {
  const [projects, setProjects] = React.useState<ProjectHead[]>([]);
  const [project, setProject] = React.useState<ProjectSnapshot>();
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [editorEpoch,setEditorEpoch]=React.useState(0);
  const [history,setHistory]=React.useState<RequirementHistory>();
  const historyCurrent=history&&project&&history.projectId===project.id&&history.revision===project.contentRevision;
  const [selectedRequirement,setSelectedRequirement]=React.useState<string|null>(null);
  const generation = React.useRef(0);
  React.useEffect(() => {
    const token = ++generation.current;
    void api.list().then(items => { if (generation.current === token) setProjects(items); }).catch(e => { if (generation.current === token) setError(String(e)); });
    return () => { generation.current++; };
  }, [api]);
  const run = async (operation: () => Promise<ProjectSnapshot>, resetEditors=false) => {
    if (busy) return;
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
    finally { if (generation.current === token) setBusy(false); }
  };
  const restore=(direction:'undo'|'redo')=>{
    if(!project||!history||!historyCurrent||busy||!window.confirm(t('historyConfirm')))return;
    void run(async()=>{const change=historyChange(history,project,direction);const next=await api.edit(project,change);setHistory(commitHistory(history,project,next,direction));setEditorEpoch(epoch=>epoch+1);return next;});
  };
  return <section className="cs-projects" aria-label={t('projects')}>
    <h2>{t('projects')}</h2>
    <form onSubmit={e => { e.preventDefault(); if (name.trim()&&(!project||window.confirm(t('confirmProjectChange')))) void run(() => api.create(name.trim())); }}>
      <input aria-label={t('projectName')} placeholder={t('projectName')} value={name} onChange={e => setName(e.target.value)} disabled={busy} />
      <button disabled={busy || !name.trim()} type="submit">{t('newProject')}</button>
    </form>
    <nav aria-label={t('projects')} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{projects.map(p => <button type="button" key={p.id} aria-pressed={project?.id === p.id} disabled={busy} onClick={() => {if(!project||project.id===p.id||window.confirm(t('confirmProjectChange')))void run(() => api.get(p.id));}}>{p.name}</button>)}</nav>
    {error && <p role="alert" className="cs-error">{error}</p>}
    {project && <article><h3>{project.name}</h3><button disabled={busy} onClick={()=>{const next=window.prompt(t('renameProject'),project.name);if(next?.trim()&&next.trim()!==project.name)void run(()=>api.rename(project,next.trim()));}}>{t('renameProject')}</button><small>{t('draftRevision')} {project.contentRevision}</small>
      <div aria-label={t('requirementHistory')}><button disabled={busy||!historyCurrent||!history?.past.length} onClick={()=>restore('undo')}>{t('undoRequirements')}</button><button disabled={busy||!historyCurrent||!history?.future.length} onClick={()=>restore('redo')}>{t('redoRequirements')}</button><small>{t('historyScope')}</small></div>
      <Workbench key={project.id} projectId={project.id} t={t}
        idea={<><GeneratePanel listWorkspaces={api.listWorkspaces} key={`generate-${project.id}`} project={project} busy={busy} t={t} generate={(request,workspaceId)=>{void run(()=>api.generate(project,request,workspaceId));}} refresh={()=>{void run(()=>api.get(project.id));}}/><ProposalPanel registerReference={reference=>{void run(()=>api.reference(project,{kind:'save',reference}));}} reject={id=>{void run(()=>api.reject(project,id));}} key={`proposals-${project.id}`} project={project} busy={busy} t={t} adopt={id=>{void run(()=>api.adopt(project,id),true);}}/></>}
        panels={[
          {id:'research',label:t('researchTitle'),content:<ResearchPanel evidence={api.evidence} project={project} busy={busy} t={t} listWorkspaces={api.listWorkspaces} start={(referenceId,request,workspaceId)=>void run(()=>api.research(project,referenceId,request,workspaceId))} refresh={()=>void run(()=>api.get(project.id))}/>},
          {id:'reports',label:t('reportsTitle'),content:<ReportsPanel project={project} busy={busy} t={t} refresh={()=>void run(()=>api.get(project.id))} accept={(id,value)=>void run(()=>api.acceptReport(project,id,value))}/>},
          {id:'handoff',label:t('handoffTitle'),content:<HandoffPanel key={`handoff-${project.id}`} project={project} api={api.handoff} dispatch={api.dispatch} onProject={next=>setProject(current=>current?.id===next.id&&next.projectRevision>=current.projectRevision?next:current)} t={t}/>},
          {id:'requirements',label:t('layoutRequirements'),content:<RequirementsEditor onSelect={setSelectedRequirement} key={`${project.id}-${editorEpoch}`} project={project} busy={busy} t={t} save={change => { void run(async() => {const next=await api.edit(project,change);setHistory(h=>recordEdit(h,project,next));return next;}); }}/>},
          {id:'architecture',label:t('layoutArchitecture'),content:<ArchitectureEditor key={`architecture-${project.id}-${editorEpoch}`} project={project} busy={busy} t={t} save={change=>{void run(()=>api.architecture(project,change));}}/>},
          {id:'references',label:t('layoutReferences'),content:<>{<ReferencesPanel key={`references-${project.id}`} project={project} busy={busy} t={t} save={change=>{void run(()=>api.reference(project,change));}}/>}{<FeaturePanel key={`features-${project.id}`} project={project} busy={busy} t={t} save={change=>{void run(()=>api.feature(project,change));}}/>}</>},
          {id:'versions',label:t('layoutVersions'),content:<VersionPanel key={`versions-${project.id}`} project={project} busy={busy} t={t} confirmTasks={id=>{void run(()=>api.confirmTasks(project,id));}} approve={(label,review)=>{void run(()=>api.approve(project,label,review));}}/>},
        ]}
        demo={compare=><DemoPanel selectedRequirement={selectedRequirement} key={`demo-${project.id}-${editorEpoch}`} project={project} t={t} stacked={compare} busy={busy} save={scene=>{void run(()=>api.demo(project,scene));}}/>}
      /></article>}
  </section>;
}
