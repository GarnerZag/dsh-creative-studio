import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

interface ClientModule {
  id: string;
  factory(require: (id: string) => object): { inject: string[]; apply(ctx: object): void };
}

test('client is lazy and registers only its native sidebar and main slots', () => {
  let registration: ClientModule | undefined;
  const imports: string[] = [];
  runInNewContext(readFileSync('lib/client.js', 'utf8'), {
    window: { __ModuleLoader__: { load(module: ClientModule) { registration = module; } } },
  });
  assert.equal(registration?.id, '@garnerzag/dsh-creative-studio');
  assert.equal(imports.length, 0);
  const client = registration!.factory(id => { imports.push(id); assert.ok(['react', 'react/jsx-runtime'].includes(id)); return {}; });
  const slots: Array<{ name: string; key?: string; id?: string }> = [];
  const disposers: Array<() => void> = [];
  client.apply({
    effect(setup: () => void | (() => void)) { const dispose = setup(); if (dispose) disposers.push(dispose); },
    locale: { register: () => () => undefined, bind: () => (key: string) => key },
    slots: { inject: (_name: string, setup: () => unknown) => setup(), register: (entry: typeof slots[number]) => slots.push(entry) },
    remote: { $mount: () => new Promise(() => undefined) },
  });
  assert.deepEqual(slots.map(({ name, key, id }) => ({ name, identity: key ?? id })), [
    { name: 'sidebar.panellist', identity: 'creative-studio' },
    { name: 'main', identity: 'creative-studio' },
  ]);
  for (const dispose of disposers) dispose();
});
