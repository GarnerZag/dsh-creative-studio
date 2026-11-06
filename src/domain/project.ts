import { z } from 'zod';
import {SceneSchema,validateScene} from './demo.js';

const id = z.string().min(1);
export const RequirementSchema = z.object({
  id, parentId: id.nullable(), title: z.string().trim().min(1),
  kind: z.enum(['goal', 'scenario', 'feature']), description: z.string(),
  priority: z.enum(['low', 'normal', 'high']),
  desktopAcceptance: z.array(z.string()), mobileAcceptance: z.array(z.string()),
}).strict();
export type Requirement = z.infer<typeof RequirementSchema>;
export const ArchitectureItemSchema = z.object({
  id, kind: z.enum(['module', 'contract', 'decision', 'task']), title: z.string().trim().min(1),
  body: z.string(), requirementIds: z.array(id), dependsOn: z.array(id),
}).strict();
export type ArchitectureItem = z.infer<typeof ArchitectureItemSchema>;
export const ProposalInputSchema = z.object({
  demo:SceneSchema.optional(),
  id, title: z.string().trim().min(1), rationale: z.string(), alternatives: z.array(z.string()), assumptions: z.array(z.string()),
  baseContentRevision: z.number().int().nonnegative(), nodes: z.array(RequirementSchema), architecture: z.array(ArchitectureItemSchema),
}).strict();
export const ProposalSchema = ProposalInputSchema.extend({status:z.enum(['pending','adopted','rejected'])});
export type ProposalInput = z.infer<typeof ProposalInputSchema>;
export const ProposalJobSchema = z.object({
  id, sessionId:id, request:z.string().trim().min(1), baseContentRevision:z.number().int().nonnegative(),
  nodes:z.array(RequirementSchema), architecture:z.array(ArchitectureItemSchema),
  status:z.enum(['queued','submitted','finished','failed','unknown']),
}).strict();
export const ReferenceSchema=z.object({
 id,name:z.string().trim().min(1),sourceKind:z.enum(['url','repository','host-file','saved-analysis']),location:z.string().trim().min(1),origin:z.enum(['manual','recommended']),notes:z.string(),license:z.string(),
}).strict().superRefine((r,ctx)=>{if(r.sourceKind==='url'||r.sourceKind==='repository'){try{const url=new URL(r.location);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error();}catch{ctx.addIssue({code:'custom',message:'HTTP_SOURCE_REQUIRED'});}}});
export type ProductReference=z.infer<typeof ReferenceSchema>;
// Analyst notes cannot claim runtime observation; verified tool evidence is separate.
export const FeatureNoteSchema=z.object({id,referenceId:id,name:z.string().trim().min(1),description:z.string(),requirementIds:z.array(id),assessment:z.enum(['unknown','inferred']),implementation:z.string(),adaptation:z.string(),sourceLocator:z.string()}).strict();
export type FeatureNote=z.infer<typeof FeatureNoteSchema>;
export const VersionSchema = z.object({
  references:z.array(ReferenceSchema).default([]),features:z.array(FeatureNoteSchema).default([]),
  taskPlanConfirmed:z.boolean().default(false),demo:SceneSchema.nullable().default(null),
  id,label:z.string().trim().min(1),createdAt:z.iso.datetime(),contentRevision:z.number().int().nonnegative(),
  nodes:z.array(RequirementSchema),architecture:z.array(ArchitectureItemSchema),
}).strict();
export type ProjectVersion=z.infer<typeof VersionSchema>;
export const DispatchSchema=z.object({id,handoffId:id,versionId:id,workspaceId:id,relativeDirectory:z.string().min(1),sessionId:id,agentPreset:z.string(),entryRelativePath:z.string(),status:z.enum(['preparing','copied','submitted','unknown','failed'])}).strict();
export type DevelopmentDispatch=z.infer<typeof DispatchSchema>;
export const ReportInputSchema=z.object({id,dispatchId:id,handoffId:id,taskId:id,acceptanceIds:z.array(id),summary:z.string().trim().min(1),changedFiles:z.array(z.string()),testEvidence:z.array(z.string().trim().min(1)),unfinished:z.array(z.string())}).strict();
export const ReportSchema=ReportInputSchema.extend({userAccepted:z.boolean()}).strict();
export const ResearchConclusionSchema=z.object({summary:z.string().trim().min(1),evidenceCallIds:z.array(id),limitations:z.array(z.string())}).strict();
export const ResearchJobSchema=z.object({conclusion:ResearchConclusionSchema.nullable().default(null),id,sessionId:id,reference:ReferenceSchema,request:z.string().trim().min(1),allowedTools:z.array(id),status:z.enum(['queued','submitted','finished','failed','unknown']),evidence:z.array(z.object({callId:id,tool:id,value:z.json(),authority:z.literal('tool-result'),interpretation:z.literal('untrusted')}).strict())}).strict();
export const ProjectSchema = z.object({
  researchJob:ResearchJobSchema.nullable().default(null),
  researchSessions:z.array(id).default([]),
  reports:z.array(ReportSchema).default([]),
  dispatches:z.array(DispatchSchema).default([]),
  demo:SceneSchema.nullable().default(null),
  schemaVersion: z.literal(1), id, name: z.string().trim().min(1),
  projectRevision: z.number().int().nonnegative(), contentRevision: z.number().int().nonnegative(),
  nodes: z.array(RequirementSchema),
  architecture: z.array(ArchitectureItemSchema).default([]),
  versions: z.array(VersionSchema).default([]),
  proposals: z.array(ProposalSchema).default([]),
  proposalJob: ProposalJobSchema.nullable().default(null),
  proposalSessions: z.array(id).default([]),
  references:z.array(ReferenceSchema).default([]),
  features:z.array(FeatureNoteSchema).default([]),
}).strict();
export type Project = z.infer<typeof ProjectSchema>;
export type RequirementEdit =
  | { kind: 'add'; node: Requirement }
  | { kind: 'rename'; id: string; title: string }
  | { kind: 'details'; id: string; description: string; priority: Requirement['priority']; desktopAcceptance: string[]; mobileAcceptance: string[] }
  | { kind: 'move'; id: string; parentId: string | null }
  | { kind: 'remove'; id: string };

