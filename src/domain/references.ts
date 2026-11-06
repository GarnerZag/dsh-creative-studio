import {validateProject,ReferenceSchema,type Project,type ProductReference} from './project.js';
export type ReferenceEdit={kind:'save';reference:ProductReference}|{kind:'remove';id:string};
export function editReference(current:Project,edit:ReferenceEdit):Project{
 const project=validateProject(current);
 if(edit.kind==='save'){
  const reference=ReferenceSchema.parse(edit.reference),index=project.references.findIndex(r=>r.id===reference.id);
  if(index<0)project.references.push(reference);else project.references[index]=reference;
 }else{
  if(project.features.some(f=>f.referenceId===edit.id))throw new Error('REFERENCE_IN_USE');
  if(!project.references.some(r=>r.id===edit.id))throw new Error('REFERENCE_NOT_FOUND');
  project.references=project.references.filter(r=>r.id!==edit.id);
 }
 project.projectRevision++;
 return validateProject(project);
}
