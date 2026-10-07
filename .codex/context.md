# Console Web Agent 任务上下文与跨电脑交接

记录日期：2026-10-07（用户时区 America/New_York）。所有路径以仓库根目录为基准，不依赖电脑 A 的绝对路径。本文件是交接快照；当前架构 authority 仍为根 AGENTS.md、README.md、docs/README.md 及主题文档。

## 1 接手说明

你现在接手的是一个已有开发进度的项目。

请先阅读本文件，不要重新从零分析已经完成的内容。已有结论可直接用于制定修复，但开始修改前应针对选定问题做最小复现，确认新电脑环境或后续代码没有使证据失效。

**当前状态：**

- 前端产品基座、设置中心和 Reference/Showcase 已存在，可以通过 pnpm dev 访问。最近完成的是三轮 UI/UX、响应式、移动端专项审查，未实施报告中的修复。
- 本轮用户只要求生成交接上下文、核对迁移状态，不允许修改业务代码。
- 最新观察到的提交为 `b8ff45b0e89b7ec9e12aee9b15305430fcc83bfe`，标题 `Document UI UX audit findings and link state foundation`；分支 `main`。
- 在创建本文件前，git status 和 git diff 均为空。创建后应只有 `.codex/context.md` 是本轮新增未提交文件；若不同，应核查新的外部修改。
- 完整 pnpm check 未通过，已知停止于 ESLint：101 errors、13 warnings。可以启动不等于已通过生产交付门禁。

**下一步：**

1. 确认 Git 版本、依赖版本、运行环境差异和本文件是否已提交迁移。
2. 阅读三份审查报告的结论/问题表，优先 P0 的手机导航、1024px Shell 断点、短视口 Dialog。
3. 用户要求继续实施修复时，按第 7 节逐项推进；当前审查建议尚未作为产品改动落地，不能直接标记完成。

**执行要求：**

- 先读根和修改范围内的 AGENTS.md；保留已有优秀视觉、设计 Token、Element、Pattern、Motion 和 i18n。
- 不复制 legacy，不研究后端反向塑造新架构，不新增第二 Router，不在 UI Adapter 外直接 import HeroUI，不以 overflow-hidden 掩盖问题。
- 修公共能力前查全部真实消费者、对应 TailAdmin 具体页面及项目 authority，完成必要 Contract/Showcase/A11y/Responsive/Dark/Content/测试；视觉基线只能人工确认后更新。
- 门禁失败修根因，不能降低规则、提高截图阈值、添加无条件排除或断言掩盖。
- 不把本地偏好、会话和开发服务当成已迁移；不回滚不明来源修改，不自动重写锁文件。
- 本上下文不授予发布、合并、账号访问或任何额外外部操作权限。

## 2 项目信息与运行环境

| 项目                   | 实际信息                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| 仓库                   | console-web；远端 origin 为 `git@github.com:i0721/console-web.git`                                          |
| 文档名称               | Community Go Frontend Product Foundation；审查称 Community Console                                          |
| 根 package             | `community-go-frontend`，0.1.0，private pnpm monorepo                                                       |
| 技术基线               | React 19、Next.js 16 App Router、HeroUI v3、Tailwind CSS v4、TypeScript                                     |
| 当前 manifest 版本范围 | React ^19.2.8，Next ^16.3.3，HeroUI React/Styles ^3.2.4，Tailwind ^4.3.3；精确解析以 pnpm-lock.yaml 为准    |
| 其它基础能力           | React Aria、RHF/Form Foundation、i18next/i18n、Zustand/State Foundation、Zod/Schema、Vitest、Playwright/Axe |
| 电脑 A                 | Windows，PowerShell，原路径 `C:\rin\coder\i0721\console-web`                                                |
| 实际工具版本           | Node v24.19.0；pnpm 10.22.0（packageManager 同版本）；根声明 Node >=20.9.0                                  |
| Node 迁移注意          | 部分当前锁定传递依赖声明更高 Node 基线，不能仅按根 >=20.9 判断兼容；优先复用已验证的 Node 24 环境           |
| Workspace              | apps/_、packages/_、surfaces；onlyBuiltDependencies: esbuild、msw                                           |

启动从**仓库根目录**执行：

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

