import {ResearchConclusionSchema,validateProject,type Project} from './project.js';
import type {CapturedResearchResult} from '../host/research-evidence.js';
export function beginResearchJob(current:Project,input:{id:string;sessionId:string;referenceId:string;request:string;allowedTools:string[]}):Project {
 const next=validateProject(current);
 if(next.researchJob&&!['finished','failed'].includes(next.researchJob.status))throw new Error('RESEARCH_ALREADY_ACTIVE');
 const reference=next.references.find(r=>r.id===input.referenceId);if(!reference)throw new Error('REFERENCE_NOT_FOUND');
 next.researchSessions=[...new Set([...next.researchSessions,...(next.researchJob?[next.researchJob.sessionId]:[]),input.sessionId])];
 next.researchJob={id:input.id,sessionId:input.sessionId,reference:structuredClone(reference),request:input.request,allowedTools:[...input.allowedTools],status:'queued',evidence:[],conclusion:null};
 next.projectRevision++;return validateProject(next);
}
export function finishResearch(current:Project,sessionId:string,jobId:string,input:unknown):Project {
 const next=validateProject(current),job=next.researchJob;
 if(!job||job.id!==jobId||job.sessionId!==sessionId)throw new Error('RESEARCH_SCOPE');
 if(!['queued','submitted','unknown'].includes(job.status))throw new Error('RESEARCH_NOT_ACTIVE');
 const conclusion=ResearchConclusionSchema.parse(input);
 if(conclusion.evidenceCallIds.some(id=>!job.evidence.some(e=>e.callId===id)))throw new Error('RESEARCH_EVIDENCE_NOT_FOUND');
 if(!conclusion.evidenceCallIds.length&&!conclusion.limitations.length)throw new Error('RESEARCH_REQUIRES_EVIDENCE_OR_LIMITATION');
 job.conclusion=conclusion;job.status='finished';next.projectRevision++;return validateProject(next);
}
export function appendResearchEvidence(current:Project,sessionId:string,jobId:string,evidence:CapturedResearchResult):Project {
 const next=validateProject(current),job=next.researchJob;
 if(!job||job.id!==jobId||job.sessionId!==sessionId)throw new Error('RESEARCH_SCOPE');
 if(!['queued','submitted','unknown'].includes(job.status))throw new Error('RESEARCH_NOT_ACTIVE');
 if(!job.allowedTools.includes(evidence.tool))throw new Error('RESEARCH_TOOL_DENIED');
 if(job.evidence.some(e=>e.callId===evidence.callId))return next;
 // Validate JSON at the same boundary as the entire project write.
 const candidate={...next,researchJob:{...job,evidence:[...job.evidence,evidence]},projectRevision:next.projectRevision+1};
 return validateProject(candidate);
}
