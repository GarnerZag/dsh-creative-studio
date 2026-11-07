import type {RequirementNode,ProjectSnapshot,RequirementChange} from '../types.js';
type Snapshot=Pick<ProjectSnapshot,'id'|'contentRevision'|'nodes'>;
export interface RequirementHistory{projectId:string;revision:number;past:RequirementNode[][];future:RequirementNode[][]}
export const emptyHistory=(p:Snapshot):RequirementHistory=>({projectId:p.id,revision:p.contentRevision,past:[],future:[]});
const same=(a:RequirementNode[],b:RequirementNode[])=>JSON.stringify(a)===JSON.stringify(b);
const matches=(h:RequirementHistory,p:Snapshot)=>h.projectId===p.id&&h.revision===p.contentRevision;
/** Record only an acknowledged edit; other revisions invalidate history rather than overwrite external work. */
export function recordEdit(history:RequirementHistory|undefined,before:Snapshot,after:Snapshot):RequirementHistory{
 const h=history&&matches(history,before)?history:emptyHistory(before);
 if(after.id!==before.id)return emptyHistory(after);
 if(same(before.nodes,after.nodes))return {...h,revision:after.contentRevision};
 return {projectId:after.id,revision:after.contentRevision,past:[...h.past,structuredClone(before.nodes)].slice(-20),future:[]};
}
export function historyChange(h:RequirementHistory,p:Snapshot,direction:'undo'|'redo'):RequirementChange{
 if(!matches(h,p))throw new Error('HISTORY_STALE');
 const nodes=(direction==='undo'?h.past:h.future).at(-1);if(!nodes)throw new Error('HISTORY_EMPTY');
 return {kind:'restore',nodes:structuredClone(nodes)};
}
/** Call only after successful Host save. Failed saves leave both stacks untouched. */
export function commitHistory(h:RequirementHistory,before:Snapshot,after:Snapshot,direction:'undo'|'redo'):RequirementHistory{
 const change=historyChange(h,before,direction);if(change.kind!=='restore'||after.id!==before.id||!same(after.nodes,change.nodes))throw new Error('HISTORY_RESULT_MISMATCH');
 return {projectId:after.id,revision:after.contentRevision,past:direction==='undo'?h.past.slice(0,-1):[...h.past,structuredClone(before.nodes)].slice(-20),future:direction==='redo'?h.future.slice(0,-1):[...h.future,structuredClone(before.nodes)].slice(-20)};
}
