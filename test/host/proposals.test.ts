import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject, editRequirements} from '../../src/domain/project.js';
import {saveProposal, adoptProposal} from '../../src/domain/proposals.js';
const proposal={id:'a',title:'建议',rationale:'更清晰',alternatives:['保持现状'],assumptions:['待确认'],baseContentRevision:0,nodes:[{id:'n',parentId:null,title:'搜索',kind:'feature' as const,description:'搜索内容',priority:'normal' as const,desktopAcceptance:[],mobileAcceptance:[]}],architecture:[]};
test('saving a proposal never edits or approves the draft; adopting does not approve',()=>{
 const p=createProject('p','产品');const saved=saveProposal(p,proposal);
 assert.equal(saved.nodes.length,0);assert.equal(saved.contentRevision,0);assert.equal(saved.versions.length,0);
 const adopted=adoptProposal(saved,0,'a');assert.equal(adopted.nodes[0]!.id,'n');assert.equal(adopted.contentRevision,1);assert.equal(adopted.versions.length,0);
 assert.equal(saved.proposals[0]!.status,'pending');assert.equal(adopted.proposals[0]!.status,'adopted');
 assert.throws(()=>adoptProposal(adopted,1,'a'),/PROPOSAL_NOT_PENDING/);
});
test('late proposals remain visible but cannot overwrite changed requirements',()=>{
 const p=editRequirements(createProject('p','产品'),0,{kind:'add',node:proposal.nodes[0]!});
 const saved=saveProposal(p,proposal);assert.equal(saved.contentRevision,1);
 assert.throws(()=>adoptProposal(saved,1,'a'),/STALE_PROPOSAL/);
 assert.throws(()=>saveProposal(saved,proposal),/PROPOSAL_EXISTS/);
 assert.throws(()=>saveProposal(p,{...proposal,nodes:[{...proposal.nodes[0]!,parentId:'missing'}]}),/PARENT_NOT_FOUND/);
});
