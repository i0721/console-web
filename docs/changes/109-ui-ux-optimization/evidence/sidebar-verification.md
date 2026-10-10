# Sidebar 专项验证

2026-10-11。方案与消费者见 [专项设计](../design/sidebar-review.md)。

原有导航回归 sidebar-existing-browser.txt：6 通过、2 因图标栏/Flyout 视觉差异失败。
未改旧基线、未放宽阈值。首轮专项 7 项中 4 通过，暴露点击固定、模式切换首次点击和
remember 被主题/语言更新复位。原日志 sidebar-browser.txt，第二轮
sidebar-browser-retry.txt 与 pin 定位 sidebar-pin-debug.txt 保留，不代替最终成绩。

覆盖图标/热区/对齐、Hover/Focus/Escape Tooltip、当前页 ARIA、Flyout 跨层/点击/
键盘/触摸、探索状态、1024/1440/2560、Dark/English、短高度、字体比例、
320/390/768/1023 Drawer 与 Reduced Motion。截图在 sidebar/，Axe 按 WCAG A/AA。
字体倍率和 hasTouch 是模拟验证，不等于原生浏览器 Zoom 或真实设备。

现役代码 10 项专项全部通过，最终日志 sidebar-accessible-final.txt；同时覆盖紧凑/舒适/
增强点击区 Token 映射和两种模式的同一图标轴线、双向 40 帧宽度/位置检查、以及
Tooltip Link 的 Host dirty leave confirmation。较早 sidebar-focused-final.txt 的轴线失败
真实暴露旧栏宽居中跳动，固定组宽后 sidebar-motion-fixed.txt / sidebar-complete.txt
通过，再补密度策略复验；这些早期日志不代替现役成绩。

全量中的命令导航首次超过 5 秒（trace 中 RSC 请求仍 pending），原断言复验通过，
见 sidebar-focused-final.txt。DatePicker 首次截图位置漂移，原断言完整复验通过，
见 sidebar-overlay-recheck.txt；不改该基线，也不修改其测试或阈值。

首次 `pnpm check` 的治理/类型/单元/构建通过，性能预算暴露 maxRoute 442372B 大于
440320B；修复为 Host 整棵 NavigationTree 按需加载，不提高预算，也不替换已聚焦链接。
最终顺序构建及原预算通过：initial 373763B、maxRoute 438385B、CSS 48384B。
日志 sidebar-build-final.txt / sidebar-performance-final.txt。期间并行重建因 Next 清理
开发缓存与服务竞争失败，保留 sidebar-build-concurrent.txt；不计入最终构建成绩。

### 完整回归与原断言复验

`sidebar-check-final.txt` 记录完整 `pnpm check`：403 单元通过；当时发现 338 个浏览器
测试，324 通过、14 失败，命令并未 exit 0。之后补充第 10 个 Sidebar 专项，当前总数
339。全量期间并行构建与开发缓存发生竞争，因此隔离复验所有失败项，未修改断言。
`sidebar-last-failed.txt` 的 14 项中 7 通过、7 失败：命令、DatePicker、草稿恢复、
UI Elements 桌面和三个 Backend Contract 均通过，后端缓存竞争不计作业务失败。

为判断 Reference/Forms 截图不稳定是否为真实布局回归，使用修改前 HEAD
`6c405084ca9c737fa0e59de09c5486ada77ed386` 的独立托管 worktree、独立 4175 服务与
原测试/原基线复验 Reference、九个 Family、Toast/Confirm：3 项全部通过，日志
`sidebar-baseline-probe.txt`。该诊断 worktree 已归档；没有复制其它 checkout 的依赖链接。
随后现役代码顺序执行同样原断言：Reference 桌面/超宽屏通过、Forms 通过；仅 Overlay
Family 和 Confirm 的稳定差异失败，日志 `sidebar-visual-isolated.txt`。先前的 Reference/
Forms 不稳定截图不作为新基线；也不因此宣称完整门禁已通过。

