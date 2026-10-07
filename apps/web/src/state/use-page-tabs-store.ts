import { createPersistStore, createSessionStorage } from '@community-go/state-foundation';

/**
 * Host —— Page Tabs Store（SET-005-002）。
 *
 * 顶部页面标签（= 页面入口；不缓存 React 页面树）。会话级持久化
 * （key `community-go.page-tabs`，sessionStorage —— 页签属于当前窗口活动状态，
 * 不跨窗口/跨启动恢复；restoreLastTabs 只在本窗口刷新时恢复）。
 *
 * - 页面身份由 pathname（Route Target 语义；筛选/排序变化不创建重复标签）；
 * - LRU 活动：激活的标签移到最近；上限固定；
 * - 关闭当前标签后跳转由调用方按 tabCloseBehavior 决定。
 */
export const PAGE_TABS_LIMIT = 12;

export type PageTab = Readonly<{
  pathname: string;
  title: string;
  activatedAt: number;
}>;

type PageTabsState = {
  tabs: readonly PageTab[];
  /** 打开标签（页面入口提交时；同 pathname 去重前移并更新时间戳）。 */
  openTab: (entry: { pathname: string; title: string }) => void;
  /** 关闭标签；返回被关闭的 pathname。 */
  closeTab: (pathname: string) => void;
  /** 清空全部（restoreLastTabs=false 时挂载清空陈旧会话标签）。 */
  closeAllTabs: () => void;
  /** 过滤失效目标（restore 后不在当前导航入口集合的标签移除）。 */
  pruneTabs: (validPathnames: ReadonlySet<string>) => void;
};

type PageTabsPersisted = {
  tabs: readonly PageTab[];
};

export function pushPageTab(
  tabs: readonly PageTab[],
  entry: { pathname: string; title: string; activatedAt?: number },
  limit = PAGE_TABS_LIMIT,
): readonly PageTab[] {
  const activatedAt = entry.activatedAt ?? Date.now();
  const withoutCurrent = tabs.filter((tab) => tab.pathname !== entry.pathname);
  const next = [{ pathname: entry.pathname, title: entry.title, activatedAt }, ...withoutCurrent];
  return next.slice(0, limit);
}

export const usePageTabsStore = createPersistStore<PageTabsState, PageTabsPersisted>(
  (set) => ({
    tabs: [],
    openTab: (entry) => set((state) => ({ tabs: pushPageTab(state.tabs, entry) })),
    closeTab: (pathname) =>
      set((state) => ({ tabs: state.tabs.filter((tab) => tab.pathname !== pathname) })),
    closeAllTabs: () => set({ tabs: [] }),
    pruneTabs: (validPathnames) =>
      set((state) => ({
        tabs: state.tabs.filter((tab) => validPathnames.has(tab.pathname)),
      })),
  }),
  {
    name: 'community-go.page-tabs',
    version: 1,
    skipHydration: true,
    storage: createSessionStorage(),
    partialize: ({ tabs }) => ({ tabs }),
    migrate: (persisted) => {
      if (typeof persisted !== 'object' || persisted === null) {
        throw new Error('page-tabs: 记录损坏');
      }
      const record = persisted as Partial<PageTabsPersisted>;
      const tabs = Array.isArray(record.tabs)
        ? (record.tabs as readonly PageTab[]).filter(
            (tab) =>
              tab &&
              typeof tab.pathname === 'string' &&
              typeof tab.title === 'string' &&
              typeof tab.activatedAt === 'number',
          )
        : [];
      return { tabs };
    },
  },
);
