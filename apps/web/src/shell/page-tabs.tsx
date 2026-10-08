'use client';

import { X } from 'lucide-react';
import { IconAction } from '@community-go/ui-adapter/icon-action';
import { MenuButton } from '@community-go/ui-adapter/menu-button';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useFrontendTranslation } from '@community-go/i18n';
import { rehydrateStore } from '@community-go/state-foundation';
import { usePageTabsStore } from '../state/use-page-tabs-store';
import { useShellStore } from '../state/use-shell-store';
import { proceedAfterLeaveConfirm } from '../host/leave-confirm';
import { markForwardRouteIntent, pageTransitionTypes } from '../host/route-transition-constants';
import { resolveScrollOption } from '../host/scroll-preference';

/**
 * Shell 顶部页面标签条（SET-005-002）。
 *
 * - 标签 = 页面入口（pathname 身份；筛选/排序变化不创建重复标签）；切换仍走
 *   Next Router（不缓存 React 页面树）；
 * - 页面入口提交时打开标签（更新当前目标，保持访问顺序，见 usePageTabsRecorder）；当前页高亮；X 关闭；
 * - **导航偏好 pageTabsEnabled 门控**（默认关 → 不显示条、不记录）；
 * - 会话级持久化（sessionStorage；restoreLastTabs=true 时本窗口刷新恢复，
 *   false 时挂载后清空陈旧会话标签——关闭记忆停止恢复但不删本地数据的语义
 *   由 clearIfDisabled 在挂载时执行一次）。
 */
export function PageTabs() {
  const { t } = useFrontendTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const pageTabsEnabled = useShellStore((state) => state.preferences.navigation.pageTabsEnabled);
  const tabs = usePageTabsStore((state) => state.tabs);

  // 显式 hydration（skipHydration store）；restoreLastTabs=false 的会话清空由
  // usePageTabsRecorder 首个启用帧处理（避免与打开当前页竞态）。
  useEffect(() => {
    rehydrateStore(usePageTabsStore);
  }, []);

  // 关闭标签（SET-005-002 关闭策略）：若关闭的是当前激活标签，按偏好
  // tabCloseBehavior（最近/右邻/左邻）导航到目标；无目标 → 回默认首页（'/'）。
  const tabCloseBehavior = useShellStore((state) => state.preferences.navigation.tabCloseBehavior);
  const closeTabAt = async (closedPathname: string) => {
    const closingActive = closedPathname === pathname;
    const closingIndex = tabs.findIndex((tab) => tab.pathname === closedPathname);
    const target = (() => {
      if (!closingActive) return null;
      if (tabCloseBehavior === 'recent') {
        const other = tabs
          .filter((tab) => tab.pathname !== closedPathname)
          .sort((a, b) => b.activatedAt - a.activatedAt)[0];
        return other?.href ?? other?.pathname ?? '/';
      }
      if (tabCloseBehavior === 'right') {
        const right = tabs[closingIndex + 1]; // 屏幕右邻（更早访问）
        return right ? (right.href ?? right.pathname) : '/';
      }
      const left = tabs[closingIndex - 1]; // 屏幕左邻（更新访问）
      return left ? (left.href ?? left.pathname) : '/';
    })();
    if (
      closingActive &&
      target &&
      target !== pathname &&
      !(await proceedAfterLeaveConfirm(target, t('shell.pageTabs')))
    )
      return;
    usePageTabsStore.getState().closeTab(closedPathname);
    if (closingActive) {
      if (target && target !== pathname) {
        void router.push(target, {
          transitionTypes: [pageTransitionTypes.forward],
          ...resolveScrollOption(),
        });
      } else if (target === '/') {
        void router.push('/', {
          transitionTypes: [pageTransitionTypes.forward],
          ...resolveScrollOption(),
        });
      }
    }
  };

  if (!pageTabsEnabled) return null;

  return (
    <nav
      aria-label={t('shell.pageTabs')}
      className="flex min-w-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-surface px-3"
    >
      {tabs.length === 0 ? (
        <span className="px-2 py-2 text-xs text-ink-muted">{t('shell.noPageTabs')}</span>
      ) : (
        tabs.map((tab) => {
          const active = tab.pathname === pathname;
          return (
            <div
              className={`${active ? 'inline-flex' : 'hidden md:inline-flex'} shrink-0 items-center gap-1 border-b-2 px-2 py-1.5 text-sm ${
                active
                  ? 'border-brand font-semibold text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
              key={tab.pathname}
            >
              <button
                aria-current={active ? 'page' : undefined}
                title={tab.title}
                className="min-h-control max-w-40 truncate rounded-control px-1 outline-none focus-visible:ring-2 focus-visible:ring-brand"
                onClick={() => {
                  if (tab.pathname === pathname) return;
                  void proceedAfterLeaveConfirm(tab.href ?? tab.pathname, t('shell.pageTabs')).then(
                    (proceed) => {
                      if (!proceed) return;
                      markForwardRouteIntent();
                      void router.push(tab.href ?? tab.pathname, {
                        transitionTypes: [pageTransitionTypes.forward],
                        ...resolveScrollOption(),
                      });
                    },
                  );
                }}
                type="button"
              >
                {tab.title}
              </button>
              <IconAction
                label={t('shell.closeTab', { title: tab.title })}
                onPress={() => {
                  void closeTabAt(tab.pathname);
                }}
              >
                <X aria-hidden="true" className="size-4" />
              </IconAction>
            </div>
          );
        })
      )}
      {tabs.length > 0 ? (
        <div className="ml-auto shrink-0 md:hidden">
          <MenuButton
            label={t('shell.morePages', { count: tabs.length })}
            ariaLabel={t('shell.pageTabs')}
            items={tabs.map((tab) => ({
              id: tab.pathname,
              label: tab.title,
              ...(tab.pathname === pathname ? { description: t('shell.currentPage') } : {}),
            }))}
            onAction={(id) => {
              const tab = tabs.find((tab) => tab.pathname === id);
              const href = tab?.href ?? id;
              void proceedAfterLeaveConfirm(href, t('shell.pageTabs')).then((proceed) => {
                if (proceed) {
                  markForwardRouteIntent();
                  router.push(href, resolveScrollOption());
                }
              });
            }}
          />
        </div>
      ) : null}
    </nav>
  );
}
