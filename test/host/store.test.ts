import assert from 'node:assert/strict';
import test from 'node:test';
import type { Project } from '../../src/domain/project.js';
import { ProjectStore } from '../../src/host/store.js';

test('store protects read snapshots and checks revision inside storage update', async () => {
  const records = new Map<string, Project>();
  let queue = Promise.resolve();
  const table = {
    get: (id: string) => records.get(id), entries: () => records.entries(),
    put: async (id: string, p: Project) => { records.set(id, p); },
    update: (id: string, transform: (p: Project) => Project) => {
      const result = queue.then(() => { const next = transform(records.get(id)!); records.set(id, next); return next; });
      queue = result.then(() => {}, () => {});
      return result;
    },
  };
  const store = new ProjectStore(table);
  const p = await store.create('工作台');
  const copy = store.get(p.id); copy.name = '污染';
  assert.equal(store.get(p.id).name, '工作台');
  const edits = await Promise.allSettled([store.rename(p.id, 0, 'A'), store.rename(p.id, 0, 'B')]);
  assert.equal(edits.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(store.get(p.id).projectRevision, 1);
  assert.equal(store.get(p.id).contentRevision, 0);
  assert.throws(() => store.get('missing'), /PROJECT_NOT_FOUND/);
  const fixture=store.get(p.id);
  fixture.nodes.push({id:'req',parentId:null,title:'Requirement',description:'',kind:'feature',priority:'normal',desktopAcceptance:['Works'],mobileAcceptance:[]});
  records.set(p.id,fixture);
  await assert.rejects(store.approve(p.id,1,0,'No acknowledgement'),/APPROVAL_UNVERIFIED_ACK_REQUIRED/);
  assert.equal(store.get(p.id).versions.length,0);
  const approved=await store.approve(p.id,1,0,'Explicit acknowledgement',{baselineVersionId:null,acknowledgeUnverified:true});
  assert.equal(approved.versions[0]!.approval!.acknowledged,true);
  assert.equal(approved.projectRevision,2);
  await assert.rejects(store.approve(p.id,1,0,'Stale',{baselineVersionId:null,acknowledgeUnverified:true}),/CONFLICT/);
});
