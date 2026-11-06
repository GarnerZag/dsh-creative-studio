import test from 'node:test';
import assert from 'node:assert/strict';
import {validateScene,runDemoAction,visibleRows} from '../../src/domain/demo.js';
const scene={id:'d',title:'搜索',contentRevision:0,requirementIds:[],state:{query:'',open:false},components:[{id:'input',kind:'input',label:'搜索',binding:'query'},{id:'list',kind:'list',label:'结果',binding:'query',rows:['苹果','香蕉']},{id:'button',kind:'button',label:'展开',actionId:'toggle'}],actions:[{id:'toggle',changes:[{key:'open',value:true}]}],steps:[{componentId:'input',value:'苹果'},{actionId:'toggle'}]};
test('declarative demo updates real state without mutating initial scene',()=>{
 const d=validateScene(scene);const state=runDemoAction(d,d.state,'toggle');assert.equal(state.open,true);assert.equal(d.state.open,false);
 assert.deepEqual(visibleRows(['苹果','香蕉'],'苹'),['苹果']);
 assert.throws(()=>runDemoAction(d,d.state,'missing'),/ACTION_NOT_FOUND/);
});
test('scene rejects script fields, missing bindings and invalid action targets',()=>{
 assert.throws(()=>validateScene({...scene,script:'alert(1)'}));
 assert.throws(()=>validateScene({...scene,actions:[{id:'toggle',changes:[{key:'missing',value:true}]}]}),/STATE_KEY_NOT_FOUND/);
 assert.throws(()=>validateScene({...scene,components:[{id:'x',kind:'button',label:'x',actionId:'absent'}]}),/ACTION_NOT_FOUND/);
});
