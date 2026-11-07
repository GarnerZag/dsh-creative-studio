import {disposeAll,type Cleanup} from './dispose.js';
import {evidencePage} from './evidence-page.js';
import type {ResearchEvidencePage} from '../types.js';
import {startResearch} from './research-runner.js';
import {researchReadTools} from './research-policy.js';
import {researchTools,researchGuard} from './research-tools.js';
import {captureResearchResult} from './research-evidence.js';
import {registerReportTool} from './report-tool.js';
import {dispatchDevelopment,type DevelopmentGateway} from './dispatch-runner.js';
import type { Context } from '@deepseek-ai/cordis';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { requireUserAuthority } from './authority.js';

import {HandoffStore,StoredHandoffSchema,type StoredHandoff} from './handoff-store.js';
import {checkHandoff} from '../domain/handoff.js';
import type { WorkspaceOption,HandoffInfo,HandoffChunk,HandoffReadinessResult,DemoSceneData, StudioHealth, ProjectHead, ProjectSnapshot, RequirementChange, ArchitectureChange, ProposalInput, ReferenceChange, FeatureChange } from '../types.js';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
import { ProjectSchema, type Project } from '../domain/project.js';
import { ProjectStore } from './store.js';
import { startProposal, type ProposalSessionGateway } from './proposal-runner.js';
import { proposalTools, proposalGuard, type ProposalToolRegistry } from './proposal-tools.js';

declare module '@deepseek-ai/cordis' {
  interface Context { creativeStudio: CreativeStudio }
}

/** The plugin's owner-only, schema-generated Host API. */
export default class CreativeStudio extends TypertRemoteService {
  static inject = ['storageDomain', 'tools'];
  private projects?: ProjectStore;
  private handoffs?:HandoffStore;
  private initializationError?: string;

  constructor(ctx: Context) {
    super(ctx, 'creativeStudio');
    ctx.effect(async () => {
      const disposers:Cleanup[]=[];
      const cleanup=async()=>{this.projects=undefined;this.handoffs=undefined;await disposeAll(disposers);};
      try {
      const domain = await ctx.storageDomain.open(defineDomain({
        name: 'garnerzag_creative_studio', version: 1, layout: 'per-record',
        tables: { projects: domainTable<string, Project>(ProjectSchema), handoffs:domainTable<string,StoredHandoff>(StoredHandoffSchema) },
      }));
      disposers.push(()=>domain.close());
      const store = new ProjectStore(domain.table('projects'));
      this.projects = store;
      this.handoffs=new HandoffStore(domain.table('handoffs'));
      const tools = ctx.get('tools') as ProposalToolRegistry | undefined;
      if (!tools) throw new Error('TOOLS_UNAVAILABLE');
      for(const definition of proposalTools(store))disposers.push(tools.register(definition, {
        when: ({agent}) => store.list().some(p => store.get(p.id).proposalJob?.sessionId === agent.id),
      }));
      disposers.push(tools.guard(proposalGuard(store)));
      disposers.push(registerReportTool(tools,store));
      for(const definition of researchTools(store))disposers.push(tools.register(definition,{when:({agent})=>store.list().some(p=>store.get(p.id).researchJob?.sessionId===agent.id)}));
      disposers.push(tools.guard(researchGuard(store)));
      // Actual Host event, not a claim submitted by the model. Structural type avoids unrelated SDK ambient resources.
      const events=ctx as unknown as {on(name:'tools/result',listener:(exec:{agent?:{id:string};callId:string;name:string},result:{isError:boolean;value?:unknown})=>void):()=>void};
      disposers.push(events.on('tools/result',(exec,result)=>{
       if(!exec.agent)return;
       for(const head of store.list()){
        const job=store.get(head.id).researchJob;
        if(!job||job.sessionId!==exec.agent.id||!['queued','submitted','unknown'].includes(job.status))continue;
        const evidence=captureResearchResult(job,exec,result);if(!evidence)continue;
        void store.researchEvidence(head.id,job.sessionId,job.id,evidence).catch(async()=>{await store.markResearch(head.id,job.id,'unknown');}).catch(()=>console.warn('Creative Studio: research evidence persistence failed; no completion claimed.'));
       }
      }));
      return cleanup;
      } catch (error) {
        await cleanup().catch(()=>console.warn('Creative Studio: initialization cleanup failed'));
        this.initializationError = error instanceof Error ? error.message : String(error);
        return () => {};
      }
    });
  }

