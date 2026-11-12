import * as React from 'react';
import type {ModelCatalogView,ModelChoice} from '../types.js';

/** Provider-grouped model selector; an empty value keeps the deployment default. */
export function ModelSelect({value,onChange,disabled,t,load}:{value:ModelChoice|undefined;onChange:(value:ModelChoice|undefined)=>void;disabled:boolean;t:(key:string)=>string;load:()=>Promise<ModelCatalogView>}):React.ReactElement{
 const [catalog,setCatalog]=React.useState<ModelCatalogView|null>(null),[error,setError]=React.useState('');
 React.useEffect(()=>{let live=true;void load().then(view=>{if(live)setCatalog(view);}).catch(e=>{if(live){setError(String(e));setCatalog(null);}});return()=>{live=false;};},[load]);
 const groups=new Map<string,{name:string;items:ModelCatalogView['options']}>();
 for(const option of catalog?.options??[]){const group=groups.get(option.provider)??{name:option.providerName,items:[]};group.items.push(option);groups.set(option.provider,group);}
 const key=value?`${value.provider}|${value.model}`:'';
 return <label>{t('model')}<select value={key} disabled={disabled} onChange={event=>{
  const raw=event.target.value;
  if(!raw){onChange(undefined);return;}
  const [provider,model]=raw.split('|');
  if(!provider||!model)return;
  const option=(catalog?.options??[]).find(item=>item.provider===provider&&item.model===model);
  onChange({provider,model,...(option?.defaultEffort?{reasoningEffort:option.defaultEffort}:{})});
 }}>
  <option value="">{catalog?`${t('modelDefault')} · ${catalog.default.model}`:t('model')}</option>
  {[...groups].map(([id,group])=>(
   <optgroup key={id} label={group.name}>
    {group.items.map(item=>(
     <option key={`${item.provider}|${item.model}`} value={`${item.provider}|${item.model}`}>{item.name}</option>
    ))}
   </optgroup>
  ))}
 </select>
 {(error||(catalog?.failures.length??0)>0)&&<small className="cs-hint" role="status">{t('modelsUnavailable')}</small>}
 </label>;
}
