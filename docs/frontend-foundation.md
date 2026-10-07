# Universal Frontend Foundation

Universal Foundation 只承载跨 Product Surface 成立的契约。

| Workspace         | 当前职责                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `design-system`   | Light/Dark、Density、Contrast、Layout 与 Motion Token；跨 Surface Motion Primitive                                       |
| `ui-adapter`      | UI Element、Overlay、Accessibility、Keyboard、Focus；唯一 HeroUI/React Aria 边界                                         |
| `form-foundation` | Schema 驱动的 dirty/pending/reset/首错聚焦/字段桥接；唯一 RHF/Resolver 边界                                              |
| `i18n`            | runtime、Provider、translation hook 与日期/数字/相对时间格式化                                                           |
| `core`            | 不依赖 React/Host/数据源的纯语义判断                                                                                     |
| `schemas`         | Universal Schema 类型、结构化 issue 与 Schema-Controlled Authority Runtime（`./runtime`），不保存 Product/Reference 字段 |
| `types`           | 已证明跨 Workspace 稳定的共享类型                                                                                        |

Universal 禁止出现 Product Page、Product Workspace、Next Router、Browser/Desktop API、后端 DTO、权限计算和业务状态机。UI authority 为 `/ui-elements/*`，Motion authority 为 `/motion`。

### Schema-Controlled Authority（`@community-go/schemas/runtime`）

正式 Authority 可以把自身事实收拢为**一份** Authority Schema
（`packages/design-system/design-system.schema.json` 是第一例，覆盖 Token 与
Motion Language facts），由 `@community-go/schemas/runtime` 统一提供校验、RFC 6902
Patch（内容哈希 etag 并发冲突）、确定性生成与 freshness：

- Authority Schema 使用 Draft 2020-12；`x-community-go` 是正式注册的 extension
  keyword（Ajv strict，不关闭校验）。`source` 实例结构由 `$defs.authoritySource`
  定义；**所有可配置值只在 `source` 下**，facts/Artifact mapping 只经 Source
  Pointer 引用，Source 内 Token 间引用为结构化 ref（不保存 `var(--*)` 等 CSS 表达）。
- `contractRef` 指向 `tooling/foundation-contracts.json`（RFC 6901 转义 pointer）；
  layer/owner/maturity/exports/evidence 仍以 registry 为唯一 Source，Schema
  **不得重新声明** registry-owned 字段。
- 内置 Generator 只做通用映射：`css-token-regions-v1` 按 Artifact mapping 的
  模板/名称规则只重写 tokens.css 的受控 marker 区段（marker 外字节原样保留）；
  `css-motion-language-v1` 从受控 Motion Language（opacity/width/translate
  operation）整文件生成 motion.css。两者均带 generated header / freshness 门禁。
- 工作流：`pnpm codegen:design` 生成、`pnpm codegen:design:check` freshness
  （纳入 `pnpm check`）；`pnpm dev` 启动 Schema Watcher 与 Plugin Watcher、
  Next dev 并行，Schema 变更自动重新校验并生成 CSS。

Vendor 类型不得穿透公共 Contract；具体 Surface 通过内容、状态、资源和 Port 组合这些能力。

Universal 之下是 [Surface Foundation](surface-foundation.md)（可复用产品视觉/Pattern）、
[Plugin Framework 与 Surface File Routes](plugin-framework.md)（契约/Registry/Host Capability/Codegen）
与 `surfaces` 插件实现；它们与 Universal 的边界由 `tooling/foundation-policy.json`
与 `tooling/foundation-contracts.json` 机器校验。
