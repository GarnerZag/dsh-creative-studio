import {validateContent,type Project} from './project.js';
import {diffContent} from './versions.js';
type Content=Pick<Project,'nodes'|'architecture'>;
export interface ApprovalSelection {collection:'nodes'|'architecture';id:string}
/** Select complete entity changes, never auto-expand dependency scope or mutate the draft. */
export function selectApprovalContent(baseline:Content,draft:Content,selection:ApprovalSelection[]):Content{
 validateContent(baseline);validateContent(draft);
 const available=new Set(diffContent(baseline,draft).map(x=>`${x.collection}:${x.id}`));
 const selected=new Set<string>();
 if(!selection.length)throw new Error('APPROVAL_SELECTION_EMPTY');
 for(const item of selection){const key=`${item.collection}:${item.id}`;if(!available.has(key))throw new Error(`APPROVAL_CHANGE_NOT_FOUND: ${key}`);if(selected.has(key))throw new Error(`APPROVAL_SELECTION_DUPLICATE: ${key}`);selected.add(key);}
 function merge<T extends {id:string}>(collection:'nodes'|'architecture',old:T[],next:T[]):T[]{
  const nextById=new Map(next.map(item=>[item.id,item])),oldIds=new Set(old.map(item=>item.id));
  const result=old.flatMap(item=>{if(!selected.has(`${collection}:${item.id}`))return [item];const replacement=nextById.get(item.id);return replacement?[replacement]:[];});
  for(const item of next)if(!oldIds.has(item.id)&&selected.has(`${collection}:${item.id}`))result.push(item);
  return structuredClone(result);
 }
 const content={nodes:merge('nodes',baseline.nodes,draft.nodes),architecture:merge('architecture',baseline.architecture,draft.architecture)};
 try{validateContent(content);}catch(error){throw new Error(`APPROVAL_SELECTION_DEPENDENCY: ${error instanceof Error?error.message:String(error)}`);}
 return content;
}
