// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PAGE_TABS_LIMIT,
  pushPageTab,
  usePageTabsStore,
  type PageTab,
} from '../state/use-page-tabs-store';

const base: PageTab = { pathname: '/a', title: 'A', activatedAt: 1_000 };

describe('页面标签 store（page-tabs，SET-005-002）', () => {
  beforeEach(() => {
    usePageTabsStore.setState({ tabs: [] });
  });

  it('pushPageTab：同 pathname 去重前移（不重复标签）', () => {
    const next = pushPageTab([base, { pathname: '/b', title: 'B', activatedAt: 2_000 }], {
      pathname: '/a',
      title: 'A 更新',
      activatedAt: 3_000,
    });
    expect(next.map((tab) => tab.pathname)).toEqual(['/a', '/b']);
    expect(next[0]?.title).toBe('A 更新');
    expect(next[0]?.activatedAt).toBe(3_000);
  });

  it('上限截断（保留最近）', () => {
    let tabs: readonly PageTab[] = [];
    for (let i = 0; i < PAGE_TABS_LIMIT + 3; i += 1) {
      tabs = pushPageTab(tabs, { pathname: `/p-${i}`, title: `P${i}` }, PAGE_TABS_LIMIT);
    }
    expect(tabs).toHaveLength(PAGE_TABS_LIMIT);
    expect(tabs[0]?.pathname).toBe(`/p-${PAGE_TABS_LIMIT + 2}`);
  });

  it('openTab/closeTab/closeAllTabs 行为', () => {
    const store = usePageTabsStore.getState();
    store.openTab({ pathname: '/a', title: 'A' });
    store.openTab({ pathname: '/b', title: 'B' });
    store.openTab({ pathname: '/a', title: 'A' });
    expect(usePageTabsStore.getState().tabs).toHaveLength(2);
    usePageTabsStore.getState().closeTab('/a');
    expect(usePageTabsStore.getState().tabs.map((t) => t.pathname)).toEqual(['/b']);
    usePageTabsStore.getState().closeAllTabs();
    expect(usePageTabsStore.getState().tabs).toHaveLength(0);
  });

  it('pruneTabs：过滤失效目标（restore 后不在当前入口集合的标签移除）', () => {
    const store = usePageTabsStore.getState();
    store.openTab({ pathname: '/valid-a', title: 'A' });
    store.openTab({ pathname: '/removed-page', title: 'Removed' });
    usePageTabsStore.getState().pruneTabs(new Set(['/valid-a']));
    expect(usePageTabsStore.getState().tabs.map((t) => t.pathname)).toEqual(['/valid-a']);
  });
});
