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

### 待人工视觉确认

[最终前后对照](sidebar/visual-differences-final/index.html) 中 6 项待确认：展开父级导航、
收缩 Flyout、收缩兄弟切换、移动 Drawer、Overlay Family 与 Confirm。
前三项和 Drawer 来自正式 Sidebar 模式/激活/轴线改进；Overlay Family 新增同源
Tooltip/Flyout 示例后高度从 1074 变为 1114；Confirm 的背景受同页示例影响，弹窗
边缘/文字还存在约 1px 的差异，纳入对照复核；没有修改 Dialog 契约或默认样式。
其它两项保留失败现场并标记不更新，原断言复验已通过。

每项原基线/当前结果/差异及 SHA-256 在 manifest.json；收集时逐项验证 expected hash
与仓库现有 golden 相同。没有修改任何 golden、阈值或测试排除。根 AGENTS §10 要求
“视觉基线只能在人工确认变化合理后更新”，故确认后才能限定更新这 6 项并完成最终
完整门禁。其余生产实现、专项验证、构建原预算、治理、Lint/TypeScript 和报告已完成。