/** Parses every write; callers must compare revisions within their storage queue. */
export function validateProject(value: unknown): Project {
  const project = ProjectSchema.parse(value);
  validateContent(project);
  const dispatchIds=new Set<string>();
  for(const d of project.dispatches){if(dispatchIds.has(d.id))throw new Error('DUPLICATE_DISPATCH');dispatchIds.add(d.id);if(!project.versions.some(v=>v.id===d.versionId))throw new Error('VERSION_NOT_FOUND');}
  const reportIds=new Set<string>();
  for(const report of project.reports){
    if(reportIds.has(report.id))throw new Error('REPORT_EXISTS');reportIds.add(report.id);
    const dispatch=project.dispatches.find(d=>d.id===report.dispatchId&&d.handoffId===report.handoffId);if(!dispatch)throw new Error('DISPATCH_NOT_FOUND');
    const version=project.versions.find(v=>v.id===dispatch.versionId)!;
    if(!version.architecture.some(a=>a.id===report.taskId&&a.kind==='task'))throw new Error('TASK_NOT_FOUND');
    const acceptance=new Set(version.nodes.flatMap(n=>['desktop','mobile'].flatMap(platform=>(platform==='desktop'?n.desktopAcceptance:n.mobileAcceptance).map((_,i)=>`${n.id}:${platform}:${i+1}`))));
    if(report.acceptanceIds.some(id=>!acceptance.has(id)))throw new Error('ACCEPTANCE_NOT_FOUND');
  }
  if(project.demo){validateScene(project.demo);if(project.demo.contentRevision>project.contentRevision)throw new Error('FUTURE_DEMO');}
  if(new Set(project.references.map(r=>r.id)).size!==project.references.length)throw new Error('DUPLICATE_REFERENCE');
  const featureIds=new Set<string>();
  for(const feature of project.features){
    if(featureIds.has(feature.id))throw new Error('DUPLICATE_FEATURE');featureIds.add(feature.id);
    if(!project.references.some(r=>r.id===feature.referenceId))throw new Error('REFERENCE_NOT_FOUND');
    if(feature.requirementIds.some(id=>!project.nodes.some(n=>n.id===id)))throw new Error('REQUIREMENT_NOT_FOUND');
  }
  const proposals = new Set<string>();
  for(const proposal of project.proposals) {
    if(proposals.has(proposal.id)) throw new Error('DUPLICATE_PROPOSAL_ID');
    proposals.add(proposal.id);
    validateContent(proposal);
    if(proposal.demo){validateScene(proposal.demo);if(proposal.demo.contentRevision!==proposal.baseContentRevision)throw new Error('DEMO_REVISION');if(proposal.demo.requirementIds.some(id=>!proposal.nodes.some(n=>n.id===id)))throw new Error('DEMO_REQUIREMENT_NOT_FOUND');}
  }
  const versions = new Set<string>();
  for (const version of project.versions) {
    if (versions.has(version.id)) throw new Error('DUPLICATE_VERSION_ID');
    versions.add(version.id);
    validateContent(version);
    if(new Set(version.references.map(r=>r.id)).size!==version.references.length||new Set(version.features.map(f=>f.id)).size!==version.features.length)throw new Error('DUPLICATE_FROZEN_REFERENCE');
    for(const feature of version.features){if(!version.references.some(r=>r.id===feature.referenceId)||feature.requirementIds.some(id=>!version.nodes.some(n=>n.id===id)))throw new Error('FROZEN_REFERENCE_SCOPE');}
  }
  return project;
}
export function validateContent(project: Pick<Project, 'nodes' | 'architecture'>): void {
  const nodes = new Map(project.nodes.map(node => [node.id, node]));
  if (nodes.size !== project.nodes.length) throw new Error('DUPLICATE_ID');
  for (const node of project.nodes) {
    const visited = new Set<string>([node.id]);
    let parent = node.parentId;
    while (parent !== null) {
      if (visited.has(parent)) throw new Error('CYCLE');
      visited.add(parent);
      const ancestor = nodes.get(parent);
      if (!ancestor) throw new Error('PARENT_NOT_FOUND');
      parent = ancestor.parentId;
    }
  }
  const items = new Map(project.architecture.map(item => [item.id, item]));
  if (items.size !== project.architecture.length) throw new Error('DUPLICATE_ARCHITECTURE_ID');
  const done = new Set<string>();
  const visit = (itemId: string, path: Set<string>) => {
    if (path.has(itemId)) throw new Error('ARCHITECTURE_CYCLE');
    if (done.has(itemId)) return;
    const item = items.get(itemId);
    if (!item) throw new Error('ARCHITECTURE_DEPENDENCY_NOT_FOUND');
    for (const requirement of item.requirementIds) if (!nodes.has(requirement)) throw new Error('REQUIREMENT_NOT_FOUND');
    const nextPath = new Set(path); nextPath.add(itemId);
    for (const dependency of item.dependsOn) visit(dependency, nextPath);
    done.add(itemId);
  };
  for (const item of project.architecture) visit(item.id, new Set());
}

