import test from 'node:test';import assert from 'node:assert/strict';
import {ProjectStore} from '../../src/host/store.js';import type {Project} from '../../src/domain/project.js';
import {startResearch} from '../../src/host/research-runner.js';
test('research dispatch stores identities before effects and uncertainty forbids duplicate submission',async()=>{
 const rows=new Map<string,Project>();const s=new ProjectStore({get:id=>rows.get(id),entries:()=>rows.entries(),put:async(id,p)=>{rows.set(id,p);},update:async(id,fn)=>{const p=fn(rows.get(id)!);rows.set(id,p);return p;}});
 const p=await s.create('Research');p.references.push({id:'r',name:'reference',sourceKind:'url',location:'https://example.com',origin:'manual',notes:'',license:''});rows.set(p.id,p);
 let creates=0;const gateway={create:async({sessionId}:{sessionId:string})=>{creates++;assert.equal(s.get(p.id).researchJob!.sessionId,sessionId);return {sessionId};},prompt:async()=>{throw new Error('NETWORK_UNKNOWN');}};
 const input={projectId:p.id,expectedProjectRevision:0,referenceId:'r',request:'inspect',workspaceId:'w',allowedTools:['read']};
 await assert.rejects(startResearch(s,gateway,input,new AbortController().signal),/NETWORK_UNKNOWN/);
 assert.equal(s.get(p.id).researchJob!.status,'unknown');
 await assert.rejects(startResearch(s,gateway,{...input,expectedProjectRevision:s.get(p.id).projectRevision},new AbortController().signal),/RESEARCH_ALREADY_ACTIVE/);assert.equal(creates,1);
});
