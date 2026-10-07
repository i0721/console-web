'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { useWorkbenchStore } from '../state/use-workbench-store';

/**
 * Host —— 最近访问记录（SET-005-004 消费方）。
 *
 * pathname 实际变化（页面入口级提交）时，把 pathname + 页面入口展示标题记入
 * Workbench recents（LRU 去重由 store 保证）。只记录能被导航入口解析的
 * pathname（href→标题映射），不记录 404/纯 search 变化。
 */
export function useRecentVisitRecorder(
  entries: ReadonlyArray<{ href: string; label: string }>,
): void {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === previousPathnameRef.current) return;
    previousPathnameRef.current = pathname;
    const entry = entries.find((candidate) => candidate.href === pathname);
    if (!entry) return; // 非导航入口（404 等）不记录
    useWorkbenchStore.getState().recordVisit({ pathname, title: entry.label });
  }, [pathname, entries]);
}
