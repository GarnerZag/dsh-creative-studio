import {validateProject,type Project} from './project.js';
export interface HandoffIssue{code:string;id:string;message:string}
export interface HandoffReadiness{versionId:string;ready:boolean;blockers:HandoffIssue[];warnings:HandoffIssue[]}
/** Called only behind user-authorized Host boundary; no content rewriting. */
export function confirmTaskPlan(current:Project,versionId:string):Project{
 const project=validateProject(current),version=project.versions.find(v=>v.id===versionId);if(!version)throw new Error('VERSION_NOT_FOUND');
 if(!version.architecture.some(a=>a.kind==='task'))throw new Error('TASK_PLAN_EMPTY');
 if(version.taskPlanConfirmed)return project;
 version.taskPlanConfirmed=true;project.projectRevision++;return validateProject(project);
}
/** Read selected approved version only. A warning never supplies missing implementation evidence. */
export function checkHandoff(current:Project,versionId:string):HandoffReadiness{
 const project=validateProject(current),version=project.versions.find(v=>v.id===versionId);if(!version)throw new Error('VERSION_NOT_FOUND');
 const blockers:HandoffIssue[]=[],warnings:HandoffIssue[]=[];
 const block=(code:string,id:string,message:string)=>blockers.push({code,id,message});
 const features=version.nodes.filter(n=>n.kind==='feature');
 if(!features.length)block('EMPTY_SCOPE',versionId,'Select a baseline with implementable features.');
 for(const n of features){
  if(!n.desktopAcceptance.some(s=>s.trim()))block('DESKTOP_ACCEPTANCE',n.id,'Add desktop acceptance or explicit not-applicable rationale.');
  if(!n.mobileAcceptance.some(s=>s.trim()))block('MOBILE_ACCEPTANCE',n.id,'Add mobile acceptance or explicit not-applicable rationale.');
  if(!version.architecture.some(a=>a.kind==='task'&&a.requirementIds.includes(n.id)))block('TASK_COVERAGE',n.id,'Link an implementation task.');
 }
 for(const n of version.nodes.filter(n=>n.kind!=='feature'))if([...n.desktopAcceptance,...n.mobileAcceptance].some(s=>s.trim())&&!version.architecture.some(a=>a.kind==='task'&&a.requirementIds.includes(n.id)))block('TASK_COVERAGE',n.id,'Every declared acceptance criterion, including goal-level criteria, needs an owning task.');
 if(!version.architecture.some(a=>a.kind==='module'))block('ARCHITECTURE_MISSING',versionId,'Approve product module boundaries.');
 for(const a of version.architecture.filter(item=>item.kind==='contract'))if(!a.contract||(!a.contract.notApplicable&&!a.contract.surface.trim()))block('CONTRACT_STRUCTURE',a.id,'Record the interface/entity surface, or mark the contract not applicable.');
 for(const a of version.architecture.filter(item=>item.kind==='task')){if(!a.task||!a.task.outputs.length||!a.task.acceptanceIds.length)block('TASK_STRUCTURE',a.id,'Record expected outputs and at least one mapped acceptance point.');}
 for(const a of version.architecture){const structured=a.kind==='task'?Boolean(a.task):a.kind==='contract'?Boolean(a.contract&&(a.contract.notApplicable||a.contract.surface.trim())):false;if(!a.body.trim()&&!structured)block('ARCHITECTURE_DETAILS',a.id,'Fill in implementation contract, decision rationale or task outputs and verification.');}
 if(!version.taskPlanConfirmed)block('TASK_PLAN_UNCONFIRMED',versionId,'Explicit user confirmation of this task plan is required.');
 if(!version.demo)warnings.push({code:'NO_DEMO',id:versionId,message:'No matching frozen Demo; interaction coverage is unverified.'});
 else for(const n of features)if(!version.demo.requirementIds.includes(n.id))warnings.push({code:'DEMO_UNCOVERED',id:n.id,message:'This requirement is not covered by the frozen Demo.'});
 warnings.push({code:'PROTOTYPE_ONLY',id:versionId,message:'Demo is a mock interaction reference, not production code. External services and deployment are not authorized.'});
 return {versionId,ready:blockers.length===0,blockers,warnings};
}