export function createProject(projectId: string, name: string): Project {
  return validateProject({ schemaVersion: 1, id: projectId, name, projectRevision: 0, contentRevision: 0, nodes: [] });
}

/** Pure editing: failures never mutate the prior project or caller input. */
export function editRequirements(current: Project, expectedContentRevision: number, edit: RequirementEdit): Project {
  if (current.contentRevision !== expectedContentRevision) throw new Error('CONFLICT');
  const project = validateProject(current);
  const node = edit.kind === 'add' ? undefined : project.nodes.find(item => item.id === edit.id);
  if (edit.kind !== 'add' && !node) throw new Error('NODE_NOT_FOUND');
  switch (edit.kind) {
    case 'add': project.nodes.push(RequirementSchema.parse(edit.node)); break;
    case 'rename': node!.title = edit.title; break;
    case 'details':
      Object.assign(node!, { description: edit.description, priority: edit.priority, desktopAcceptance: [...edit.desktopAcceptance], mobileAcceptance: [...edit.mobileAcceptance] });
      break;
    case 'move': node!.parentId = edit.parentId; break;
    case 'remove': {
      const removed = new Set([edit.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const item of project.nodes) {
          if (item.parentId !== null && removed.has(item.parentId) && !removed.has(item.id)) {
            removed.add(item.id); changed = true;
          }
        }
      }
      project.nodes = project.nodes.filter(item => !removed.has(item.id));
      break;
    }
  }
  project.projectRevision++;
  project.contentRevision++;
  return validateProject(project);
}
