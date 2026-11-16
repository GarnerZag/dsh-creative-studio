import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../../src/domain/project.js';
import {abandonProposalJob,beginProposalJob,confirmJobBrief,editJobBrief,submitJobBrief,submitJobProposal} from '../../src/domain/jobs.js';
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
 // Nothing becomes a requirement before the user confirms the understanding.
 assert.throws(()=>submitJobProposal(briefed,'session','job',input),/PROPOSAL_CONFIRMATION_REQUIRED/);
 const confirmed=confirmJobBrief(briefed,'job',new Date().toISOString());
 assert.ok(confirmed.proposalJob!.briefConfirmedAt);
 const done=submitJobProposal(confirmed,'session','job',input);
 assert.equal(done.proposals.length,1);assert.equal(done.proposalJob!.status,'finished');assert.equal(done.versions.length,0);
 assert.throws(()=>submitJobProposal(done,'session','job',{...input,id:'another'}),/JOB_NOT_ACTIVE/);
 assert.throws(()=>beginProposalJob(p,'second','session','其他'),/JOB_ALREADY_ACTIVE/);
});
test('an instruction to the studio never becomes product requirements',()=>{
 const p=beginProposalJob(createProject('p','产品'),'job','session','读取另一个会话里进行到一半的开发工作');
 const input={id:'proposal',title:'读取会话',rationale:'理由',alternatives:[],assumptions:[],baseContentRevision:0,nodes:[],architecture:[]};
 // The job stays open so the user can answer the brief's questions in the same session.
 const operation=submitJobBrief(p,'session','job',brief('operation'));
 assert.equal(operation.proposalJob!.brief!.intent,'operation');
 assert.equal(operation.proposalJob!.status,'queued');
 assert.throws(()=>submitJobProposal(operation,'session','job',input),/PROPOSAL_REQUIRES_PRODUCT_INTENT/);
 assert.equal(operation.proposals.length,0);
 // Answering the questions may still turn it into a product idea; a second brief is allowed.
 const product=submitJobBrief(operation,'session','job',brief('product'));
 assert.equal(product.proposals.length,0);
 assert.throws(()=>submitJobProposal(product,'session','job',input),/PROPOSAL_CONFIRMATION_REQUIRED/);
 const confirmed=confirmJobBrief(product,'job',new Date().toISOString());
 assert.equal(submitJobProposal(confirmed,'session','job',input).proposals.length,1);
 // Re-confirming is required after a correction, because the confirmed text changed.
 const corrected=confirmJobBrief(submitJobBrief(product,'session','job',brief('product')),'job',new Date().toISOString());
 assert.ok(corrected.proposalJob!.briefConfirmedAt);
});
test('a job the session cannot answer is abandoned by the user, not retried',()=>{
 const p=beginProposalJob(createProject('p','产品'),'job','session','读取另一个会话');
 const operation=submitJobBrief(p,'session','job',brief('operation'));
 assert.throws(()=>abandonProposalJob(operation,'other'),/JOB_SCOPE_MISMATCH/);
 const abandoned=abandonProposalJob(operation,'job');
 assert.equal(abandoned.proposalJob!.status,'failed');
 assert.equal(abandoned.proposalJob!.brief!.intent,'operation');
 assert.throws(()=>abandonProposalJob(abandoned,'job'),/JOB_NOT_ACTIVE/);
 assert.doesNotThrow(()=>beginProposalJob(abandoned,'job2','session2','改写后的需求'));
});

test('the user can correct the understanding before requirements exist',()=>{
 const p=beginProposalJob(createProject('p','产品'),'job','session','读取另一个会话的进度');
 const operation=submitJobBrief(p,'session','job',brief('operation'));
 const corrected=editJobBrief(operation,'job',{...brief('operation'),restated:'把另一个会话已完成的搜索过滤成果接回本项目',questions:['结论能否导出？']});
 assert.equal(corrected.proposalJob!.brief!.restated,'把另一个会话已完成的搜索过滤成果接回本项目');
 assert.equal(corrected.proposalJob!.brief!.intent,'operation');
 assert.equal(corrected.contentRevision,operation.contentRevision);
 // A user correction may reclassify the input; requirements still need a product intent.
 const product=editJobBrief(corrected,'job',{...corrected.proposalJob!.brief!,intent:'product'});
 assert.equal(product.proposalJob!.brief!.intent,'product');
 assert.throws(()=>editJobBrief(product,'other',brief('product')),/JOB_SCOPE_MISMATCH/);
 const abandoned=abandonProposalJob(product,'job');
 assert.throws(()=>editJobBrief(abandoned,'job',brief('product')),/JOB_NOT_ACTIVE/);
});
