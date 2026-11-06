import * as React from 'react';
import {newId} from './id.js';
import type {ProjectSnapshot,ProductReference,ReferenceChange} from '../types.js';
export function ReferencesPanel({project,busy,t,save}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;save:(change:ReferenceChange)=>void}):React.ReactElement{
 const [name,setName]=React.useState(''),[location,setLocation]=React.useState(''),[notes,setNotes]=React.useState(''),[license,setLicense]=React.useState('unknown'),[kind,setKind]=React.useState<ProductReference['sourceKind']>('url');
 return <section><h3>{t('referencesTitle')}</h3><p>{t('referencesNotice')}</p><form onSubmit={e=>{e.preventDefault();if(name.trim()&&location.trim())save({kind:'save',reference:{id:newId(),name,location,notes,license,sourceKind:kind,origin:'manual'}});}}>
 <label>{t('referenceName')}<input value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label>
 <label>{t('sourceKind')}<select value={kind} onChange={e=>setKind(e.target.value as ProductReference['sourceKind'])} disabled={busy}>{(['url','repository','host-file','saved-analysis'] as const).map(k=><option key={k} value={k}>{t('source_'+k)}</option>)}</select></label>
 <label>{t('sourceLocation')}<input value={location} onChange={e=>setLocation(e.target.value)} disabled={busy}/></label>
 <label>{t('referenceNotes')}<textarea value={notes} onChange={e=>setNotes(e.target.value)} disabled={busy}/></label>
 <label>{t('referenceLicense')}<input value={license} onChange={e=>setLicense(e.target.value)} disabled={busy}/></label>
 <button disabled={busy||!name.trim()||!location.trim()}>{t('addReference')}</button></form>
 {project.references.map(r=><article key={r.id}><h4>{r.name}</h4><p>{t('source_'+r.sourceKind)} · {t('origin_'+r.origin)}</p><code style={{overflowWrap:'anywhere'}}>{r.location}</code><p>{r.notes}</p><small>{t('referenceLicense')}: {r.license}</small><p>{t('referenceUnverified')}</p><button type="button" disabled={busy} onClick={()=>{if(window.confirm(t('removeReferenceConfirm')))save({kind:'remove',id:r.id});}}>{t('removeReference')}</button></article>)}
 </section>;
}
