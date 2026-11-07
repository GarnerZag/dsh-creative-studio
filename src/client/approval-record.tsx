import * as React from 'react';
import type {ApprovalRecord} from '../types.js';
export function ApprovalReceipt({record,t}:{record:ApprovalRecord|null;t:(key:string)=>string}):React.ReactElement{
 return <details><summary>{t('approvalReceipt')}</summary>{record?<>
 <p>{t('approvalBaseline')}: {record.baselineVersionId??t('emptyBaseline')}</p>
 <p>{t('differences')}: {record.changes.length}</p><ul>{record.changes.map(c=><li key={`${c.collection}:${c.id}`}>{c.collection} · {c.id}</li>)}</ul>
 <p>{t('demoMapped')}: {record.mappedRequirementIds.join(', ')||'—'}</p>
 <p>{t('demoUncovered')}: {record.uncoveredRequirementIds.join(', ')||'—'}</p>
 <p>{t('unverifiedAcceptance')}: {record.unverifiedAcceptanceIds.length}</p><ul>{record.unverifiedAcceptanceIds.map(id=><li key={id}>{id}</li>)}</ul>
 <p>{record.acknowledged?t('limitationsAcknowledged'):t('limitationsNotAcknowledged')}</p>
 <p>{t('approvalCoverageNotice')}</p>
 </>:<p>{t('legacyApprovalReceipt')}</p>}</details>;
}
