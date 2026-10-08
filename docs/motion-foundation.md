# Motion Foundation 与语义动效分层

本文件是 `/frontend` Motion 主题的唯一当前权威。历史变更记录只保存当时证据，不构成现行规范。

## 1. 治理模型

```text
Motion Policy      用户环境 + development override，决定是否允许某类动效
Motion Recipe      Design Token 之上的语义行为，决定如何呈现连续性
Semantic Component 绑定真实生命周期，决定为什么动、何时动
```

页面只声明业务状态，不填写 duration、easing、keyframes 或浏览器观察器。动画层不得改变高度、滚动容器、定位上下文或 Layout Contract。Overlay Enter/Exit 继续完全由 HeroUI 与 UI Adapter 主持。

## 2. 生命周期与所有权

| 生命周期                 | 当前组件                     | 所有权                                | 规则                                                                                                         |
| ------------------------ | ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Router / Suspense        | Host `RouteTransition`       | `apps/web/src/host`                   | `nav-forward` 使用 Surface screen recipe；无导航类型使用克制的 `content.enter`；hydration 不重复播放页面滑动 |
| 数据 readiness           | `AsyncRegion`、`StateRegion` | Universal / Product Surface           | initial 才替换 Skeleton；refresh 保留旧内容；background 静默                                                 |
| 首次进入视口             | Host `ViewportReveal`        | Host 生命周期 + Surface reveal recipe | 仅显式 below-fold Region，单例 Observer，reveal-once                                                         |
| 同路由内容切换           | `ContentSwapTransition`      | UI Adapter                            | 使用稳定 `contentKey`；`TabsView` 默认接入；筛选刷新不使用它                                                 |
| Inline Feedback Presence | `FeedbackPresence`           | UI Adapter                            | exit 期间立即退出辅助技术与交互树；支持快速反转；Toast 不接入                                                |
| 非 Avatar 图片 readiness | `ReadyImage`                 | UI Adapter                            | width/height 预留空间，load + decode 后 crossfade，error 保持尺寸                                            |
| Overlay                  | HeroUI compound lifecycle    | UI Adapter                            | 禁止再套 Presence 或页面动画容器                                                                             |

冷启动与路由挂起统一使用 `PageLoadingSurface`。根 `loading.tsx` 与各路由 Suspense 都必须提供 `page/catalog/collection/form` 结构化 Skeleton；禁止 `fallback={null}` 和居中卡片整屏替换 Shell。

## 3. Design Token 与 Recipe Registry

基础参数的单一权威是 `packages/design-system/src/tokens.css`（其受控区段由
`packages/design-system/design-system.schema.json` 生成，见下）：

- `--motion-duration-fast/standard/slow`：基础档位，并受 development 慢速倍率控制。
- `--motion-duration-control/feedback/page`：用途语义。
- `--ease-product`、`--motion-distance-page`、`--motion-distance-reveal`：缓动与位移语义。

Universal recipe 的单一登记文件是 `packages/design-system/src/motion.css`：

| Recipe              | 消费方                               | Reduced / Off                            |
| ------------------- | ------------------------------------ | ---------------------------------------- |
| `content.enter`     | Route fallback、Async 无内容→有内容  | 全局 Policy 缩短并取消非必要位移         |
| `content.swap`      | `ContentSwapTransition` / `TabsView` | `swap` 分类关闭时禁用                    |
| `viewport.reveal`   | Host `ViewportReveal`                | reduced、off、不支持 Observer 时直接显示 |
| `feedback.presence` | `FeedbackPresence`                   | `feedback` 分类关闭时禁用                |
| `media.ready`       | `ReadyImage`                         | `media` 分类关闭时直接显示               |

Surface `screen.enter/exit`、Shell 锚定、Route content、Viewport 与 State recipe 的具体绑定继续由 `packages/surface-foundation/src/styles.css` 持有。非上述权威文件禁止声明 `@keyframes`。

持久布局通过既有 `[data-route-content]` 标出可替换区域。含此区域的外层 Page
只提供 spacing，不再次触发直接区段 choreography；CSS 根据这个现有布局标识排除
外层壳，使 Settings 标题/导航保持稳定，分类区段只进入一次。普通 Page 仍由 Host
自动提供进入体验，不需要页面声明动画类型或绕过 Page。109 回归证明修复的是重复
进入范围，Duration/Easing Token 保持原值。

### Schema-Controlled 生成（Design System 单一 Schema）

Design System Token 与 Motion Language facts 的唯一 Source 是
`packages/design-system/design-system.schema.json`（Schema-Controlled Authority
第一例，协议见 `docs/frontend-foundation.md` §Schema-Controlled Authority）：

