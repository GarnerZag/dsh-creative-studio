import {z} from 'zod';
import type {Project} from '../domain/project.js';
import {buildHandoffArchive,type HandoffArchive} from './handoff-export.js';
export const StoredHandoffSchema=z.object({handoffId:z.string().min(1),projectId:z.string().min(1),versionId:z.string().min(1),ready:z.boolean(),manifestDigest:z.string(),archiveSha256:z.string(),size:z.number().int().nonnegative(),base64:z.string()}).strict();
export type StoredHandoff=z.infer<typeof StoredHandoffSchema>;
export type HandoffInfo=Omit<StoredHandoff,'base64'>;
interface ArchiveTable{get(id:string):StoredHandoff|undefined;put(id:string,value:StoredHandoff):Promise<void>}
export class HandoffStore{
 constructor(private readonly table:ArchiveTable){}
 async create(project:Project,versionId:string):Promise<HandoffInfo>{const archive=buildHandoffArchive(project,versionId);const {bytes,...meta}=archive;const record=StoredHandoffSchema.parse({...meta,size:bytes.length,base64:Buffer.from(bytes).toString('base64')});if(this.table.get(record.handoffId))throw new Error('HANDOFF_EXISTS');await this.table.put(record.handoffId,record);return this.info(project.id,record.handoffId);}
 private record(projectId:string,id:string):StoredHandoff{const row=this.table.get(id);if(!row||row.projectId!==projectId)throw new Error('HANDOFF_NOT_FOUND');return row;}
 info(projectId:string,id:string):HandoffInfo{const {base64,...info}=this.record(projectId,id);return {...info};}
 archive(projectId:string,id:string):HandoffArchive{const {base64,size,...meta}=this.record(projectId,id);const bytes=Buffer.from(base64,'base64');if(bytes.length!==size)throw new Error('ARCHIVE_SIZE_MISMATCH');return {...meta,bytes};}
 chunk(projectId:string,id:string,offset:number,maxBytes:number):{base64:string;nextOffset:number|null;total:number;packageId:string}{
  const row=this.record(projectId,id);if(!Number.isSafeInteger(offset)||offset<0||offset>row.size||!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>65536)throw new Error('INVALID_CHUNK');
  const end=Math.min(row.size,offset+maxBytes);
  // Decode only the aligned base64 slice, not the entire archive on every request.
  const alignedStart=Math.floor(offset/3)*3,alignedEnd=Math.ceil(end/3)*3;
  const slice=Buffer.from(row.base64.slice(alignedStart/3*4,alignedEnd/3*4),'base64').subarray(offset-alignedStart,end-alignedStart);
  return {base64:slice.toString('base64'),nextOffset:end<row.size?end:null,total:row.size,packageId:row.handoffId};
 }
}
