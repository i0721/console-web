# 实施与验收账本

每项完成须有代码与对应证据，历史报告不等于当前验收。

- [ ] UX109-01 主P0-01/M01：正式手机导航、焦点/ESC/背景/跨断点。
- [x] UX109-02 R01/M02：Shell 1023/1024/1025 互补区间。
- [x] UX109-03 R02/M02：短视口 Dialog/Confirm/危险确认与 Pending。
- [ ] UX109-04 主P1-01/R07/M09：顶栏预算与手机全局搜索。
- [ ] UX109-05 R03/R04/R05/M10：搜索收缩、字段高度、compound 方向及容器分列。
- [ ] UX109-06 M05/M06/M07/M13：七 Toggle/十 Tabs 的可达性、方向和当前项。
- [ ] UX109-07 主P1-02/R06/M03/M04：设置分类抽屉、字段定位、紧凑组合与恢复。
- [x] UX109-08 R09/107：密度尺寸语义与外观 schema 权威。
- [ ] UX109-09 M08/M12：PageTabs 身份、更多入口、触控与离开保护。
- [x] UX109-10 主P1-09：面包屑及修饰键导航。
- [ ] UX109-11 主P1-03/06/R08/M11：工作台详情、Toolbar、搜索与清除。
- [ ] UX109-12 SET-002-005：正式列宽调整、记忆、迁移与 Showcase。
- [x] UX109-13 主P1-04：Archetype/Pattern 启用动作与状态闭环。
- [x] UX109-14 主P1-05：Reference 身份、校验、保存/通知/草稿一致性。
- [ ] UX109-15 主P1-07/08：i18n、首页事实与 Foundations。
- [ ] UX109-16 主P2-01/03/M09/M13：容器层级、Showcase 目录/状态查阅。
- [x] UX109-17 主P2-02：连续导航、进度与 reduced motion 实测。
- [ ] UX109-18 主P1-10/R10/SET-002-002：lint、文档、全门禁及视觉复核。

## 新增发现

- PageTabs 关闭活动页直接删除/导航，绕过离开确认。
- Host Link 无条件 preventDefault，且 onNavigate 在确认前执行。
- Settings Archetype 的 notifications 锚点没有对应区段。
- Reference 保存到其它路由前未先清理 dirty 基线；创建页缺 dirty 注册。

## 当前实施状态与验收依据

以下“已实施”表示当前代码包含修改，不代表全部矩阵已验收。上方 checkbox 只在
对应工作包的剩余验证完成后勾选。最终门禁日志为 `evidence/check-final.txt`；
早期失败、被中断的日志仍保留，不与当前通过结果混用。

