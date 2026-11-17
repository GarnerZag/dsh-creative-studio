import { randomUUID } from 'node:crypto';
import {disposeAll,type Cleanup} from './dispose.js';
import {evidencePage} from './evidence-page.js';
import type {ApprovalReviewInput,ResearchEvidencePage} from '../types.js';
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
import {AttachmentStore,StoredAttachmentSchema,type StoredAttachment} from './attachment-store.js';
import {decodeUpload} from './attachment-upload.js';
import {MAX_ATTACHMENT_BYTES} from '../domain/attachment-schema.js';
import {checkHandoff} from '../domain/handoff.js';
import type { AttachmentChunk, BriefInfo, JobReply, ModelCatalogView, ModelChoice, WorkspaceOption,HandoffInfo,HandoffChunk,HandoffReadinessResult,DemoSceneData, StudioHealth, ProjectHead, ProjectSummary, ProjectSnapshot, RequirementChange, ArchitectureChange, ProposalInput, ReferenceChange, FeatureChange } from '../types.js';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
import { ProjectSchema, type Project } from '../domain/project.js';
import { ProjectStore } from './store.js';
import { continueProposal, startProposal, type ProposalSessionGateway } from './proposal-runner.js';
import { extractReply } from './session-reply.js';
import { proposalTools, proposalGuard, type ProposalToolRegistry } from './proposal-tools.js';

declare module '@deepseek-ai/cordis' {
  interface Context { creativeStudio: CreativeStudio }
}

/** The plugin's owner-only, schema-generated Host API. */
export default class CreativeStudio extends TypertRemoteService {
  static inject = ['storageDomain', 'tools'];
  private projects?: ProjectStore;
  private handoffs?:HandoffStore;
  private attachments?:AttachmentStore;
  private initializationError?: string;

