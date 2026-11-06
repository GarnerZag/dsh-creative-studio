import {createHash,randomUUID} from 'node:crypto';
import {zipSync,strToU8} from 'fflate';
import {handoffContents} from '../domain/handoff-content.js';
import type {Project} from '../domain/project.js';
export interface HandoffArchive{handoffId:string;projectId:string;versionId:string;ready:boolean;manifestDigest:string;archiveSha256:string;bytes:Uint8Array}
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
/** Hash only at the exported artifact boundary, not on ordinary project reads/writes. */
export function buildHandoffArchive(project:Project,versionId:string):HandoffArchive{
 const contents=handoffContents(project,versionId),handoffId=randomUUID();
 const entries:Record<string,Uint8Array>={},files:{path:string;bytes:number;sha256:string}[]=[];
 let total=0;
 for(const path of Object.keys(contents.files).sort()){
  if(path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>p==='..'||p==='.'||!p))throw new Error('UNSAFE_EXPORT_PATH');
  const bytes=strToU8(contents.files[path]!);total+=bytes.length;
  if(total>32*1024*1024)throw new Error('HANDOFF_TOO_LARGE: export exceeds 32 MiB');
  entries[path]=bytes;files.push({path,bytes:bytes.length,sha256:sha(bytes)});
 }
 const manifest=strToU8(JSON.stringify({schemaVersion:1,handoffId,projectId:project.id,versionId,ready:contents.ready,createdAt:new Date().toISOString(),files},null,2)+'\n');
 entries['manifest.json']=manifest;
 const bytes=zipSync(entries,{level:6});
 return {handoffId,projectId:project.id,versionId,ready:contents.ready,manifestDigest:sha(manifest),archiveSha256:sha(bytes),bytes};
}
