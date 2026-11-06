import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, editRequirements, validateProject } from '../../src/domain/project.js';
import { editArchitecture } from '../../src/domain/architecture.js';

test('older project records gain an empty architecture without modifying saved input',()=>{
  const legacy={schemaVersion:1,id:'old',name:'原项目',projectRevision:2,contentRevision:1,nodes:[]};
  assert.deepEqual(validateProject(legacy).architecture,[]);
  assert.equal('architecture' in legacy,false);
});

test('architecture links requirements, preserves identity and rejects broken dependencies', () => {
  const base = editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:[],mobileAcceptance:[]}});
  const item = {id:'m',kind:'module' as const,title:'查询模块',body:'处理筛选',requirementIds:['r'],dependsOn:[]};
  const next = editArchitecture(base,1,{kind:'save',item});
  assert.equal(next.architecture[0]?.id,'m');
  assert.equal(base.architecture.length,0);
  assert.throws(()=>editArchitecture(next,1,{kind:'remove',id:'m'}),/CONFLICT/);
  assert.throws(()=>editArchitecture(next,2,{kind:'save',item:{...item,dependsOn:['missing']}}),/ARCHITECTURE_DEPENDENCY_NOT_FOUND/);
  assert.throws(()=>editArchitecture(next,2,{kind:'save',item:{...item,requirementIds:['missing']}}),/REQUIREMENT_NOT_FOUND/);
});

test('architecture prevents cycles and removing referenced requirements',()=>{
  const base = editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:[],mobileAcceptance:[]}});
  const one=editArchitecture(base,1,{kind:'save',item:{id:'a',kind:'module',title:'A',body:'',requirementIds:['r'],dependsOn:[]}});
  const two=editArchitecture(one,2,{kind:'save',item:{id:'b',kind:'task',title:'B',body:'',requirementIds:['r'],dependsOn:['a']}});
  assert.throws(()=>editArchitecture(two,3,{kind:'save',item:{...two.architecture[0]!,dependsOn:['b']}}),/ARCHITECTURE_CYCLE/);
  assert.throws(()=>editArchitecture(two,3,{kind:'remove',id:'a'}),/ARCHITECTURE_DEPENDENCY_NOT_FOUND/);
  assert.throws(()=>editRequirements(two,3,{kind:'remove',id:'r'}),/REQUIREMENT_NOT_FOUND/);
});
