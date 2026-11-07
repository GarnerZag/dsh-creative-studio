import {validateContent,type Project} from './project.js';
import {diffContent} from './versions.js';
type Content=Pick<Project,'nodes'|'architecture'>;
export interface ApprovalSelection {collection:'nodes'|'architecture';id:string;fields?:string[]}
/** Select complete entity changes or individual changed fields, never auto-expand dependency scope or mutate the draft. */
export function selectApprovalContent(baseline:Content,draft:Content,selection:ApprovalSelection[]):Content{
 validateContent(baseline);validateContent(draft);
 const changes=new Map(diffContent(baseline,draft).map(x=>[`${x.collection}:${x.id}`,x]));
 const selected=new Set<string>();
 const fieldsByKey=new Map<string,Set<string>>();
 if(!selection.length)throw new Error('APPROVAL_SELECTION_EMPTY');
 for(const item of selection){
  const key=`${item.collection}:${item.id}`;
  const change=changes.get(key);
  if(!change)throw new Error(`APPROVAL_CHANGE_NOT_FOUND: ${key}`);
  if(selected.has(key))throw new Error(`APPROVAL_SELECTION_DUPLICATE: ${key}`);
  selected.add(key);
  if(item.fields===undefined)continue;
  if(!item.fields.length)throw new Error(`APPROVAL_FIELD_SELECTION_EMPTY: ${key}`);
  if(change.kind!=='changed')throw new Error(`APPROVAL_FIELD_SELECTION_UNAVAILABLE: ${key} ${change.kind}`);
  const fields=new Set<string>();
  for(const field of item.fields){
   if(!change.fields.includes(field))throw new Error(`APPROVAL_FIELD_NOT_CHANGED: ${key} ${field}`);
   if(fields.has(field))throw new Error(`APPROVAL_FIELD_SELECTION_DUPLICATE: ${key} ${field}`);
   fields.add(field);
  }
  fieldsByKey.set(key,fields);
 }
 function merge<T extends {id:string}>(collection:'nodes'|'architecture',old:T[],next:T[]):T[]{
  const nextById=new Map(next.map(item=>[item.id,item])),oldIds=new Set(old.map(item=>item.id));
  const result=old.flatMap(item=>{
   const key=`${collection}:${item.id}`;
   if(!selected.has(key))return [item];
   const replacement=nextById.get(item.id);
   if(!replacement)return [];
   const fields=fieldsByKey.get(key);
   if(!fields)return [replacement];
   const merged=structuredClone(item) as Record<string,unknown>;
   for(const field of fields)merged[field]=structuredClone((replacement as Record<string,unknown>)[field]);
   return [merged as unknown as T];
  });
  for(const item of next)if(!oldIds.has(item.id)&&selected.has(`${collection}:${item.id}`))result.push(item);
  return structuredClone(result);
 }
 const content={nodes:merge('nodes',baseline.nodes,draft.nodes),architecture:merge('architecture',baseline.architecture,draft.architecture)};
 try{validateContent(content);}catch(error){throw new Error(`APPROVAL_SELECTION_DEPENDENCY: ${error instanceof Error?error.message:String(error)}`);}
 return content;
}
