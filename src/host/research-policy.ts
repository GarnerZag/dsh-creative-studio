import {realpathSync} from 'node:fs';
import {relative,isAbsolute} from 'node:path';
import type {Project} from '../domain/project.js';
type Job=NonNullable<Project['researchJob']>;
export const researchReadTools=['read','web_fetch','mcp__rea__analyze_javascript_application','mcp__rea__inspect_desktop_application','mcp__rea__inspect_android_package','mcp__rea__inspect_wasm_artifact','mcp__rea__inspect_managed_artifact','mcp__rea__inspect_native_exports'];
export function researchToolAllowed(job:Job,name:string,args:unknown):boolean {
 if(!['queued','submitted','unknown'].includes(job.status))return false;
 if(name==='creative_studio_finish_research'||name==='creative_studio_read_research')return true;
 if(!researchReadTools.includes(name)||!job.allowedTools.includes(name)||!args||typeof args!=='object')return false;
 const a=args as Record<string,unknown>,source=job.reference;
 if(name==='mcp__rea__inspect_wasm_artifact'&&(a.glue_paths!==undefined||a.candidate_paths!==undefined))return false;
 if(name==='web_fetch')return a.url===source.location&&/^https?:\/\//.test(source.location);
 if(source.sourceKind==='url'||/^https?:\/\//.test(source.location))return false;
 const selected=name==='read'?a.file_path:name==='mcp__rea__analyze_javascript_application'?a.input_path:a.path;
 if(typeof selected!=='string'||!isAbsolute(selected)||!isAbsolute(source.location))return false;
 try{
  const root=realpathSync(source.location),target=realpathSync(selected);
  if(source.sourceKind!=='repository')return root===target;
  const rel=relative(root,target);return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('../'));
 }catch{return false;}
}
