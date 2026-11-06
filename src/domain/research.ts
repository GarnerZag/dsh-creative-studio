import {FeatureNoteSchema,validateProject,type Project,type FeatureNote} from './project.js';
/** Notes are analyst inference/unknown, never automatically promoted to observed evidence. */
export function saveFeatureNote(current:Project,input:FeatureNote):Project{
 const project=validateProject(current),feature=FeatureNoteSchema.parse(input);
 const index=project.features.findIndex(f=>f.id===feature.id);
 if(index<0)project.features.push(feature);else project.features[index]=feature;
 project.projectRevision++;
 return validateProject(project);
}
export function removeFeatureNote(current:Project,id:string):Project{
 const project=validateProject(current);
 if(!project.features.some(f=>f.id===id))throw new Error('FEATURE_NOT_FOUND');
 project.features=project.features.filter(f=>f.id!==id);project.projectRevision++;
 return validateProject(project);
}
