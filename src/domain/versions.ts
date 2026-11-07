import { validateProject, VersionSchema, type ArchitectureItem, type Project } from './project.js';

type Content = Pick<Project,'nodes'|'architecture'>;
export interface ContentDifference { collection:'nodes'|'architecture'; id:string; title:string; kind:'added'|'removed'|'changed'; fields:string[] }
/** Host user-only approval entry must authorize before calling this pure mutation. */
export function approveVersion(current:Project,expectedContentRevision:number,id:string,label:string,createdAt:string):Project {
  if(current.contentRevision!==expectedContentRevision) throw new Error('CONFLICT');
  const project=validateProject(current);
  if(project.versions.some(version=>version.id===id)) throw new Error('VERSION_EXISTS');
  project.versions.push(VersionSchema.parse({references:project.references,features:project.features,demo:project.demo?.contentRevision===project.contentRevision?project.demo:null,id,label,createdAt,contentRevision:project.contentRevision,nodes:project.nodes,architecture:project.architecture}));
  project.projectRevision++;
  return validateProject(project);
}
/** Flatten a structured payload into leaf paths so a diff can name the exact field that changed. */
function flattenPayload(value:unknown,prefix:string,out:Map<string,string>):void{
  if(value===undefined){return;}
  if(value===null||typeof value!=='object'){out.set(prefix,JSON.stringify(value));return;}
  if(Array.isArray(value)){
    if(value.length===0){out.set(prefix,'[]');return;}
    value.forEach((item,index)=>flattenPayload(item,`${prefix}[${index}]`,out));
    return;
  }
  const entries=Object.entries(value as Record<string,unknown>);
  if(entries.length===0){out.set(prefix,'{}');return;}
  for(const [key,item] of entries)flattenPayload(item,`${prefix}.${key}`,out);
}
/** Human-readable structured payload differences (contract fields, task inputs/outputs/acceptance). */
export function structuredFieldChanges(before:ArchitectureItem|undefined,after:ArchitectureItem|undefined):{path:string;state:'added'|'removed'|'changed'}[]{
  const changes:{path:string;state:'added'|'removed'|'changed'}[]=[];
  for(const key of ['contract','task'] as const){
    const oldPayload=new Map<string,string>(),newPayload=new Map<string,string>();
    flattenPayload(before?.[key],key,oldPayload);
    flattenPayload(after?.[key],key,newPayload);
    for(const [path,value] of newPayload){const old=oldPayload.get(path);if(old===undefined)changes.push({path,state:'added'});else if(old!==value)changes.push({path,state:'changed'});}
    for(const path of oldPayload.keys())if(!newPayload.has(path))changes.push({path,state:'removed'});
  }
  return changes;
}

export function diffContent(before:Content,after:Content):ContentDifference[] {
  const differences:ContentDifference[]=[];
  for(const collection of ['nodes','architecture'] as const){
    const oldItems=new Map(before[collection].map(item=>[item.id,item]));
    const newItems=new Map(after[collection].map(item=>[item.id,item]));
    for(const item of after[collection]){
      const old=oldItems.get(item.id);
      if(!old){differences.push({collection,id:item.id,title:item.title,kind:'added',fields:[]});continue;}
      const keys=new Set([...Object.keys(old as object),...Object.keys(item as object)]);
      const fields=[...keys].filter(key=>JSON.stringify(Reflect.get(old,key))!==JSON.stringify(Reflect.get(item,key)));
      if(fields.length) differences.push({collection,id:item.id,title:item.title,kind:'changed',fields});
    }
    for(const item of before[collection]) if(!newItems.has(item.id)) differences.push({collection,id:item.id,title:item.title,kind:'removed',fields:[]});
  }
  return differences;
}