| 工作包                | 根因与当前代码                                                                                                                                                          | 消费者影响及当前证据                                                                                                                   | 剩余验收                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 01/02 手机导航、Shell | Host `app-shell.tsx` 使用正式左 Drawer；`surface-foundation/styles.css` 手机区间改为 `<64rem`，桌面仍 `lg`。跨桌面关闭浮层。                                            | 桌面/手机复用导航树；原默认右 Drawer 保持。`browser-109.txt` 的 ESC、焦点返回、跨断点及 16 个宽度边界通过。                            | 自动化已过；手机导航 Light/Dark/英文视觉批准。                                    |
| 03 短视口与确认       | Adapter 保留 HeroUI anatomy；普通正文滚动，短高度允许完整 Dialog 滚动。确认使用即时 pending guard，失败保留错误，重试清旧错误。                                         | 所有 Dialog/Confirm 消费者共享修复；`critical-controls.txt` 普通/危险确认 256/400px 动作可达通过。                                     | 短高度、Pending/失败恢复及原确认基线已过；全站视觉门独立保留。                    |
| 04 顶栏与搜索         | 小屏保留导航/搜索/账户核心入口，语言与主题进入账户菜单；Command 可无可见触发器由顶栏调用。                                                                              | Shell 全路由；320px 文档边界通过。                                                                                                     | 自动化已过；顶栏/Command 当前差异视觉批准。                                       |
| 05 字段、收缩及容器   | Search 根/Group/Input 的 min-width 收口；`.ui-field` 起始对齐；Switch/Radio/Checkbox Content 纵向且可收缩。Showcase 使用 auto-fit。                                     | 字段模块拆分但保留 `form-field` 公共入口；TextArea/Date 等交互仍归 HeroUI；输入 ref/onBlur 接 Form Foundation。                        | 局部几何、三密度、字段行为已过；Forms 当前差异视觉批准。                          |
| 06 切换控件           | 单选 Toggle 内部横滚，多选换行。Tabs 根据真实 orientation 同步布局与键盘；选择/尺寸/语言变动才揭示当前项，不抢手动滚动。动态失效项回退首个 enabled 项。                 | 7 个 Toggle、10 个 Tabs 见 research/consumers.md；公开 API 不透传 vendor。                                                             | 30 个 Tabs 组合及三密度 Family 检查已过；切换控件视觉批准。                       |
| 07 设置               | 分类内容同源，窄空间当前分类+Drawer，桌面侧栏；字段稳定片段；Host 等浮层关闭后聚焦控件。短枚举行、布尔行、次级恢复区；移除 `as never`。                                 | 保留 8 路由、3 组分类及偏好 Store；`browser-109.txt` 同路由字号定位通过；原恢复/存储失败测试纳入全套。                                 | 定位、恢复、存储失败、分类状态已过；Settings 视觉批准。                           |
| 08 密度/外观          | appearanceProfiles 纳入 Design System schema/生成器；保持原数值与优先级。默认控制高度跟随 density；small/embedded 有明确语义。                                          | 生成区域由 codegen 输出，freshness 通过；现有用户 preference/key 不变。                                                                | Schema、authority、生成与三密度检查已过；控件视觉归 05/06。                       |
| 09 页面标签           | Catalog 判断全部有效页面，已提交 h1 提供标题；pathname 身份保留最后实体 href；访问顺序稳定。手机当前项+完整名称菜单。关闭活动项先确认；hydrate 后记录避免覆盖会话恢复。 | 原 session key，v2 显式迁移；`tab-close.txt` 取消保留输入/标签，确认回 Beta 详情通过。                                                 | 恢复、关闭取消/确认及身份已过；标签与菜单视觉批准。                               |
| 10 导航/面包屑        | 正式上级 RouteLink；Host 保留修饰键、新页打开行为。导航回调在确认后执行；同目标只关闭浮层。连续 leave 请求结束上一请求，避免悬挂。                                      | Registry 只解析 query/fragment，Next 仍唯一 Router；`navigation-final.txt` 4 项通过。                                                  | 修饰键、新标签、浏览器返回、连续确认检查已过。                                    |
| 11 工作台             | route 只编排，私有派生规则/页面/browser adapter 分离；共享详情在窄空间 Drawer、桌面 SplitView。Enter 模式显式提交；Clear all 清查询/筛选/页码。默认窄列不覆盖保存偏好。 | 同一表格/详情/selected identity，无手机复制数据列表；visibility/online/timer 归 browser adapter。                                      | 详情身份/焦点/选择/打开态 Axe、搜索恢复等已过；工作台视觉批准。                   |
| 12 列宽               | 正式 ResizableContainer/ColumnResizer，指针/键盘由 HeroUI；稳定 column id 宽度。v2 原 key 迁移，隐藏/顺序/排序互不覆盖。坏数据显式恢复失败并可重试。                    | DataTable 可选能力，未启用消费者保留原 Table；`column-resize.txt` 指针、键盘及 reload 通过；UI Data Showcase 同源。                    | 指针/键盘/reload、隐藏、remember off、损坏恢复已过；公共列宽与 107 视觉门待批准。 |
| 13 示例               | Archetype review/edit/settings/master-detail/operation 使用确定性本地状态；Notifications 有实际锚点。Pattern 工具条/批量/表单闭环，静态槽位说明。                       | 原 Page/Section/State 组合，无新万能抽象；operation timer 卸载清理。                                                                   | 确定性动作、失败/重试/取消、编辑校验/保存/重置已过。                              |
| 14 Reference          | id 查询贯穿列表/详情/编辑/通知/最近访问/收藏；不存在实体明确返回。Plugin 非持久化资源 Store，Zod 校验；成功更新基线/数据再离开，创建 dirty 与草稿注册。                 | fixture 刷新恢复；已有 durable draft 保留。`draft-restore.txt` 4 项通过；Beta 身份/校验本轮复测。受控字段修复 RAC 重置后陈旧默认值。   | 实体、校验、保存去向、通知/草稿及并发/卸载回归已过。                              |
| 15 内容               | 所属 namespace 收口说明与状态；数字/时间经 i18n。首页 3 主入口、Catalog 推导路由/插件/唯一 Host；Foundations 表达 Universal/Surface/Host。                              | 删除无口径百分比与 Sprint 暗示；保留辅助最近/收藏，单区段全宽。                                                                        | Catalog 全路由标题/主内容及本地化回归已过；首页/authority 视觉批准。              |
| 16 层级/查阅          | 有证据普通容器用 outlined/embedded；手机目录收起，真实 ComponentPreview 锚点与索引；状态标签进入 i18n。                                                                 | 不改全局 shadow/default token；当前 Family 和本页内容同源。                                                                            | 目录、索引焦点、局部边界已过；Showcase 视觉批准。                                 |
| 17 动效               | 不调整全局 duration；修同目标导航、离开确认、标签记录/页面切换生命周期。                                                                                                | Motion Token/Recipe 及 reduced policy 保持；原快速导航/进度测试纳入全套。                                                              | 快速连续导航、浏览器返回、进度收尾、reduced motion 已过；不改全局 duration。      |
| 18 工程               | 修 lint 根因（Fast Refresh、类型/Promise/可访问性等）及文档断链；模块切分/lazy 降低真实构建开销。Next dev `.next` / production `dist` 避免并行目录冲突。                | 500 文件架构、25 依赖治理及生成 fresh 已过；最新生产预算通过：最大路由 432613 B，原上限 440320 B。公共入口保持，CSS sideEffects 保留。 | 219 项中 205 通过、14 视觉失败；人工批准和真实设备限制仍保留。                    |

