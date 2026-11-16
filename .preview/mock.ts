// Preview-only mock data. Not part of the plugin build; used to render the
// client panel outside the Harness host so the UI can be audited/screenshotted.
import type {
  ArchitectureNode, DemoSceneData, ProjectHead, ProjectSnapshot, RequirementNode,
} from '../src/types.js';
import type { ProjectActions } from '../src/client/projects.js';

const nodes: RequirementNode[] = [
  {
    id: 'n1', parentId: null, title: '把模糊想法整理成可开发的需求', kind: 'goal',
    description: '用户只有一个模糊的产品想法时，能在一个工作台里把它拆成目标、场景与功能，并逐条写清验收标准。',
    priority: 'high', order: 0, dependsOn: [],
    desktopAcceptance: ['新建项目后 30 秒内可添加第一个需求节点', '需求树支持拖动改层级并拒绝成环依赖'],
    mobileAcceptance: ['手机端可查看需求树并编辑说明'],
  },
  {
    id: 'n2', parentId: 'n1', title: '需求导图编辑', kind: 'scenario',
    description: '以树形导图编辑需求，支持重命名、说明、双端验收、依赖与同级排序。',
    priority: 'high', order: 0, dependsOn: [],
    desktopAcceptance: ['拖动左侧手柄到另一张卡片可改父节点', '最近 20 次需求修改可撤销重做'],
    mobileAcceptance: ['窄屏下导图可横向滚动查看'],
  },
  {
    id: 'n3', parentId: 'n2', title: '依赖关系校验', kind: 'feature',
    description: '保存依赖时校验目标存在、不重复、不成环，并指出相关节点。',
    priority: 'normal', order: 0, dependsOn: ['n2'],
    desktopAcceptance: ['成环依赖被拒绝并提示环上的节点'],
    mobileAcceptance: [],
  },
  {
    id: 'n4', parentId: 'n1', title: '参考产品研究', kind: 'scenario',
    description: '登记参考产品来源，按“需求 × 参考来源”记录功能、实现方式与可借鉴点。',
    priority: 'normal', order: 1, dependsOn: [],
    desktopAcceptance: ['功能对比矩阵可新增与删除功能笔记'],
    mobileAcceptance: ['手机端可只读查看对比矩阵'],
  },
];

const architecture: ArchitectureNode[] = [
  {
    id: 'a1', kind: 'module', title: '需求域模型', body: '需求树、依赖与验收点的纯函数领域层，Host 与 Client 共用。',
    requirementIds: ['n1', 'n2'], dependsOn: [],
  },
  {
    id: 'a2', kind: 'contract', title: '需求编辑接口', body: '保存需求变更，带乐观并发修订号。',
    requirementIds: ['n2'], dependsOn: ['a1'],
    contract: {
      surface: 'POST /api/requirements/edit',
      inputs: [{ name: 'id', type: 'string', required: true, notes: '项目 ID' }, { name: 'change', type: 'RequirementChange', required: true, notes: '' }],
      outputs: [{ name: 'snapshot', type: 'ProjectSnapshot', required: true, notes: '' }],
      errors: ['409 REVISION_CONFLICT', '400 REQUIREMENT_DEPENDENCY_CYCLE'],
      permissions: '仅项目所有者可写；跨项目隔离。', notApplicable: false,
    },
  },
  {
    id: 'a3', kind: 'task', title: '实现依赖环检测', body: '在保存依赖前做拓扑校验，返回环上的节点 ID。',
    requirementIds: ['n3'], dependsOn: ['a1'],
    task: { inputs: ['已批准的需求域模型'], outputs: ['src/domain/requirement-dependencies.ts 与单测'], acceptanceIds: ['n3:desktop:1'] },
  },
];

const demo: DemoSceneData = {
  id: 'scene-1', title: '需求列表交互示例', contentRevision: 7, requirementIds: ['n2'],
  state: { query: '', notice: false },
  components: [
    { id: 'search', kind: 'input', label: '搜索需求', binding: 'query' },
    { id: 'results', kind: 'list', label: '需求列表', binding: 'query', rows: ['需求导图编辑', '依赖关系校验', '参考产品研究'] },
    { id: 'show', kind: 'button', label: '展示反馈', actionId: 'show' },
    { id: 'notice', kind: 'notice', label: '这是模拟反馈，没有调用生产服务。', binding: 'notice' },
  ],
  actions: [{ id: 'show', changes: [{ key: 'notice', value: true }] }],
  steps: [{ componentId: 'search', value: '需求' }, { actionId: 'show' }],
};

