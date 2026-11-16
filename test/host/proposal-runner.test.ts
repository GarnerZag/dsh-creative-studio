import test from 'node:test';
import assert from 'node:assert/strict';
import {ProjectStore} from '../../src/host/store.js';
import type {Project} from '../../src/domain/project.js';
import {continueProposal,startProposal} from '../../src/host/proposal-runner.js';
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
 await startProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async(request)=>{const text=request.content[0]!.text;assert.match(text,/recommendations/);assert.match(text,/未核验线索/);assert.match(text,/含goal/);assert.match(text,/creative_studio_save_brief/);assert.match(text,/operation/);return {accepted:true};}},{projectId:p.id,expectedProjectRevision:0,request:'优化'},new AbortController().signal);
 assert.equal(s.get(p.id).proposalJob?.status,'submitted');assert.equal(s.get(p.id).versions.length,0);
});
test('the first prompt asks for a brief before any proposal',async()=>{
 const s=store(),p=await s.create('测试');
 let sent='';
 await startProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async(request)=>{sent=request.content[0]!.text;return {accepted:true};}},{projectId:p.id,expectedProjectRevision:0,request:'读取另一个会话里进行到一半的开发工作'},new AbortController().signal);
 assert.match(sent,/第一步/);
 assert.match(sent,/creative_studio_save_brief/);
 assert.match(sent,/不要把它改写成一条产品需求/);
 const job=s.get(p.id).proposalJob!;
 await s.submitJobBrief(p.id,job.sessionId,job.id,{intent:'operation',restated:'接上另一个会话的进度',interpretation:'操作指令',goals:[],users:[],scenarios:[],constraints:[],unknowns:[],questions:['那个会话的结论能否导出？'],needs:['结论摘要'],createdAt:new Date().toISOString()});
 let followUp='',target='';
 await continueProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async(request)=>{target=request.sessionId;followUp=request.content[0]!.text;return {accepted:true};}},{projectId:p.id,expectedProjectRevision:s.get(p.id).projectRevision,jobId:job.id,answers:'能，我把结论贴在这里：搜索栏需要支持标签过滤。'},new AbortController().signal);
 assert.equal(target,job.sessionId);
 assert.match(followUp,/intent 改为 product/);
 assert.match(followUp,/搜索栏需要支持标签过滤/);
 assert.equal(s.get(p.id).proposalJob!.status,'submitted');
 await assert.rejects(continueProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async()=>({accepted:true})},{projectId:p.id,expectedProjectRevision:0,jobId:job.id,answers:'x'},new AbortController().signal),/CONFLICT/);
});
