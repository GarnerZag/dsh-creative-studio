import * as React from 'react';
import type {ModelCatalogView,ModelChoice} from '../types.js';

/**
 * Provider-grouped model selector plus, when the chosen model advertises them, a
 * reasoning-effort selector. An empty model value keeps the deployment default.
 */
export function ModelSelect({value,onChange,disabled,t,load}:{value:ModelChoice|undefined;onChange:(value:ModelChoice|undefined)=>void;disabled:boolean;t:(key:string)=>string;load:()=>Promise<ModelCatalogView>}):React.ReactElement{
 const [catalog,setCatalog]=React.useState<ModelCatalogView|null>(null),[error,setError]=React.useState('');
 React.useEffect(()=>{let live=true;void load().then(view=>{if(live)setCatalog(view);}).catch(e=>{if(live){setError(String(e));setCatalog(null);}});return()=>{live=false;};},[load]);
 const groups=new Map<string,{name:string;items:ModelCatalogView['options']}>();
 for(const option of catalog?.options??[]){const group=groups.get(option.provider)??{name:option.providerName,items:[]};group.items.push(option);groups.set(option.provider,group);}
 const key=value?`${value.provider}|${value.model}`:'';
 // The deployment default behaves like a selected model, so its efforts are editable too.
 const base:ModelChoice|undefined=value??(catalog?{provider:catalog.default.provider,model:catalog.default.model,...(catalog.default.reasoningEffort?{reasoningEffort:catalog.default.reasoningEffort}:{})}:undefined);
 const option=base?(catalog?.options??[]).find(item=>item.provider===base.provider&&item.model===base.model):undefined;
 const efforts=option?.reasoningEfforts??[];
 const effort=base?.reasoningEffort??'';
 const pick=(effortId:string):void=>{
  if(!base)return;
  onChange({provider:base.provider,model:base.model,...(effortId?{reasoningEffort:effortId}:{})});
 };
 return <>
  <label>{t('model')}<select value={key} disabled={disabled} onChange={event=>{
   const raw=event.target.value;
   if(!raw){onChange(undefined);return;}
   const [provider,model]=raw.split('|');
   if(!provider||!model)return;
   const picked=(catalog?.options??[]).find(item=>item.provider===provider&&item.model===model);
   onChange({provider,model,...(picked?.defaultEffort?{reasoningEffort:picked.defaultEffort}:{})});
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
  </label>
  {efforts.length>0?<label>{t('reasoningEffort')}<select value={effort} disabled={disabled} onChange={event=>pick(event.target.value)}>
   <option value="">{t('effortModelDefault')}{option?.defaultEffort?` · ${option.defaultEffort}`:''}</option>
   {efforts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
  </select>
  {option?.description&&<small className="cs-hint">{option.description}</small>}
  </label>:null}
 </>;
}
