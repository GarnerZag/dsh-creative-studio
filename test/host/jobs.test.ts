import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../../src/domain/project.js';
import {beginProposalJob,submitJobBrief,submitJobProposal} from '../../src/domain/jobs.js';
const brief=(intent:'product'|'operation'|'unclear')=>({intent,restated:'整理需求',interpretation:'判断依据',goals:[],users:[],scenarios:[],constraints:[],unknowns:[],questions:[],needs:[],createdAt:new Date().toISOString()});
test('job output binds to exact session and original draft, not model-supplied scope',()=>{
 const p=beginProposalJob(createProject('p','产品'),'job','session','整理需求');
 assert.equal(p.contentRevision,0);
 const input={id:'proposal',title:'建议',rationale:'理由',alternatives:[],assumptions:[],baseContentRevision:0,nodes:[],architecture:[]};
 assert.throws(()=>submitJobProposal(p,'other','job',input),/JOB_SCOPE_MISMATCH/);
 assert.throws(()=>submitJobProposal(p,'session','other',input),/JOB_SCOPE_MISMATCH/);
 assert.throws(()=>submitJobBrief(p,'other','job',brief('product')),/JOB_SCOPE_MISMATCH/);
 assert.throws(()=>submitJobProposal(p,'session','job',input),/PROPOSAL_BRIEF_REQUIRED/);
 const briefed=submitJobBrief(p,'session','job',brief('product'));
 assert.equal(briefed.proposals.length,0);assert.equal(briefed.proposalJob!.brief!.intent,'product');
 const done=submitJobProposal(briefed,'session','job',input);
 assert.equal(done.proposals.length,1);assert.equal(done.proposalJob!.status,'finished');assert.equal(done.versions.length,0);
 assert.throws(()=>submitJobProposal(done,'session','job',{...input,id:'another'}),/JOB_NOT_ACTIVE/);
 assert.throws(()=>beginProposalJob(p,'second','session','其他'),/JOB_ALREADY_ACTIVE/);
});
test('an instruction to the studio never becomes product requirements',()=>{
 const p=beginProposalJob(createProject('p','产品'),'job','session','读取另一个会话里进行到一半的开发工作');
 const input={id:'proposal',title:'读取会话',rationale:'理由',alternatives:[],assumptions:[],baseContentRevision:0,nodes:[],architecture:[]};
 const operation=submitJobBrief(p,'session','job',brief('operation'));
 assert.equal(operation.proposalJob!.brief!.intent,'operation');
 // The studio has no chat channel here, so a non-product answer ends the job instead of
 // leaving it active and blocking the next attempt.
 assert.equal(operation.proposalJob!.status,'finished');
 assert.throws(()=>submitJobProposal(operation,'session','job',input),/JOB_NOT_ACTIVE/);
 assert.equal(operation.proposals.length,0);
 assert.throws(()=>submitJobBrief(p,'session','other',brief('unclear')),/JOB_SCOPE_MISMATCH/);
});
