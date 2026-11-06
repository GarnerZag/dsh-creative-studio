import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,editRequirements} from '../../src/domain/project.js';
import {saveDemo} from '../../src/domain/demos.js';
import {approveVersion} from '../../src/domain/versions.js';
const scene={id:'d',title:'Demo',contentRevision:0,requirementIds:[],state:{},components:[],actions:[],steps:[]};
test('demo save persists without changing requirement revision and freezes with approval',()=>{const p=createProject('p','P');const next=saveDemo(p,0,scene);assert.equal(next.contentRevision,0);assert.equal(next.projectRevision,1);assert.equal(p.demo,null);const approved=approveVersion(next,0,'v','v','2026-11-07T00:00:00Z');assert.equal(approved.versions[0]?.demo?.id,'d');next.demo!.title='changed';assert.equal(approved.versions[0]?.demo?.title,'Demo');});
test('stale demos cannot be saved against newer draft, and invalid replacement preserves last scene',()=>{const p=saveDemo(createProject('p','P'),0,scene);assert.throws(()=>saveDemo(p,1,scene),/CONFLICT/);assert.throws(()=>saveDemo(p,0,{...scene,requirementIds:['missing']}),/REQUIREMENT_NOT_FOUND/);const newer=editRequirements(p,0,{kind:'add',node:{id:'r',parentId:null,title:'R',kind:'feature',description:'',priority:'normal',desktopAcceptance:[],mobileAcceptance:[]}});assert.equal(newer.demo?.contentRevision,0);assert.throws(()=>saveDemo(newer,1,scene),/STALE_DEMO/);assert.equal(approveVersion(newer,1,'v','v','2026-11-07T00:00:00Z').versions[0]?.demo,null);});
