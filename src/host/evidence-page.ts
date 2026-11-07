import type {Project} from '../domain/project.js';
export function evidencePage(project:Project,jobId:string,callId:string,offset:number):{text:string;nextOffset:number|null;total:number}{
 const job=project.researchJob;if(!job||job.id!==jobId)throw new Error('RESEARCH_SCOPE');
 const item=job.evidence.find(e=>e.callId===callId);if(!item)throw new Error('EVIDENCE_NOT_FOUND');
 const text=JSON.stringify(item.value,null,2);
 if(!Number.isSafeInteger(offset)||offset<0||offset>text.length)throw new Error('INVALID_OFFSET');
 const end=Math.min(text.length,offset+16384);
 return {text:text.slice(offset,end),nextOffset:end<text.length?end:null,total:text.length};
}
