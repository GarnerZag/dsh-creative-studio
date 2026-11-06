import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../../src/domain/project.js';
import {editReference} from '../../src/domain/references.js';
import {saveFeatureNote} from '../../src/domain/research.js';
test('reference feature notes preserve uncertainty and reject missing sources',()=>{
 const p=editReference(createProject('p','产品'),{kind:'save',reference:{id:'r',name:'产品',sourceKind:'url',location:'https://example.com',origin:'manual',notes:'',license:'unknown'}});
 const feature={id:'f',referenceId:'r',name:'过滤器',description:'候选能力',requirementIds:[],assessment:'unknown' as const,implementation:'未知',adaptation:'研究后确定',sourceLocator:'https://example.com/help'};
 const next=saveFeatureNote(p,feature);assert.equal(next.features[0]?.assessment,'unknown');assert.equal(next.contentRevision,0);
 assert.throws(()=>saveFeatureNote(p,{...feature,referenceId:'missing'}),/REFERENCE_NOT_FOUND/);
 assert.throws(()=>saveFeatureNote(p,{...feature,requirementIds:['missing']}),/REQUIREMENT_NOT_FOUND/);
 assert.throws(()=>saveFeatureNote(p,{...feature,assessment:'observed'} as never));
 assert.throws(()=>editReference(next,{kind:'remove',id:'r'}),/REFERENCE_IN_USE/);
});
