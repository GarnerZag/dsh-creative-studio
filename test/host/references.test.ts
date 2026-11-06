import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,validateProject} from '../../src/domain/project.js';
import {editReference} from '../../src/domain/references.js';
test('manual references are explicit sources, not fabricated research evidence',()=>{
 const p=createProject('p','产品');
 const next=editReference(p,{kind:'save',reference:{id:'r',name:'参考产品',sourceKind:'url',location:'https://example.com',origin:'manual',notes:'看看筛选',license:'unknown'}});
 assert.equal(next.references[0]?.origin,'manual');assert.equal(next.contentRevision,0);assert.equal(next.projectRevision,1);assert.equal(p.references.length,0);
 assert.throws(()=>editReference(next,{kind:'save',reference:{...next.references[0]!,location:'javascript:alert(1)'}}));
 assert.equal(editReference(next,{kind:'remove',id:'r'}).references.length,0);
 assert.throws(()=>validateProject({...next,references:[next.references[0],next.references[0]]}),/DUPLICATE_REFERENCE/);
});
