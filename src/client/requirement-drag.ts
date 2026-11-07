export function canReparent(nodes:readonly {id:string;parentId:string|null}[],id:string,parentId:string|null):boolean{
 const node=nodes.find(n=>n.id===id);if(!node||node.parentId===parentId)return false;
 const seen=new Set<string>();let cursor=parentId;
 while(cursor!==null){if(cursor===id||seen.has(cursor))return false;seen.add(cursor);const parent=nodes.find(n=>n.id===cursor);if(!parent)return false;cursor=parent.parentId;}
 return true;
}
