import * as React from 'react';
import {newId} from './id.js';
import type {ProjectSnapshot,FeatureNote,FeatureChange} from '../types.js';
export function FeaturePanel({project,busy,t,save}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;save:(change:FeatureChange)=>void}):React.ReactElement{
 const empty=():FeatureNote=>({id:newId(),referenceId:project.references[0]?.id??'',name:'',description:'',requirementIds:[],assessment:'unknown',implementation:'',adaptation:'',sourceLocator:''});
 const [draft,setDraft]=React.useState<FeatureNote>(empty);
 const [dirty,setDirty]=React.useState(false);
 const change=(patch:Partial<FeatureNote>)=>{setDraft(d=>({...d,...patch}));setDirty(true);};
 const choose=(item:FeatureNote)=>{if(!dirty||window.confirm(t('discardEdits'))){setDraft(structuredClone(item));setDirty(false);}};
 return <section><h3>{t('featureMatrix')}</h3><p>{t('featureNotice')}</p>
 <div style={{overflowX:'auto'}}><table><thead><tr><th>{t('requirements')}</th>{project.references.map(r=><th key={r.id}>{r.name}</th>)}</tr></thead><tbody>{project.nodes.map(n=><tr key={n.id}><th>{n.title}</th>{project.references.map(r=>{const features=project.features.filter(f=>f.referenceId===r.id&&f.requirementIds.includes(n.id));return <td key={r.id}>{features.length?features.map(f=><button key={f.id} onClick={()=>choose(f)}>{f.name} · {t('assessment_'+f.assessment)}</button>):t('assessment_unknown')}</td>;})}</tr>)}</tbody></table></div>
 <nav>{project.features.map(f=><button disabled={busy} key={f.id} onClick={()=>choose(f)}>{f.name}</button>)}<button disabled={busy} onClick={()=>choose(empty())}>{t('newFeature')}</button></nav>
 <form onSubmit={e=>{e.preventDefault();if(draft.name.trim()&&draft.referenceId)save({kind:'save',feature:draft});}}>
 <label>{t('referenceName')}<select disabled={busy} value={draft.referenceId} onChange={e=>change({referenceId:e.target.value})}><option value="">—</option>{project.references.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
 {(['name','description','implementation','adaptation','sourceLocator'] as const).map(key=><label key={key}>{t('feature_'+key)}<textarea disabled={busy} value={draft[key]} onChange={e=>change({[key]:e.target.value})}/></label>)}
 <label>{t('assessment')}<select disabled={busy} value={draft.assessment} onChange={e=>change({assessment:e.target.value as FeatureNote['assessment']})}><option value="unknown">{t('assessment_unknown')}</option><option value="inferred">{t('assessment_inferred')}</option></select></label>
 <fieldset disabled={busy}><legend>{t('linkedRequirements')}</legend>{project.nodes.map(n=><label key={n.id}><input type="checkbox" checked={draft.requirementIds.includes(n.id)} onChange={e=>change({requirementIds:e.target.checked?[...draft.requirementIds,n.id]:draft.requirementIds.filter(id=>id!==n.id)})}/>{n.title}</label>)}</fieldset>
 <button disabled={busy||!draft.name.trim()||!project.references.some(r=>r.id===draft.referenceId)}>{t('saveFeature')}</button>
 {project.features.some(f=>f.id===draft.id)&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm(t('removeFeatureConfirm')))save({kind:'remove',id:draft.id});}}>{t('removeFeature')}</button>}
 </form></section>;
}
