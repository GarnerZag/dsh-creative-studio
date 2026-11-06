import test from 'node:test';
import assert from 'node:assert/strict';
import {captureResearchResult} from '../../src/host/research-evidence.js';
test('research evidence accepts only scoped actual successful tool results, preserving unknowns',()=>{
 const scope={sessionId:'research',allowedTools:['mcp__rea__inspect_analysis_view']};
 const exec={agent:{id:'research'},callId:'call1',name:scope.allowedTools[0]!};
 const value={coverage:'partial',limitations:['static only'],normalized_result:{error:'unsupported'}};
 const result=captureResearchResult(scope,exec,{isError:false,value})!;
 assert.deepEqual(result.value,value);assert.equal(result.authority,'tool-result');assert.equal(result.interpretation,'untrusted');
 value.coverage='changed';assert.equal((result.value as {coverage:string}).coverage,'partial');
 assert.equal(captureResearchResult(scope,{...exec,agent:{id:'other'}},{isError:false,value}),null);
 assert.equal(captureResearchResult(scope,{...exec,name:'bash'},{isError:false,value}),null);
 assert.equal(captureResearchResult(scope,exec,{isError:true,value}),null);
 assert.equal(captureResearchResult(scope,{...exec,agent:undefined},{isError:false,value}),null);
});
