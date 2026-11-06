/** Only owner-authorized Remote callers may set acceptance, never the report tool. */
export function setReportAcceptance(current:Project,reportId:string,accepted:boolean):Project{
 const project=validateProject(current),report=project.reports.find(r=>r.id===reportId);
 if(!report)throw new Error('REPORT_NOT_FOUND');
 if(report.userAccepted===accepted)return project;
 report.userAccepted=accepted;project.projectRevision++;return validateProject(project);
}
import {ReportInputSchema,validateProject,type Project} from './project.js';
/** Session is supplied by actual tool execution, never by the model input. Evidence is self-reported. */
export function submitReport(current:Project,sessionId:string,input:unknown):Project{
 const project=validateProject(current),report=ReportInputSchema.parse(input);
 const dispatch=project.dispatches.find(d=>d.id===report.dispatchId&&d.handoffId===report.handoffId);
 if(!dispatch||dispatch.sessionId!==sessionId)throw new Error('SESSION_SCOPE');
 if(!['copied','submitted','unknown'].includes(dispatch.status))throw new Error('DISPATCH_NOT_STARTED');
 project.reports.push({...report,userAccepted:false});project.projectRevision++;
 return validateProject(project);
}
