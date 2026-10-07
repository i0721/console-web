'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
 * - 页面入口提交时打开标签（去重前移，见 usePageTabsRecorder）；当前页高亮；X 关闭；
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
  const closeTabAt = (closedPathname: string) => {
    const closingActive = closedPathname === pathname;
    const closingIndex = tabs.findIndex((tab) => tab.pathname === closedPathname);
    const target = (() => {
      if (!closingActive) return null;
      if (tabCloseBehavior === 'recent') {
        const other = tabs.find((tab) => tab.pathname !== closedPathname);
        return other?.pathname ?? '/';
      }
      if (tabCloseBehavior === 'right') {
        const right = tabs[closingIndex + 1]; // 屏幕右邻（更早访问）
        return right ? right.pathname : '/';
      }
      const left = tabs[closingIndex - 1]; // 屏幕左邻（更新访问）
      return left ? left.pathname : '/';
    })();
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
      className="flex items-center gap-0.5 overflow-x-auto border-b border-border bg-surface px-3"
    >
      {tabs.length === 0 ? (
        <span className="px-2 py-2 text-xs text-ink-muted">{t('shell.noPageTabs')}</span>
      ) : (
        tabs.map((tab) => {
          const active = tab.pathname === pathname;
          return (
            <div
              className={`inline-flex shrink-0 items-center gap-1 border-b-2 px-2 py-1.5 text-sm ${
                active
                  ? 'border-brand font-semibold text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
              key={tab.pathname}
            >
              <button
                className="max-w-40 truncate rounded-control px-1 outline-none focus-visible:ring-2 focus-visible:ring-brand"
                onClick={() => {
                  if (tab.pathname === pathname) return;
                  void proceedAfterLeaveConfirm(tab.pathname, t('shell.pageTabs')).then(
                    (proceed) => {
                      if (!proceed) return;
                      markForwardRouteIntent();
                      void router.push(tab.pathname, {
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
              <button
                aria-label={t('shell.closeTab', { title: tab.title })}
                className="grid size-5 shrink-0 place-items-center rounded-control text-ink-muted outline-none hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
                onClick={() => closeTabAt(tab.pathname)}
                type="button"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          );
        })
      )}
    </nav>
  );
}

/** 记录当前 pathname 的标签打开事件（app-shell 在导航提交时一并调用）。 */
export function usePageTabsRecorder(entries: ReadonlyArray<{ href: string; label: string }>): void {
  const pathname = usePathname();
  const previousRef = useRef<string | null>(null);
  const enabled = useShellStore((state) => state.preferences.navigation.pageTabsEnabled);
  const restoreLastTabs = useShellStore((state) => state.preferences.navigation.restoreLastTabs);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    // 首个启用帧：restoreLastTabs=false → 清空陈旧会话标签（随后打开当前页，
    // 避免与"关闭记忆"语义冲突）；true → 保留会话标签并立即把当前页前移。
    if (!startedRef.current) {
      startedRef.current = true;
      const frame = requestAnimationFrame(() => {
        if (!restoreLastTabs) {
          usePageTabsStore.getState().closeAllTabs();
        } else {
          // 恢复上次标签：过滤失效目标（不在当前导航入口集合的标签移除）。
          const valid = new Set(entries.map((entry) => entry.href));
          usePageTabsStore.getState().pruneTabs(valid);
        }
        const entry = entries.find((candidate) => candidate.href === pathname);
        if (entry) usePageTabsStore.getState().openTab({ pathname, title: entry.label });
        previousRef.current = pathname;
      });
      return () => cancelAnimationFrame(frame);
    }
    if (pathname === previousRef.current) return;
    previousRef.current = pathname;
    const entry = entries.find((candidate) => candidate.href === pathname);
    if (!entry) return;
    usePageTabsStore.getState().openTab({ pathname, title: entry.label });
  }, [pathname, entries, enabled, restoreLastTabs]);
}