## 实施中追加的实际缺陷

- Reference 非受控输入在 reset/草稿恢复后保留旧默认值：改为 Form Foundation
  受控桥接并接 ref/onBlur，草稿刷新测试 4 项通过。
- PageTabs 在 hydration 前记录当前页覆盖旧会话：使用 state-foundation hydration
  门控；恢复专项已通过（fixes-behavior.txt）。
- 本轮同时运行 dev 与生产 build 共用输出目录出现 ENOTEMPTY：Host 根据 Next
  phase 分离输出，dev 原端口不变；没有删除现场或关闭既有 codegen watcher。
- DataTable resizer 半个命中区被相邻 sticky 列覆盖：Adapter 内把正式手柄保持
  在列边界内部；指针和键盘复测通过。
- 保存后导航仍触发未保存确认、活动标签关闭绕过确认、同目标浮层不关闭等已修。

## 风险与待确认

- TailAdmin 对应 Modals/Tabs/Button Group/Form/Data Table 页面已读取并保存截图。
  终端曾导航超时，后续应用内浏览器已取得五页 × 两主题 × 三宽度的 30 张
  当前截图及切换、分页、查询、日期打开态，见 evidence/tailadmin-review.html。
  这不构成 107 人工视觉门及全部状态均通过的证据。
- controlled HeroUI 根节点没有内部 Pressable 时有 PressResponder 警告；已核对
  安装的 3.2.4 源码，Drawer.Root 正式委托 RAC DialogTrigger，受控参数仍走公开
  isOpen/onOpenChange。当前 ESC/焦点返回/Axe 已有行为证据，保留 vendor 警告为
  非阻塞来源记录，不制造隐藏按钮或改写 vendor anatomy 消警告。
- 已有视觉快照可能因合理设计变化失败；不得提高阈值或自动批准。
  需给出当前截图与差异供人工确认后再更新。

## 验证环境限制

原生 zoom、真实 iOS/Android、软键盘、动态工具栏和安全区另需设备证据；不以
CSS 视口模拟替代这些结论。人工视觉基线确认独立于自动化检查。

## 最新追加验证与环境收口

- `deferred-and-draft.txt`：列隐藏/重载和恢复草稿后继续创建 3 项通过；另 3 项
  超时来自测试遗漏原生 disabled，已修定位，并非产品可选项卡住。
- `toggle-boundaries-final.txt`：9 Family × 3 密度，Dark/English/大字号/320px，
  搜索父边界及 Toggle 最后可选项可见性均通过。Showcase 的局部 spacing 控制
  独立于 Host density，不把两者混为一项配置。
- `tabs-geometry-current.txt`：10 个 Tabs 消费者 × 320/767/768，30 组合当前项
  可见；vertical 回退与实际方向同步。
- `fixes-behavior.txt`：标签刷新恢复、搜索建议 listitem 语义、设置单次进入动效、
  Operation 失败/重试/取消、Detail 校验/保存/重置专项通过。
- 大字号将 body 原 20rem 最小宽度放大为 360px，导致 320px 溢出：Host 改为
  min-width:0，由正式 Shell/组件负责几何，公共 Family 矩阵已验证。
- Settings 持久 Layout 使用 Page 后出现外层与内层重复进入：Motion Recipe 通过
  既有 data-route-content 标记排除持久外层，不改变全局 duration。
