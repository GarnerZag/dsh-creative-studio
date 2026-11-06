import assert from 'node:assert/strict';
import test from 'node:test';
import { createProject, editRequirements, validateProject } from '../../src/domain/project.js';

test('edits preserve node identity and accept Chinese requirements', () => {
  const p = createProject('p1', '我的产品');
  const next = editRequirements(p, 0, { kind: 'add', node: { id: 'n1', parentId: null, title: '模糊想法', kind: 'goal', description: '', priority: 'normal', desktopAcceptance: [], mobileAcceptance: [] } });
  const renamed = editRequirements(next, 1, { kind: 'rename', id: 'n1', title: '更明确的目标' });
  assert.equal(renamed.nodes[0]?.id, 'n1');
  assert.equal(renamed.nodes[0]?.title, '更明确的目标');
  assert.equal(p.nodes.length, 0);
  assert.equal(renamed.contentRevision, 2);
});

test('stale edits, dangling parents and cycles are rejected without mutations', () => {
  let p = createProject('p1', '产品');
  for (const [id, parentId] of [['a', null], ['b', 'a']] as const) {
    p = editRequirements(p, p.contentRevision, { kind: 'add', node: { id, parentId, title: id, kind: 'feature', description: '', priority: 'normal', desktopAcceptance: [], mobileAcceptance: [] } });
  }
  assert.throws(() => editRequirements(p, 0, { kind: 'rename', id: 'a', title: '旧编辑' }), /CONFLICT/);
  assert.throws(() => editRequirements(p, 2, { kind: 'move', id: 'a', parentId: 'b' }), /CYCLE/);
  assert.throws(() => editRequirements(p, 2, { kind: 'move', id: 'a', parentId: 'missing' }), /PARENT_NOT_FOUND/);
  assert.equal(p.nodes[0]?.parentId, null);
});

test('remove explicitly includes descendants; schema rejects duplicate identities', () => {
  const p = createProject('p1', '产品');
  const node = { id: 'a', parentId: null, title: '功能', kind: 'feature' as const, description: '', priority: 'normal' as const, desktopAcceptance: [], mobileAcceptance: [] };
  const next = editRequirements(p, 0, { kind: 'add', node });
  assert.throws(() => validateProject({ ...next, nodes: [node, node] }), /DUPLICATE_ID/);
  const child = editRequirements(next, 1, { kind: 'add', node: { ...node, id: 'b', parentId: 'a' } });
  const grandchild = editRequirements(child, 2, { kind: 'add', node: { ...node, id: 'c', parentId: 'b' } });
  assert.equal(editRequirements(grandchild, 3, { kind: 'remove', id: 'a' }).nodes.length, 0);
  assert.equal(grandchild.nodes.length, 3);
  const detailed = editRequirements(child, 2, { kind: 'details', id: 'b', description: '筛选', priority: 'high', desktopAcceptance: ['表格刷新'], mobileAcceptance: ['卡片刷新'] });
  assert.deepEqual(detailed.nodes[1]?.mobileAcceptance, ['卡片刷新']);
});
