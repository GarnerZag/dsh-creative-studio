import {realpath,mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {isAbsolute,resolve,relative,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {unzipSync,strFromU8} from 'fflate';
import type {HandoffArchive} from './handoff-export.js';
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const safe=(p:string)=>!!p&&!isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(s=>!s||s==='.'||s==='..');
/** Caller resolves an authorized workspace root; this function never accepts a client absolute destination. */
export async function copyHandoff(archive:HandoffArchive,workspaceRoot:string,relativeDirectory:string):Promise<{entryRelativePath:string;cwd:string}>{
 if(relativeDirectory!=='.'&&!safe(relativeDirectory))throw new Error('INVALID_TARGET');
 const root=await realpath(workspaceRoot),cwd=await realpath(resolve(root,relativeDirectory));const rel=relative(root,cwd);
 if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw new Error('TARGET_ESCAPE');
 if(hash(archive.bytes)!==archive.archiveSha256)throw new Error('ARCHIVE_CHECKSUM_MISMATCH');
 const entries=unzipSync(archive.bytes),manifestBytes=entries['manifest.json'];
 if(!manifestBytes||hash(manifestBytes)!==archive.manifestDigest)throw new Error('MANIFEST_CHECKSUM_MISMATCH');
 const manifest=JSON.parse(strFromU8(manifestBytes)) as {handoffId:string;projectId:string;versionId:string;files:{path:string;bytes:number;sha256:string}[]};
 if(manifest.handoffId!==archive.handoffId||manifest.projectId!==archive.projectId||manifest.versionId!==archive.versionId||!Array.isArray(manifest.files))throw new Error('MANIFEST_IDENTITY_MISMATCH');
 const names=new Set(['manifest.json']);
 for(const f of manifest.files){if(!safe(f.path)||names.has(f.path))throw new Error('UNSAFE_EXPORT_PATH');names.add(f.path);const bytes=entries[f.path];if(!bytes||bytes.length!==f.bytes||hash(bytes)!==f.sha256)throw new Error('FILE_CHECKSUM_MISMATCH');}
 if(Object.keys(entries).some(p=>!names.has(p))||!entries['START_HERE.md'])throw new Error('MANIFEST_FILES_MISMATCH');
 // Fresh directory only. Failures leave a partial directory but never dispatch or overwrite existing code.
 const destination=await mkdtemp(join(cwd,'.creative-studio-handoff-'));
 for(const [path,bytes] of Object.entries(entries)){const file=join(destination,path);await mkdir(dirname(file),{recursive:true});await writeFile(file,bytes,{flag:'wx',mode:0o600});}
 return {entryRelativePath:relative(root,join(destination,'START_HERE.md')),cwd};
}
