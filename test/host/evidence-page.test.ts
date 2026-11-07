import test from 'node:test';import assert from 'node:assert/strict';
import {createProject} from '../../src/domain/project.js';
import {beginResearchJob,appendResearchEvidence} from '../../src/domain/research-jobs.js';
import {evidencePage} from '../../src/host/evidence-page.js';
test('research evidence pages preserve original values and reject stale or invalid coordinates',()=>{
 const p=createProject('p','P');p.references.push({id:'r',name:'R',sourceKind:'url',location:'https://example.com',origin:'manual',notes:'',license:''});
 const job=beginResearchJob(p,{id:'j',sessionId:'s',referenceId:'r',request:'R',allowedTools:['read']});
 const value={coverage:'partial',text:'中'.repeat(20000)};
 const saved=appendResearchEvidence(job,'s','j',{callId:'c',tool:'read',value,authority:'tool-result',interpretation:'untrusted'});
 const a=evidencePage(saved,'j','c',0),b=evidencePage(saved,'j','c',a.nextOffset!);assert.equal(a.text.length,16384);assert.equal(b.nextOffset,null);assert.deepEqual(JSON.parse(a.text+b.text),value);
 assert.throws(()=>evidencePage(saved,'other','c',0),/SCOPE/);assert.throws(()=>evidencePage(saved,'j','missing',0),/NOT_FOUND/);assert.throws(()=>evidencePage(saved,'j','c',-1),/OFFSET/);
});