pnpm dev 调用 `tooling/plugin-codegen/dev.mjs`，编排 Plugin codegen watch、Design System runtime-codegen watch 和 Next dev。Next 服务绑定 `127.0.0.1:4173`，入口为 `http://127.0.0.1:4173`。不要只启动 Host 后误以为两个 watcher 也在运行。

本轮确认 4173 存在监听中的 Next Node 进程，首页 HTTP 200。前几轮浏览器实际访问了全部38路由；本轮 HTTP 检查只证明此刻入口响应，不证明所有功能正确。用户此前已启动 pnpm dev，本轮没有重启或终止服务。

`apps/web/.env.example` 唯一示例配置是可选的 `WEB_DEPLOYMENT_MODE=static`；还有 static-enumerated/server 模式。电脑 A 未发现 apps/web 本地 `.env*`（除示例），但进程继承的环境变量没有完整核查，实际外部覆盖未知。`apps/web/next.config.ts` 默认 static/export，distDir 默认 `dist`，可用 NEXT_DIST_DIR 覆盖。

不要把机密写入本文件。当前 `.gitignore` 没有忽略 `.env`，虽然示例注释称其不入库；以后若创建本地配置，先确保不会被广泛 git add 一起提交。

### 关键目录

```text
.codex/context.md                 本交接文件
AGENTS.md / README.md             规则与项目入口
apps/web                         唯一 Web Host、Next App Router、Browser 生命周期
  src/host                       Host Port、路由/滚动/离开确认等
  src/shell                      顶栏、导航、页面标签、通知中心
  src/state                      Host-owned state-foundation stores
  src/test / e2e                 单元、浏览器、可访问性与视觉测试
packages/design-system           Semantic Token、Motion、受控 stylesheet
packages/ui-adapter              HeroUI 边界与公共 UI Contract
packages/surface-foundation      产品 Page/Layout/Pattern/State/Motion recipe
packages/plugin-framework        Plugin/Route Target/Host Capability（不是 Router）
packages/state-foundation        Store/Persistence/Hydration/Storage 基础
packages/core / schemas / types  纯规则、输入验证、跨模块稳定类型
packages/form-foundation / i18n  表单生命周期、语言与格式化
surfaces/plugins                settings、ui-elements、motion、reference 等插件
surfaces/src                    Surface 公共模型/装配
surfaces/generated              自动生成产物，不手工修改
tooling                         codegen、架构/依赖/性能/文档门禁
docs                            当前主题 authority
docs/changes/107-settings-center 历史设置实施清单与设计
docs/changes/108-ui-ux-audit      三轮审查报告与截图/JSON/检查日志
```

实际当前 checkout 就是前端根目录，尽管历史文档称 `/frontend`；不要再假设存在一个需要进入的 frontend 子目录。

## 3 当前任务目标与背景

用户要求从资深 UI/UX、产品设计、前端架构视角，通过浏览器完整浏览、点击、滚动和状态切换评估项目，保留已有优秀设计，提升专业感、易用性、一致性和现代 Web 体验。随后扩展了响应式审查及手机设置/全部 Tab、Segment、导航切换专项，要求建立统一策略，而非只修单页。

这些审查目标已经完成；没有正在运行的代码修复，也没有未完成的 Agent 代码补丁。当前目标是把实际状态保存到本文件供另一台电脑接手。后续修复方向已提出，但审查请求本身没有要求实施全部建议。

## 4 已完成工作与文件状态

### 本会话已完成的审查

