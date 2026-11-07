import * as React from 'react';
import {newId} from './id.js';
import type {ProjectSnapshot,ProductReference,ReferenceChange} from '../types.js';
export function ReferencesPanel({project,busy,t,save}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;save:(change:ReferenceChange)=>void}):React.ReactElement{
 const empty=():ProductReference=>({id:newId(),name:'',location:'',notes:'',license:'unknown',sourceKind:'url',origin:'manual'});
 const [draft,setDraft]=React.useState<ProductReference>(empty);
 const existing=project.references.find(r=>r.id===draft.id);
 const dirty=existing?JSON.stringify(existing)!==JSON.stringify(draft):Boolean(draft.name||draft.location||draft.notes||draft.license!=='unknown');
 const choose=(next:ProductReference)=>{if(!dirty||window.confirm(t('discardReferenceEdits')))setDraft({...next});};
 const field=<K extends keyof ProductReference>(key:K,value:ProductReference[K])=>setDraft({...draft,[key]:value});
 return <section><h3>{t('referencesTitle')}</h3><p>{t('referencesNotice')}</p>
 <button type="button" disabled={busy} onClick={()=>choose(empty())}>{t('newReference')}</button>
 <form onSubmit={e=>{e.preventDefault();if(draft.name.trim()&&draft.location.trim())save({kind:'save',reference:draft});}}>
 <label>{t('referenceName')}<input value={draft.name} onChange={e=>field('name',e.target.value)} disabled={busy}/></label>
 <label>{t('sourceKind')}<select value={draft.sourceKind} onChange={e=>field('sourceKind',e.target.value as ProductReference['sourceKind'])} disabled={busy}>{(['url','repository','host-file','saved-analysis'] as const).map(k=><option key={k} value={k}>{t('source_'+k)}</option>)}</select></label>
 <label>{t('sourceLocation')}<input value={draft.location} onChange={e=>field('location',e.target.value)} disabled={busy}/></label>
 <label>{t('referenceNotes')}<textarea value={draft.notes} onChange={e=>field('notes',e.target.value)} disabled={busy}/></label>
 <label>{t('referenceLicense')}<input value={draft.license} onChange={e=>field('license',e.target.value)} disabled={busy}/></label>
 <button disabled={busy||!draft.name.trim()||!draft.location.trim()}>{t(existing?'saveReference':'addReference')}</button></form>
 {project.references.map(r=><article key={r.id}><h4>{r.name}</h4><p>{t('source_'+r.sourceKind)} · {t('origin_'+r.origin)}</p><code style={{overflowWrap:'anywhere'}}>{r.location}</code><p>{r.notes}</p><small>{t('referenceLicense')}: {r.license}</small><p>{t('referenceUnverified')}</p><button type="button" disabled={busy} onClick={()=>choose(r)}>{t('editReference')}</button><button type="button" disabled={busy} onClick={()=>{if(window.confirm(t('removeReferenceConfirm')))save({kind:'remove',id:r.id});}}>{t('removeReference')}</button></article>)}
 </section>;
}
