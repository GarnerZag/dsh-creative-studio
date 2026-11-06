import test from 'node:test';
import assert from 'node:assert/strict';
import {demoDocument} from '../../src/domain/demo-document.js';
test('demo HTML escapes scene text and grants scripts only to trusted nonce',()=>{
 const html=demoDocument({id:'d',title:'</script><script>alert(1)</script>',contentRevision:0,requirementIds:[],state:{},components:[],actions:[],steps:[]},'owned-nonce');
 assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes("connect-src 'none'"));assert.ok(html.includes('nonce="owned-nonce"'));
 assert.throws(()=>demoDocument({},'unsafe"'));
});
