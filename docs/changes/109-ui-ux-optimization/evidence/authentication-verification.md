# Authentication 实施进度与证据

2026-10-09，目标尚未完成，真实后端待联调。

已阅读完整目标并审查Next root布局、Plugin codegen、Store/Provider/Form和Adapter边界。
浏览器实际查看TailAdmin React登录及注册，方案与契约见
[认证审查](../design/authentication-review.md)。原108审查和109入口/任务表已补充。

Public/Auth/App真实Route Groups、38个生成器Host adapters、登录/注册/过期/欢迎页面、
统一身份菜单与退出已接入。Host-owned契约、非法生产配置失败关闭、内部returnTo
校验、Mock加盐PBKDF2/恢复/过期与Backend Cookie/CSRF/超时/错误均复用统一服务。
当前用户唯一内存Store拒绝过期请求与重复提交；退出前立即隐藏受保护内容，跨用户
清理私有记录、跨标签页重载，并保留设备偏好。共享启动加载面已移除后台骨架。

专项测试auth-service-unit.txt覆盖注册摘要无明文、同源跳转、生产模式、后端CSRF/
登录后恢复/401/网络/协议/超时、模拟身份与过期，以及会话控制器退出/恢复竞态/失败。
独立Web类型检查首次遇到四条临时生成模块解析失败；确认文件存在，禁增量复验通过，
不是修改生成物或放宽边界。测试可空索引、Promise写法和控制字符规则已修复。
当前类型/Lint检查日志auth-typecheck.txt、auth-lint.txt；后续每次改动继续按范围验证。

`auth-unit-current.txt`扩为17项通过，包含真实持久化快照、损坏/版本保留与修复恢复、
密码输入值/自动填充/禁用/错误/显示语义；随后增加两项身份重载和清理失败保护测试。
`auth-browser-integrated.txt`17项全部通过：14项Mock/布局/键盘/恢复/深链/损坏/退出/
过期/跨标签页/设备偏好和私有清理，以及3项Backend模式受控API契约，包含注册Pending/
成功、退出失败隐藏与重试。320/390/768/1440/2048四公共页面布局/Axe，以及320/1440
英文深色Reduced。实际注册身份截图在authentication/manual-registered-identity.png。

公共PasswordField先实测TailAdmin Form Elements正常/错误/禁用和密码切换，采用
HeroUI公开InputGroup anatomy，并在UI Elements/forms同源展示。320px确认密码输入
溢出已通过Adapter flex收缩修复，不改普通TextField默认。原失败日志保留；英文主题
测试按真实名称修复后单独与综合复验通过，不增加超时。

完整auth-check-initial.txt中治理、Lint、类型、全部单元和生产构建通过，但最重路由
452301B超出原440320B预算，未进入全量浏览器。随后按需加载认证状态/404/会话运行时/
身份菜单，复用中性启动面；各次构建、失败和测量保存在auth-build/auth-performance
系列日志。部分诊断测量发生于新构建完成前，仅最终已完成构建的测量作为对应证据。
认证文案使用现役i18n新增受控资源注册，仍共用同一运行时与语言。

最新 `auth-check-final-retry.txt` 已通过治理、Lint、类型、403 项单元、生产构建和
原性能预算：initial 374019B，最重 resource-list 路由 439160B（上限 440320B），
CSS 47957B。328 项全量浏览器回归进行中，不提前记作全部通过。
此前完整检查的临时类型错误与本次菜单滚动静态误报均保留失败日志。

大字号英文 320px 注册输入的可用宽度和 Axe 已复验；密码切换使用带完整名称的
图标。菜单具名滚动区域经过短窗口布局、Axe、触屏与键盘 End 到退出项验证，
最终专项日志 `authentication/auth-menu-scroll-region.txt` 与
`authentication/auth-menu-keyboard-scroll-final.txt`。仅滚动区域属性有 W3C ACT
依据的 lint 误报注释，未修改全局 lint、Axe、截图阈值或预算。

仍需：当前源码完整pnpm check、额外状态矩阵与新视觉人工确认。此前28项Scroll Reveal
和4项账户菜单批准不自动覆盖认证造成的新变化。配置与待联调API契约见
[Web Authentication](../../../../apps/web/src/auth/README.md)。Backend受控契约测试不代表
真实API、服务器授权或安全Cookie/CORS/CSRF已完成联调；最终不得宣称真实Backend已验证。
