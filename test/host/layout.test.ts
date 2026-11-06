import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLayout} from '../../src/client/layout.js';
test('layout preferences tolerate malformed storage and bound usable proportions',()=>{
 for(const raw of [null,'null','[]','true','bad','{"split":"60","compare":"false"}'])assert.deepEqual(parseLayout(raw),{compare:false,split:50});
 assert.deepEqual(parseLayout('{"compare":true,"split":80}'),{compare:true,split:70});
 assert.deepEqual(parseLayout('{"split":-10}'),{compare:false,split:30});
 assert.deepEqual(parseLayout('{"compare":false,"split":42}'),{compare:false,split:42});
});
