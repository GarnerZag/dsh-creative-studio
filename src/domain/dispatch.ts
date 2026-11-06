import {validateProject,type Project,type DevelopmentDispatch} from './project.js';
/** Caller validates approved package readiness and user authority before admission. */
export function beginDispatch(current:Project,input:Omit<DevelopmentDispatch,'status'>):Project{
 const p=validateProject(current);
 if(p.dispatches.some(d=>d.id===input.id||(d.handoffId===input.handoffId&&d.workspaceId===input.workspaceId&&d.relativeDirectory===input.relativeDirectory)))throw new Error('DISPATCH_EXISTS');
 p.dispatches.push({...input,status:'preparing'});p.projectRevision++;return validateProject(p);
}
export function advanceDispatch(current:Project,id:string,status:DevelopmentDispatch['status'],entryRelativePath?:string):Project{
 const p=validateProject(current),d=p.dispatches.find(d=>d.id===id);if(!d)throw new Error('DISPATCH_NOT_FOUND');
 const allowed:Record<DevelopmentDispatch['status'],DevelopmentDispatch['status'][]>= {preparing:['copied','unknown','failed'],copied:['submitted','unknown','failed'],submitted:[],unknown:[],failed:[]};
 if(d.status===status)return p;
 if(!allowed[d.status].includes(status))throw new Error('INVALID_DISPATCH_TRANSITION');
 if(status==='copied'&&!entryRelativePath)throw new Error('ENTRY_PATH_REQUIRED');
 d.status=status;if(entryRelativePath!==undefined)d.entryRelativePath=entryRelativePath;p.projectRevision++;return validateProject(p);
}
