import {z} from 'zod';
// Narrow structural contract for the public tools API. Keeping SDK ambient
// resource augmentations out of this Remote compiler face avoids pulling in
// unrelated Session resource schemas; these signatures match tools Inspect.
interface ToolExecution {name:string;agent?:{id:string};signal:AbortSignal}
interface ToolDefinition {name:string;description:string;parameters:Record<string,unknown>;output:{schema:Record<string,unknown>;render(args:unknown,value:unknown):{type:'text';text:string}[]};execute(args:unknown,exec:ToolExecution):Promise<unknown>}
type ToolGuard=(exec:ToolExecution)=>string|undefined;
export interface ProposalToolRegistry {
 register(definition:ToolDefinition,options:{when:(input:{agent:{id:string}})=>boolean}):()=>void;
 guard(guard:ToolGuard):()=>void;
}
import {ProposalInputSchema} from '../domain/project.js';
import type {ProjectStore} from './store.js';
const Scope=z.object({projectId:z.string(),jobId:z.string()}).strict();
const Submit=Scope.extend({proposal:ProposalInputSchema});
const output:ToolDefinition['output']={schema:{type:'object'},render:(_args,value)=>[{type:'text',text:JSON.stringify(value)}]};
export const proposalToolNames=['creative_studio_read','creative_studio_save_proposal'];
export function proposalTools(store:ProjectStore):ToolDefinition[]{
 function scope(args:z.infer<typeof Scope>,sessionId:string|undefined){
  const project=store.get(args.projectId),job=project.proposalJob;
  if(!sessionId||!job||job.sessionId!==sessionId||job.id!==args.jobId)throw new Error('JOB_SCOPE_MISMATCH');
  return job;
 }
 return [{name:proposalToolNames[0]!,description:'读取当前需求推导作业冻结的需求与架构，返回原始版本；不会读取其他项目。',parameters:z.toJSONSchema(Scope),output,
 execute:async(raw,exec)=>{exec.signal.throwIfAborted();const args=Scope.parse(raw),job=scope(args,exec.agent?.id);return {jobId:job.id,baseContentRevision:job.baseContentRevision,request:job.request,nodes:job.nodes,architecture:job.architecture};}},
 {name:proposalToolNames[1]!,description:'提交完整候选需求与架构及理由/假设/备选。只保存候选，不采纳、不审批；必须使用原作业版本。',parameters:z.toJSONSchema(Submit),output,
 execute:async(raw,exec)=>{exec.signal.throwIfAborted();const args=Submit.parse(raw);scope(args,exec.agent?.id);await store.submitJobProposal(args.projectId,exec.agent!.id,args.jobId,args.proposal);return {proposalId:args.proposal.id,status:'pending'};}}];
}
/** Applies only to dedicated proposal sessions; other Harness sessions are untouched. */
export function proposalGuard(store:ProjectStore):ToolGuard{return exec=>{
 const sessionId=exec.agent?.id;if(!sessionId)return;
 const bound=store.list().some(p=>{const project=store.get(p.id);return project.proposalSessions.includes(sessionId)||project.proposalJob?.sessionId===sessionId;});
 return bound&&!proposalToolNames.includes(exec.name)?'需求推导会话仅可读取冻结内容并提交候选，不可执行开发或审批。':undefined;
};}
