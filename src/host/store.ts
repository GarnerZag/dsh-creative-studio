import {finishResearch,beginResearchJob,appendResearchEvidence} from '../domain/research-jobs.js';
import type {CapturedResearchResult} from './research-evidence.js';
import {submitReport,setReportAcceptance} from '../domain/reports.js';
import {beginDispatch,advanceDispatch} from '../domain/dispatch.js';
import type {DevelopmentDispatch} from '../domain/project.js';
import {confirmTaskPlan} from '../domain/handoff.js';
import {saveDemo} from '../domain/demos.js';
import {saveFeatureNote,removeFeatureNote} from '../domain/research.js';
import type {FeatureNote} from '../domain/project.js';
import {editReference,type ReferenceEdit} from '../domain/references.js';
import { randomUUID } from 'node:crypto';
import { beginProposalJob, submitJobProposal } from '../domain/jobs.js';
import { saveProposal, adoptProposal, rejectProposal } from '../domain/proposals.js';
import type { ProposalInput } from '../domain/project.js';
import { approveVersion } from '../domain/versions.js';
import { editArchitecture, type ArchitectureEdit } from '../domain/architecture.js';
import type { KvTable } from '@deepseek-ai/dsh-storage-domain';
import { createProject, editRequirements, validateProject, type Project, type RequirementEdit } from '../domain/project.js';

type ProjectTable = Pick<KvTable<string, Project>, 'get' | 'entries' | 'put' | 'update'>;

