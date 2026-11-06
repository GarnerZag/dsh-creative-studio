import {validateScene} from './demo.js';
import {validateProject,type Project} from './project.js';
export function saveDemo(current:Project,expectedContentRevision:number,input:unknown):Project{
 if(current.contentRevision!==expectedContentRevision)throw new Error('CONFLICT');
 const scene=validateScene(input);if(scene.contentRevision!==current.contentRevision)throw new Error('STALE_DEMO');
 if(scene.requirementIds.some(id=>!current.nodes.some(n=>n.id===id)))throw new Error('REQUIREMENT_NOT_FOUND');
 const project=validateProject(current);project.demo=scene;project.projectRevision++;return validateProject(project);
}
