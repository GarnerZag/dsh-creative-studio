import {ProposalInputSchema,validateProject,type Project,type ProposalInput} from './project.js';
export function rejectProposal(current:Project,id:string):Project {
  const project=validateProject(current),proposal=project.proposals.find(p=>p.id===id);
  if(!proposal)throw new Error('PROPOSAL_NOT_FOUND');
  if(proposal.status==='rejected')return project;
  if(proposal.status!=='pending')throw new Error('PROPOSAL_NOT_PENDING');
  proposal.status='rejected';project.projectRevision++;
  return validateProject(project);
}
/** Candidate storage is not adoption or approval. Late results remain reviewable. */
export function saveProposal(current:Project,input:ProposalInput):Project {
  const project=validateProject(current);
  const proposal=ProposalInputSchema.parse(input);
  if(project.proposals.some(p=>p.id===proposal.id)) throw new Error('PROPOSAL_EXISTS');
  if(proposal.baseContentRevision>project.contentRevision) throw new Error('INVALID_BASE_REVISION');
  project.proposals.push({...proposal,status:'pending'});project.projectRevision++;
  return validateProject(project);
}
/** Called only by user-authorized business entry; replacement is shown as a diff first. */
export function adoptProposal(current:Project,expectedContentRevision:number,id:string):Project {
  if(current.contentRevision!==expectedContentRevision) throw new Error('CONFLICT');
  const project=validateProject(current);
  const proposal=project.proposals.find(p=>p.id===id);
  if(!proposal) throw new Error('PROPOSAL_NOT_FOUND');
  if(proposal.status!=='pending') throw new Error('PROPOSAL_NOT_PENDING');
  if(proposal.baseContentRevision!==project.contentRevision) throw new Error('STALE_PROPOSAL');
  project.nodes=structuredClone(proposal.nodes);project.architecture=structuredClone(proposal.architecture);
  proposal.status='adopted';project.projectRevision++;project.contentRevision++;
  if(proposal.demo)project.demo={...structuredClone(proposal.demo),contentRevision:project.contentRevision};
  return validateProject(project);
}