/** Thin adapter: serialization/persistence belongs to the Host's KvTable. */
export class ProjectStore {
  constructor(private readonly table: ProjectTable) {}
  finishResearch(id:string,sessionId:string,jobId:string,input:unknown):Promise<Project>{return this.table.update(id,current=>finishResearch(current,sessionId,jobId,input));}
  markResearch(id:string,jobId:string,status:'submitted'|'unknown'|'finished'|'failed'):Promise<Project>{return this.table.update(id,current=>{const next=validateProject(current);if(next.researchJob?.id!==jobId)throw new Error('RESEARCH_SCOPE');if(['finished','failed'].includes(next.researchJob.status))return next;next.researchJob.status=status;next.projectRevision++;return validateProject(next);});}
  beginResearch(id:string,expectedProjectRevision:number,input:Parameters<typeof beginResearchJob>[1]):Promise<Project>{return this.table.update(id,current=>{if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');return beginResearchJob(current,input);});}
  researchEvidence(id:string,sessionId:string,jobId:string,evidence:CapturedResearchResult):Promise<Project>{return this.table.update(id,current=>appendResearchEvidence(current,sessionId,jobId,evidence));}
  acceptReport(projectId:string,expectedProjectRevision:number,reportId:string,accepted:boolean):Promise<Project>{return this.table.update(projectId,current=>{if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');return setReportAcceptance(current,reportId,accepted);});}
  report(projectId:string,sessionId:string,input:unknown):Promise<Project>{return this.table.update(projectId,current=>submitReport(current,sessionId,input));}

  list(): Array<{ id: string; name: string; projectRevision: number; contentRevision: number }> {
    return Array.from(this.table.entries(), ([, p]) => ({ id: p.id, name: p.name, projectRevision: p.projectRevision, contentRevision: p.contentRevision }));
  }

  get(id: string): Project {
    const current = this.table.get(id);
    if (!current) throw new Error('PROJECT_NOT_FOUND');
    return validateProject(current);
  }

  async create(name: string): Promise<Project> {
    const project = createProject(randomUUID(), name);
    await this.table.put(project.id, project);
    return validateProject(project);
  }

  async beginDispatch(id:string,expectedProjectRevision:number,input:Omit<DevelopmentDispatch,'status'>):Promise<Project>{return validateProject(await this.table.update(id,current=>{if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');return beginDispatch(current,input);}));}
  async advanceDispatch(id:string,dispatchId:string,status:DevelopmentDispatch['status'],entry?:string):Promise<Project>{return validateProject(await this.table.update(id,current=>advanceDispatch(current,dispatchId,status,entry)));}

  async confirmTasks(id:string,expectedProjectRevision:number,versionId:string):Promise<Project>{return validateProject(await this.table.update(id,current=>{if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');return confirmTaskPlan(current,versionId);}));}

  async demo(id:string,expectedProjectRevision:number,expectedContentRevision:number,input:unknown):Promise<Project>{
    return validateProject(await this.table.update(id,current=>{
      if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');
      return saveDemo(current,expectedContentRevision,input);
    }));
  }

  async feature(id:string,expectedProjectRevision:number,change:{kind:'save';feature:FeatureNote}|{kind:'remove';id:string}):Promise<Project>{
    return validateProject(await this.table.update(id,current=>{
      if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');
      return change.kind==='save'?saveFeatureNote(current,change.feature):removeFeatureNote(current,change.id);
    }));
  }

  async reference(id:string,expectedProjectRevision:number,edit:ReferenceEdit):Promise<Project>{
    return validateProject(await this.table.update(id,current=>{
      if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');
      return editReference(current,edit);
    }));
  }

  async rename(id: string, expectedProjectRevision: number, name: string): Promise<Project> {
    const result = await this.table.update(id, current => {
      if (current.projectRevision !== expectedProjectRevision) throw new Error('CONFLICT');
      return validateProject({ ...current, name, projectRevision: current.projectRevision + 1 });
    });
    return validateProject(result);
  }

  async beginProposalJob(id: string, expectedProjectRevision: number, jobId: string, sessionId: string, request: string): Promise<Project> {
    return validateProject(await this.table.update(id,current=>{
      if(current.projectRevision!==expectedProjectRevision) throw new Error('CONFLICT');
      return beginProposalJob(current,jobId,sessionId,request);
    }));
  }
  async markProposalJob(id: string, jobId: string, status: 'submitted'|'unknown'): Promise<Project> {
    return validateProject(await this.table.update(id,current=>{
      if(current.proposalJob?.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
      if(current.proposalJob.status==='finished'||current.proposalJob.status==='failed') return current;
      return validateProject({...current,projectRevision:current.projectRevision+1,proposalJob:{...current.proposalJob,status}});
    }));
  }
  async submitJobProposal(id: string, sessionId: string, jobId: string, input: ProposalInput): Promise<Project> {
    return validateProject(await this.table.update(id,current=>submitJobProposal(current,sessionId,jobId,input)));
  }

  async rejectProposal(id:string,expectedProjectRevision:number,proposalId:string):Promise<Project>{
    return validateProject(await this.table.update(id,current=>{if(current.projectRevision!==expectedProjectRevision)throw new Error('CONFLICT');return rejectProposal(current,proposalId);}));
  }
  async saveProposal(id: string, input: ProposalInput): Promise<Project> {
    return validateProject(await this.table.update(id,current=>saveProposal(current,input)));
  }
  async adoptProposal(id: string, expectedProjectRevision: number, expectedContentRevision: number, proposalId: string): Promise<Project> {
    return validateProject(await this.table.update(id,current=>{
      if(current.projectRevision!==expectedProjectRevision) throw new Error('CONFLICT');
      return adoptProposal(current,expectedContentRevision,proposalId);
    }));
  }

  async approve(id: string, expectedProjectRevision: number, expectedContentRevision: number, label: string): Promise<Project> {
    const versionId=randomUUID();
    const result=await this.table.update(id,current=>{
      if(current.projectRevision!==expectedProjectRevision) throw new Error('CONFLICT');
      return approveVersion(current,expectedContentRevision,versionId,label,new Date().toISOString());
    });
    return validateProject(result);
  }

  async architecture(id: string, expectedProjectRevision: number, expectedContentRevision: number, edit: ArchitectureEdit): Promise<Project> {
    const result = await this.table.update(id, current => {
      if (current.projectRevision !== expectedProjectRevision) throw new Error('CONFLICT');
      return editArchitecture(current, expectedContentRevision, edit);
    });
    return validateProject(result);
  }

  async edit(id: string, expectedProjectRevision: number, expectedContentRevision: number, edit: RequirementEdit): Promise<Project> {
    const result = await this.table.update(id, current => {
      if (current.projectRevision !== expectedProjectRevision) throw new Error('CONFLICT');
      return editRequirements(current, expectedContentRevision, edit);
    });
    return validateProject(result);
  }
}
