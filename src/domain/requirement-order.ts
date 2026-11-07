import {validateProject,type Project} from './project.js';
type OrderedNode={id:string;parentId:string|null;order?:number};
/** Legacy nodes preserve array order. Explicit sibling order is snapshot data, not a UI preference. */
export function orderedChildren<T extends OrderedNode>(nodes:readonly T[],parentId:string|null):T[]{
 return nodes.filter(n=>n.parentId===parentId).map((node,index)=>({node,index})).sort((a,b)=>(a.node.order??a.index)-(b.node.order??b.index)||a.index-b.index).map(x=>x.node);
}
export function reorderRequirements(current:Project,expectedContentRevision:number,id:string,beforeId:string|null):Project{
 if(current.contentRevision!==expectedContentRevision)throw new Error('CONFLICT');
 const project=validateProject(current),node=project.nodes.find(n=>n.id===id);
 if(!node)throw new Error('NODE_NOT_FOUND');
 if(beforeId===id)throw new Error('ORDER_SELF_TARGET');
 const siblings=orderedChildren(project.nodes,node.parentId);
 if(beforeId!==null&&!siblings.some(n=>n.id===beforeId))throw new Error('ORDER_TARGET_NOT_SIBLING');
 const next=siblings.filter(n=>n.id!==id);next.splice(beforeId===null?next.length:next.findIndex(n=>n.id===beforeId),0,node);
 if(next.every((n,i)=>n.id===siblings[i]!.id))return project;
 next.forEach((n,i)=>{n.order=i;});
 project.projectRevision++;project.contentRevision++;
 return validateProject(project);
}
