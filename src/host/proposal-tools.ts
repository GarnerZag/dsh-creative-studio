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
import {BriefSchema,ProposalInputSchema} from '../domain/project.js';
import type {ProjectStore} from './store.js';
const Scope=z.object({projectId:z.string(),jobId:z.string()}).strict();
const Submit=Scope.extend({proposal:ProposalInputSchema});
const BriefInput=Scope.extend({brief:BriefSchema});
const output:ToolDefinition['output']={schema:{type:'object'},render:(_args,value)=>[{type:'text',text:JSON.stringify(value)}]};
export const demoCapabilities={
 version:1,
 components:{text:'Static label text.',input:'Edits its string state binding on every keystroke.',list:'Filters static rows immediately by the string state binding: case-insensitive substring match. Empty query shows all rows. Share the same binding with an input to implement live filtering; no derived state or action is needed.',button:'Runs actionId; changes update declared string/boolean state.',notice:'Visible when its boolean state binding is true; no automatic empty-result detection.'},
 playback:'steps can edit a named input or invoke an action; Play advances every 900 ms. Reset restores initial state.',
 limitations:['No scripts, network, persistence, navigation or backend.','Rows and labels are static. No computed conditions, dynamic row creation/deletion or automatic empty-state messages.','Only requirementIds actually demonstrated should be listed.'],
 filterExample:{state:{query:''},components:[{id:'filter',kind:'input',label:'Search',binding:'query'},{id:'items',kind:'list',label:'Bookmarks',binding:'query',rows:['Alpha','Beta']},{id:'clear',kind:'button',label:'Clear',actionId:'clear'}],actions:[{id:'clear',changes:[{key:'query',value:''}]}],steps:[{componentId:'filter',value:'alpha'},{actionId:'clear'}]}
};
export const proposalToolNames=['creative_studio_read','creative_studio_save_brief','creative_studio_save_proposal'];
export function proposalTools(store:ProjectStore):ToolDefinition[]{
 function scope(args:z.infer<typeof Scope>,sessionId:string|undefined){
  const project=store.get(args.projectId),job=project.proposalJob;
  if(!sessionId||!job||job.sessionId!==sessionId||job.id!==args.jobId)throw new Error('JOB_SCOPE_MISMATCH');
  return job;
 }
 return [{name:proposalToolNames[0]!,description:'读取当前需求推导作业的冻结需求、架构、原始输入与本作业已提交的理解；返回 Demo 支持的交互语义和过滤示例；不会读取其他项目。',parameters:z.toJSONSchema(Scope),output,
 execute:async(raw,exec)=>{exec.signal.throwIfAborted();const args=Scope.parse(raw),job=scope(args,exec.agent?.id);return {jobId:job.id,baseContentRevision:job.baseContentRevision,request:job.request,brief:job.brief,nodes:job.nodes,architecture:job.architecture,demoCapabilities};}},
 {name:proposalToolNames[1]!,description:'先提交你对用户输入的结构化理解（复述、意图判定、目标用户、场景、约束、未知项、待确认问题、所需材料）。必须在提交候选方案之前调用；intent 判定为 operation（对插件本身的操作指令，例如读取另一个会话）或 unclear 时不得提交候选需求。',parameters:z.toJSONSchema(BriefInput),output,
 execute:async(raw,exec)=>{exec.signal.throwIfAborted();const args=BriefInput.parse(raw);const sessionId=exec.agent?.id;if(!sessionId)throw new Error('JOB_SCOPE_MISMATCH');await store.submitJobBrief(args.projectId,sessionId,args.jobId,args.brief);return {jobId:args.jobId,intent:args.brief.intent,questions:args.brief.questions.length};}},
 {name:proposalToolNames[2]!,description:'提交完整候选需求与架构及理由/假设/备选。只保存候选，不采纳、不审批；必须先提交 intent 为 product 的理解，且必须使用原作业版本。',parameters:z.toJSONSchema(Submit),output,
 execute:async(raw,exec)=>{exec.signal.throwIfAborted();const args=Submit.parse(raw);scope(args,exec.agent?.id);await store.submitJobProposal(args.projectId,exec.agent!.id,args.jobId,args.proposal);return {proposalId:args.proposal.id,status:'pending'};}}];
}
/** Applies only to dedicated proposal sessions; other Harness sessions are untouched. */
export function proposalGuard(store:ProjectStore):ToolGuard{return exec=>{
 const sessionId=exec.agent?.id;if(!sessionId)return;
 const bound=store.list().some(p=>{const project=store.get(p.id);return project.proposalSessions.includes(sessionId)||project.proposalJob?.sessionId===sessionId;});
 return bound&&!proposalToolNames.includes(exec.name)?'需求推导会话仅可读取冻结内容、提交理解与候选，不可执行开发或审批。':undefined;
};}
