import * as React from 'react';
import {CandidateDemo} from './demo.js';
import type { ProjectSnapshot,ProductReference } from '../types.js';
import {newId} from './id.js';
import { diffContent } from '../domain/versions.js';
export function ProposalPanel({project,busy,adopt,reject,registerReference,t}:{registerReference:(reference:ProductReference)=>void;reject:(id:string)=>void;project:ProjectSnapshot;busy:boolean;adopt:(id:string)=>void;t:(key:string)=>string}):React.ReactElement {
 return <section aria-label={t('proposals')}><h3>{t('proposals')}</h3><p>{t('proposalRule')}</p>
 {project.proposals.length===0&&<p>{t('noProposals')}</p>}
 {project.proposals.map(proposal=>{
  const stale=proposal.baseContentRevision!==project.contentRevision;
  const differences=diffContent(project,proposal);
  return <article key={proposal.id} style={{border:'1px solid currentColor',borderRadius:12,padding:16,marginBlock:12}}>
   <h4>{proposal.title}</h4><p>{proposal.rationale}</p><small>{t('proposalBase')} r{proposal.baseContentRevision} · {t(`proposal_${proposal.status}`)}</small>
   {proposal.status==='pending'&&stale&&<p role="status">{t('staleProposal')}</p>}
   <h5>{t('assumptions')}</h5><ul>{proposal.assumptions.map((text,i)=><li key={i}>{text}</li>)}</ul>
   {!!proposal.recommendations?.length&&<section><h5>{t('recommendedProducts')}</h5><p>{t('recommendationNotice')}</p>{proposal.recommendations.map(r=>{const exists=project.references.some(ref=>ref.location===r.location);return <div key={r.id}><strong>{r.name}</strong><p>{r.location}</p><p>{r.rationale}</p><ul>{r.featureIdeas.map((idea,i)=><li key={i}>{idea}</li>)}</ul><button disabled={busy||exists} onClick={()=>{if(window.confirm(t('confirmReferenceRecommendation')))registerReference({id:newId(),name:r.name,sourceKind:r.sourceKind,location:r.location,origin:'recommended',license:'unknown',notes:`${t('recommendationNotice')}\n${r.rationale}\n${r.featureIdeas.join('\n')}`});}}>{t(exists?'recommendationRegistered':'registerRecommendation')}</button></div>;})}</section>}
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
