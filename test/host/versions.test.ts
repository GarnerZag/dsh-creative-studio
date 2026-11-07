import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject, editRequirements } from '../../src/domain/project.js';
import { approveVersion, diffContent, structuredFieldChanges } from '../../src/domain/versions.js';
test('approval freezes content and later edits do not rewrite the version',()=>{
 let p=createProject('p','产品');
 p=editRequirements(p,0,{kind:'add',node:{id:'n',parentId:null,title:'功能',kind:'feature',description:'',priority:'normal',desktopAcceptance:[],mobileAcceptance:[]}});
 const approved=approveVersion(p,1,'v1','首版','2026-11-06T12:00:00Z');
 assert.equal(approved.contentRevision,1);assert.equal(approved.projectRevision,2);
 const changed=editRequirements(approved,1,{kind:'rename',id:'n',title:'修改'});
 assert.equal(changed.versions[0]!.nodes[0]!.title,'功能');
 assert.equal(diffContent(approved.versions[0]!,changed)[0]!.kind,'changed');
 assert.throws(()=>approveVersion(changed,1,'v2','过期','2026-11-06T12:00:00Z'),/CONFLICT/);
 assert.throws(()=>approveVersion(approved,1,'v1','重复','2026-11-06T12:00:00Z'),/VERSION_EXISTS/);
 assert.equal(p.versions.length,0);
});
test('diff identifies additions removals and architecture field changes',()=>{
 const p=createProject('p','项目');
 assert.deepEqual(diffContent(p,p),[]);
 const item={id:'m',kind:'module' as const,title:'模块',body:'说明',dependsOn:[],requirementIds:[]};
 assert.equal(diffContent(p,{...p,architecture:[item]})[0]!.kind,'added');
 assert.equal(diffContent({...p,architecture:[item]},p)[0]!.kind,'removed');
 assert.deepEqual(diffContent({...p,architecture:[item]},{...p,architecture:[{...item,body:'更新'}]})[0]!.fields,['body']);
});

test('diff reports fields that were removed from an item',()=>{
 const p=createProject('p','项目');
 const item={id:'c',kind:'contract' as const,title:'契约',body:'',dependsOn:[],requirementIds:[],contract:{surface:'GET /x',inputs:[],outputs:[],errors:[],permissions:'',notApplicable:false}};
 const withPayload={...p,architecture:[item]};
 const withoutPayload={...p,architecture:[{id:'c',kind:'contract' as const,title:'契约',body:'',dependsOn:['other'],requirementIds:[]}]};
 assert.deepEqual(diffContent(withoutPayload,withPayload)[0]!.fields.sort(),['contract','dependsOn']);
 assert.deepEqual(diffContent(withPayload,withoutPayload)[0]!.fields.sort(),['contract','dependsOn']);
});

test('structured payload diff names the exact field that changed',()=>{
 const base={id:'c',kind:'contract' as const,title:'契约',body:'',dependsOn:[],requirementIds:[],contract:{surface:'GET /x',inputs:[{name:'q',type:'string',required:true,notes:''}],outputs:[],errors:[],permissions:'',notApplicable:false}};
 const next={...base,contract:{...base.contract,surface:'POST /x',inputs:[{name:'q',type:'string',required:false,notes:'optional'}]}};
 const changes=structuredFieldChanges(base,next);
 assert.ok(changes.some(c=>c.path==='contract.surface'&&c.state==='changed'));
 assert.ok(changes.some(c=>c.path==='contract.inputs[0].required'&&c.state==='changed'));
 assert.ok(changes.some(c=>c.path==='contract.inputs[0].notes'&&c.state==='changed'));
 assert.deepEqual(structuredFieldChanges(base,base),[]);
 assert.deepEqual(structuredFieldChanges(undefined,base).map(c=>c.path),['contract.surface','contract.inputs[0].name','contract.inputs[0].type','contract.inputs[0].required','contract.inputs[0].notes','contract.outputs','contract.errors','contract.permissions','contract.notApplicable']);
 assert.deepEqual(structuredFieldChanges(base,undefined).map(c=>c.state).every(s=>s==='removed'),true);
});
