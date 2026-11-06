import test from 'node:test';import assert from 'node:assert/strict';import {createProject} from '../../src/domain/project.js';import {beginResearchJob} from '../../src/domain/research-jobs.js';import {researchToolAllowed} from '../../src/host/research-policy.js';
test('research denies side effects and off-target reads even when tool name is supplied',()=>{
 const p=createProject('p','Research');p.references.push({id:'r',name:'web',sourceKind:'url',location:'https://example.com',origin:'manual',notes:'',license:''});
 const job=beginResearchJob(p,{id:'j',sessionId:'s',referenceId:'r',request:'inspect',allowedTools:['web_fetch','bash','read','mcp__rea__capture_browser_scenario']}).researchJob!;
 assert.equal(researchToolAllowed(job,'web_fetch',{url:'https://example.com'}),true);
 assert.equal(researchToolAllowed(job,'web_fetch',{url:'https://other.example'}),false);
 assert.equal(researchToolAllowed(job,'bash',{command:'anything'}),false);
 assert.equal(researchToolAllowed(job,'read',{file_path:'/etc/passwd'}),false);
 assert.equal(researchToolAllowed(job,'mcp__rea__capture_browser_scenario',{}),false);
 job.status='finished';assert.equal(researchToolAllowed(job,'web_fetch',{url:'https://example.com'}),false);
});
