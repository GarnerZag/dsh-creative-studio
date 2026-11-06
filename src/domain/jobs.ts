import {validateProject,type Project,type ProposalInput} from './project.js';
import {saveProposal} from './proposals.js';
export function beginProposalJob(current:Project,id:string,sessionId:string,request:string):Project {
 const project=validateProject(current);
 if(project.proposalJob && !['finished','failed'].includes(project.proposalJob.status)) throw new Error('JOB_ALREADY_ACTIVE');
 project.proposalSessions=[...new Set([...project.proposalSessions,...(project.proposalJob?[project.proposalJob.sessionId]:[]),sessionId])];
 project.proposalJob={id,sessionId,request,baseContentRevision:project.contentRevision,nodes:structuredClone(project.nodes),architecture:structuredClone(project.architecture),status:'queued'};
 project.projectRevision++;
 return validateProject(project);
}
export function submitJobProposal(current:Project,sessionId:string,jobId:string,input:ProposalInput):Project {
 const job=current.proposalJob;
 if(!job || job.sessionId!==sessionId || job.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
 if(!['queued','submitted','unknown'].includes(job.status)) throw new Error('JOB_NOT_ACTIVE');
 if(input.baseContentRevision!==job.baseContentRevision) throw new Error('JOB_BASE_MISMATCH');
 const next=saveProposal(current,input);
 next.proposalJob!.status='finished';
 return validateProject(next);
}
