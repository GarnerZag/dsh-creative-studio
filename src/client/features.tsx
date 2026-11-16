import * as React from 'react';
import {newId} from './id.js';
import type {ProjectSnapshot,FeatureNote,FeatureChange} from '../types.js';
export function FeaturePanel({project,busy,t,save}:{project:ProjectSnapshot;busy:boolean;t:(key:string)=>string;save:(change:FeatureChange)=>void}):React.ReactElement{
 const empty=():FeatureNote=>({id:newId(),referenceId:project.references[0]?.id??'',name:'',description:'',requirementIds:[],assessment:'unknown',implementation:'',adaptation:'',sourceLocator:''});
 const [draft,setDraft]=React.useState<FeatureNote>(empty);
 const [dirty,setDirty]=React.useState(false);
 const [openId,setOpenId]=React.useState('');
 const change=(patch:Partial<FeatureNote>)=>{setDraft(d=>({...d,...patch}));setDirty(true);};
 const choose=(item:FeatureNote)=>{if(!dirty||window.confirm(t('discardEdits'))){setDraft(structuredClone(item));setDirty(false);setOpenId(item.id);}};
 const cell=(referenceId:string,requirementId:string)=>project.features.filter(f=>f.referenceId===referenceId&&f.requirementIds.includes(requirementId));
 const active=project.features.find(f=>f.id===openId)??null;
 const editing=project.features.some(f=>f.id===draft.id);
 return <section><h3>{t('featureMatrix')}</h3><p>{t('featureNotice')}</p>
 {project.references.length&&project.nodes.length
  ?<div className="cs-table-wrap"><table className="cs-table cs-table-matrix">
   <thead><tr><th>{t('requirements')}</th>{project.references.map(r=><th key={r.id} scope="col">{r.name}</th>)}</tr></thead>
   <tbody>{project.nodes.map(n=><tr key={n.id}>
    <th scope="row">{n.title}</th>
    {project.references.map(r=>{const hits=cell(r.id,n.id);return <td key={r.id}>
     {hits.length?hits.map(f=><button type="button" key={f.id} className="cs-chip" disabled={busy} aria-pressed={f.id===openId} onClick={()=>choose(f)}>{f.name}<small>{t('assessment_'+f.assessment)}</small></button>):<span className="cs-muted">{t('assessment_unknown')}</span>}
    </td>;})}
   </tr>)}</tbody></table></div>
  :<p className="cs-hint">{t('featureMatrixEmpty')}</p>}
 {active&&<article className="cs-feature-detail" aria-label={active.name}>
  <h4>{active.name}<small className="cs-hint"> {t('assessment_'+active.assessment)}</small></h4>
  <p>{active.description}</p>
  <dl className="cs-pairs">
   <dt>{t('feature_implementation')}</dt><dd>{active.implementation||t('valueNotSet')}</dd>
   <dt>{t('feature_adaptation')}</dt><dd>{active.adaptation||t('valueNotSet')}</dd>
   <dt>{t('feature_sourceLocator')}</dt><dd>{active.sourceLocator?<code className="cs-code-clip">{active.sourceLocator}</code>:t('valueNotSet')}</dd>
   <dt>{t('linkedRequirements')}</dt><dd>{active.requirementIds.length?active.requirementIds.map(id=>project.nodes.find(n=>n.id===id)?.title??id).join(' · '):t('valueNotSet')}</dd>
   <dt>{t('referenceName')}</dt><dd>{project.references.find(r=>r.id===active.referenceId)?.name??t('valueNotSet')}</dd>
  </dl>
  <div className="cs-row-actions">
   <button type="button" disabled={busy} onClick={()=>choose(active)}>{t('editFeature')}</button>
   <button type="button" className="cs-quiet" onClick={()=>setOpenId('')}>{t('collapse')}</button>
  </div>
 </article>}
 {!!project.references.length&&<details className="cs-disclosure" open={!editing&&!project.features.length} >
  <summary>{editing?t('editFeature'):t('newFeature')}</summary>
  <form className="cs-form cs-form-stack" onSubmit={e=>{e.preventDefault();if(draft.name.trim()&&draft.referenceId){save({kind:'save',feature:draft});setOpenId(draft.id);}}}>
   <label>{t('referenceName')}<select disabled={busy} value={draft.referenceId} onChange={e=>change({referenceId:e.target.value})}><option value="">—</option>{project.references.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
   {(['name','description','implementation','adaptation','sourceLocator'] as const).map(key=><label key={key}>{t('feature_'+key)}<textarea rows={key==='name'?1:2} disabled={busy} value={draft[key]} onChange={e=>change({[key]:e.target.value})}/></label>)}
   <label>{t('assessment')}<select disabled={busy} value={draft.assessment} onChange={e=>change({assessment:e.target.value as FeatureNote['assessment']})}><option value="unknown">{t('assessment_unknown')}</option><option value="inferred">{t('assessment_inferred')}</option></select></label>
   <fieldset disabled={busy} className="cs-checks"><legend>{t('linkedRequirements')}</legend>{project.nodes.map(n=><label key={n.id}><input type="checkbox" checked={draft.requirementIds.includes(n.id)} onChange={e=>change({requirementIds:e.target.checked?[...draft.requirementIds,n.id]:draft.requirementIds.filter(id=>id!==n.id)})}/>{n.title}</label>)}</fieldset>
   <div className="cs-row-actions">
    <button disabled={busy||!draft.name.trim()||!project.references.some(r=>r.id===draft.referenceId)}>{t('saveFeature')}</button>
    {editing&&<button type="button" className="cs-quiet cs-danger" disabled={busy} onClick={()=>{if(window.confirm(t('removeFeatureConfirm')))save({kind:'remove',id:draft.id});}}>{t('removeFeature')}</button>}
   </div>
  </form>
 </details>}
 </section>;
}