  constructor(ctx: Context) {
    super(ctx, 'creativeStudio');
    ctx.effect(async () => {
      const disposers:Cleanup[]=[];
      const cleanup=async()=>{this.projects=undefined;this.handoffs=undefined;this.attachments=undefined;await disposeAll(disposers);};
      try {
      const domain = await ctx.storageDomain.open(defineDomain({
        name: 'garnerzag_creative_studio', version: 1, layout: 'per-record',
        tables: { projects: domainTable<string, Project>(ProjectSchema), handoffs:domainTable<string,StoredHandoff>(StoredHandoffSchema), attachments:domainTable<string,StoredAttachment>(StoredAttachmentSchema) },
      }));
      disposers.push(()=>domain.close());
      const store = new ProjectStore(domain.table('projects'));
      this.projects = store;
      this.handoffs=new HandoffStore(domain.table('handoffs'));
      this.attachments=new AttachmentStore(domain.table('attachments'));
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
  async uploadAttachment(id:string,expectedProjectRevision:number,expectedContentRevision:number,input:{name:string;mime:string;base64:string}):Promise<ProjectSnapshot>{
    const store=this.userStore();
    const attachments=this.attachments;
    if(!attachments)throw new Error('STORAGE_NOT_READY');
    const current=store.get(id);
    if(current.projectRevision!==expectedProjectRevision||current.contentRevision!==expectedContentRevision)throw new Error('CONFLICT');
    const bytes=decodeUpload(input.base64);
    const attachmentId=randomUUID();
    await attachments.put(id,attachmentId,bytes);
    try{
      return await store.attach(id,expectedProjectRevision,{id:attachmentId,name:input.name,mime:input.mime,size:bytes.length,createdAt:new Date().toISOString()});
    }catch(error){
      await attachments.remove(id,attachmentId).catch(()=>undefined);
      throw error;
    }
  }

  @Remote
  async deleteAttachment(id:string,expectedProjectRevision:number,attachmentId:string):Promise<ProjectSnapshot>{
    const store=this.userStore();
    const snapshot=await store.detach(id,expectedProjectRevision,attachmentId);
    if(this.attachments)await this.attachments.remove(id,attachmentId);
    return snapshot;
  }

  @Remote
  readAttachmentChunk(id:string,attachmentId:string,offset:number,maxBytes:number):AttachmentChunk{
    const project=this.userStore().get(id);
    if(!project.attachments.some(item=>item.id===attachmentId))throw new Error('ATTACHMENT_NOT_FOUND');
    if(!this.attachments)throw new Error('STORAGE_NOT_READY');
    return this.attachments.chunk(id,attachmentId,offset,maxBytes);
  }

  @Remote
  confirmTaskPlan(id:string,expectedProjectRevision:number,versionId:string):Promise<ProjectSnapshot>{return this.userStore().confirmTasks(id,expectedProjectRevision,versionId);}

  @Remote
  saveDemo(id:string,expectedProjectRevision:number,expectedContentRevision:number,scene:DemoSceneData):Promise<ProjectSnapshot>{return this.userStore().demo(id,expectedProjectRevision,expectedContentRevision,scene);}

  @Remote
  listProjects(): ProjectSummary[] {
    const store=this.userStore();
    return store.list().map(head=>{const project=store.get(head.id);return {...head,requirementCount:project.nodes.length,architectureCount:project.architecture.length,proposalStatus:project.proposalJob?.status??null};});
  }

  @Remote
  createProject(name: string): Promise<ProjectSnapshot> { return this.userStore().create(name); }

  @Remote
  getProject(id: string): ProjectSnapshot { return this.userStore().get(id); }

  @Remote
  rejectProposal(id:string,expectedProjectRevision:number,proposalId:string):Promise<ProjectSnapshot>{return this.userStore().rejectProposal(id,expectedProjectRevision,proposalId);}

  @Remote
  readResearchEvidence(id:string,jobId:string,callId:string,offset:number):ResearchEvidencePage{return evidencePage(this.userStore().get(id),jobId,callId,offset);}

  @Remote
  async deleteProject(id:string,expectedProjectRevision:number):Promise<ProjectSummary[]>{
    const store=this.userStore();
    await store.remove(id,expectedProjectRevision);
    if(this.handoffs)await this.handoffs.purge(id);
    if(this.attachments)await this.attachments.purge(id);
    return this.listProjects();
  }

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
  approveVersion(id: string, expectedProjectRevision: number, expectedContentRevision: number, label: string, review?:ApprovalReviewInput): Promise<ProjectSnapshot> {
    return this.userStore().approve(id, expectedProjectRevision, expectedContentRevision, label, review);
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
  async listModels():Promise<ModelCatalogView>{
    type Catalog={default:{provider:string;model:string;reasoningEffort?:string};groups:readonly {id:string;name:string;models:readonly {id:string;name:string;description?:string;reasoning?:{efforts:readonly {id:string;name:string}[];defaultEffort?:string}}[]}[];failures:readonly {id:string;name:string;message:string}[]};
    const sessions=this.ctx.get('sessionController') as {modelCatalog():Promise<Catalog>}|undefined;
    if(!sessions)throw new Error('SESSION_SERVICE_UNAVAILABLE');
    const catalog=await sessions.modelCatalog();
    return {
      default:{provider:catalog.default.provider,model:catalog.default.model,...(catalog.default.reasoningEffort?{reasoningEffort:catalog.default.reasoningEffort}:{})},
      options:catalog.groups.flatMap(group=>group.models.map(model=>({
        provider:group.id,providerName:group.name,model:model.id,name:model.name,
        ...(model.description?{description:model.description}:{}),
        ...(model.reasoning?{reasoningEfforts:model.reasoning.efforts.map(effort=>({id:effort.id,name:effort.name})),...(model.reasoning.defaultEffort?{defaultEffort:model.reasoning.defaultEffort}:{})}:{}),
      }))),
      failures:catalog.failures.map(failure=>({provider:failure.id,name:failure.name,message:failure.message})),
    };
  }

  /** Text attachments are handed to the session as material; images only by name. */
  private materialFor(project:Project):{name:string;kind:string;text?:string}[]{
    if(!this.attachments||!project.attachments.length)return [];
    return project.attachments.map(item=>{
      if(item.kind!=='text')return {name:item.name,kind:item.kind};
      try{return {name:item.name,kind:item.kind,text:this.attachments!.bytes(project.id,item.id).toString('utf8')};}
      catch{return {name:item.name,kind:item.kind};}
    });
  }

  @Remote
  async generateProposal(id:string, expectedProjectRevision:number, request:string, workspaceId:string, model:ModelChoice|undefined, signal:AbortSignal):Promise<ProjectSnapshot> {
    const store=this.userStore();
    if(!request.trim()||!workspaceId.trim()) throw new Error('REQUEST_AND_WORKSPACE_REQUIRED');
    const sessions=this.ctx.get('sessionController') as ProposalSessionGateway|undefined;
    if(!sessions) throw new Error('SESSION_SERVICE_UNAVAILABLE');
    const material=this.materialFor(store.get(id));
    await startProposal(store,sessions,{projectId:id,expectedProjectRevision,request,workspaceId,material,...(model?{model}:{})},signal);
    return store.get(id);
  }

  @Remote
  async readJobReply(id:string, jobId:string):Promise<JobReply> {
    const job=this.userStore().get(id).proposalJob;
    if(!job||job.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
    type Page=(request:{address:{kind:'session';sessionId:string};maxMessages?:number},signal:AbortSignal)=>Promise<{records:readonly {type?:string;seq?:number;data?:unknown}[];hasMore?:boolean}>;
    const sessions=this.ctx.get('sessionController') as {events?:Page;page?:Page}|undefined;
    // Bind to the service: its history reader dereferences `this.historyController` internally.
    const readPage=typeof sessions?.events==='function'?sessions.events.bind(sessions)
      :typeof sessions?.page==='function'?sessions.page.bind(sessions):undefined;
    if(!readPage) throw new Error('SESSION_SERVICE_UNAVAILABLE');
    // Passive, cold-safe history read: no wait, no activation, no state change on the job session.
    const page=await readPage({address:{kind:'session',sessionId:job.sessionId},maxMessages:6},new AbortController().signal);
    const reply=extractReply(page.records,false);
    return {text:reply.text,truncated:reply.truncated,running:false,reason:'idle',records:Array.isArray(page.records)?page.records.length:0};
  }

  @Remote
  async editProposalBrief(id:string, expectedProjectRevision:number, jobId:string, brief:BriefInfo):Promise<ProjectSnapshot> {
    return this.userStore().editJobBrief(id,expectedProjectRevision,jobId,brief);
  }

  @Remote
  async continueProposalJob(id:string, expectedProjectRevision:number, jobId:string, answers:string, confirmed:boolean, signal:AbortSignal):Promise<ProjectSnapshot> {
    const store=this.userStore();
    if(!confirmed&&!answers.trim()) throw new Error('ANSWERS_REQUIRED');
    const sessions=this.ctx.get('sessionController') as ProposalSessionGateway|undefined;
    if(!sessions) throw new Error('SESSION_SERVICE_UNAVAILABLE');
    // Confirming is a user action on this call: freeze it before the session may propose.
    let project=store.get(id);
    if(project.projectRevision!==expectedProjectRevision) throw new Error('CONFLICT');
    if(project.proposalJob?.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
    if(confirmed&&!project.proposalJob.briefConfirmedAt)
      project=await store.confirmJobBrief(id,project.projectRevision,jobId,new Date().toISOString());
    await continueProposal(store,sessions,{projectId:id,expectedProjectRevision:project.projectRevision,jobId,answers,confirmed},signal);
    return store.get(id);
  }

  @Remote
  async abandonProposalJob(id:string, expectedProjectRevision:number, jobId:string):Promise<ProjectSnapshot> {
    return this.userStore().abandonProposalJob(id,expectedProjectRevision,jobId);
  }

  @Remote
  async researchReference(id:string,expectedProjectRevision:number,referenceId:string,request:string,workspaceId:string,model:ModelChoice|undefined,confirmed:boolean,signal:AbortSignal):Promise<ProjectSnapshot>{
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
    await startResearch(store,sessions,{projectId:id,expectedProjectRevision,referenceId,request,workspaceId,allowedTools,...(model?{model}:{})},signal);
    return store.get(id);
  }

  /** Verify an authenticated connection to the workshop Host service. */
  @Remote
  health(): StudioHealth {
    requireUserAuthority(this.ctx.invocation);
    return { status: 'connected', version: '0.1.0' };
  }
}
