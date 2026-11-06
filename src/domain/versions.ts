import { validateProject, VersionSchema, type Project } from './project.js';

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
export function diffContent(before:Content,after:Content):ContentDifference[] {
  const differences:ContentDifference[]=[];
  for(const collection of ['nodes','architecture'] as const){
    const oldItems=new Map(before[collection].map(item=>[item.id,item]));
    const newItems=new Map(after[collection].map(item=>[item.id,item]));
    for(const item of after[collection]){
      const old=oldItems.get(item.id);
      if(!old){differences.push({collection,id:item.id,title:item.title,kind:'added',fields:[]});continue;}
      const fields=Object.keys(item).filter(key=>JSON.stringify(Reflect.get(old,key))!==JSON.stringify(Reflect.get(item,key)));
      if(fields.length) differences.push({collection,id:item.id,title:item.title,kind:'changed',fields});
    }
    for(const item of before[collection]) if(!newItems.has(item.id)) differences.push({collection,id:item.id,title:item.title,kind:'removed',fields:[]});
  }
  return differences;
}
