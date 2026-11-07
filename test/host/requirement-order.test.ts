import test from 'node:test';import assert from 'node:assert/strict';
import {createProject,editRequirements} from '../../src/domain/project.js';
import {orderedChildren,reorderRequirements} from '../../src/domain/requirement-order.js';
import {approveVersion,diffContent} from '../../src/domain/versions.js';
test('sibling order preserves IDs and old snapshots and participates in revision diff',()=>{
 let p=createProject('p','test');for(const id of ['a','b','c'])p=editRequirements(p,p.contentRevision,{kind:'add',node:{id,parentId:null,title:id,kind:'feature',priority:'normal',description:'',desktopAcceptance:[],mobileAcceptance:[]}});
 p=approveVersion(p,3,'v','before order','2026-11-07T00:00:00Z');
 assert.deepEqual(orderedChildren(p.nodes,null).map(n=>n.id),['a','b','c']);
 const next=editRequirements(p,3,{kind:'reorder',id:'c',beforeId:'a'});assert.deepEqual(orderedChildren(next.nodes,null).map(n=>n.id),['c','a','b']);assert.equal(next.contentRevision,4);assert.equal(next.projectRevision,p.projectRevision+1);
 assert.deepEqual(orderedChildren(next.versions[0]!.nodes,null).map(n=>n.id),['a','b','c']);assert.ok(p.nodes.every(n=>n.order===undefined));
 assert.ok(diffContent(p,next).some(c=>c.fields.includes('order')));
 assert.equal(reorderRequirements(next,4,'c','a').projectRevision,next.projectRevision);
 assert.throws(()=>reorderRequirements(next,3,'a',null),/CONFLICT/);assert.throws(()=>reorderRequirements(next,4,'a','a'),/SELF_TARGET/);
 const child=editRequirements(next,4,{kind:'add',node:{...next.nodes[0]!,id:'child',parentId:'a'}});
 assert.throws(()=>reorderRequirements(child,5,'b','child'),/NOT_SIBLING/);
 assert.deepEqual(orderedChildren(reorderRequirements(next,4,'c',null).nodes,null).map(n=>n.id),['a','b','c']);
});
