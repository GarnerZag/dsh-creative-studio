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
  const base = editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:['可见'],mobileAcceptance:[]}});
  const item = {id:'m',kind:'module' as const,title:'查询模块',body:'处理筛选',requirementIds:['r'],dependsOn:[]};
  const next = editArchitecture(base,1,{kind:'save',item});
  assert.equal(next.architecture[0]?.id,'m');
  assert.equal(base.architecture.length,0);
  assert.throws(()=>editArchitecture(next,1,{kind:'remove',id:'m'}),/CONFLICT/);
  assert.throws(()=>editArchitecture(next,2,{kind:'save',item:{...item,dependsOn:['missing']}}),/ARCHITECTURE_DEPENDENCY_NOT_FOUND/);
  assert.throws(()=>editArchitecture(next,2,{kind:'save',item:{...item,requirementIds:['missing']}}),/REQUIREMENT_NOT_FOUND/);
});

test('architecture prevents cycles and removing referenced requirements',()=>{
  const base = editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:['可见'],mobileAcceptance:[]}});
  const one=editArchitecture(base,1,{kind:'save',item:{id:'a',kind:'module',title:'A',body:'',requirementIds:['r'],dependsOn:[]}});
  const two=editArchitecture(one,2,{kind:'save',item:{id:'b',kind:'task',title:'B',body:'',requirementIds:['r'],dependsOn:['a'],task:{inputs:['已批准契约'],outputs:['src/client/filter.ts'],acceptanceIds:['r:desktop:1']}}});
  assert.throws(()=>editArchitecture(two,3,{kind:'save',item:{...two.architecture[0]!,dependsOn:['b']}}),/ARCHITECTURE_CYCLE/);
  assert.throws(()=>editArchitecture(two,3,{kind:'remove',id:'a'}),/ARCHITECTURE_DEPENDENCY_NOT_FOUND/);
  assert.throws(()=>editRequirements(two,3,{kind:'remove',id:'r'}),/REQUIREMENT_NOT_FOUND/);
});

test('contract items must carry structured surface or an explicit not-applicable mark',()=>{
  const base=editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:[],mobileAcceptance:[]}});
  const bare={id:'c',kind:'contract' as const,title:'查询接口',body:'',requirementIds:['r'],dependsOn:[]};
  assert.throws(()=>editArchitecture(base,1,{kind:'save',item:bare}),/CONTRACT_STRUCTURE_REQUIRED/);
  assert.throws(()=>editArchitecture(base,1,{kind:'save',item:{...bare,contract:{surface:'  ',inputs:[],outputs:[],errors:[],permissions:'',notApplicable:false}}}),/CONTRACT_STRUCTURE_REQUIRED/);
  const structured={...bare,contract:{surface:'GET /api/bookmarks',inputs:[{name:'q',type:'string',required:false,notes:''}],outputs:[{name:'items',type:'Bookmark[]',required:true,notes:''}],errors:['400 INVALID_QUERY'],permissions:'仅限当前项目成员',notApplicable:false}};
  const saved=editArchitecture(base,1,{kind:'save',item:structured});
  assert.equal(saved.architecture[0]?.contract?.surface,'GET /api/bookmarks');
  const exempt=editArchitecture(base,1,{kind:'save',item:{...bare,id:'c2',contract:{surface:'',inputs:[],outputs:[],errors:[],permissions:'',notApplicable:true}}});
  assert.equal(exempt.architecture[0]?.contract?.notApplicable,true);
});

test('task items must declare outputs and resolve their acceptance IDs',()=>{
  const base=editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:['筛选生效'],mobileAcceptance:['可清空']}});
  const bare={id:'t',kind:'task' as const,title:'实现筛选',body:'',requirementIds:['r'],dependsOn:[]};
  assert.throws(()=>editArchitecture(base,1,{kind:'save',item:bare}),/TASK_STRUCTURE_REQUIRED/);
  assert.throws(()=>editArchitecture(base,1,{kind:'save',item:{...bare,task:{inputs:['契约'],outputs:[],acceptanceIds:['r:desktop:1']}}}),/TASK_STRUCTURE_REQUIRED/);
  assert.throws(()=>editArchitecture(base,1,{kind:'save',item:{...bare,task:{inputs:['契约'],outputs:['filter.ts'],acceptanceIds:['r:desktop:1','r:mobile:9']}}}),/ACCEPTANCE_NOT_FOUND/);
  const saved=editArchitecture(base,1,{kind:'save',item:{...bare,task:{inputs:['contract.currentVersion'],outputs:['src/client/filter.ts'],acceptanceIds:['r:desktop:1','r:mobile:1']}}});
  assert.deepEqual(saved.architecture[0]?.task?.acceptanceIds,['r:desktop:1','r:mobile:1']);
});

test('structured payloads are rejected on the wrong kind and legacy items still load',()=>{
  const base=editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:[],mobileAcceptance:[]}});
  const legacy={...base,architecture:[{id:'c',kind:'contract' as const,title:'旧契约',body:'自由文本',requirementIds:['r'],dependsOn:[]}]};
  assert.equal(validateProject(legacy).architecture.length,1);
  assert.throws(()=>editArchitecture(base,1,{kind:'save',item:{id:'m',kind:'module',title:'模块',body:'',requirementIds:['r'],dependsOn:[],contract:{surface:'x',inputs:[],outputs:[],errors:[],permissions:'',notApplicable:false}}}),/ARCHITECTURE_PAYLOAD_KIND/);
});

test('a task may only cite acceptance points of its own requirements',()=>{
  const base=editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r1',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:['可见'],mobileAcceptance:['可见']}});
  const two=editRequirements(base,1,{kind:'add',node:{id:'r2',parentId:null,title:'收藏',kind:'feature',description:'',priority:'normal',desktopAcceptance:['可收藏'],mobileAcceptance:[]}});
  const task={id:'t',kind:'task' as const,title:'查询任务',body:'',requirementIds:['r1'],dependsOn:[],task:{inputs:[],outputs:['src/q.ts'],acceptanceIds:['r2:desktop:1']}};
  assert.throws(()=>editArchitecture(two,2,{kind:'save',item:task}),/ACCEPTANCE_NOT_LINKED: t r2:desktop:1/);
  const ok=editArchitecture(two,2,{kind:'save',item:{...task,task:{...task.task,acceptanceIds:['r1:desktop:1']}}});
  assert.deepEqual(ok.architecture[0]?.task?.acceptanceIds,['r1:desktop:1']);
});

test('editing the text of a cited acceptance point is rejected instead of silently re-pointing',()=>{
  const base=editRequirements(createProject('p','产品'),0,{kind:'add',node:{id:'r',parentId:null,title:'查询',kind:'feature',description:'',priority:'normal',desktopAcceptance:['A','B','C'],mobileAcceptance:[]}});
  const withTask=editArchitecture(base,1,{kind:'save',item:{id:'t',kind:'task',title:'任务',body:'',requirementIds:['r'],dependsOn:[],task:{inputs:[],outputs:['src/q.ts'],acceptanceIds:['r:desktop:2']}}});
  assert.throws(()=>editRequirements(withTask,2,{kind:'details',id:'r',description:'',priority:'normal',desktopAcceptance:['A','C'],mobileAcceptance:[]}),/ACCEPTANCE_TEXT_CHANGED: t r:desktop:2/);
  const edit=editRequirements(withTask,2,{kind:'details',id:'r',description:'',priority:'normal',desktopAcceptance:['A','B','C','D'],mobileAcceptance:[]});
  assert.equal(edit.nodes[0]?.desktopAcceptance.length,4);
});
