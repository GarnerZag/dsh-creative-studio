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
 await startProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async(request)=>{const text=request.content[0]!.text;assert.match(text,/recommendations/);assert.match(text,/未核验线索/);assert.match(text,/含goal/);assert.match(text,/creative_studio_save_brief/);assert.match(text,/operation/);assert.match(text,/briefConfirmed/);return {accepted:true};}},{projectId:p.id,expectedProjectRevision:0,request:'优化'},new AbortController().signal);
 assert.equal(s.get(p.id).proposalJob?.status,'submitted');assert.equal(s.get(p.id).versions.length,0);
});
test('the first prompt asks for a brief and stops before any proposal',async()=>{
 const s=store(),p=await s.create('测试');
 let sent='';
 await startProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async(request)=>{sent=request.content[0]!.text;return {accepted:true};}},{projectId:p.id,expectedProjectRevision:0,request:'读取另一个会话里进行到一半的开发工作'},new AbortController().signal);
 assert.match(sent,/第一步/);
 assert.match(sent,/creative_studio_save_brief/);
 assert.match(sent,/不要把它改写成一条产品需求/);
 assert.match(sent,/本轮到此结束/);
 assert.match(sent,/"briefConfirmed":false/);
 const job=s.get(p.id).proposalJob!;
 await s.submitJobBrief(p.id,job.sessionId,job.id,{intent:'operation',restated:'接上另一个会话的进度',interpretation:'操作指令',goals:[],users:[],scenarios:[],constraints:[],unknowns:[],questions:['那个会话的结论能否导出？'],needs:['结论摘要'],createdAt:new Date().toISOString()});
 let followUp='',target='';
 await continueProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async(request)=>{target=request.sessionId;followUp=request.content[0]!.text;return {accepted:true};}},{projectId:p.id,expectedProjectRevision:s.get(p.id).projectRevision,jobId:job.id,answers:'能，我把结论贴在这里：搜索栏需要支持标签过滤。',confirmed:false},new AbortController().signal);
 assert.equal(target,job.sessionId);
 assert.match(followUp,/currentBrief/);
 assert.match(followUp,/搜索栏需要支持标签过滤/);
 assert.match(followUp,/"briefConfirmed":false/);
 assert.match(followUp,/不要再提交候选方案/);
 assert.equal(s.get(p.id).proposalJob!.status,'submitted');
 await assert.rejects(continueProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async()=>({accepted:true})},{projectId:p.id,expectedProjectRevision:0,jobId:job.id,answers:'x',confirmed:false},new AbortController().signal),/CONFLICT/);
});
test('a confirmed brief is delivered as confirmed and unfreezes the proposal',async()=>{
 const s=store(),p=await s.create('测试');
 await startProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async()=>({accepted:true})},{projectId:p.id,expectedProjectRevision:0,request:'做一个按标签过滤的搜索'},new AbortController().signal);
 const job=s.get(p.id).proposalJob!;
 await s.submitJobBrief(p.id,job.sessionId,job.id,{intent:'product',restated:'按标签筛选搜索结果',interpretation:'产品需求',goals:['快速找到目标条目'],users:['编辑'],scenarios:['条目很多时'],constraints:[],unknowns:[],questions:['标签从何而来？'],needs:[],createdAt:new Date().toISOString()});
 const input={id:'proposal',title:'标签过滤',rationale:'理由',alternatives:[],assumptions:[],baseContentRevision:job.baseContentRevision,nodes:[],architecture:[]};
 await assert.rejects(s.submitJobProposal(p.id,job.sessionId,job.id,input),/PROPOSAL_CONFIRMATION_REQUIRED/);
 const confirmed=await s.confirmJobBrief(p.id,s.get(p.id).projectRevision,job.id,new Date().toISOString());
 assert.ok(confirmed.proposalJob!.briefConfirmedAt);
 let sent='';
 await continueProposal(s,{create:async({sessionId})=>({sessionId}),prompt:async(request)=>{sent=request.content[0]!.text;return {accepted:true};}},{projectId:p.id,expectedProjectRevision:s.get(p.id).projectRevision,jobId:job.id,answers:'',confirmed:true},new AbortController().signal);
 assert.match(sent,/"briefConfirmed":true/);
 assert.match(sent,/直接调用 creative_studio_save_proposal/);
 const done=await s.submitJobProposal(p.id,job.sessionId,job.id,input);
 assert.equal(done.proposalJob!.status,'finished');
 assert.equal(done.proposals.length,1);
});