  private userStore(): ProjectStore {
    requireUserAuthority(this.ctx.invocation);
    if (!this.projects) throw new Error(this.initializationError ? `STORAGE_INITIALIZATION_FAILED: ${this.initializationError}` : 'STORAGE_NOT_READY');
    return this.projects;
  }

  @Remote
  listWorkspaces():WorkspaceOption[]{
    requireUserAuthority(this.ctx.invocation);
    const registry=this.ctx.get('workspaceRegistry') as {list():WorkspaceOption[]}|undefined;
    if(!registry)throw new Error('WORKSPACE_REGISTRY_UNAVAILABLE');
    return registry.list().map(({id,title,path})=>({id,title,path}));
  }

  @Remote
  handoffReadiness(id:string,versionId:string):HandoffReadinessResult{return checkHandoff(this.userStore().get(id),versionId);}

  @Remote
  exportHandoff(id:string,versionId:string):Promise<HandoffInfo>{const project=this.userStore().get(id);if(!this.handoffs)throw new Error('STORAGE_NOT_READY');return this.handoffs.create(project,versionId);}

  @Remote
  readHandoffChunk(id:string,handoffId:string,offset:number,maxBytes:number):HandoffChunk{this.userStore().get(id);if(!this.handoffs)throw new Error('STORAGE_NOT_READY');return this.handoffs.chunk(id,handoffId,offset,maxBytes);}

  @Remote
  confirmTaskPlan(id:string,expectedProjectRevision:number,versionId:string):Promise<ProjectSnapshot>{return this.userStore().confirmTasks(id,expectedProjectRevision,versionId);}

  @Remote
  saveDemo(id:string,expectedProjectRevision:number,expectedContentRevision:number,scene:DemoSceneData):Promise<ProjectSnapshot>{return this.userStore().demo(id,expectedProjectRevision,expectedContentRevision,scene);}

  @Remote
  listProjects(): ProjectHead[] { return this.userStore().list(); }

  @Remote
  createProject(name: string): Promise<ProjectSnapshot> { return this.userStore().create(name); }

  @Remote
  getProject(id: string): ProjectSnapshot { return this.userStore().get(id); }

  @Remote
  rejectProposal(id:string,expectedProjectRevision:number,proposalId:string):Promise<ProjectSnapshot>{return this.userStore().rejectProposal(id,expectedProjectRevision,proposalId);}

  @Remote
  readResearchEvidence(id:string,jobId:string,callId:string,offset:number):ResearchEvidencePage{return evidencePage(this.userStore().get(id),jobId,callId,offset);}

  @Remote
  renameProject(id: string, expectedProjectRevision: number, name: string): Promise<ProjectSnapshot> {
    return this.userStore().rename(id, expectedProjectRevision, name);
  }

  @Remote
  editRequirements(id: string, expectedProjectRevision: number, expectedContentRevision: number, change: RequirementChange): Promise<ProjectSnapshot> {
    return this.userStore().edit(id, expectedProjectRevision, expectedContentRevision, change);
  }

  @Remote
  editArchitecture(id: string, expectedProjectRevision: number, expectedContentRevision: number, change: ArchitectureChange): Promise<ProjectSnapshot> {
    return this.userStore().architecture(id, expectedProjectRevision, expectedContentRevision, change);
  }

  @Remote
  approveVersion(id: string, expectedProjectRevision: number, expectedContentRevision: number, label: string): Promise<ProjectSnapshot> {
    return this.userStore().approve(id, expectedProjectRevision, expectedContentRevision, label);
  }

  @Remote
  saveProposal(id: string, input: ProposalInput): Promise<ProjectSnapshot> {
    return this.userStore().saveProposal(id, input);
  }
  @Remote
  adoptProposal(id: string, expectedProjectRevision: number, expectedContentRevision: number, proposalId: string): Promise<ProjectSnapshot> {
    return this.userStore().adoptProposal(id, expectedProjectRevision, expectedContentRevision, proposalId);
  }

