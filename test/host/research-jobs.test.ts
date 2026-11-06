import test from 'node:test';import assert from 'node:assert/strict';
import {createProject} from '../../src/domain/project.js';
import {finishResearch,beginResearchJob,appendResearchEvidence} from '../../src/domain/research-jobs.js';
test('research jobs freeze source, bind results and refuse overlapping or foreign writes',()=>{
 const p=createProject('p','Research');p.references.push({id:'r',name:'Source',sourceKind:'url',location:'https://example.com',origin:'manual',notes:'',license:''});
 const input={id:'job',sessionId:'session',referenceId:'r',request:'Inspect features',allowedTools:['rea-read']};
 const started=beginResearchJob(p,input);p.references[0]!.location='https://changed.example';assert.equal(started.researchJob!.reference.location,'https://example.com');
 assert.throws(()=>beginResearchJob(started,input),/RESEARCH_ALREADY_ACTIVE/);
 const evidence={callId:'c',tool:'rea-read',value:{coverage:'partial'},authority:'tool-result' as const,interpretation:'untrusted' as const};
 assert.throws(()=>appendResearchEvidence(started,'other','job',evidence),/RESEARCH_SCOPE/);
 assert.throws(()=>appendResearchEvidence(started,'session','job',{...evidence,tool:'bash'}),/RESEARCH_TOOL_DENIED/);
 const saved=appendResearchEvidence(started,'session','job',evidence);assert.equal(saved.contentRevision,started.contentRevision);assert.equal(saved.features.length,0);
 assert.deepEqual(appendResearchEvidence(saved,'session','job',evidence),saved);
 assert.equal(saved.researchJob!.evidence[0]!.interpretation,'untrusted');
 assert.throws(()=>finishResearch(saved,'session','job',{summary:'claim',evidenceCallIds:['fake'],limitations:[]}),/RESEARCH_EVIDENCE_NOT_FOUND/);
 assert.throws(()=>finishResearch(saved,'session','job',{summary:'claim',evidenceCallIds:[],limitations:[]}),/RESEARCH_REQUIRES/);
 const done=finishResearch(saved,'session','job',{summary:'static inference',evidenceCallIds:['c'],limitations:['partial']});assert.equal(done.researchJob!.status,'finished');assert.equal(done.features.length,0);
 assert.throws(()=>finishResearch(done,'session','job',{summary:'again',evidenceCallIds:['c'],limitations:[]}),/RESEARCH_NOT_ACTIVE/);
});
