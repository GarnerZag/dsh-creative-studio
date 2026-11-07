import test from 'node:test';import assert from 'node:assert/strict';import {canReparent} from '../../src/client/requirement-drag.js';
test('drag targets reject cycles, missing nodes and no-op parents',()=>{
 const nodes=[{id:'a',parentId:null},{id:'b',parentId:'a'},{id:'c',parentId:'b'},{id:'d',parentId:null}];
 assert.equal(canReparent(nodes,'b','d'),true);assert.equal(canReparent(nodes,'b',null),true);
 assert.equal(canReparent(nodes,'b','a'),false);assert.equal(canReparent(nodes,'a','c'),false);assert.equal(canReparent(nodes,'b','b'),false);
 assert.equal(canReparent(nodes,'foreign','d'),false);assert.equal(canReparent(nodes,'b','foreign'),false);
 assert.equal(canReparent([{id:'a',parentId:'a'},{id:'b',parentId:null}],'b','a'),false);
});
