import test from 'node:test';import assert from 'node:assert/strict';import {requirementsMarkdown,type ExportLabels} from '../../src/client/requirements-export.js';import type {RequirementNode} from '../../src/types.js';
const labels:ExportLabels={root:'Requirement outline',priorityHigh:'do first',priorityLow:'later',acceptance:'Acceptance',depends:'Depends on',desktop:'desktop',mobile:'mobile',empty:'No requirements yet.'};
const node=(patch:Partial<RequirementNode>&{id:string;title:string}):RequirementNode=>({parentId:null,kind:'feature',description:'',priority:'normal',desktopAcceptance:[],mobileAcceptance:[],...patch});
test('renders nesting, priority, acceptance and dependency titles in order',()=>{
  const nodes=[
    node({id:'child',parentId:'root',title:'Child',priority:'high',desktopAcceptance:['shows a list'],mobileAcceptance:['swipe'],dependsOn:['other'],order:0}),
    node({id:'root',title:'Root',kind:'goal',description:'Why we build this',order:0}),
    node({id:'other',title:'Other',priority:'low',order:1}),
  ];
  const out=requirementsMarkdown('Demo',nodes,labels);
  const lines=out.split('\n');
  assert.equal(lines[0],'# Demo');
  assert.ok(out.includes('Requirement outline'));
  assert.ok(out.includes('- **Root** _()_')===false);
  assert.ok(out.includes('- **Root**'));
  assert.ok(out.includes('  Why we build this'));
  assert.ok(out.includes('  - **Child** _(do first)_'));
  assert.ok(out.includes('    Acceptance desktop: shows a list; mobile: swipe'));
  assert.ok(out.includes('    Depends on Other'));
  assert.ok(out.indexOf('- **Root**')<out.indexOf('  - **Child**'));
  assert.ok(out.includes('- **Other** _(later)_'));
});
test('explains an empty project and still lists orphans',()=>{
  assert.equal(requirementsMarkdown('Empty',[],labels),'No requirements yet.\n');
  const orphan=node({id:'lost',parentId:'missing',title:'Lost'});
  assert.ok(requirementsMarkdown('P',[orphan],labels).includes('- **Lost**'));
});
