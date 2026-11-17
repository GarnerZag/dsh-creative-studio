import test from 'node:test';import assert from 'node:assert/strict';import {createProject} from '../../src/domain/project.js';import {approveVersion} from '../../src/domain/versions.js';import {handoffContents} from '../../src/domain/handoff-content.js';
test('portable handoff is derived from approved content and excludes later draft/private references',()=>{let p=createProject('p','P');p.nodes=[{id:'r',parentId:null,title:'Approved',kind:'feature',description:'Goal',priority:'normal',desktopAcceptance:['Filter works'],mobileAcceptance:['Touch works']}];p=approveVersion(p,0,'v','V','2026-11-07T00:00:00Z');p.nodes[0]!.title='Unapproved draft';p.references=[{id:'secret',name:'private',sourceKind:'host-file',location:'/private/source',origin:'manual',notes:'confidential',license:'unknown'}];const out=handoffContents(p,'v');assert.equal(out.ready,false);assert.match(out.files['START_HERE.md']!,/REVIEW ONLY/);assert.match(out.files['requirements.json']!,/Approved/);assert.doesNotMatch(JSON.stringify(out.files),/Unapproved draft|confidential|\/private\/source/);assert.ok(out.files['architecture.json']);assert.ok(out.files['traceability.json']);assert.ok(out.files['demo/README.md']);assert.ok(out.files['acceptance.md']?.includes('r:desktop:1'));});

test('attached reference files travel with the package as a materials note', () => {
  let project = createProject('p-material', 'Material');
  project.attachments = [
    { id: 'a1', name: '需求草稿.md', mime: 'text/markdown', size: 2048, kind: 'text', createdAt: '2026-11-17T03:00:00.000Z' },
    { id: 'a2', name: '首页截图.png', mime: 'image/png', size: 184320, kind: 'image', createdAt: '2026-11-17T03:01:00.000Z' },
  ];
  const approved = approveVersion(project, 0, 'v1', 'V1', '2026-11-17T03:02:00.000Z');
  const bundle = handoffContents(approved, 'v1');
  assert.ok(bundle.files['materials.md']?.includes('需求草稿.md — text'));
  assert.ok(bundle.files['materials.md']?.includes('首页截图.png — image'));
  assert.ok(bundle.files['START_HERE.md']?.includes('materials.md'));
  const without = handoffContents(approveVersion(createProject('p-empty', 'Empty'), 0, 'v1', 'V1', '2026-11-17T03:02:00.000Z'), 'v1');
  assert.equal(without.files['materials.md'], undefined);
});
