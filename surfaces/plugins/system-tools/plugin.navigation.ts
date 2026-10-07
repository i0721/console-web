import type { NavigationContribution } from '@community-go/plugin-framework/navigation';

/**
 * system-tools —— Sidebar Navigation Contribution。
 *
 * Group `system`（plugins 公共 Group Alias）下的 leaf Parent：原"系统工具"分组下的
 * preferences 已迁出为独立 settings 插件（107 单轨清理），此处收敛为单一入口
 * "Icon 大全"（/system-tools/icons），不保留旧入口/旧路由别名。
 */
export const navigationContribution = {
  parents: [
    {
      navigationId: 'system-tools.root',
      labelKey: 'systemTools.nav.icons',
      groupId: 'system',
      iconId: 'settings',
      routeId: 'system-tools.icons',
    },
  ],
} as const satisfies NavigationContribution;