  @Remote
  async editFeature(id:string,expectedProjectRevision:number,change:FeatureChange):Promise<ProjectSnapshot>{return this.userStore().feature(id,expectedProjectRevision,change);}

  @Remote
  async editReference(id:string,expectedProjectRevision:number,change:ReferenceChange):Promise<ProjectSnapshot>{
    return this.userStore().reference(id,expectedProjectRevision,change);
  }

  @Remote
  acceptImplementationReport(id:string,expectedProjectRevision:number,reportId:string,accepted:boolean):Promise<ProjectSnapshot>{return this.userStore().acceptReport(id,expectedProjectRevision,reportId,accepted);}

  @Remote
  async dispatchHandoff(id:string,expectedProjectRevision:number,handoffId:string,workspaceId:string,relativeDirectory:string,agentPreset:string,confirmed:boolean,signal:AbortSignal):Promise<ProjectSnapshot>{
    const store=this.userStore();
    if(!confirmed)throw new Error('DEVELOPMENT_CONFIRMATION_REQUIRED');
    if(!this.handoffs)throw new Error('STORAGE_NOT_READY');
    const sessions=this.ctx.get('sessionController') as Pick<DevelopmentGateway,'create'|'prompt'>|undefined;
    const registry=this.ctx.get('workspaceRegistry') as {get(id:string):{path:string}|undefined}|undefined;
    if(!sessions||!registry)throw new Error('DEVELOPMENT_SERVICES_UNAVAILABLE');
    await dispatchDevelopment(store,this.handoffs,{workspace:key=>registry.get(key),create:input=>sessions.create(input),prompt:(input,signal)=>sessions.prompt(input,signal)},{projectId:id,expectedProjectRevision,handoffId,workspaceId,relativeDirectory,agentPreset},signal);
    return store.get(id);
  }

  @Remote
  async generateProposal(id:string, expectedProjectRevision:number, request:string, workspaceId:string, signal:AbortSignal):Promise<ProjectSnapshot> {
    const store=this.userStore();
    if(!request.trim()||!workspaceId.trim()) throw new Error('REQUEST_AND_WORKSPACE_REQUIRED');
    const sessions=this.ctx.get('sessionController') as ProposalSessionGateway|undefined;
    if(!sessions) throw new Error('SESSION_SERVICE_UNAVAILABLE');
    await startProposal(store,sessions,{projectId:id,expectedProjectRevision,request,workspaceId},signal);
    return store.get(id);
  }

  @Remote
  async researchReference(id:string,expectedProjectRevision:number,referenceId:string,request:string,workspaceId:string,confirmed:boolean,signal:AbortSignal):Promise<ProjectSnapshot>{
    const store=this.userStore();if(!confirmed)throw new Error('RESEARCH_CONFIRMATION_REQUIRED');
    if(!request.trim())throw new Error('RESEARCH_REQUEST_REQUIRED');
    const registry=this.ctx.get('workspaceRegistry') as {get(id:string):unknown}|undefined;
    if(!registry?.get(workspaceId))throw new Error('WORKSPACE_NOT_FOUND');
    const sessions=this.ctx.get('sessionController') as ProposalSessionGateway|undefined;
    if(!sessions)throw new Error('SESSION_SERVICE_UNAVAILABLE');
    const project=store.get(id),reference=project.references.find(r=>r.id===referenceId);if(!reference)throw new Error('REFERENCE_NOT_FOUND');
    const remote=/^https?:\/\//.test(reference.location);
    // Availability is also enforced by the child session's resolved tool set; never grant execution tools.
    const allowedTools=researchReadTools.filter(name=>remote?name==='web_fetch':name!=='web_fetch');
    await startResearch(store,sessions,{projectId:id,expectedProjectRevision,referenceId,request,workspaceId,allowedTools},signal);
    return store.get(id);
  }

  /** Verify an authenticated connection to the workshop Host service. */
  @Remote
  health(): StudioHealth {
    requireUserAuthority(this.ctx.invocation);
    return { status: 'connected', version: '0.1.0' };
  }
}