### 人工视觉确认与限定更新

[最终前后对照](sidebar/visual-differences-final/index.html) 中用户已确认的 6 项：展开父级导航、
收缩 Flyout、收缩兄弟切换、移动 Drawer、Overlay Family 与 Confirm。
前三项和 Drawer 来自正式 Sidebar 模式/激活/轴线改进；Overlay Family 新增同源
Tooltip/Flyout 示例后高度从 1074 变为 1114；Confirm 的背景受同页示例影响，弹窗
边缘/文字还存在约 1px 的差异，纳入对照复核；没有修改 Dialog 契约或默认样式。
其它两项保留失败现场并标记不更新，原断言复验已通过。

每项原基线/当前结果/差异及 SHA-256 在 manifest.json；收集时逐项验证 expected hash
与当时仓库 golden 相同。用户回复“确认”后再次校验原基线与 reviewed actual 的 hash，
仅复制这 6 个确认文件；更新前后 hash 和确认时间保存在
[approved-baselines.json](sidebar/visual-differences-final/approved-baselines.json)。没有修改
其它 golden、阈值或测试排除。保留前后图片和早期失败证据；原图不因确认而覆盖。
确认后的视觉复验见 sidebar-approved-visual.txt，随后执行完整 pnpm check。

### 按目标逐项核对

| 用户验收项                          | 当前证据与结论                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 先实测再分析、参考成熟设计          | sidebar-review.md 记录原始几何与实际 TailAdmin Tooltip/Popover 状态；108 审查已追加专项                                            |
| 图标/容器比例、对齐、间距和点击区   | sidebar-design.spec.ts 第 1/4 项通过：24px 图标、48px 热区、80px 标准栏宽；密度与增强热区同源联动                                  |
| 展开与收缩分别定义、状态共享        | Surface Shell 管模式布局，Adapter 管 Trigger/Overlay；第 3 项验证展开 264px/16px 与探索状态保留                                    |
| 当前页、祖先激活、Hover/Press/Focus | 第 1 项验证 aria-current、祖先激活、提示和 2px/4px 焦点；状态样式由同一 Adapter 规则消费 Token                                     |
| Tooltip、子菜单不丢功能、避免误关   | 第 2/6/8 项验证跨层 Hover、点击固定/再次关闭、键盘焦点保持、Escape、触摸子级导航与同源 Showcase；原深层 Accordion fixture 单元通过 |
| Header/主内容联动、品牌/底部高度    | 第 7/10 项验证布局列联动及双向 40 帧图标轴线；原 navigation.spec.ts 的滚动/品牌/底部测试在全量通过                                 |
| 偏好/当前位置、刷新、Host 导航保护  | 第 1/3/5/9 项覆盖刷新恢复、模式往返、移动再回桌面、dirty leave confirmation；Shell Store 单元通过                                  |
| 桌面/窄屏/移动/Dark/英文/短高度     | 第 4/5 项覆盖 1024/1440/2560、320/390/768/1023、Dark/English、480px 高度；截图保存在 sidebar/                                      |
| 缩放与触摸验证的边界                | 已验证 125% 字体缩放和 hasTouch 模拟；不是原生浏览器 Zoom 或真实触摸设备，不能把模拟证据扩张为硬件验证                             |
| 无障碍与轻量 Motion                 | 第 2/7/8 项包含 Axe；第 5 项验证 Drawer 焦点圈定/恢复；第 7/10 项覆盖 Reduced Motion 与正常切换                                    |
| 公共边界、原预算与报告              | Foundation/Architecture、Lint/TypeScript、403 单元、顺序构建/原性能预算、格式/文档门禁通过；设计和审查已更新                       |
| 最终完整门禁与视觉验收              | 6 项已人工确认并限定更新；最终完整 pnpm check 尚待结果，不能以专项通过替代                                                         |

上述核对不增加新验收标准，也不把未验证的原生 Zoom/真实设备或未通过的完整门禁记为完成。
