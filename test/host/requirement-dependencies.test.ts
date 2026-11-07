import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequirementDependencies } from '../../src/domain/requirement-dependencies.js';

test('legacy requirements and shared acyclic prerequisites remain valid and unmodified', () => {
  const nodes = [{ id: 'a', dependsOn: ['c'] }, { id: 'b', dependsOn: ['c'] }, { id: 'c' }];
  const before = structuredClone(nodes);
  validateRequirementDependencies(nodes);
  validateRequirementDependencies([{ id: 'legacy' }]);
  assert.deepEqual(nodes, before);
});
test('invalid dependency edges identify the owning node or cycle without repairing data', () => {
  assert.throws(() => validateRequirementDependencies([{ id: 'a', dependsOn: ['missing'] }]), /REQUIREMENT_DEPENDENCY_NOT_FOUND: a -> missing/);
  assert.throws(() => validateRequirementDependencies([{ id: 'a', dependsOn: ['a'] }]), /REQUIREMENT_DEPENDENCY_CYCLE: a -> a/);
  assert.throws(() => validateRequirementDependencies([{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }]), /REQUIREMENT_DEPENDENCY_CYCLE: a -> b -> a/);
  assert.throws(() => validateRequirementDependencies([{ id: 'a', dependsOn: ['b', 'b'] }, { id: 'b' }]), /DUPLICATE_REQUIREMENT_DEPENDENCY: a/);
  assert.throws(() => validateRequirementDependencies([{ id: 'a' }, { id: 'a' }]), /DUPLICATE_ID/);
});
