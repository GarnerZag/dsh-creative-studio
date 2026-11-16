import test from 'node:test';
import assert from 'node:assert/strict';
import {extractReply} from '../../src/host/session-reply.js';
const assistant=(seq:number,text:string,extra:readonly {type:string;text?:string}[]=[])=>({type:'assistant/message',seq,data:{message:{role:'assistant',content:[{type:'reasoning',text:'内部推理'},...extra,{type:'text',text}]}}});
test('the newest visible answer wins and reasoning is not shown',()=>{
 const records=[assistant(3,'最新结论'),assistant(2,'较早结论')];
 const reply=extractReply(records,false);
 assert.equal(reply.text,'最新结论');
 assert.equal(reply.truncated,false);
});
test('a chronological history page resolves to the newest answer as well',()=>{
 const records=[assistant(1,'第一条'),assistant(2,'第二条'),assistant(3,'最新一条')];
 assert.equal(extractReply(records,false).text,'最新一条');
});
test('records without visible text are skipped instead of blanking the reply',()=>{
 const records=[{type:'assistant/message',seq:4,data:{message:{role:'assistant',content:[{type:'reasoning',text:'只有推理'}]}}},assistant(2,'上一条可见回答')];
 assert.equal(extractReply(records,false).text,'上一条可见回答');
 assert.equal(extractReply([],false).text,'');
});
test('a long reply is cut at the limit and reported as truncated',()=>{
 const reply=extractReply([assistant(1,'x'.repeat(60))],false,20);
 assert.equal(reply.text.length,20);
 assert.equal(reply.truncated,true);
});
