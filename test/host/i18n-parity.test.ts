import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
const source=readFileSync('src/client.ts','utf8');
const zhStart=source.indexOf('zh: {');const enStart=source.indexOf('en: {');const end=source.indexOf('\n  }',enStart);
const dictionaryKeys=(text:string)=>new Set([...text.matchAll(/([A-Za-z0-9_]+)\s*:\s*(?:'|`)/g)].map(m=>String(m[1])));
const zh=dictionaryKeys(source.slice(zhStart,enStart));const en=dictionaryKeys(source.slice(enStart,end));
const used=new Set<string>();
for(const file of readdirSync('src/client').filter(f=>/\.tsx?$/.test(f))){
  const text=readFileSync(`src/client/${String(file)}`,'utf8');
  for(const match of text.matchAll(/\bt\('([A-Za-z0-9_]+)'\)/g))used.add(String(match[1]));
}
const dynamic=[...used].filter(key=>key.endsWith('_'));
const literal=[...used].filter(key=>!key.endsWith('_')).sort();
test('every literal translation key used by the client exists in both dictionaries',()=>{
  assert.ok(literal.length>300,`expected a substantial key set, got ${literal.length}`);
  assert.deepEqual(literal.filter(key=>!zh.has(key)),[],'missing Chinese keys');
  assert.deepEqual(literal.filter(key=>!en.has(key)),[],'missing English keys');
});
