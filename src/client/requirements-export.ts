import type {RequirementNode} from '../types.js';
export interface ExportLabels { attachments?: string; root: string; priorityHigh: string; priorityLow: string; acceptance: string; depends: string; desktop: string; mobile: string; empty: string }
const order=(node:RequirementNode)=>node.order??0;
function childrenOf(nodes:readonly RequirementNode[],parentId:string|null):RequirementNode[]{
  return nodes.filter(node=>node.parentId===parentId).slice().sort((a,b)=>order(a)-order(b)||a.title.localeCompare(b.title));
}
function orphanDetected(nodes:readonly RequirementNode[]):RequirementNode[]{
  const ids=new Set(nodes.map(n=>n.id));
  return nodes.filter(n=>n.parentId!==null&&!ids.has(n.parentId));
}
function linesFor(nodes:readonly RequirementNode[],children:readonly RequirementNode[],depth:number,labels:ExportLabels,byId:Map<string,RequirementNode>):string[]{
  const lines:string[]=[];
  for(const node of children){
    const marks:string[]=[];
    if(node.priority==='high')marks.push(labels.priorityHigh);
    if(node.priority==='low')marks.push(labels.priorityLow);
    const indent='  '.repeat(depth);
    lines.push(`${indent}- **${node.title}**${marks.length?` _(${marks.join(', ')})_`:''}`);
    const detail:string[]=[];
    if(node.description.trim())detail.push(node.description.trim());
    const acceptance=[...node.desktopAcceptance.map(a=>`${labels.desktop}: ${a}`),...node.mobileAcceptance.map(a=>`${labels.mobile}: ${a}`)];
    if(acceptance.length)detail.push(`${labels.acceptance} ${acceptance.join('; ')}`);
    const depends=(node.dependsOn??[]).map(id=>byId.get(id)?.title??id).filter(Boolean);
    if(depends.length)detail.push(`${labels.depends} ${depends.join(', ')}`);
    for(const item of detail)lines.push(`${indent}  ${item}`);
    lines.push(...linesFor(nodes,childrenOf(nodes,node.id),depth+1,labels,byId));
  }
  return lines;
}
/** Render the requirement tree as shareable Markdown; keeps nesting, priority, acceptance and dependencies. */
export function requirementsMarkdown(name:string,nodes:readonly RequirementNode[],labels:ExportLabels,material:readonly {name:string;kind:string}[]=[]):string{
  if(!nodes.length)return `${labels.empty}\n`;
  const byId=new Map(nodes.map(node=>[node.id,node]));
  const lines=[`# ${name}`,`${labels.root}`,'',...linesFor(nodes,childrenOf(nodes,null),0,labels,byId)];
  const orphans=orphanDetected(nodes);
  if(orphans.length)lines.push('',...linesFor(nodes,orphans,0,labels,byId));
  if(material.length&&labels.attachments)lines.push('',`## ${labels.attachments}`,'',...material.map(item=>`- ${item.name} (${item.kind})`));
  return `${lines.join('\n')}\n`;
}
