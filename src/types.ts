/** Public, serializable contracts shared by the Host and Client. */
export interface ResearchEvidencePage {text:string;nextOffset:number|null;total:number}
export interface HandoffInfo { handoffId:string; projectId:string; versionId:string; ready:boolean; manifestDigest:string; archiveSha256:string; size:number }
export interface HandoffChunk {base64:string;nextOffset:number|null;total:number;packageId:string}
export interface HandoffIssue {code:string;id:string;message:string}
export interface HandoffReadinessResult {versionId:string;ready:boolean;blockers:HandoffIssue[];warnings:HandoffIssue[]}
export interface StudioHealth {
  status: 'connected';
  version: string;
}

export interface RequirementNode {
  id: string;
  parentId: string | null;
  title: string;
  kind: 'goal' | 'scenario' | 'feature';
  description: string;
  priority: 'low' | 'normal' | 'high';
  order?: number;
  dependsOn?: string[];
  desktopAcceptance: string[];
  mobileAcceptance: string[];
}
export interface ContractField { name: string; type: string; required: boolean; notes: string }
export interface ContractPayload {
  surface: string;
  inputs: ContractField[];
  outputs: ContractField[];
  errors: string[];
  permissions: string;
  notApplicable: boolean;
}
export interface TaskPayload { inputs: string[]; outputs: string[]; acceptanceIds: string[] }
export interface ArchitectureNode {
  id: string;
  kind: 'module' | 'contract' | 'decision' | 'task';
  title: string;
  body: string;
  requirementIds: string[];
  dependsOn: string[];
  contract?: ContractPayload;
  task?: TaskPayload;
}
export type ArchitectureChange = { kind: 'save'; item: ArchitectureNode } | { kind: 'remove'; id: string };
export interface ProjectHead {
  id: string;
  name: string;
  projectRevision: number;
  contentRevision: number;
}
export interface ApprovalReviewInput {baselineVersionId:string|null;selection?:Array<{collection:'nodes'|'architecture';id:string}>;acknowledgeUnverified:boolean}
export interface ApprovalRecord {baselineVersionId:string|null;operator:'owner';changes:Array<{collection:'nodes'|'architecture';id:string}>;sceneId:string|null;mappedRequirementIds:string[];uncoveredRequirementIds:string[];unverifiedAcceptanceIds:string[];acknowledged:boolean}
export interface ApprovedVersion {
  approval:ApprovalRecord|null;
  references:ProductReference[];features:FeatureNote[];
  taskPlanConfirmed:boolean;
   demo:DemoSceneData|null;
  id: string; label: string; createdAt: string; contentRevision: number;
  nodes: RequirementNode[]; architecture: ArchitectureNode[];
}
export interface ProductRecommendation {id:string;name:string;sourceKind:'url'|'repository';location:string;rationale:string;featureIdeas:string[]}
export interface ProposalInput {
  recommendations?:ProductRecommendation[];
  demo?:DemoSceneData;
  id: string; title: string; rationale: string; alternatives: string[]; assumptions: string[];
  baseContentRevision: number; nodes: RequirementNode[]; architecture: ArchitectureNode[];
}
export interface Proposal extends ProposalInput { status: 'pending' | 'adopted' | 'rejected' }
export interface ProductReference {id:string;name:string;sourceKind:'url'|'repository'|'host-file'|'saved-analysis';location:string;origin:'manual'|'recommended';notes:string;license:string}
export type ReferenceChange={kind:'save';reference:ProductReference}|{kind:'remove';id:string};
export interface FeatureNote {id:string;referenceId:string;name:string;description:string;requirementIds:string[];assessment:'unknown'|'inferred';implementation:string;adaptation:string;sourceLocator:string}
export type FeatureChange={kind:'save';feature:FeatureNote}|{kind:'remove';id:string};
export interface DemoSceneData {
 id:string;title:string;contentRevision:number;requirementIds:string[];state:Record<string,string|boolean>;
 components:({id:string;kind:'text';label:string}|{id:string;kind:'input';label:string;binding:string}|{id:string;kind:'button';label:string;actionId:string}|{id:string;kind:'list';label:string;binding:string;rows:string[]}|{id:string;kind:'notice';label:string;binding:string})[];
 actions:{id:string;changes:{key:string;value:string|boolean}[]}[];
 steps:({actionId:string}|{componentId:string;value:string})[];
}
export interface DevelopmentDispatchInfo {id:string;handoffId:string;versionId:string;workspaceId:string;relativeDirectory:string;sessionId:string;agentPreset:string;entryRelativePath:string;status:'preparing'|'copied'|'submitted'|'unknown'|'failed'}
export interface ImplementationReportInfo{id:string;dispatchId:string;handoffId:string;taskId:string;acceptanceIds:string[];summary:string;changedFiles:string[];testEvidence:string[];unfinished:string[];userAccepted:boolean}
export interface ResearchJobInfo {id:string;sessionId:string;reference:ProductReference;request:string;status:'queued'|'submitted'|'finished'|'failed'|'unknown';evidence:{callId:string;tool:string}[];conclusion:{summary:string;evidenceCallIds:string[];limitations:string[]}|null}
export interface ProjectSnapshot extends ProjectHead {
  researchJob:ResearchJobInfo|null;
  reports:ImplementationReportInfo[];
  dispatches:DevelopmentDispatchInfo[];
  demo:DemoSceneData|null;
  features:FeatureNote[];
  references:ProductReference[];
  proposalJob: {id:string;sessionId:string;request:string;baseContentRevision:number;status:'queued'|'submitted'|'finished'|'failed'|'unknown';nodes:RequirementNode[];architecture:ArchitectureNode[]}|null;
  proposals: Proposal[];
  versions: ApprovedVersion[];
  schemaVersion: 1;
  nodes: RequirementNode[];
  architecture: ArchitectureNode[];
}
export interface WorkspaceOption { id:string;title:string;path:string }
export type RequirementChange =
  | { kind: 'add'; node: RequirementNode }
  | { kind: 'rename'; id: string; title: string }
  | { kind: 'details'; id: string; description: string; priority: 'low' | 'normal' | 'high'; desktopAcceptance: string[]; mobileAcceptance: string[] }
  | { kind: 'move'; id: string; parentId: string | null }
  | { kind: 'dependencies'; id: string; dependsOn: string[] }
  | { kind: 'reorder'; id: string; beforeId: string | null }
  | { kind: 'restore'; nodes: RequirementNode[] }
  | { kind: 'remove'; id: string };

