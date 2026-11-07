import {validateProject,VersionSchema,type Project} from './project.js';
import {selectApprovalContent,type ApprovalSelection} from './approval-selection.js';
import {diffContent} from './versions.js';
export interface ApprovalReview {baselineVersionId:string|null;selection?:ApprovalSelection[];acknowledgeUnverified:boolean}
type ApprovalSource=Pick<Project,'nodes'|'architecture'|'features'|'versions'|'demo'|'contentRevision'>;
export function reviewApproval(current:ApprovalSource,review:ApprovalReview){
 const project=structuredClone(current);
 const baseline=review.baselineVersionId===null?{nodes:[],architecture:[]}:project.versions.find(v=>v.id===review.baselineVersionId);
 if(!baseline)throw new Error('APPROVAL_BASELINE_NOT_FOUND');
 const content=review.selection?selectApprovalContent(baseline,project,review.selection):{nodes:project.nodes,architecture:project.architecture};
 const sameDraft=diffContent(content,project).length===0;
 const demo=sameDraft&&project.demo?.contentRevision===project.contentRevision?project.demo:null;
 const ids=new Set(content.nodes.map(n=>n.id));
 for(const feature of project.features)for(const id of feature.requirementIds)if(!ids.has(id))throw new Error(`APPROVAL_RESEARCH_REQUIREMENT_NOT_SELECTED: ${id}`);
 const mappedRequirementIds=content.nodes.filter(n=>demo?.requirementIds.includes(n.id)).map(n=>n.id);
 const uncoveredRequirementIds=content.nodes.filter(n=>!mappedRequirementIds.includes(n.id)).map(n=>n.id);
 const unverifiedAcceptanceIds=content.nodes.flatMap(n=>[...n.desktopAcceptance.map((_,i)=>`${n.id}:desktop:${i+1}`),...n.mobileAcceptance.map((_,i)=>`${n.id}:mobile:${i+1}`)]);
 const approval={baselineVersionId:review.baselineVersionId,operator:'owner' as const,changes:diffContent(baseline,content).map(({collection,id,fields})=>({collection,id,fields})),sceneId:demo?.id??null,mappedRequirementIds,uncoveredRequirementIds,unverifiedAcceptanceIds,acknowledged:review.acknowledgeUnverified};
 return {content,demo,approval,needsAcknowledgement:uncoveredRequirementIds.length>0||unverifiedAcceptanceIds.length>0};
}
/** Only an owner-authorized Host caller can supply the acknowledgement. */
export function approveReviewedVersion(current:Project,expectedContentRevision:number,id:string,label:string,createdAt:string,review:ApprovalReview):Project{
 if(current.contentRevision!==expectedContentRevision)throw new Error('CONFLICT');
 const project=validateProject(current);if(project.versions.some(v=>v.id===id))throw new Error('VERSION_EXISTS');
 const result=reviewApproval(project,review);
 if(result.needsAcknowledgement&&!review.acknowledgeUnverified)throw new Error('APPROVAL_UNVERIFIED_ACK_REQUIRED');
 project.versions.push(VersionSchema.parse({id,label,createdAt,contentRevision:project.contentRevision,...result.content,demo:result.demo,approval:result.approval,references:project.references,features:project.features}));
 project.projectRevision++;return validateProject(project);
}
