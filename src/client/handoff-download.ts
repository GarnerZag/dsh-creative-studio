import {sha256} from '@noble/hashes/sha2.js';
import type {HandoffInfo,HandoffChunk} from '../types.js';
/** Collect one fixed package; verify the complete byte digest once, including on intranet HTTP. */
export async function receiveHandoff(info:HandoffInfo,read:(offset:number,maxBytes:number)=>Promise<HandoffChunk>):Promise<Uint8Array>{
 if(!Number.isSafeInteger(info.size)||info.size<1||info.size>40*1024*1024)throw new Error('INVALID_ARCHIVE_SIZE');
 const bytes=new Uint8Array(info.size);let offset=0;
 while(offset<info.size){const part=await read(offset,65536);if(part.packageId!==info.handoffId||part.total!==info.size)throw new Error('ARCHIVE_IDENTITY_CHANGED');const text=atob(part.base64);if(!text.length||text.length>65536||offset+text.length>info.size)throw new Error('INVALID_ARCHIVE_CHUNK');for(let i=0;i<text.length;i++)bytes[offset+i]=text.charCodeAt(i);offset+=text.length;if(part.nextOffset!==(offset===info.size?null:offset))throw new Error('INVALID_ARCHIVE_OFFSET');}
 const actual=Array.from(sha256(bytes),b=>b.toString(16).padStart(2,'0')).join('');if(actual!==info.archiveSha256)throw new Error('ARCHIVE_CHECKSUM_MISMATCH');return bytes;
}
