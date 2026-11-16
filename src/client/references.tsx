import * as React from 'react';
import {newId} from './id.js';
import type {ProjectSnapshot,ProductReference,ReferenceChange} from '../types.js';
export function ReferencesPanel({project,busy,t,save}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;save:(change:ReferenceChange)=>void}):React.ReactElement{
 const empty=():ProductReference=>({id:newId(),name:'',location:'',notes:'',license:'unknown',sourceKind:'url',origin:'manual'});
 const [draft,setDraft]=React.useState<ProductReference>(empty);
 const [editing,setEditing]=React.useState(()=>project.references.length===0);
 const existing=project.references.find(r=>r.id===draft.id);
 const dirty=editing&&(existing?JSON.stringify(existing)!==JSON.stringify(draft):Boolean(draft.name||draft.location||draft.notes||draft.license!=='unknown'));
 const choose=(next:ProductReference)=>{if(!dirty||window.confirm(t('discardReferenceEdits'))){setDraft({...next});setEditing(true);}};
 const field=<K extends keyof ProductReference>(key:K,value:ProductReference[K])=>setDraft({...draft,[key]:value});
 const features=(referenceId:string)=>project.features.filter(f=>f.referenceId===referenceId);
 return <section><h3>{t('referencesTitle')}</h3><p>{t('referencesNotice')}</p>
 {project.references.length?<div className="cs-table-wrap"><table className="cs-table cs-table-refs">
  <thead><tr><th>{t('referenceName')}</th><th>{t('sourceKind')}</th><th>{t('sourceLocation')}</th><th>{t('referenceLicense')}</th><th>{t('referenceFeatureCount')}</th><th>{t('actions')}</th></tr></thead>
  <tbody>{project.references.map(r=><tr key={r.id}>
   <th scope="row">{r.name}<small className="cs-hint">{t('origin_'+r.origin)}</small></th>
   <td>{t('source_'+r.sourceKind)}</td>
   <td><code className="cs-code-clip" title={r.location}>{r.location}</code></td>
   <td>{r.license}</td>
   <td>{features(r.id).length}</td>
   <td><div className="cs-row-actions">
    <button type="button" className="cs-quiet" disabled={busy} onClick={()=>choose(r)}>{t('editReference')}</button>
    <button type="button" className="cs-quiet cs-danger" disabled={busy} onClick={()=>{if(window.confirm(t('removeReferenceConfirm')))save({kind:'remove',id:r.id});}}>{t('removeReference')}</button>
   </div></td>
  </tr>)}</tbody></table></div>:<p className="cs-hint">{t('referencesEmpty')}</p>}
 <details className="cs-disclosure" open={editing} onToggle={e=>setEditing((e.target as HTMLDetailsElement).open)}>
  <summary>{existing?t('editReference'):t('newReference')}</summary>
  <form className="cs-form cs-form-stack" onSubmit={e=>{e.preventDefault();if(draft.name.trim()&&draft.location.trim()){save({kind:'save',reference:draft});setEditing(false);}}}>
   <label>{t('referenceName')}<input value={draft.name} onChange={e=>field('name',e.target.value)} disabled={busy}/></label>
   <label>{t('sourceKind')}<select value={draft.sourceKind} onChange={e=>field('sourceKind',e.target.value as ProductReference['sourceKind'])} disabled={busy}>{(['url','repository','host-file','saved-analysis'] as const).map(k=><option key={k} value={k}>{t('source_'+k)}</option>)}</select></label>
   <label>{t('sourceLocation')}<input value={draft.location} onChange={e=>field('location',e.target.value)} disabled={busy}/></label>
   <label>{t('referenceNotes')}<textarea value={draft.notes} onChange={e=>field('notes',e.target.value)} disabled={busy}/></label>
   <label>{t('referenceLicense')}<input value={draft.license} onChange={e=>field('license',e.target.value)} disabled={busy}/></label>
   <div className="cs-row-actions">
    <button disabled={busy||!draft.name.trim()||!draft.location.trim()}>{t(existing?'saveReference':'addReference')}</button>
    <button type="button" className="cs-quiet" disabled={busy} onClick={()=>{setDraft(empty());setEditing(false);}}>{t('cancel')}</button>
   </div>
  </form>
 </details>
 {!!project.references.length&&<p className="cs-hint">{t('referenceUnverified')}</p>}
 </section>;
}
