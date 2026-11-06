import test from 'node:test';
import assert from 'node:assert/strict';
import {ProjectStore} from '../../src/host/store.js';
import type {Project} from '../../src/domain/project.js';
import {startProposal} from '../../src/host/proposal-runner.js';
function store(){const rows=new Map<string,Project>();return new ProjectStore({get:id=>rows.get(id),entries:()=>rows.entries(),put:async(id,p)=>{rows.set(id,p);},update:async(id,fn)=>{const p=fn(rows.get(id)!);rows.set(id,p);return p;}});}
test('admission failure keeps known identity and prevents duplicate sessions',async()=>{
 const s=store(),p=await s.create('测试');let creates=0;
 const gateway={create:async({sessionId}:{sessionId:string})=>{creates++;assert.equal(s.get(p.id).proposalJob?.sessionId,sessionId);return {sessionId};},prompt:async()=>{throw new Error('NETWORK_UNKNOWN');}};
 await assert.rejects(startProposal(s,gateway,{projectId:p.id,expectedProjectRevision:0,request:'优化'},new AbortController().signal),/NETWORK_UNKNOWN/);
 assert.equal(s.get(p.id).proposalJob?.status,'unknown');
 await assert.rejects(startProposal(s,gateway,{projectId:p.id,expectedProjectRevision:s.get(p.id).projectRevision,request:'再试'},new AbortController().signal));
 assert.equal(creates,1);
});
test('prompt ACK is submitted, not finished or approved',async()=>{
 const s=store(),p=await s.create('测试');
 await startProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async()=>({accepted:true})},{projectId:p.id,expectedProjectRevision:0,request:'优化'},new AbortController().signal);
 assert.equal(s.get(p.id).proposalJob?.status,'submitted');assert.equal(s.get(p.id).versions.length,0);
});
