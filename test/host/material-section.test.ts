import test from 'node:test';
import assert from 'node:assert/strict';
import { materialSection } from '../../src/host/proposal-runner.js';

test('uploaded material is presented as context with explicit limits', () => {
  assert.equal(materialSection(), '');
  const long = 'A'.repeat(9000);
  const section = materialSection([
    { name: '需求草稿.md', kind: 'text', text: long },
    { name: '首页截图.png', kind: 'image' },
    { name: '竞品分析.pdf', kind: 'other' },
  ]);
  assert.ok(section.includes('不要把文件名或截图当成需求条目'));
  assert.ok(section.includes('需求草稿.md'));
  assert.ok(section.includes('A'.repeat(6000)));
  assert.equal(section.includes('A'.repeat(6001)), false);
  assert.ok(section.includes('截图，你无法直接看到内容'));
  assert.ok(section.includes('竞品分析.pdf'));
});

test('total injected material stays inside the budget', () => {
  const files = Array.from({ length: 6 }, (_, index) => ({ name: `doc-${index}.md`, kind: 'text', text: 'B'.repeat(6000) }));
  const section = materialSection(files);
  const injected = (section.match(/B/g) ?? []).length;
  assert.ok(injected <= 24000);
  assert.equal(section.includes('doc-0.md'), true);
  assert.equal(section.includes('doc-5.md'), false);
});
