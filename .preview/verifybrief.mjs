// End-to-end check for the "understand before proposing" flow.
// Run from the package root after restarting `dsh web`:
//   node .preview/verifybrief.mjs
// It creates a throwaway project, runs one real generation, then reports what the
// session understood, whether requirements were invented, and whether a user
// correction plus answers turns it into a product proposal. Cleanup deletes the project.
import {chromium} from 'playwright-core';

const request = process.argv[2] ?? '读取另一个会话里进行到一半的开发工作，把已经做完的部分接上';
const answer = process.argv[3] ?? '那个会话的结论是：搜索栏需要支持按标签过滤，已完成一半。请据此继续。';
const keep = process.argv.includes('--keep');

const context = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', {headless: true});
const page = context.pages()[0] ?? await context.newPage();
await page.goto('http://192.168.31.188:3080/', {waitUntil: 'domcontentloaded', timeout: 30000});
await page.waitForTimeout(2000);

const call = (method, args) => page.evaluate(async ({method, args}) => {
  const rpcId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
  const response = await fetch('/api/' + method, {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({type: 'client-request', rpcId, method, payload: {args}}),
  });
  const text = await response.text();
  try { return {status: response.status, body: JSON.parse(text)}; }
  catch { return {status: response.status, body: {parseError: text.slice(0, 300)}}; }
}, {method, args});

const unwrap = result => {
  const value = result.body?.result;
  if (!value) throw new Error(JSON.stringify(result.body).slice(0, 400));
  if (!value.ok) throw new Error(value.error?.message ?? JSON.stringify(value).slice(0, 400));
  return value.value;
};
const sleep = ms => new Promise(done => setTimeout(done, ms));

const created = unwrap(await call('creativeStudio/createProject', {name: `Brief flow check ${new Date().toISOString()}`}));
const id = created.id;
const workspaces = unwrap(await call('creativeStudio/listWorkspaces', {}));
const workspaceId = workspaces[0]?.id;
console.log('project', id, 'workspace', workspaceId ?? 'NONE');
if (!workspaceId) { console.log('FAIL no Harness workspace'); process.exit(1); }

const settle = async (predicate, budgetMs = 180000) => {
  const started = Date.now();
  while (Date.now() - started < budgetMs) {
    const project = unwrap(await call('creativeStudio/getProject', {id}));
    const outcome = predicate(project);
    if (outcome) return {project, outcome};
    await sleep(4000);
  }
  return null;
};

const report = {request, brief: null, inventedRequirements: null, editApplied: false, continued: null, afterConfirm: null};
try {
  unwrap(await call('creativeStudio/generateProposal', {id, expectedProjectRevision: created.projectRevision, request, workspaceId}));
  const first = await settle(project => project.proposalJob?.brief ? project : null);
  if (!first) throw new Error('no brief within 180s');
  const job = first.project.proposalJob;
  report.brief = {intent: job.brief.intent, restated: job.brief.restated, questions: job.brief.questions, needs: job.brief.needs};
  report.inventedRequirements = first.project.proposals.length;
  console.log('BRIEF', JSON.stringify(report.brief, null, 1));
  console.log('PROPOSALS_AFTER_BRIEF', report.inventedRequirements, '(0 means no requirement was invented)');

  const corrected = unwrap(await call('creativeStudio/editProposalBrief', {
    id, expectedProjectRevision: first.project.projectRevision, jobId: job.id,
    brief: {...job.brief, restated: `${job.brief.restated}（用户已确认）`},
  }));
  report.editApplied = corrected.proposalJob.brief.restated.endsWith('（用户已确认）');
  console.log('EDIT_APPLIED', report.editApplied);

  // 1) Answers only: the brief must be updated, nothing may be proposed yet.
  unwrap(await call('creativeStudio/continueProposalJob', {
    id, expectedProjectRevision: corrected.projectRevision, jobId: job.id, answers: answer, confirmed: false,
  }));
  const second = await settle(project => (project.proposalJob?.brief && project.proposalJob.brief.createdAt !== job.brief.createdAt) ? project : null);
  if (!second) throw new Error('no brief update within 180s');
  report.continued = {intent: second.project.proposalJob.brief.intent, proposals: second.project.proposals.length, confirmedAt: second.project.proposalJob.briefConfirmedAt ?? null};
  console.log('AFTER_ANSWERS', JSON.stringify(report.continued));
  if (report.continued.proposals !== 0) throw new Error('requirements were invented before confirmation');

  // 2) Explicit confirmation: only now may the session submit a proposal.
  unwrap(await call('creativeStudio/continueProposalJob', {
    id, expectedProjectRevision: second.project.projectRevision, jobId: job.id, answers: '', confirmed: true,
  }));
  const third = await settle(project => project.proposals.length > 0 ? project : null, 240000);
  report.afterConfirm = third
    ? {proposals: third.project.proposals.length, title: third.project.proposals[0]?.title ?? null, status: third.project.proposalJob?.status ?? null,
       confirmedAt: third.project.proposalJob?.briefConfirmedAt ?? null, versions: third.project.versions.length}
    : 'no proposal within 240s';
  console.log('AFTER_CONFIRM', JSON.stringify(report.afterConfirm));
} finally {
  console.log('RESULT', JSON.stringify(report));
  if (!keep) {
    const current = unwrap(await call('creativeStudio/getProject', {id}));
    unwrap(await call('creativeStudio/deleteProject', {id, expectedProjectRevision: current.projectRevision}));
    console.log('CLEANED', id);
  } else {
    console.log('KEPT', id);
  }
  await context.close();
}
