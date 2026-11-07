import test from 'node:test';import assert from 'node:assert/strict';
import {createProject,editRequirements} from '../../src/domain/project.js';
import {approveVersion} from '../../src/domain/versions.js';
import {recordEdit,historyChange,commitHistory} from '../../src/client/requirement-history.js';
test('undo and redo restore only acknowledged requirement changes with revision checks',()=>{
 let p=createProject('p','test');p=editRequirements(p,0,{kind:'add',node:{id:'a',parentId:null,title:'A',kind:'feature',priority:'normal',description:'',desktopAcceptance:[],mobileAcceptance:[]}});p=approveVersion(p,1,'v','frozen','2026-11-07T00:00:00Z');
 const changed=editRequirements(p,1,{kind:'rename',id:'a',title:'B'}),h=recordEdit(undefined,p,changed);
 const undone=editRequirements(changed,2,historyChange(h,changed,'undo'));assert.equal(undone.nodes[0]!.title,'A');assert.equal(undone.versions[0]!.nodes[0]!.title,'A');assert.equal(changed.nodes[0]!.title,'B');
 const h2=commitHistory(h,changed,undone,'undo');assert.equal(h.past.length,1);assert.equal(h2.future.length,1);
 const redone=editRequirements(undone,3,historyChange(h2,undone,'redo'));assert.equal(redone.nodes[0]!.title,'B');assert.equal(commitHistory(h2,undone,redone,'redo').future.length,0);
 assert.throws(()=>historyChange(h,undone,'undo'),/HISTORY_STALE/);
 assert.throws(()=>editRequirements(changed,1,historyChange(h,changed,'undo')),/CONFLICT/);assert.equal(h.past.length,1);
 assert.throws(()=>editRequirements(changed,2,{kind:'restore',nodes:[changed.nodes[0]!,changed.nodes[0]!]}),/DUPLICATE/);
 const fork=editRequirements(undone,3,{kind:'rename',id:'a',title:'C'});assert.equal(recordEdit(h2,undone,fork).future.length,0);
});
