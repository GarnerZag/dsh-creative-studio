import * as React from 'react';
import {CandidateDemo} from './demo.js';
import type { ProjectSnapshot } from '../types.js';
import { diffContent } from '../domain/versions.js';
export function ProposalPanel({project,busy,adopt,reject,t}:{reject:(id:string)=>void;project:ProjectSnapshot;busy:boolean;adopt:(id:string)=>void;t:(key:string)=>string}):React.ReactElement {
 return <section aria-label={t('proposals')}><h3>{t('proposals')}</h3><p>{t('proposalRule')}</p>
 {project.proposals.length===0&&<p>{t('noProposals')}</p>}
 {project.proposals.map(proposal=>{
  const stale=proposal.baseContentRevision!==project.contentRevision;
  const differences=diffContent(project,proposal);
  return <article key={proposal.id} style={{border:'1px solid currentColor',borderRadius:12,padding:16,marginBlock:12}}>
   <h4>{proposal.title}</h4><p>{proposal.rationale}</p><small>{t('proposalBase')} r{proposal.baseContentRevision} · {t(`proposal_${proposal.status}`)}</small>
   {proposal.status==='pending'&&stale&&<p role="status">{t('staleProposal')}</p>}
   <h5>{t('assumptions')}</h5><ul>{proposal.assumptions.map((text,i)=><li key={i}>{text}</li>)}</ul>
   <h5>{t('alternatives')}</h5><ul>{proposal.alternatives.map((text,i)=><li key={i}>{text}</li>)}</ul>
   <details><summary>{t('proposedContent')}</summary>
    {proposal.nodes.map(node=><div key={node.id}><strong>{node.title}</strong><p>{node.description}</p><p>{t('desktopAcceptance')}: {node.desktopAcceptance.join(' · ')}</p><p>{t('mobileAcceptance')}: {node.mobileAcceptance.join(' · ')}</p></div>)}
    {proposal.architecture.map(item=><div key={item.id}><strong>{t(`architecture_${item.kind}`)} · {item.title}</strong><p style={{whiteSpace:'pre-wrap'}}>{item.body}</p><small>{t('linkedRequirements')}: {item.requirementIds.join(', ')} — {t('dependencies')}: {item.dependsOn.join(', ')}</small></div>)}
   </details>
   {proposal.demo&&<CandidateDemo scene={proposal.demo} t={t}/>}
    <h5>{t('proposalDiff')}</h5><ul>{differences.map(change=><li key={`${change.collection}-${change.id}`}>{t(change.kind)} · {change.title} {change.fields.join(', ')}</li>)}</ul>
   {differences.length===0&&<p>{t('noDifferences')}</p>}
   <button disabled={busy||stale||proposal.status!=='pending'} onClick={()=>{if(window.confirm(t('confirmAdopt'))) adopt(proposal.id);}}>{t('adoptProposal')}</button>
  <button disabled={busy||proposal.status!=='pending'} onClick={()=>{if(window.confirm(t('confirmReject')))reject(proposal.id);}}>{t('rejectProposal')}</button>
   </article>;
 })}</section>;
}
