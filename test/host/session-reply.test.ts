import test from 'node:test';
import assert from 'node:assert/strict';
import {extractReply} from '../../src/host/session-reply.js';
const assistant=(text:string,extra:readonly {type:string;text?:string}[]=[])=>({type:'assistant/message',seq:1,data:{message:{role:'assistant',content:[{type:'reasoning',text:'内部推理'},...extra,{type:'text',text}]}}});
test('the newest visible answer wins and reasoning is not shown',()=>{
 const records=[assistant('最新结论'),assistant('较早结论')];
 const reply=extractReply(records,false);
 assert.equal(reply.text,'最新结论');
 assert.equal(reply.truncated,false);
});
test('records without visible text are skipped instead of blanking the reply',()=>{
 const records=[{type:'assistant/message',data:{message:{role:'assistant',content:[{type:'reasoning',text:'只有推理'}]}}},assistant('上一条可见回答')];
 assert.equal(extractReply(records,false).text,'上一条可见回答');
 assert.equal(extractReply([],false).text,'');
});
test('a long reply is cut at the limit and reported as truncated',()=>{
 const reply=extractReply([assistant('x'.repeat(60))],false,20);
 assert.equal(reply.text.length,20);
 assert.equal(reply.truncated,true);
});
