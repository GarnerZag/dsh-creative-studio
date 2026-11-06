// Called only from the Host tools/result event, never from an agent-supplied claim.
export interface ResearchCaptureScope {sessionId:string; allowedTools:readonly string[]}
export interface CapturedResearchResult {callId:string;tool:string;value:unknown;authority:'tool-result';interpretation:'untrusted'}
export function captureResearchResult(scope:ResearchCaptureScope,exec:{agent?:{id:string};callId:string;name:string},result:{isError:boolean;value?:unknown}):CapturedResearchResult|null {
 if(exec.agent?.id!==scope.sessionId || !scope.allowedTools.includes(exec.name) || result.isError || result.value===undefined) return null;
 // This proves a tool returned these bytes, not that every feature assertion is true.
 // REA coverage, limitations and nested failure states stay intact in the original value.
 return {callId:exec.callId,tool:exec.name,value:structuredClone(result.value),authority:'tool-result',interpretation:'untrusted'};
}
