import { ArchitectureItemSchema, validateProject, type ArchitectureItem, type Project } from './project.js';

export type ArchitectureEdit = { kind: 'save'; item: ArchitectureItem } | { kind: 'remove'; id: string };

export function editArchitecture(current: Project, expectedContentRevision: number, edit: ArchitectureEdit): Project {
  if (current.contentRevision !== expectedContentRevision) throw new Error('CONFLICT');
  const project = validateProject(current);
  if (edit.kind === 'save') {
    const item = ArchitectureItemSchema.parse(edit.item);
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
