import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../../src/domain/project.js';
import {beginProposalJob,submitJobProposal} from '../../src/domain/jobs.js';
test('job output binds to exact session and original draft, not model-supplied scope',()=>{
 const p=beginProposalJob(createProject('p','产品'),'job','session','整理需求');
 assert.equal(p.contentRevision,0);
 const input={id:'proposal',title:'建议',rationale:'理由',alternatives:[],assumptions:[],baseContentRevision:0,nodes:[],architecture:[]};
 assert.throws(()=>submitJobProposal(p,'other','job',input),/JOB_SCOPE_MISMATCH/);
 assert.throws(()=>submitJobProposal(p,'session','other',input),/JOB_SCOPE_MISMATCH/);
 const done=submitJobProposal(p,'session','job',input);
 assert.equal(done.proposals.length,1);assert.equal(done.proposalJob!.status,'finished');assert.equal(done.versions.length,0);
 assert.throws(()=>submitJobProposal(done,'session','job',{...input,id:'another'}),/JOB_NOT_ACTIVE/);
 assert.throws(()=>beginProposalJob(p,'second','session','其他'),/JOB_ALREADY_ACTIVE/);
});
