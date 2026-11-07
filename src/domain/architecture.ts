import { ArchitectureItemSchema, validateProject, type ArchitectureItem, type Project } from './project.js';

export type ArchitectureEdit = { kind: 'save'; item: ArchitectureItem } | { kind: 'remove'; id: string };

/** New saves must be structured; historical items stay loadable through validateContent. */
function requireStructure(item: ArchitectureItem): void {
  if (item.kind === 'contract') {
    const contract = item.contract;
    if (!contract || (!contract.notApplicable && !contract.surface.trim())) throw new Error('CONTRACT_STRUCTURE_REQUIRED');
  }
  if (item.kind === 'task') {
    const task = item.task;
    if (!task || task.outputs.length === 0 || task.acceptanceIds.length === 0) throw new Error('TASK_STRUCTURE_REQUIRED');
  }
}

export function editArchitecture(current: Project, expectedContentRevision: number, edit: ArchitectureEdit): Project {
  if (current.contentRevision !== expectedContentRevision) throw new Error('CONFLICT');
  const project = validateProject(current);
  if (edit.kind === 'save') {
    const item = ArchitectureItemSchema.parse(edit.item);
    requireStructure(item);
    const index = project.architecture.findIndex(existing => existing.id === item.id);
    if (index < 0) project.architecture.push(item); else project.architecture[index] = item;
  } else {
    if (!project.architecture.some(item => item.id === edit.id)) throw new Error('ARCHITECTURE_NOT_FOUND');
    project.architecture = project.architecture.filter(item => item.id !== edit.id);
  }
  project.projectRevision++;
  project.contentRevision++;
  return validateProject(project);
}
