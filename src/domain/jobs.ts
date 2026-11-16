import {validateProject,type Project,type ProposalInput,type Brief} from './project.js';
import {saveProposal} from './proposals.js';
export function beginProposalJob(current:Project,id:string,sessionId:string,request:string):Project {
 const project=validateProject(current);
 if(project.proposalJob && !['finished','failed'].includes(project.proposalJob.status)) throw new Error('JOB_ALREADY_ACTIVE');
 project.proposalSessions=[...new Set([...project.proposalSessions,...(project.proposalJob?[project.proposalJob.sessionId]:[]),sessionId])];
 project.proposalJob={id,sessionId,request,baseContentRevision:project.contentRevision,nodes:structuredClone(project.nodes),architecture:structuredClone(project.architecture),brief:null,status:'queued'};
 project.projectRevision++;
 return validateProject(project);
}
/** Records what the session understood from the raw input before proposing anything. */
export function submitJobBrief(current:Project,sessionId:string,jobId:string,brief:Brief):Project {
 const job=current.proposalJob;
 if(!job || job.sessionId!==sessionId || job.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
 if(!['queued','submitted','unknown'].includes(job.status)) throw new Error('JOB_NOT_ACTIVE');
 const next=structuredClone(current);
 next.proposalJob!.brief=brief;
 next.projectRevision++;
 return validateProject(next);
}
/** User-side correction of the structured understanding, before requirements exist. */
export function editJobBrief(current:Project,jobId:string,brief:Brief):Project {
 const job=current.proposalJob;
 if(!job || job.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
 if(!['queued','submitted','unknown'].includes(job.status)) throw new Error('JOB_NOT_ACTIVE');
 const next=structuredClone(current);
 next.proposalJob!.brief=brief;
 next.projectRevision++;
 return validateProject(next);
}
/** User-side stop for a job the session will not turn into requirements. */
export function abandonProposalJob(current:Project,jobId:string):Project {
 const job=current.proposalJob;
 if(!job || job.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
 if(!['queued','submitted','unknown'].includes(job.status)) throw new Error('JOB_NOT_ACTIVE');
 const next=structuredClone(current);
 next.proposalJob!.status='failed';
 next.projectRevision++;
 return validateProject(next);
}
export function submitJobProposal(current:Project,sessionId:string,jobId:string,input:ProposalInput):Project {
 const job=current.proposalJob;
 if(!job || job.sessionId!==sessionId || job.id!==jobId) throw new Error('JOB_SCOPE_MISMATCH');
 if(!['queued','submitted','unknown'].includes(job.status)) throw new Error('JOB_NOT_ACTIVE');
 if(!job.brief) throw new Error('PROPOSAL_BRIEF_REQUIRED');
 // An instruction addressed to the studio is not a product idea: never invent requirements from it.
 if(job.brief.intent!=='product') throw new Error('PROPOSAL_REQUIRES_PRODUCT_INTENT');
 if(input.baseContentRevision!==job.baseContentRevision) throw new Error('JOB_BASE_MISMATCH');
 const next=saveProposal(current,input);
 next.proposalJob!.status='finished';
 return validateProject(next);
}