export const project: ProjectSnapshot = {
  id: 'p1', name: '创意工坊 · 需求梳理', projectRevision: 3, contentRevision: 7, schemaVersion: 1,
  nodes, architecture,
  references: [{
    id: 'r1', name: 'Linear', sourceKind: 'url', location: 'https://linear.app', origin: 'manual',
    notes: '借鉴其命令面板与键盘优先的交互密度。', license: 'unknown',
  }],
  features: [{
    id: 'f1', referenceId: 'r1', name: '命令面板', description: '⌘K 唤起全局命令面板',
    requirementIds: ['n2'], assessment: 'inferred', implementation: '前端注册命令表，按上下文过滤',
    adaptation: '用于需求树快速跳转', sourceLocator: 'app/command-menu',
  }],
  versions: [{
    id: 'v1', label: 'v1 · 首版需求', createdAt: '2026-11-08T10:00:00.000Z', contentRevision: 5,
    nodes: nodes.slice(0, 3), architecture: architecture.slice(0, 2),
    references: [], features: [], demo: null, taskPlanConfirmed: false,
    approval: {
      baselineVersionId: null, operator: 'owner',
      changes: [{ collection: 'nodes', id: 'n1' }, { collection: 'nodes', id: 'n2' }],
      sceneId: null, mappedRequirementIds: ['n2'], uncoveredRequirementIds: ['n1', 'n3'],
      unverifiedAcceptanceIds: ['n1:desktop:2'], acknowledged: true,
    },
  }],
  proposals: [{
    id: 'pr1', title: '把参考研究并入需求推导', rationale: '研究结论可直接作为推导输入，减少重复描述。',
    alternatives: ['保持手动复制', '只预填摘要'], assumptions: ['研究结论质量足够作为输入'],
    baseContentRevision: 6, nodes: nodes.slice(0, 2), architecture: architecture.slice(0, 1),
    status: 'pending',
  }],
  demo, reports: [{
    id: 'rep1', dispatchId: 'd1', handoffId: 'h1', taskId: 'a3', acceptanceIds: ['n3:desktop:1'],
    summary: '实现依赖环检测并补充单测。', changedFiles: ['src/domain/requirement-dependencies.ts'],
    testEvidence: ['npm run test:unit — 76 passed'], unfinished: [], userAccepted: false,
  }],
  dispatches: [{
    id: 'd1', handoffId: 'h1', versionId: 'v1', workspaceId: 'ws1', relativeDirectory: '.',
    sessionId: 'session-abc', agentPreset: '', entryRelativePath: 'AGENTS.md', status: 'submitted',
  }],
  researchJob: {
    id: 'j1', sessionId: 'session-research', reference: {
      id: 'r1', name: 'Linear', sourceKind: 'url', location: 'https://linear.app', origin: 'manual',
      notes: '', license: 'unknown',
    },
    request: '梳理命令面板与键盘优先交互的实现方式', status: 'finished',
    evidence: [{ callId: 'c1', tool: 'web_fetch' }, { callId: 'c2', tool: 'read_image' }],
    conclusion: {
      summary: 'Linear 使用全局命令面板承载跳转与创建操作，键盘优先，列表项带分组与最近使用。',
      evidenceCallIds: ['c1'], limitations: ['未验证其内部实现，仅基于页面与文档推断。'],
    },
  },
  proposalJob: {
    id:'job-demo', sessionId:'sess-demo', request:'读取另一个会话里进行到一半的开发工作', baseContentRevision:7,
    status:'submitted',
    brief:{
      intent:'operation',
      restated:'你现在需要的是把这个项目在另一个会话里已经推进到的开发成果接上，而不是从零再推导一遍需求。',
      interpretation:'这条输入是给我的操作指令（读取另一个会话），不是产品要解决的问题，所以按 operation 处理，不生成候选需求。',
      goals:[], users:[], scenarios:[], constraints:['插件不能跨会话读取内容，只能读取当前项目已保存的草稿与已冻结版本'],
      unknowns:['另一个会话推进到了哪一步、产物在哪里'],
      questions:['那个会话的关键结论或产出能否导出成文件放到 Host？','是否可以把其中已完成的需求直接登记为当前草稿的参考来源？'],
      needs:['另一个会话的结论摘要或产出文件路径','可作为参考来源登记的本地文件或仓库地址'],
      createdAt:'2026-11-16T04:20:00.000Z',
    },
    nodes:[],
    architecture:[],
  },
};

export const heads: ProjectHead[] = [
  { id: 'p1', name: '创意工坊 · 需求梳理', projectRevision: 3, contentRevision: 7 },
  { id: 'p2', name: '移动端记账', projectRevision: 1, contentRevision: 2 },
];

const ok = async (): Promise<ProjectSnapshot> => project;

export const actions: ProjectActions = {
  reject: ok, rename: ok, evidence: async () => ({ text: 'raw evidence', nextOffset: null, total: 1 }),
  research: ok, acceptReport: ok, listWorkspaces: async () => [{ id: 'ws1', title: 'dsh运维', path: '/dsh-home/dsh运维' }],
  listModels: async () => ({ default: { provider: 'deepseek', model: 'deepseek-reasoner', reasoningEffort: 'high' }, options: [
    { provider: 'deepseek', providerName: 'DeepSeek', model: 'deepseek-chat', name: 'deepseek-chat' },
    { provider: 'deepseek', providerName: 'DeepSeek', model: 'deepseek-reasoner', name: 'deepseek-reasoner', description: '扩展思考，适合架构推导', reasoningEfforts: [{ id: 'low', name: '低' }, { id: 'medium', name: '中' }, { id: 'high', name: '高' }], defaultEffort: 'high' },
  ], failures: [] }),
  handoff: {
    readiness: async () => ({ versionId: 'v1', ready: true, blockers: [], warnings: [] }),
    export: async () => ({ handoffId: 'h1', projectId: 'p1', versionId: 'v1', ready: true, manifestDigest: 'sha256:abc', archiveSha256: 'sha256:def', size: 5425 }),
    chunk: async () => ({ base64: '', nextOffset: null, total: 0, packageId: 'h1' }),
  },
  dispatch: {
    workspaces: async () => [{ id: 'ws1', title: 'dsh运维', path: '/dsh-home/dsh运维' }],
    send: ok, get: ok,
  },
  confirmTasks: ok, demo: ok, feature: ok, reference: ok, generate: ok,
  continueProposal: ok, abandonProposal: ok,
  list: async () => heads, adopt: ok, approve: ok, create: ok, get: async () => project, remove: async () => heads,
  architecture: ok, edit: ok,
};