- 恢复草稿的默认名称被永久作为 dirty 条件：改为未保存恢复标记，并在成功提交后
  清理；保存继续创建、输入再清空、返回列表不出现错误确认的回归通过。
- 工作台详情与列配置拆成 Plugin 私有按需视图，桌面和手机仍共享同一身份；
  导出 Browser Adapter 在操作时加载，批量确认等待真实 Promise。
- Git core.autocrlf 与 Prettier LF 冲突造成 304 个格式报告；增加 .gitattributes
  收口 LF 并执行 Prettier，不回滚初始工作区，不修改历史审查结论或快照。
- Playwright 截图断言使用 soft 保留原失败判定/阈值，同时继续后续键盘/Axe 检查，
  收集完整人工复核差异；未更新 baseline，视觉失败仍会使门禁失败。
- 本轮另实测两个提交缺陷：同帧 requestSubmit 两次创建两条记录；延迟校验期间
  离开页面，完成后旧提交又把用户拉回列表。证据为 duplicate-submit-before.txt
  与 stale-submit-before.txt。Form Foundation 为两个真实消费者增加即时提交锁、
  finally 释放及卸载后的校验回调门控；Reference Pending 字段不可编辑。
- Create/Edit 本地示例定时器移入私有 Browser Adapter，卸载时清理并结束等待，
  不在离开后发布旧反馈。没有增加公共 API 或改变全局 Motion 时长。
- submit-guards-final.txt：导出失败/保留选择/重试真实下载、重复提交/首错重试、
  过期校验不写入不重定向、模拟保存卸载清理，4 项全部通过。
- 工作台详情 fixture 说明与 IconAction/Retry 的反馈文案进入所属 namespace；
  原导出 fixture 数据保持，专有名称与技术标识不伪装成翻译文案。
- 上次完整检查为 214 项浏览器用例，199 通过、15 失败（14 视觉、1 Toast 范围
  过宽的测试定位）；日志 check-before-submit-guards.txt。当前 check-final.txt
  覆盖最后修正及新增 3 项回归，二者不能混用为最终全绿证据。
- confirm-pending-final.txt：阻塞真实导出模块期间，确认/取消禁用、ESC 与背景
  点击不能关闭、重复原生点击只下载一次；释放后成功关闭，独立回归 1 项通过。
  该文件在本次完整回归发现测试后加入，单列证据，不算入 217 项总数。
- 最后手机详情专项实际发现关闭后焦点落在页面根部；原即时打开早于表格完成
  选中焦点。Plugin 私有 Browser Adapter 延后一帧打开，交还 HeroUI 正常焦点
  恢复，并清理未完成 frame、跨桌面关闭。detail-focus-final.txt 验证同一实体、
  关闭后选中/可见/焦点保留、跨 1280 回桌面详情及打开态 Axe，1 项通过。
- 工作台详情改用现有 embedded（Drawer）/outlined（桌面）组合，移除普通内容
  面的额外阴影；不改 Panel 默认值或公共 Token。
- check-before-detail-focus.txt 为 217 项完整回归：203 通过、14 视觉比较失败；
  错误均为 toHaveScreenshot，不包含其后键盘/Axe/状态断言失败。最后局部修改
  与两项新增用例由重新执行的 check-final.txt 验证，旧结果不冒充最终代码结果。
- 108 中 18 个文本证据文件仅有格式空白差异，逐文件移除空白后与 HEAD 内容
  相同；审查结论、JSON 数据与像素证据未改。已有 Playwright baseline 修改数为 0。

## 最终自动化结果（当前代码）

最终完整检查为 219 项浏览器用例，205 通过、14 失败；27 个错误均为
toHaveScreenshot，未出现其它行为断言失败。源码在最后详情组合和焦点修复后
重新执行治理、lint、类型、369 项单元测试、生产构建与原产物预算，均通过。
最大 Route gzip 432613 B，原上限 440320 B；未提高预算、diff 阈值或更新快照。

[最终日志](evidence/check-final.txt) 与 [27 组视觉对照](evidence/visual-diffs-final/index.html)
分别保留判定和原尺寸像素。完整命令因视觉失败 exit 1；其后格式/文档门独立补跑，
结果见 [最终验证记录](evidence/verification.md)。两个后补专项已纳入本次 219 项。

勾选项表示其职责的代码与自动化要求已闭合，不表示整体变更全部验收。涉及当前
视觉差异的工作包继续未勾；107 列宽整体视觉验收和外部全状态人工门仍保留。
真实设备/原生 zoom 无证据，不声称通过。
