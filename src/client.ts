import { TYPERT_REMOTE } from '../lib/typert.remote-client.js';
import type { TypertDisposer } from '@deepseek-ai/dsh-typert-protocol';
import type { StudioClientContext } from './client/context.js';
import { createStudioPanel, StudioIcon, type ConnectionState } from './client/app.js';

export const inject: string[] = ['slots', 'remote', 'locale'];
const namespace = 'creativeStudio';
const dictionaries = {
  zh: {
    confirmProjectChange:'切换或新建项目会关闭当前编辑区，未保存的表单和本地 Demo 预览将丢弃。确认继续？已保存数据不会删除。',
    editorConflict:'远端修改与未保存编辑冲突。已保留输入并暂停保存；请核对后重新载入。',editorReload:'放弃本地输入并载入最新值',
    researchSeed:'将最新研究带入推导输入',researchSeedConfirm:'用最新研究摘要替换当前未提交输入？只预填文本，不发送模型请求。随后生成时，这些摘要及限制会发送给所选模型；不包含原始工具结果或源文件。',
    recommendedProducts:'推荐参考产品',recommendationNotice:'模型推荐线索，未经来源核验；功能点仅供研究，不代表产品已有这些能力。',confirmReferenceRecommendation:'将此推荐加入参考库？不会访问来源、启动研究、采纳需求或审批；许可仍为未知。',recommendationRegistered:'已在参考库',registerRecommendation:'加入参考库',
    researchTitle:'参考实现研究',researchSource:'选择参考来源',researchWorkspace:'选择研究工作区',researchQuestion:'希望梳理哪些功能和实现？',researchStart:'开始只读研究',researchRefresh:'刷新研究结果',researchEvidence:'实际工具调用',researchScopeNotice:'网页先读取指定页面；Host制品使用可用静态工具。不会执行目标程序或切换共享REA目标。',researchConfirm:'确认创建研究会话并调用模型？选定参考内容可能发送给配置的模型；请确认拥有使用权限。可能产生费用。',researchInferenceNotice:'总结是模型推断；工具返回不等于证明所有功能结论。请核对证据与限制。',
    candidateDemo:'查看/收起候选双端 Demo',candidateDemoNotice:'候选预览：未采纳、未审批。仅模拟声明的交互；不代表生产实现。',
    reportsTitle:'实施报告',reportsNotice:'报告和测试证据由 Agent 自报，未独立验证。会话空闲不表示完成；只有你能确认验收。',reportsRefresh:'刷新报告',reportsEmpty:'尚无实施报告。',reportsAccepted:'用户已验收',reportsPending:'待用户验收',reportsDetails:'文件、验收项与测试证据',reportsEvidence:'附带测试证据（Agent 自报）',reportsNoEvidence:'未附测试证据，仅实现自报。',reportsAccept:'确认验收',reportsRevoke:'撤销验收',reportsAcceptConfirm:'确认已亲自核对该任务、验收项、未完成项及证据？这只确认本报告，不自动验收整个项目。',reportsRevokeConfirm:'撤销这份报告的用户验收？',
    generateTitle:'从模糊想法推导方案',generateNotice:'创建独立推导会话并调用已配置模型（可能产生费用）。只使用已保存草稿，候选不会自动采纳。当前手动填写已有 Harness 工作区 ID。',generateConfirm:'确认创建推导会话并调用模型？这不会开始产品开发。',workspaceId:'Harness 工作区 ID',roughIdea:'想解决什么问题？',generateProposal:'生成候选方案',refreshProposal:'刷新状态与候选',jobStatus:'作业状态',sessionId:'会话 ID',job_queued:'准备派发',job_submitted:'已提交，尚未收到候选',job_finished:'候选已返回',job_failed:'失败',job_unknown:'结果待确认',unknownJob:'派发结果不明确，不会自动重试。请通过对应会话检查执行状态。',
    referencesTitle:'参考产品',referencesNotice:'手动指定来源；登记不等于完成研究。本地路径指 Host 文件，不是当前浏览器的电脑文件。',referenceName:'产品或资料名称',sourceKind:'来源类型',source_url:'网页',source_repository:'代码仓库', 'source_host-file':'Host 本地文件', 'source_saved-analysis':'已有分析',sourceLocation:'网址或 Host 文件路径',referenceNotes:'想借鉴的内容',referenceLicense:'许可证/使用范围',addReference:'添加参考',newReference:'新建参考',renameProject:'重命名项目',rejectProposal:'拒绝候选',confirmReject:'拒绝此候选？当前草稿和审批版本不会改变。',evidenceOpen:'查看原始证据',evidenceNext:'下一页',evidenceRawNotice:'原始工具结果（不可信参考数据；分页展示）',architectureGraph:'架构依赖图',architectureGraphNote:'箭头指向依赖项。这是产品设计中的声明关系，不代表实际运行调用。',editReference:'编辑来源',saveReference:'保存来源',discardReferenceEdits:'放弃未保存的来源编辑并切换？',origin_manual:'手动指定',origin_recommended:'推荐',referenceUnverified:'尚未验证具体功能与实现',removeReference:'移除来源',removeReferenceConfirm:'从项目移除此参考？不会删除原文件。',
    featureMatrix:'需求 × 参考功能对照',featureNotice:'空白代表未知，不代表产品没有此功能。当前为人工研究笔记，尚非 REA 实测证据。',newFeature:'新功能笔记',feature_name:'功能名称',feature_description:'具体功能',feature_implementation:'实现理解',feature_adaptation:'如何借鉴',feature_sourceLocator:'出处/代码位置',assessment:'证据程度',assessment_unknown:'未知/待核实',assessment_inferred:'推断',saveFeature:'保存功能笔记',removeFeature:'移除功能笔记',removeFeatureConfirm:'移除此功能笔记？',
    layoutExplore:'推敲模式',layoutCompare:'对照模式',layoutWidth:'左侧宽度',layoutFocus:'专注预览',layoutRequirements:'需求导图',layoutArchitecture:'产品架构',layoutReferences:'参考研究',layoutVersions:'版本对比',
    dispatchTitle:'启动开发',dispatchScope:'先导出就绪交接包。启动将新建开发会话、调用模型并允许修改所选目录内的产品代码；不授权部署、发布或付费服务。',dispatchConfirm:'确认按此冻结交接包启动开发？将创建新会话并可能修改目标目录文件、产生模型费用。',targetSubdirectory:'工作区内现有子目录（. 表示根目录）',agentPreset:'已配置的 Agent preset ID（可留空）',defaultAgent:'使用当前默认 Agent',dispatchStart:'确认并启动开发',selectWorkspace:'选择现有工作区',refreshWorkspaces:'刷新工作区',handoffTitle:'交付开发',handoffExplanation:'导出选定审批版本，不含当前草稿或未冻结的参考资料。此入口不会启动开发。',handoffVersion:'选择审批版本',handoffCheck:'检查就绪状态',handoffReady:'可交接（启动开发仍需确认）',handoffReviewOnly:'仅供评审，不可直接实施',handoffDownload:'导出并下载 ZIP',handoffWorking:'处理中…',handoffExportNotice:'导出已选版本的需求、架构、任务、验收与离线 Demo？未就绪包只能用于评审。不会启动开发或附带私人参考源。',demoTitle:'交互 Demo',demoSearch:'搜索',demoItems:'示例列表',demoSample:'示例条目',demoShow:'展示反馈',demoMock:'这是模拟反馈，没有调用生产服务。',demoTemplateNotice:'通用列表交互示例：以需求标题作样本数据，不表示已实现这些需求。',demoCustom:'自定义声明式场景（模拟数据）',demoStale:'此预览基于较旧的需求修订，请核对覆盖范围。',demoViewport:'产品视口',demoBoth:'桌面与手机',demoDesktop:'桌面',demoMobile:'手机',demoSceneEditor:'编辑场景 JSON',taskPlanReview:'查看任务计划',confirmTasks:'确认此版本任务计划',tasksConfirmed:'任务计划已确认',confirmTasksNotice:'确认已审阅此版本的任务、依赖、产出和验证要求？此操作不启动开发。',demoSave:'保存当前场景',demoLocalOnly:'应用场景仅更新本地预览；点击保存当前场景后才会写入项目。不执行任意脚本。',demoApply:'应用场景',demoLoad:'载入当前场景',demoReset:'返回通用示例',
    proposals:'候选方案', proposalRule:'候选与草稿隔离；采纳仅更新草稿，不等于审批。', noProposals:'暂无候选方案，可通过上方入口生成。', proposalBase:'基于修订', proposal_pending:'待审阅', proposal_adopted:'已采纳', proposal_rejected:'已拒绝', staleProposal:'草稿已有后续修改。此候选仅供查看，需重新生成或合并后才能采纳。', assumptions:'待验证假设', alternatives:'备选方案', proposedContent:'查看候选完整内容', proposalDiff:'与当前已保存草稿的差异', confirmAdopt:'将此候选完整替换为当前草稿？未保存的需求/架构编辑和本地 Demo 预览将丢弃，不会合并。这不会审批或开始开发。', adoptProposal:'采纳为草稿',
    selectedDemoCoverage:'选中需求的 Demo 覆盖',selectedDemoMapped:'当前场景声明映射了此需求。',selectedDemoUnmapped:'当前场景没有映射此需求，不能据此推定已实现。',selectedDemoCaution:'映射不是验收结果；旧版本场景和临时预览仍需核对。选择节点不会重置演示状态。',approvalReceipt:'冻结时的审批确认记录',limitationsAcknowledged:'用户已确认上述限制；不是验收通过。',limitationsNotAcknowledged:'此记录没有未验证项确认标记。',legacyApprovalReceipt:'历史版本没有结构化确认记录，不追溯推定已经确认。',approvalReview:'审批范围与验证说明',approvalBaseline:'审批合并基线',emptyBaseline:'空基线（首次或重新选择）',partialApproval:'仅批准勾选变化，保留基线的其他内容',approvalCoverageNotice:'Demo 映射仅表示声明覆盖，不是验收通过。局部版本不沿用不匹配的草稿 Demo。',demoMapped:'Demo 已映射需求',demoUncovered:'Demo 未覆盖需求',unverifiedAcceptance:'尚未验证的验收项',ackUnverified:'我理解上述未覆盖/未验证项，并同意带着这些限制冻结此版本；这不表示验收通过。',versions:'版本与审批', approvalScope:'批准全部已保存需求与架构，或选择相对基线的部分变化。未保存的表单输入不包含在内；这不是开发派发，也不代表测试验收通过。', confirmApproval:'确认冻结此已保存版本？内容修订', versionLabel:'版本名称', approveVersion:'批准并冻结', compareFrom:'对比基线', compareTo:'对比目标', selectVersion:'选择冻结版本', currentDraft:'当前草稿', noDifferences:'没有内容差异', differences:'差异', added:'新增', removed:'删除', changed:'修改',
    architectureType:'类型', architectureTitle:'名称', architectureBody:'设计说明', architecture_module:'模块', architecture_contract:'数据/API契约', architecture_decision:'决策', architecture_task:'开发任务', addArchitecture:'新增架构项', linkedRequirements:'关联需求', dependencies:'依赖关系', removeArchitecture:'删除该架构项？被其他项引用时会拒绝删除。',
    hint_module:'职责、边界、输入输出、桌面/手机差异', hint_contract:'实体/字段、请求响应、状态变化、权限与错误', hint_decision:'选择、备选方案、理由、约束和风险', hint_task:'输入、产出、涉及范围、验证步骤和验收条件',
    contractStructure:'契约结构（保存时必填）', contractNotApplicable:'该需求不涉及后端/接口契约', contractSurface:'接口或实体名称', hint_contractSurface:'例如 POST /api/bookmarks 或 Bookmark 实体',
    contractInputs:'入参 / 字段', contractOutputs:'出参 / 字段', contractFieldName:'字段名', contractFieldType:'类型', contractFieldNotes:'说明', contractFieldRequired:'必填', addContractField:'新增字段',
    contractErrors:'异常与错误码', hint_contractErrors:'每行一个，例如 400 INVALID_QUERY', contractPermissions:'权限与数据访问边界', hint_contractPermissions:'谁能调用、能读写哪些数据、跨项目隔离规则',
    taskStructure:'任务结构（保存时必填）', taskInputs:'输入', hint_taskInputs:'每行一项，例如 已批准的接口契约 currentVersion', taskOutputs:'预期产物', hint_taskOutputs:'每行一项，例如 src/client/filters.ts 与单测', taskAcceptance:'关联验收点（来自需求）', taskAcceptanceEmpty:'请先在需求中补充验收条件，任务无法凭空声明验收。',
    discardEdits: '尚有未保存的编辑，放弃并切换节点？',
    dragRequirement:'拖动需求',nodeDragHint:'拖动卡片左侧 ⠿ 手柄到另一张卡片可改为其子节点；也可使用父节点选择器。',nodeDropRoot:'拖到此处改为根节点',confirmNodeDrop:'确认将拖动的需求移动到目标父节点？后代关系会随之移动。',requirementHistory:'需求编辑历史',undoRequirements:'撤销需求修改',redoRequirements:'重做需求修改',historyScope:'仅当前页面内最近 20 次已保存的需求操作；刷新页面、切换项目、采纳方案或外部内容更新会使旧历史不可用。',historyConfirm:'恢复上一/下一次已保存需求状态？未保存表单与临时 Demo 将丢弃；审批快照不变。',historyDesync:'恢复历史后本地记录与服务器状态不一致，已清空历史；请重新加载项目。',errorDependencyCycle:'依赖关系会成环，已拒绝：',errorDependencyMissing:'依赖的目标需求不存在（可能已被删除），已拒绝：',errorDependencyDuplicate:'同一需求重复依赖了同一目标，已拒绝：',errorDuplicateId:'存在重复的需求 ID，已拒绝。',moveEarlier:'同级上移',moveLater:'同级下移',newRequirement: '新需求', addChild: '添加子节点', addRoot: '添加根节点', selectRoot: '项目根', nodeTitle: '需求名称', rename: '重命名', parentNode: '父节点', nodeDescription: '需求说明', desktopAcceptance: '桌面端验收（每行一条）', mobileAcceptance: '手机端验收（每行一条）', saveDetails: '保存详情', requirementDependencies: '需求依赖（先决条件）', saveRequirementDependencies: '保存依赖', requirementDependencyHint: '依赖关系独立于父子层级，只表示“先完成哪个需求”。缺失目标、重复依赖或成环都会被拒绝，并指出相关节点。', requirementOrder:'同级顺序', requirementPriority:'优先级', approvalFieldSelectionEmpty:'至少要选择一个字段', approvalFieldSelectionUnavailable:'新增或删除的条目不能按字段部分批准', approvalFieldNotChanged:'该字段与基线相同，无法单独批准', approvalSelectSomething:'请至少选择一条变更或一个字段再批准', confirmRemove: '删除该需求及其全部子节点？', removeNode: '删除节点', selectNode: '选择一个需求节点进行编辑。',
    errorContractStructure:'契约项需要填写接口/实体名称，或明确标记“不适用”。', errorTaskStructure:'任务需要填写预期产物并至少关联一个验收点。', errorArchitecturePayloadKind:'契约/任务结构只能用在对应类型的架构项上。', errorAcceptanceMissing:'引用的验收点已不存在，请重新选择。',desktop:'桌面',mobile:'手机',errorAcceptanceTextChanged:'该验收点已被任务引用，改动文字会让任务指向未选过的标准，已拒绝：',errorAcceptanceNotLinked:'任务只能引用其关联需求的验收点，已拒绝：',errorRequirementMissing:'被引用的需求已不存在，请先修正引用它的架构项：',errorArchitectureDependencyMissing:'架构依赖的目标不存在，已拒绝：',diffContract:'契约结构变化',diffTask:'任务结构变化',
    projects: '产品项目', projectName: '项目名称', newProject: '新建项目', draftRevision: '草稿修订', emptyRequirements: '尚无需求节点。',
    title: '创意工坊', eyebrow: '把想法打磨成可以开发的产品', headline: '从一个想法，到一份清晰的开发起点。',
    description: '把需求、参考产品、实现方案与交互演示放在同一个工作台中。先看清楚，再决定做什么。',
    flow: '产品打磨流程', idea: '模糊想法', requirements: '需求导图', research: '参考研究', architecture: '架构方案', demo: '双端演示', handoff: '交付开发',
    connecting: '正在连接 Host', connected: 'Host 已连接', error: '连接未就绪', retry: '检查 Host 连接',
    readyTitle: '你的产品工作台', initialStage: '在上方选择或创建项目，梳理需求、审阅候选并验证交互。Demo 使用模拟数据；采纳、审批和启动开发是相互独立的操作。',
    draftRule: 'AI 提供候选，你决定批准。', native: 'Harness 原生插件',
  },
  en: {
    confirmProjectChange:'Switching or creating a project closes the current editors and discards unsaved forms and local Demo previews. Continue? Saved data will not be deleted.',
    editorConflict:'Remote changes conflict with unsaved edits. Input is preserved and saving is paused; review then reload.',editorReload:'Discard local input and load latest values',
    researchSeed:'Bring latest research into proposal input',researchSeedConfirm:'Replace the unsent input with the latest research summary? This only prefills text. Generating later sends the summary and limitations to the model, but not raw tool results or source files.',
    recommendedProducts:'Recommended reference products',recommendationNotice:'Unverified model suggestions. Feature ideas are research leads, not confirmed product capabilities.',confirmReferenceRecommendation:'Add this suggestion to references? This does not visit the source, start research, adopt requirements or approve anything. License remains unknown.',recommendationRegistered:'Already in references',registerRecommendation:'Add to references',
    researchTitle:'Reference implementation research',researchSource:'Select reference',researchWorkspace:'Select research workspace',researchQuestion:'Which features and implementation details should be examined?',researchStart:'Start read-only research',researchRefresh:'Refresh research',researchEvidence:'Actual tool calls',researchScopeNotice:'Web references read the selected page; Host artifacts use available static tools. No target execution or shared REA target switching.',researchConfirm:'Create a research session and call the model? Selected source content may be sent to your configured model. Confirm you have permission; charges may apply.',researchInferenceNotice:'The summary is model inference. Tool output does not prove every feature claim. Review evidence and limitations.',
    candidateDemo:'Show/hide candidate dual-viewport demo',candidateDemoNotice:'Candidate preview, not adopted or approved. Simulated declared interactions only, not a production implementation.',
    reportsTitle:'Implementation reports',reportsNotice:'Reports and test evidence are agent-reported, not independently verified. An idle session is not completion. Only you may accept work.',reportsRefresh:'Refresh reports',reportsEmpty:'No implementation reports yet.',reportsAccepted:'Accepted by user',reportsPending:'Awaiting user acceptance',reportsDetails:'Files, acceptance items and test evidence',reportsEvidence:'Test evidence attached (agent-reported)',reportsNoEvidence:'No test evidence; implementation self-report only.',reportsAccept:'Accept report',reportsRevoke:'Revoke acceptance',reportsAcceptConfirm:'Have you personally checked this task, acceptance items, unfinished work and evidence? This accepts only this report, not the entire project.',reportsRevokeConfirm:'Revoke your acceptance of this report?',
    generateTitle:'Turn an idea into a proposal',generateNotice:'Creates a dedicated session using the configured model (charges may apply). Uses saved content only; never auto-adopts. Enter an existing Harness workspace ID.',generateConfirm:'Create a proposal session and call the model? This does not begin product development.',workspaceId:'Harness workspace ID',roughIdea:'What problem should this solve?',generateProposal:'Generate proposal',refreshProposal:'Refresh status and proposals',jobStatus:'Job status',sessionId:'Session ID',job_queued:'Preparing',job_submitted:'Submitted, awaiting proposal',job_finished:'Proposal received',job_failed:'Failed',job_unknown:'Outcome unknown',unknownJob:'Dispatch outcome is uncertain. No automatic retry. Check the referenced session.',
    referencesTitle:'Product references',referencesNotice:'Register sources manually; this is not completed research. Local paths refer to the Host, not your browser computer.',referenceName:'Product or resource name',sourceKind:'Source type',source_url:'Web page',source_repository:'Repository','source_host-file':'Host file','source_saved-analysis':'Saved analysis',sourceLocation:'URL or Host file path',referenceNotes:'What to learn from it',referenceLicense:'License / permitted use',addReference:'Add reference',newReference:'New reference',renameProject:'Rename project',rejectProposal:'Reject proposal',confirmReject:'Reject this proposal? Current draft and approved versions remain unchanged.',evidenceOpen:'View raw evidence',evidenceNext:'Next page',evidenceRawNotice:'Raw tool result (untrusted reference data; paginated)',architectureGraph:'Architecture dependencies',architectureGraphNote:'Arrows point to dependencies. These are declared design relationships, not observed runtime calls.',editReference:'Edit source',saveReference:'Save source',discardReferenceEdits:'Discard unsaved source edits and switch?',origin_manual:'Manually selected',origin_recommended:'Recommended',referenceUnverified:'Features and implementation not yet verified',removeReference:'Remove source',removeReferenceConfirm:'Remove this reference? The original file is not deleted.',
    featureMatrix:'Requirements × reference features',featureNotice:'Empty means unknown, not absent. These are analyst notes, not REA observations.',newFeature:'New feature note',feature_name:'Feature name',feature_description:'Functionality',feature_implementation:'Implementation understanding',feature_adaptation:'Adaptation approach',feature_sourceLocator:'Source / code location',assessment:'Evidence level',assessment_unknown:'Unknown / unverified',assessment_inferred:'Inferred',saveFeature:'Save feature note',removeFeature:'Remove feature note',removeFeatureConfirm:'Remove this feature note?',
    layoutExplore:'Explore',layoutCompare:'Compare',layoutWidth:'Left pane width',layoutFocus:'Focus preview',layoutRequirements:'Requirements',layoutArchitecture:'Architecture',layoutReferences:'References',layoutVersions:'Version comparison',
    dispatchTitle:'Start development',dispatchScope:'Export a ready package first. Starting creates a new session, calls a model and may modify product files in the selected directory. No deployment, publication or paid services are authorized.',dispatchConfirm:'Start development from this frozen package? A new session may change files in the selected directory and incur model costs.',targetSubdirectory:'Existing workspace subdirectory (. for root)',agentPreset:'Configured Agent preset ID (optional)',defaultAgent:'Use current default Agent',dispatchStart:'Confirm and start development',selectWorkspace:'Select existing workspace',refreshWorkspaces:'Refresh workspaces',handoffTitle:'Development handoff',handoffExplanation:'Export one approved baseline, excluding later drafts and unfrozen research. This does not start development.',handoffVersion:'Select approved version',handoffCheck:'Check readiness',handoffReady:'Ready for handoff; development still requires confirmation',handoffReviewOnly:'Review only; not ready for implementation',handoffDownload:'Export and download ZIP',handoffWorking:'Working…',handoffExportNotice:'Export requirements, architecture, tasks, acceptance and offline Demo? Unready packages are review-only. No development is started or private reference sources included.',demoTitle:'Interactive demo',demoSearch:'Search',demoItems:'Sample list',demoSample:'Sample item',demoShow:'Show feedback',demoMock:'Mock feedback. No production service called.',demoTemplateNotice:'Generic list interaction using requirement titles as sample data; this does not implement those requirements.',demoCustom:'Custom declarative scene (mock data)',demoStale:'This preview belongs to an older requirement revision. Review its coverage.',demoViewport:'Product viewport',demoBoth:'Desktop and mobile',demoDesktop:'Desktop',demoMobile:'Mobile',demoSceneEditor:'Edit scene JSON',taskPlanReview:'Review task plan',confirmTasks:'Confirm this version’s task plan',tasksConfirmed:'Task plan confirmed',confirmTasksNotice:'Confirm review of tasks, dependencies, outputs and verification? This does not start development.',demoSave:'Save current scene',demoLocalOnly:'Apply updates the local preview; Save current scene persists it to the project. Arbitrary scripts are not executed.',demoApply:'Apply scene',demoLoad:'Load current scene',demoReset:'Return to example',
    proposals:'Proposals', proposalRule:'Proposals are isolated from the draft. Adoption updates the draft, not approval.', noProposals:'No proposals yet. Use the generation form above.', proposalBase:'Based on revision', proposal_pending:'Pending review', proposal_adopted:'Adopted', proposal_rejected:'Rejected', staleProposal:'The draft has changed. Review only; regenerate or merge before adoption.', assumptions:'Assumptions to validate', alternatives:'Alternatives', proposedContent:'View full proposed content', proposalDiff:'Changes against the current saved draft', confirmAdopt:'Replace the entire saved draft with this proposal? Unsaved requirement/architecture edits and local Demo previews will be discarded, not merged. This does not approve or start development.', adoptProposal:'Adopt into draft',
    selectedDemoCoverage:'Selected requirement demo coverage',selectedDemoMapped:'The current scene declares a mapping to this requirement.',selectedDemoUnmapped:'The current scene does not map this requirement; implementation cannot be inferred.',selectedDemoCaution:'A mapping is not acceptance. Check stale scenes and local previews. Selecting a node does not reset demo state.',approvalReceipt:'Frozen approval acknowledgement',limitationsAcknowledged:'The user acknowledged these limitations; this is not passed acceptance.',limitationsNotAcknowledged:'This record has no unverified-item acknowledgement flag.',legacyApprovalReceipt:'This historical version has no structured acknowledgement record. No acknowledgement is inferred retroactively.',approvalReview:'Approval scope and verification',approvalBaseline:'Approval merge baseline',emptyBaseline:'Empty baseline',partialApproval:'Approve selected changes only; keep other baseline content',approvalCoverageNotice:'Demo mappings are declared coverage, not passed acceptance. A partial snapshot does not reuse a mismatched draft demo.',demoMapped:'Demo-mapped requirements',demoUncovered:'Requirements not covered by demo',unverifiedAcceptance:'Unverified acceptance criteria',ackUnverified:'I understand the uncovered/unverified items above and agree to freeze with these limitations; this does not confirm acceptance.',versions:'Versions and approval', approvalScope:'Approve all saved requirements and architecture, or selected changes relative to a baseline. Unsaved form inputs are excluded. This neither starts development nor confirms test acceptance.', confirmApproval:'Freeze this saved version? Content revision', versionLabel:'Version label', approveVersion:'Approve and freeze', compareFrom:'Baseline', compareTo:'Compare to', selectVersion:'Select frozen version', currentDraft:'Current draft', noDifferences:'No content differences', differences:'Differences', added:'Added', removed:'Removed', changed:'Changed',
    architectureType:'Type', architectureTitle:'Title', architectureBody:'Design notes', architecture_module:'Module', architecture_contract:'Data/API contract', architecture_decision:'Decision', architecture_task:'Development task', addArchitecture:'Add architecture item', linkedRequirements:'Linked requirements', dependencies:'Dependencies', removeArchitecture:'Remove this item? Referenced items cannot be removed.',
    hint_module:'Responsibilities, boundaries, inputs/outputs, desktop/mobile differences', hint_contract:'Entities/fields, requests/responses, states, permissions and errors', hint_decision:'Choice, alternatives, rationale, constraints and risks', hint_task:'Inputs, outputs, scope, verification steps and acceptance',
    contractStructure:'Contract structure (required to save)', contractNotApplicable:'This requirement involves no backend/API contract', contractSurface:'Interface or entity name', hint_contractSurface:'e.g. POST /api/bookmarks or the Bookmark entity',
    contractInputs:'Inputs / fields', contractOutputs:'Outputs / fields', contractFieldName:'Field', contractFieldType:'Type', contractFieldNotes:'Notes', contractFieldRequired:'Required', addContractField:'Add field',
    contractErrors:'Errors and codes', hint_contractErrors:'One per line, e.g. 400 INVALID_QUERY', contractPermissions:'Permissions and data-access boundary', hint_contractPermissions:'Who may call it, which data is readable/writable, cross-project isolation',
    taskStructure:'Task structure (required to save)', taskInputs:'Inputs', hint_taskInputs:'One per line, e.g. approved contract currentVersion', taskOutputs:'Expected outputs', hint_taskOutputs:'One per line, e.g. src/client/filters.ts and its unit test', taskAcceptance:'Linked acceptance points (from requirements)', taskAcceptanceEmpty:'Add acceptance criteria to the requirement first; a task cannot invent acceptance.',
    discardEdits: 'Discard unsaved edits and select another node?',
    dragRequirement:'Drag requirement',nodeDragHint:'Drag the left ⠿ handle onto another card to make it a child. The parent selector is also available.',nodeDropRoot:'Drop here to make a root node',confirmNodeDrop:'Move the dragged requirement under this target? Its descendants move with it.',requirementHistory:'Requirement edit history',undoRequirements:'Undo requirement edit',redoRequirements:'Redo requirement edit',historyScope:'Last 20 saved requirement edits in this page only. Reload, project switches, proposal adoption or external content updates invalidate older history.',historyConfirm:'Restore the previous/next saved requirement state? Unsaved forms and local Demo will be discarded. Approved snapshots stay unchanged.',historyDesync:'Local history no longer matches the server state and was cleared; reload the project.',errorDependencyCycle:'Rejected because the dependencies would form a cycle:',errorDependencyMissing:'Rejected because a dependency target no longer exists:',errorDependencyDuplicate:'Rejected because the same target is listed twice:',errorDuplicateId:'Rejected because a requirement id is duplicated.',
    errorContractStructure:'A contract item needs an interface/entity name, or an explicit not-applicable mark.', errorTaskStructure:'A task needs expected outputs and at least one linked acceptance point.', errorArchitecturePayloadKind:'Contract/task structure is only valid on the matching architecture kind.', errorAcceptanceMissing:'A referenced acceptance point no longer exists; pick it again.',desktop:'Desktop',mobile:'Mobile',errorAcceptanceTextChanged:'A task cites this acceptance point, so rewriting its text would re-point the task at a criterion nobody chose. Rejected:',errorAcceptanceNotLinked:'A task may only cite acceptance points of its own requirements. Rejected:',errorRequirementMissing:'A referenced requirement no longer exists; fix the architecture item that cites it first:',errorArchitectureDependencyMissing:'Rejected because an architecture dependency target does not exist:',diffContract:'contract structure change',diffTask:'task structure change',moveEarlier:'Move earlier among siblings',moveLater:'Move later among siblings',newRequirement: 'New requirement', addChild: 'Add child', addRoot: 'Add root', selectRoot: 'Project root', nodeTitle: 'Requirement title', rename: 'Rename', parentNode: 'Parent', nodeDescription: 'Description', desktopAcceptance: 'Desktop acceptance (one per line)', mobileAcceptance: 'Mobile acceptance (one per line)', saveDetails: 'Save details', requirementDependencies: 'Requirement dependencies', saveRequirementDependencies: 'Save dependencies', requirementDependencyHint: 'Dependencies are separate from parent/child structure and only express prerequisites. Missing targets, duplicates or cycles are rejected with the related nodes named.', requirementOrder:'Sibling order', requirementPriority:'Priority', approvalFieldSelectionEmpty:'Select at least one field', approvalFieldSelectionUnavailable:'Added or removed items cannot be approved field by field', approvalFieldNotChanged:'That field already matches the baseline', approvalSelectSomething:'Select at least one change or field to approve', confirmRemove: 'Delete this requirement and all descendants?', removeNode: 'Delete node', selectNode: 'Select a requirement to edit.',
    projects: 'Product projects', projectName: 'Project name', newProject: 'Create project', draftRevision: 'Draft revision', emptyRequirements: 'No requirement nodes yet.',
    title: 'Creative Studio', eyebrow: 'SHAPE AN IDEA INTO A BUILDABLE PRODUCT', headline: 'From an idea to a clear development starting point.',
    description: 'Explore requirements, reference products, implementation choices and interactive demos in one workspace. Understand first, then decide what to build.',
    flow: 'Product discovery flow', idea: 'Idea', requirements: 'Requirements', research: 'References', architecture: 'Architecture', demo: 'Dual demos', handoff: 'Handoff',
    connecting: 'Connecting to Host', connected: 'Host connected', error: 'Connection unavailable', retry: 'Check Host connection',
    readyTitle: 'Your product workspace', initialStage: 'Select or create a project above to refine requirements, review proposals and verify interactions. Demos use mock data; adoption, approval and starting development are separate actions.',
    draftRule: 'AI proposes. You approve.', native: 'Native Harness plugin',
  },
};

