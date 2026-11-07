import test from 'node:test';import assert from 'node:assert/strict';
import {createProject} from '../../src/domain/project.js';import {saveProposal,rejectProposal,adoptProposal} from '../../src/domain/proposals.js';
test('rejecting a candidate leaves draft and approvals untouched, including stale candidates',()=>{
 const p=saveProposal(createProject('p','P'),{id:'c',title:'C',rationale:'R',alternatives:[],assumptions:[],baseContentRevision:0,nodes:[],architecture:[]});
 const rejected=rejectProposal(p,'c');assert.equal(p.proposals[0]!.status,'pending');assert.equal(rejected.proposals[0]!.status,'rejected');assert.equal(rejected.contentRevision,p.contentRevision);assert.deepEqual(rejected.nodes,p.nodes);assert.deepEqual(rejected.versions,[]);assert.deepEqual(rejectProposal(rejected,'c'),rejected);
 assert.throws(()=>adoptProposal(rejected,0,'c'),/NOT_PENDING/);assert.throws(()=>rejectProposal(adoptProposal(p,0,'c'),'c'),/NOT_PENDING/);
 const stale={...p,contentRevision:1};assert.equal(rejectProposal(stale,'c').proposals[0]!.status,'rejected');
});