| 文件                                              | 内容与完成状态                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| docs/changes/108-ui-ux-audit/README.md            | 首轮38路由整体视觉/交互/架构评价、优点、1项P0/10项P1/3项P2、优化顺序；第10/11节链接后续专项                                       |
| docs/changes/108-ui-ux-audit/responsive-review.md | 38路由×5宽度=190基础测量，断点、英文18px大字号/宽松密度30组合、短浮层、缩放等效布局；R01～R10根因与建议                           |
| docs/changes/108-ui-ux-audit/mobile-review.md     | 38路由×320/390/430=114组合；八设置分类24样本；10内容Tabs、7ToggleGroup与PageTabs；设置五模式比较、A/B/C/D规范、M01～M13合并优先级 |
| docs/changes/108-ui-ux-audit/evidence/*           | 49个截图/JSON/日志，逐文件清单见文末；用于复现及证据，不是可自动批准的视觉基线                                                    |
| docs/changes/README.md                            | 新增108变更索引，说明审查范围及没有修改产品实现                                                                                   |
| .codex/context.md                                 | 本轮新建；整理实际状态、迁移要求、缺失信息及继续执行计划                                                                          |

审查没有实现产品功能或修复任何报告所列 UI Bug。已完成的是问题验证、误判纠正、根因定位、方案比较和报告交付。语言恢复为中文、临时开启的PageTabs恢复关闭、标准字号/密度与系统主题保持，临时视口覆盖已重置；最近访问与会话记录可能仍在浏览器。

### Git 状态变化与锁文件来源

本轮最初读取到 HEAD=`668b4e8`（init），工作区有：

- `docs/changes/README.md`：+1行审查索引。
- `pnpm-lock.yaml`：+461/-458行；这份修改在首次审查前已经存在，不是审查 Agent 新增。
- 108目录52个未跟踪文件：3份报告、49份证据，总大小1,754,303 bytes。

已实际检查 git diff。锁文件主要变化为移除显式 npm tarball URL；将旧锁文件中这些字段归一化后逐行比较，剩余是 `surfaces` importer 增加 `@community-go/state-foundation` workspace specifier/link 三行，当前 surfaces package manifest 确实依赖它。**修改的执行者、命令与原始动机未知**，没有回滚、重装或重新生成锁文件。

核对期间仓库出现新提交 `b8ff45b`，上述文件已经被提交。此后 git status/git diff/git diff --cached 均为空，本地 HEAD 与本地 origin/main 跟踪引用一致（ahead/behind=0/0）。本 Agent 没有执行 git add、commit、push、fetch；因此只能确认本地跟踪引用一致，不能凭此证明远端实时可拉取或新电脑 SSH 权限可用。

本文件生成后本轮预期未提交项只有 `.codex/context.md`，原因是用户请求的交接文档。未来提交后本段记录仍作为创建时快照，下一电脑以实时 Git 为准。

### 已存在的设置功能与历史待办

107记录和当前源码包含八分类设置、本地偏好持久化/迁移、字段搜索索引、分类/全部恢复、Host能力Port、页面标签、通知、草稿/最近/收藏及工作恢复等能力；设置持久化布局壳、分类图标、复用Host route-enter的内容动效也已存在。这些不是本审查新开发的功能，不能把历史checkbox当成今天重新验证通过。

`docs/changes/107-settings-center/tasks.md` 仍有两条未勾选：SET-002-002外部视觉完整复核、SET-002-005剩余DataTable列宽Resizable。部分已勾选分片内还有“剩余”说明，需要按局部描述核实。首页索引/107README的概要未完全反映更后面的SET-010～012进度，**以当前源码、实际行为和tasks细项为准**。其中“搜索结果定位滚动”的历史完成描述与本轮实际行为不同：当前结果只到分类，字段定位仍未实现。

## 5 运行、检查与未解决问题

### 已有检查证据

| 检查                             | 已知结果与范围                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm check（最近手机审查）       | Foundation、Architecture、Dependency、两个Codegen fresh通过；ESLint 101 errors/13 warnings停止；未进入后续类型/单测/build/performance/浏览器/格式/docs步骤 |
| 独立 pnpm typecheck（首轮）      | 通过；见 evidence/typecheck.log，含 Next typegen                                                                                                           |
| 独立 pnpm test（首轮）           | 59个测试文件、367个测试通过；见 evidence/unit-tests.log                                                                                                    |
| 文档格式/链接（手机审查）        | 四份审查/索引文档格式通过，mobile-review所有本地链接目标存在                                                                                               |
| docs:check（首轮）               | 失败：docs/README.md -> ../../docs/repository-scope.md 断链；既有问题                                                                                      |
| build/performance/全量浏览器门禁 | 本审查未获得完整通过证据；不能据此宣称性能合格或全量Axe通过                                                                                                |

本轮上下文交付另执行pnpm check，结果在最终迁移自检小节记录。没有为了文档工作顺带修lint或更改测试基线。

### 主要未解决问题与落点

| 优先级 | 已确认问题                                                                                          | 主要建议落点                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| P0     | 手机Shell导航自绘aside/scrim，缺完整Modal焦点、ESC和背景滚动管理                                    | apps/web/src/shell/app-shell.tsx；复用ui-adapter正式Drawer/Overlay                                                         |
| P0     | 1024px：Host lg显示侧栏，Surface max-width:64rem同时单列，main被整屏导航推后                        | packages/surface-foundation/src/styles.css、Host Shell断点消费者                                                           |
| P0     | 320×256有效视口Dialog Footer裁切，Tab能聚焦不可见操作                                               | packages/ui-adapter/src/overlays.tsx 与Adapter stylesheet的有限高度分配                                                    |
| P1     | SearchBox grid min-content突破设置列；44/51/68px输入高度漂移；Switch说明横向挤压                    | ui-adapter search-box.tsx、form-field.tsx、styles.css；查所有消费者                                                        |
| P1     | 全站320顶栏超宽，英文/大字号加剧；手机全局搜索入口不明显                                            | Host app-shell.tsx与正式导航/菜单组合                                                                                      |
| P1     | Settings分类Panel482px，390手机首字段文档Y=854～1088；搜索有字段索引但只跳分类                      | settings/src/settings-layout-shell.tsx、settings-index.ts、category-sections.tsx、routes/layout.tsx，正式Host目标/焦点接口 |
| P1     | ToggleGroup长组选项被裁切，不能横滚；英文三项也超宽                                                 | ui-adapter/src/toggle-group.tsx；Motion/UIActions/UIData七消费者                                                           |
| P1     | Tabs缩窄后选中项不可见；vertical手机回退仍column                                                    | ui-adapter/src/data-display.tsx；十消费者与Navigation Showcase                                                             |
| P1     | PageTabs访问前移后当前项部分裁切；设置子路由没有活动项                                              | apps/web/src/shell/page-tabs.tsx、页面入口身份及Store契约                                                                  |
| P1     | 工作台表797px/手机可见333px，详情在长页下方；部分Archetype按钮无结果、Reference用同一fixture/假完成 | page-archetypes/routes/resource-list/page.tsx、对应示例/Reference Plugin                                                   |
| P1     | 文案/首页指标与唯一Web Host等现状不一致；lint和docs断链阻碍交付                                     | owner i18n/首页/authority文档、错误文件各自修根因                                                                          |
| P2     | 20×20 PageTabs关闭命中区偏小、完整名称难发现；溢出提示、Showcase查阅层级、密度与微动效需收敛        | 正式Adapter/Host命中区、目录组合与Motion Recipe                                                                            |

首轮P1完整列表、各项原因/影响/验收见108README；响应式根因见R01～R10；手机汇总见M01～M13。问题编号不同报告有合并，不能直接相加计数。

性能目前只确认布局/内容任务成本，未量化Lighthouse、CWV、真实设备帧率或完整gzip预算；没有已证明的性能瓶颈。架构基础总体较好，维护风险是公共响应式契约不闭合、历史完成文档与真实行为冲突、Showcase行为不可信，而非要求推翻分层。

## 6 已分析方案与结论

以下是**审查推荐，尚未实施，也不是用户已确认的最终产品设计**。

- 设置手机：排除左右分栏作为手机主方案，内容空间不足；不推荐八分类顶栏Tabs，标签长、分组丢失、隐藏选项多。折叠分类可过渡但展开仍推内容。分类首页→独立页适合后续增长；当前推荐保留八路由，用当前分类触发器+正式Drawer，并让搜索结果定位字段。恢复操作降为次级，保留确认。
- 内容Tabs默认溢出选A横向滚动；桌面短项自然宽度、语义间距，但嵌套窄容器仍需回退。已证明普通Tabs能滚动，不能再把它写成全站无滚动能力。
- B换行适合独立多选Toggle/目录链接，不作为line/soft内容Tabs或连体单选分段默认方案。
- C Select/Dropdown适合低频长单选；不能把多选改成单选，不能把路由导航伪装为内容tab。
- D“当前页/稳定常用项+更多”适合PageTabs；隐藏项选中后应显式显示当前名称，避免每次选中都重排位置。普通内容Tabs没有主次时不要任意隐藏。
- 不选页面特例CSS、全局降低Radio高度、overflow-hidden掩盖、不选第二套状态/Router/自研键盘机制。保留HeroUI Selection/Focus/Overlay和项目语义Motion。
- 尺寸变化、语言变化、受控选择、恢复与PageTabs重排需要保持当前项可见；只滚列表，不能拉动整页或持续抢回用户手动滚动。

## 7 后续实施计划（用户要求继续修复时）

1. **基线与P0**：最小复现手机导航焦点、1023/1024/1025、Dialog 320×256；查真实消费者，分别修Host Overlay装配、断点边界、Dialog空间分配。补必要键盘/焦点/短高度回归。
2. **公共切换契约**：toggle-group.tsx解决祖先收缩与实际溢出策略；data-display.tsx明确vertical回退及当前项可见性。复核7/10消费者与Showcase，中英、徽标、禁用、长文、resize、controlled selected、草稿保持。需要公共能力扩展则登记foundation-contracts，不把vendor props透给Page。
3. **公共字段/搜索**：form-field/SearchBox/compound布局修轨道和方向；查全部真实调用方、大字号/密度，禁止用统一高度或裁切遮蔽内容错误。
4. **Settings任务优先级**：当前分类入口+正式Drawer、字段目标、同路由定位、正确焦点与返回、次级恢复操作。优先Plugin composition，Browser生命周期由Host/明确Adapter提供，不把设置视觉塞PluginFramework。
5. **PageTabs/顶栏/数据**：Host标签身份与重排、移动更多入口/触控区域、顶栏空间预算；工作台身份/状态/主动作优先，详情用正式Drawer或既有详情路由，数据逻辑保持一套。
6. **工程与历史收尾**：逐文件修既有lint、文档断链；核查107两个未完成与分片剩余，不用审查完成替代视觉人工确认；修示例无效动作与假完成/过期文案。
7. **交付回归**：pnpm check；Playwright关键流程/Keyboard/Focus/Axe，桌面、超宽、手机、Dark、英文大字号、Floating打开态；真实iOS/Android另补触摸/软键盘/动态工具栏/安全区。不得提高diff阈值或自动批准视觉基线。

## 8 迁移可行性、缺失上下文与电脑 B 操作

仓库源码、报告与49份证据已在本地提交中，适合通过Git迁移。**新交接文件必须再提交并推送，才能随clone/pull获得。** 当前Agent没有执行提交/推送，用户消息中的相关命令视为后续流程示例，不把文档整理扩展为Git写操作。

迁移自检与建议：

```powershell
git status --short --untracked-files=all
git diff
git diff --cached
git log -3 --oneline
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

先安装依赖再安装浏览器。Linux环境若浏览器缺系统依赖，按Playwright官方安装要求处理；本轮没有验证Linux/macOS安装。若frozen install报错，检查错误与manifest/锁文件，不能无声改锁。当前传递依赖需要比根最低声明更高Node，优先使用已验证24环境。

电脑 A 的node_modules、dist/.next、测试输出、pnpm store、运行中的服务、系统字体、浏览器localStorage/sessionStorage/IndexedDB与Codex聊天历史不会因普通Git迁移自动复制。图片基线可能受OS/字体差异影响，先确定差异来源，不能直接重拍认作正确。偏好/草稿无账号后端或跨设备同步。

重要缺失/不确定项：

- 新电脑OS、字体、Node/pnpm、浏览器、SSH/GitHub权限、端口占用与环境变量未知。
- 没有联网验证远端实际最新提交；本地origin/main一致只是跟踪引用状态。
- pnpm-lock此前修改的执行者和命令未知；目前已提交，变更性质如第4节。
- 107引用历史研究基线`77740c19`，当前可见Git历史为init→b8ff45b；旧基线是否可获取未验证，不能假设本clone包含全部历史。
- 完整build/performance/e2e/Axe/真实手机/原生zoom缺最新通过证据。此前zoom为有效CSS视口模拟，截图有捕获软化，不把其计为字体缺陷。
- 107局部checkbox与“剩余”说明、当前搜索真实行为有差异；按实际行为核实，不能重新盲目认领完成。

电脑 B 接手后先确认上述环境差异和实时Git，读108的已有结论；无需重新做38路由全量研究。针对本次实施范围做最小复现和消费者检查，再依次推进计划。若用户只要求迁移确认，就只核查并补上下文，不修改产品。

## 9 本轮最终迁移自检

本轮最终核对：HEAD仍为b8ff45b，`git status --short --untracked-files=all`仅输出`?? .codex/context.md`；tracked/staged diff均为空，未修改任何业务源码、配置、锁文件或原有审查记录。本文件未被.gitignore忽略，需随下一次提交迁移。

本轮执行pnpm check：前置Foundation/Architecture/Dependency/Codegen通过，仍在ESLint停止，114 problems（101 errors、13 warnings），exit 1。没有进入后续交付步骤，也没有以自动fix修改业务代码。日志写到电脑A临时目录，不依赖它迁移；相同失败的已提交日志在108/evidence/mobile/pnpm-check.log。

本文件Prettier检查通过；文末49条证据路径与实际文件逐项核对存在。迁移上下文已补齐到当前可确认的范围；第8节未知项需要电脑B实测，不能替代为猜测。

## 10 已提交审查证据逐文件清单

下表从实际目录生成。截图记录视觉状态，JSON记录结构/坐标/交互样本，日志记录命令检查；具体解释与复现由三份报告提供。

| 文件                                                                              | 类型              | 用途                                  |
| --------------------------------------------------------------------------------- | ----------------- | ------------------------------------- |
| `docs/changes/108-ui-ux-audit/evidence/dialog-dark.jpg`                           | 截图              | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/dialog-desktop.jpg`                        | 截图              | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/docs-check.log`                            | 检查日志          | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/forms-mobile-en-long.jpg`                  | 截图              | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/mobile/all-routes.json`                    | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/english-segments-320.jpg`           | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/english-segments.json`              | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/english-tabs-320.jpg`               | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/english-tabs.json`                  | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/landscape-settings.json`            | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/motion-segments-390.jpg`            | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/page-tabs-reorder.jpg`              | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/page-tabs.json`                     | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/pnpm-check.log`                     | 检查日志          | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/resize-selected.jpg`                | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/resize-selected.json`               | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/segments-overflow.json`             | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/settings-categories.json`           | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/settings-search.json`               | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/state-tabs-end.jpg`                 | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/state-tabs-end.json`                | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/state-tabs-start.jpg`               | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/tab-interactions.json`              | DOM/布局/交互记录 | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/mobile/vertical-tabs-390.jpg`              | 截图              | 手机设置、Tabs、Segment、PageTabs专项 |
| `docs/changes/108-ui-ux-audit/evidence/navigation-mobile-open.jpg`                | 截图              | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/overview-wide.jpg`                         | 截图              | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/pnpm-check.log`                            | 检查日志          | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/responsive/breakpoints.json`               | DOM/布局/交互记录 | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/command-320.jpg`                | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/dialog-320-256.jpg`             | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/dialog-short-focus.json`        | DOM/布局/交互记录 | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/dialog-short.jpg`               | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/drawer-320-256.jpg`             | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/english-large-comfortable.json` | DOM/布局/交互记录 | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/form-controls-1025.jpg`         | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/forms-1025-en-large.jpg`        | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/matrix.json`                    | DOM/布局/交互记录 | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/overlays.json`                  | DOM/布局/交互记录 | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/pnpm-check.log`                 | 检查日志          | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/settings-1024.jpg`              | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/settings-1280.jpg`              | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/settings-2560.jpg`              | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/settings-390-en-large.jpg`      | 截图              | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/settings-widths.json`           | DOM/布局/交互记录 | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/responsive/zoom-equivalent.json`           | DOM/布局/交互记录 | 响应式、断点、密度、短高度浮层专项    |
| `docs/changes/108-ui-ux-audit/evidence/settings-mobile.jpg`                       | 截图              | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/typecheck.log`                             | 检查日志          | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/unit-tests.log`                            | 检查日志          | 首轮UI/UX与工程检查                   |
| `docs/changes/108-ui-ux-audit/evidence/workspace-mobile.jpg`                      | 截图              | 首轮UI/UX与工程检查                   |