- `tokens.css` 由内置 Generator `css-token-regions-v1` 生成**受控 marker 区段**
  （`@theme`、`:root` motion、light/dark `--ds-*`），marker 外的 selector、
  reduced-motion policy 与实现型 CSS 保持手写；`motion.css` 由
  `css-motion-language-v1` 从受控 Motion Language（opacity enter/exit、
  token-driven translate、progress width operation）**整文件**生成。两文件路径与
  export（`@community-go/design-system/tokens.css`、`/motion.css`）不变。
- 修改 Token/Motion 事实 = 编辑 Schema 的 `source`（唯一可配置值域），运行
  `pnpm codegen:design` 重新生成；`pnpm codegen:design:check` 与完整 `pnpm check`
  做 freshness（受控区段逐字节 / motion.css 整文件逐字节）。`pnpm dev` 启动
  Schema Watcher 自动重新生成并触发 CSS HMR。
- surface-specific keyframes、Host 生命周期绑定与 UI Adapter 使用方式**不进入**
  Design System Source（仍属 Surface Foundation / Host / Adapter 所有权）。

## 4. Readiness 单一语义

`AsyncRegionPhase` 固定为：

| Phase        | 内容                      | Pending              | `aria-busy` | 整块 content.enter       |
| ------------ | ------------------------- | -------------------- | ----------- | ------------------------ |
| `initial`    | 无可用数据，显示 Skeleton | 可访问 Loading label | 是          | 进入 ready 时播放        |
| `ready`      | 显示内容                  | 无                   | 否          | 仅从无内容阶段进入时播放 |
| `refreshing` | 保留旧内容                | 局部可见             | 是          | 否                       |
| `background` | 保留旧内容                | 默认静默             | 否          | 否                       |
| `empty`      | Empty recovery surface    | 无                   | 否          | 否                       |
| `error`      | Error recovery surface    | 无                   | 否          | 否                       |

`StateRegion` 复用同一 loading/refreshing/background readiness，并额外拥有 Surface 级 `partial/readonly/denied/pending`。业务不能建立第二套相反的 Loading 规则。关键提交确需阻断时由明确的 Operation/Overlay 契约负责，不归普通数据 refresh。

## 5. Host Motion Policy

`MotionPolicyProvider` 是 `matchMedia`、system preference、development override 与 DOM policy attribute 的唯一入口：

- production 固定 `System`，不渲染 Inspector，不读取或写入调试偏好。
- development 提供 `System/Full/Reduced/Off`，`Screen/Async/Reveal/Swap/Feedback/Media` 分类开关，以及 `1×/2×/4×` 慢速。
- 调试状态只存 `sessionStorage`；Feature props、业务 Store 与持久配置不得感知它。
- `Full` 只用于开发检查；用户生产环境的 reduced-motion 始终由系统策略统一解析。

页面和 Feature 禁止调用 `matchMedia`、创建 `IntersectionObserver`、写入 `data-motion-*` 或手工调用 `startViewTransition`。React `<ViewTransition>` 只协调 Router、Suspense 和稳定 `contentKey` 生命周期。

## 6. 组合规则

- Screen Transition 只表达已经进入另一个 Screen，不等待全部数据后整页 reveal。
- Above-fold Shell/Region 立即稳定；below-fold 只有显式 Region 使用 `ViewportReveal`。
- Async Region 各自 progressive ready；不得 Wait-all → Reveal-all。
- `refreshing → ready`、`background → ready` 保留同一内容实例，不重播整块进场。
- `TabsView` 的键盘、Selection 和 Focus 仍由 HeroUI 主持，Content Swap 只主持面板视觉切换。
- 输入每次击键、筛选请求、表格行和 UI Element 不播放页面级动效。
- Avatar 继续使用 HeroUI Image/Fallback readiness，不嵌套 `ReadyImage`。

## 7. Reduced Motion 与中断安全

`tokens.css` 提供普通元素的全局 reduced/off policy，`surface-foundation/styles.css` 覆盖 View Transition 伪元素。新 recipe 必须同时具备分类关闭和 reduced/off 行为。

自动化必须覆盖：快速 Enter/Exit 反转、refresh 保留内容、background 静默、Observer 注册/注销与 reveal-once、图片 decode/error、键盘 Tabs、路由前进/后退、development policy 恢复、窄屏、Dark、Reduced Motion、Axe 和 Visual。

## 8. 架构门禁

`architecture:check` 拒绝：

- 路由或组件使用 `fallback={null}`。
- Motion 权威文件之外声明 `@keyframes`。
- TSX 硬编码 `duration-N` / `delay-N`。
- Host motion 边界之外使用 `IntersectionObserver` 或 `matchMedia`。
- Feature 写入 `data-motion-*`。

新增动效先识别生命周期并复用上表现役组件。没有现役语义时，先证明真实用例、所有权、中断语义和验证方式；不得以 fade、slide、scale 等实现名称扩展业务 Contract。
