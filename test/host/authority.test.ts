import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireUserAuthority } from '../../src/host/authority.js';

test('requires a real owner invocation, not an actor in a request', () => {
  for (const input of [undefined, {}, { actor: 'user' }, { peer: {} }, { peer: { principal: { kind: 'agent' } } }]) {
    assert.throws(() => requireUserAuthority(input), { code: 'FORBIDDEN' });
  }
});

test('owner invocation supplies user authority', () => {
  assert.deepEqual(requireUserAuthority({ peer: { principal: { kind: 'owner' } } }), { kind: 'user' });
});