export function apply(ctx: StudioClientContext): void {
  ctx.effect(() => ctx.locale.register(namespace, dictionaries));
  const t = ctx.locale.bind(namespace);
  let disposed = false;
  let mounted = false;
  let remoteContext = ctx;
  let release: TypertDisposer | undefined;
  let state: ConnectionState = { status: 'connecting' };
  const listeners = new Set<() => void>();
  const update = (next: ConnectionState): void => {
    if (disposed) return;
    state = next;
    for (const listener of listeners) listener();
  };
  const refresh = async (): Promise<void> => {
    if (!mounted || disposed) return;
    update({ status: 'connecting' });
    try {
      const result = await TYPERT_REMOTE.methods['creativeStudio/health'].invoke(remoteContext.remote, {});
      if (!result.ok) update({ status: 'error', error: result.error.message });
      else update({ status: result.value.status });
    } catch (error) {
      update({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  };
  const Panel = createStudioPanel({
    getSnapshot: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    retry: () => { void refresh(); },
  }, t, {
    async acceptReport(project,reportId,accepted){const r=await TYPERT_REMOTE.methods['creativeStudio/acceptImplementationReport'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,reportId,accepted});if(!r.ok)throw new Error(r.error.message);return r.value;},
    async listWorkspaces(){const r=await TYPERT_REMOTE.methods['creativeStudio/listWorkspaces'].invoke(remoteContext.remote,{});if(!r.ok)throw new Error(r.error.message);return r.value;},
    dispatch:{
      async workspaces(){const r=await TYPERT_REMOTE.methods['creativeStudio/listWorkspaces'].invoke(remoteContext.remote,{});if(!r.ok)throw new Error(r.error.message);return r.value;},
      async get(id){const r=await TYPERT_REMOTE.methods['creativeStudio/getProject'].invoke(remoteContext.remote,{id});if(!r.ok)throw new Error(r.error.message);return r.value;},
      async send(project,info,workspaceId,relativeDirectory,agentPreset){const r=await TYPERT_REMOTE.methods['creativeStudio/dispatchHandoff'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,handoffId:info.handoffId,workspaceId,relativeDirectory,agentPreset,confirmed:true});if(!r.ok)throw new Error(r.error.message);return r.value;},
    },
    handoff:{
      async readiness(id,versionId){const r=await TYPERT_REMOTE.methods['creativeStudio/handoffReadiness'].invoke(remoteContext.remote,{id,versionId});if(!r.ok)throw new Error(r.error.message);return r.value;},
      async export(id,versionId){const r=await TYPERT_REMOTE.methods['creativeStudio/exportHandoff'].invoke(remoteContext.remote,{id,versionId});if(!r.ok)throw new Error(r.error.message);return r.value;},
      async chunk(id,handoffId,offset,maxBytes){const r=await TYPERT_REMOTE.methods['creativeStudio/readHandoffChunk'].invoke(remoteContext.remote,{id,handoffId,offset,maxBytes});if(!r.ok)throw new Error(r.error.message);return r.value;},
    },
    async confirmTasks(project,versionId){const result=await TYPERT_REMOTE.methods['creativeStudio/confirmTaskPlan'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,versionId});if(!result.ok)throw new Error(result.error.message);return result.value;},
    async demo(project,scene){const result=await TYPERT_REMOTE.methods['creativeStudio/saveDemo'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,expectedContentRevision:project.contentRevision,scene});if(!result.ok)throw new Error(result.error.message);return result.value;},
    async feature(project,change){const result=await TYPERT_REMOTE.methods['creativeStudio/editFeature'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,change});if(!result.ok)throw new Error(result.error.message);return result.value;},
    async reference(project,change){
      const result=await TYPERT_REMOTE.methods['creativeStudio/editReference'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,change});
      if(!result.ok)throw new Error(result.error.message);
      return result.value;
    },
    async reject(project,proposalId){const result=await TYPERT_REMOTE.methods['creativeStudio/rejectProposal'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,proposalId});if(!result.ok)throw new Error(result.error.message);return result.value;},
    async rename(project,name){const result=await TYPERT_REMOTE.methods['creativeStudio/renameProject'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,name});if(!result.ok)throw new Error(result.error.message);return result.value;},
    async evidence(id,jobId,callId,offset){const result=await TYPERT_REMOTE.methods['creativeStudio/readResearchEvidence'].invoke(remoteContext.remote,{id,jobId,callId,offset});if(!result.ok)throw new Error(result.error.message);return result.value;},
    async research(project,referenceId,request,workspaceId){const result=await TYPERT_REMOTE.methods['creativeStudio/researchReference'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,referenceId,request,workspaceId,confirmed:true});if(!result.ok)throw new Error(result.error.message);return result.value;},
    async generate(project,request,workspaceId) {
      const result=await TYPERT_REMOTE.methods['creativeStudio/generateProposal'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,request,workspaceId});
      if(!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    async list() {
      const result = await TYPERT_REMOTE.methods['creativeStudio/listProjects'].invoke(remoteContext.remote, {});
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    async create(name) {
      const result = await TYPERT_REMOTE.methods['creativeStudio/createProject'].invoke(remoteContext.remote, { name });
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    async edit(project, change) {
      const result = await TYPERT_REMOTE.methods['creativeStudio/editRequirements'].invoke(remoteContext.remote, { id: project.id, expectedProjectRevision: project.projectRevision, expectedContentRevision: project.contentRevision, change });
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    async architecture(project, change) {
      const result = await TYPERT_REMOTE.methods['creativeStudio/editArchitecture'].invoke(remoteContext.remote, { id: project.id, expectedProjectRevision: project.projectRevision, expectedContentRevision: project.contentRevision, change });
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    async approve(project, label, review) {
      const result=await TYPERT_REMOTE.methods['creativeStudio/approveVersion'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,expectedContentRevision:project.contentRevision,label,review});
      if(!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    async adopt(project, proposalId) {
      const result=await TYPERT_REMOTE.methods['creativeStudio/adoptProposal'].invoke(remoteContext.remote,{id:project.id,expectedProjectRevision:project.projectRevision,expectedContentRevision:project.contentRevision,proposalId});
      if(!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    async get(id) {
      const result = await TYPERT_REMOTE.methods['creativeStudio/getProject'].invoke(remoteContext.remote, { id });
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
  });
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'creative-studio', order: 5, locale: namespace, label: () => t('title') }, StudioIcon));
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'creative-studio', locale: namespace }, Panel));
  ctx.effect(() => {
    void ctx.remote.$mount(TYPERT_REMOTE).then(async unmount => {
      if (disposed) { await unmount(); return; }
      release = unmount;
      ctx.inject(['remote', 'remote.creativeStudio'], child => {
        remoteContext = child;
        mounted = true;
        void refresh();
        child.effect(() => () => { mounted = false; });
      });
    }).catch(error => update({ status: 'error', error: error instanceof Error ? error.message : String(error) }));
    return () => {
      disposed = true;
      listeners.clear();
      if (release) void release().catch(() => undefined);
    };
  });
}
