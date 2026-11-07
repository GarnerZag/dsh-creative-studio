import * as React from 'react';
import type {ApprovalReviewInput,ProjectSnapshot} from '../types.js';
import {reviewApproval} from '../domain/approval-review.js';
import {diffContent} from '../domain/versions.js';
export function ApprovalForm({project,busy,approve,t}:{project:ProjectSnapshot;busy:boolean;approve:(label:string,review:ApprovalReviewInput)=>void;t:(key:string)=>string}):React.ReactElement{
 const [base,setBase]=React.useState(project.versions.at(-1)?.id??'');const [partial,setPartial]=React.useState(false);const [selected,setSelected]=React.useState<string[]>([]);const [ack,setAck]=React.useState(false);const [ackRevision,setAckRevision]=React.useState(-1);const [label,setLabel]=React.useState('');
 React.useEffect(()=>{setAck(false);setSelected([]);},[project.projectRevision]);
 const baseline=project.versions.find(v=>v.id===base)??{nodes:[],architecture:[]};
 const changes=diffContent(baseline,project);
 const review:ApprovalReviewInput={baselineVersionId:base||null,acknowledgeUnverified:ack&&ackRevision===project.projectRevision,...(partial?{selection:changes.filter(c=>selected.includes(`${c.collection}:${c.id}`)).map(({collection,id})=>({collection,id}))}:{})};
 let preview:ReturnType<typeof reviewApproval>|null=null,error='';try{preview=reviewApproval(project,review);}catch(e){error=e instanceof Error?e.message:String(e);}
 const ready=preview!==null&&preview.content.nodes.length>0&&(!preview.needsAcknowledgement||review.acknowledgeUnverified);
 return <form onSubmit={e=>{e.preventDefault();if(ready&&label.trim()&&window.confirm(`${t('confirmApproval')} r${project.contentRevision}`))approve(label.trim(),review);}}>
 <fieldset disabled={busy}><legend>{t('approvalReview')}</legend>
 <label>{t('approvalBaseline')}<select aria-label={t('approvalBaseline')} value={base} onChange={e=>{setBase(e.target.value);setSelected([]);setAck(false);}}><option value="">{t('emptyBaseline')}</option>{project.versions.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
 <label><input type="checkbox" checked={partial} onChange={e=>{setPartial(e.target.checked);setAck(false);}}/>{t('partialApproval')}</label>
 {partial&&<ul>{changes.map(c=>{const key=`${c.collection}:${c.id}`;return <li key={key}><label><input type="checkbox" checked={selected.includes(key)} onChange={e=>{setSelected(e.target.checked?[...selected,key]:selected.filter(x=>x!==key));setAck(false);}}/>{t(c.kind)} · {c.title} · {c.collection} · {c.fields.join(', ')}</label></li>;})}</ul>}
 {error&&<p role="alert">{error}</p>}
 {preview&&<><p>{t('approvalCoverageNotice')}</p><p>{t('demoMapped')}: {preview.approval.mappedRequirementIds.join(', ')||'—'}</p><p>{t('demoUncovered')}: {preview.approval.uncoveredRequirementIds.join(', ')||'—'}</p><details><summary>{t('unverifiedAcceptance')} ({preview.approval.unverifiedAcceptanceIds.length})</summary><ul>{preview.approval.unverifiedAcceptanceIds.map(id=><li key={id}>{id}</li>)}</ul></details>{preview.needsAcknowledgement&&<label><input type="checkbox" checked={review.acknowledgeUnverified} onChange={e=>{setAck(e.target.checked);setAckRevision(project.projectRevision);}}/>{t('ackUnverified')}</label>}</>}
 <input aria-label={t('versionLabel')} value={label} onChange={e=>setLabel(e.target.value)} placeholder={t('versionLabel')}/><button disabled={!ready||!label.trim()}>{t('approveVersion')}</button>
 </fieldset></form>;
}
