import * as React from 'react';
import type {ApprovalReviewInput,ProjectSnapshot} from '../types.js';
import {reviewApproval} from '../domain/approval-review.js';
import {diffContent} from '../domain/versions.js';
export function ApprovalForm({project,busy,approve,t}:{project:ProjectSnapshot;busy:boolean;approve:(label:string,review:ApprovalReviewInput)=>void;t:(key:string)=>string}):React.ReactElement{
 const [base,setBase]=React.useState(project.versions.at(-1)?.id??'');const [partial,setPartial]=React.useState(false);const [selected,setSelected]=React.useState<string[]>([]);const [fields,setFields]=React.useState<Record<string,string[]>>({});const [ack,setAck]=React.useState(false);const [ackRevision,setAckRevision]=React.useState(-1);const [label,setLabel]=React.useState('');
 React.useEffect(()=>{setAck(false);setSelected([]);setFields({});setPartial(false);setLabel('');},[project.projectRevision]);
 const baseline=project.versions.find(v=>v.id===base)??{nodes:[],architecture:[]};
 const changes=diffContent(baseline,project);
 const selection=partial?changes.flatMap(({collection,id})=>{const key=`${collection}:${id}`;const picked=fields[key];if(picked?.length)return [{collection,id,fields:picked}];return selected.includes(key)?[{collection,id}]:[];}):null;
 const selectionEmpty=selection!==null&&selection.length===0;
 const review:ApprovalReviewInput={baselineVersionId:base||null,acknowledgeUnverified:ack&&ackRevision===project.projectRevision,...(selection&&!selectionEmpty?{selection}:{})};
 let preview:ReturnType<typeof reviewApproval>|null=null,error='';try{preview=reviewApproval(project,review);}catch(e){error=e instanceof Error?e.message:String(e);}
 const requirementName=(id:string):string=>project.nodes.find(node=>node.id===id)?.title??id;
 const ready=preview!==null&&preview.content.nodes.length>0&&!selectionEmpty&&(!preview.needsAcknowledgement||review.acknowledgeUnverified);
 return <form onSubmit={e=>{e.preventDefault();if(ready&&label.trim()&&window.confirm(`${t('confirmApproval')} ${project.contentRevision}`))approve(label.trim(),review);}}>
 <fieldset disabled={busy}><legend>{t('approvalReview')}</legend>
 <label>{t('approvalBaseline')}<select aria-label={t('approvalBaseline')} value={base} onChange={e=>{setBase(e.target.value);setSelected([]);setAck(false);}}><option value="">{t('emptyBaseline')}</option>{project.versions.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select>{partial&&<p className="cs-hint">{t('approvalBaselineHint')}</p>}</label>
 <label><input type="checkbox" checked={partial} onChange={e=>{setPartial(e.target.checked);setAck(false);}}/>{t('partialApproval')}</label>
 {partial&&<ul>{changes.map(c=>{const key=`${c.collection}:${c.id}`;const picked=fields[key]??[];return <li key={key}><label><input type="checkbox" checked={selected.includes(key)||picked.length===c.fields.length} onChange={e=>{setFields(f=>{const next={...f};if(e.target.checked)next[key]=[...c.fields];else delete next[key];return next;});setSelected(s=>e.target.checked?[...s.filter(x=>x!==key),key]:s.filter(x=>x!==key));setAck(false);}}/>{t(c.kind)} · {c.title} · {t(c.collection==='nodes'?'approvalCollectionNodes':'approvalCollectionArchitecture')}</label>{c.kind==='changed'&&c.fields.length>0&&<ul>{c.fields.map(field=><li key={field}><label><input type="checkbox" checked={picked.includes(field)} onChange={e=>{setFields(f=>{const current=f[key]??[];const next=e.target.checked?[...current,field]:current.filter(x=>x!==field);const copy={...f};if(next.length)copy[key]=next;else delete copy[key];return copy;});setSelected(s=>s.filter(x=>x!==key));setAck(false);}}/>{fieldLabel(field,t)}</label></li>)}</ul>}</li>;})}</ul>}
 {selectionEmpty&&<p role="status">{t('approvalSelectSomething')}</p>}
 {error&&<p role="alert">{selectionError(error,t)}</p>}
 {preview&&<><p>{t('approvalCoverageNotice')}</p><p>{t('demoMapped')}: {preview.approval.mappedRequirementIds.length?preview.approval.mappedRequirementIds.map(id=>requirementName(id)).join('、'):'—'}</p><details><summary>{t('demoUncovered')} ({preview.approval.uncoveredRequirementIds.length})</summary>{preview.approval.uncoveredRequirementIds.length?<ul className="cs-id-list">{preview.approval.uncoveredRequirementIds.map(id=><li key={id}><span>{requirementName(id)}</span><small>{id}</small></li>)}</ul>:<p className="cs-hint">{t('approvalNothingUncovered')}</p>}</details><details><summary>{t('unverifiedAcceptance')} ({preview.approval.unverifiedAcceptanceIds.length})</summary>{preview.approval.unverifiedAcceptanceIds.length?<ul className="cs-id-list">{preview.approval.unverifiedAcceptanceIds.map(id=><li key={id}>{id}</li>)}</ul>:<p className="cs-hint">{t('approvalNothingUnverified')}</p>}</details>{preview.needsAcknowledgement&&<label><input type="checkbox" checked={review.acknowledgeUnverified} onChange={e=>{setAck(e.target.checked);setAckRevision(project.projectRevision);}}/>{t('ackUnverified')}</label>}</>}
 <label>{t('versionLabel')}<input aria-label={t('versionLabel')} value={label} onChange={e=>setLabel(e.target.value)} placeholder={t('versionLabel')}/></label>
 {preview&&<p className="cs-hint">{(project.nodes.length===0?t('approvalNothingToFreeze'):`${t('approvalWillFreeze')}${project.nodes.length}${t('approvalReqUnit')}、${project.architecture.length}${t('approvalArchUnit')}${base&&changes.length>0?`，${t('approvalBaselineChanges')}${changes.length}${t('approvalChangesUnit')}`:''}`)}</p>}
 {!label.trim()&&<p className="cs-hint">{t('approvalNeedLabel')}</p>}
 <button disabled={!ready||!label.trim()}>{t('approveVersion')}</button>
 </fieldset></form>;
}
function fieldLabel(field:string,t:(key:string)=>string):string{
 const labels:Record<string,string>={title:'architectureTitle',body:'architectureBody',kind:'architectureType',requirementIds:'linkedRequirements',dependsOn:'dependencies',contract:'diffContract',task:'diffTask',parentId:'parentNode',order:'requirementOrder',description:'nodeDescription',priority:'requirementPriority',desktopAcceptance:'desktopAcceptance',mobileAcceptance:'mobileAcceptance'};
 return labels[field]?t(labels[field]!):field;
}

/** Field-selection errors name the entity/field, so keep that context and localize the rest. */
function selectionError(message:string,t:(key:string)=>string):string{
 const [code,...rest]=message.split(': ');
 const detail=rest.join(': ');
 if(code==='APPROVAL_FIELD_SELECTION_EMPTY')return `${t('approvalFieldSelectionEmpty')} — ${detail}`;
 if(code==='APPROVAL_FIELD_SELECTION_UNAVAILABLE')return `${t('approvalFieldSelectionUnavailable')} — ${detail}`;
 if(code==='APPROVAL_FIELD_NOT_CHANGED')return `${t('approvalFieldNotChanged')} — ${detail}`;
 return message;
}
