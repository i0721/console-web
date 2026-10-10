'use client';

import { flattenNavigationLeaves } from '@community-go/core';
import { ShellRoot } from '@community-go/surface-foundation/shell-navigation';
import { PluginLocaleProvider } from '@community-go/plugin-framework/plugin';
import type { NavigationNode } from '@community-go/types';
import { IconAction } from '@community-go/ui-adapter/icon-action';
import { Skeleton } from '@community-go/ui-adapter/skeleton';
import { NotificationAlerts } from '../host/notification-alerts';
import { useDesktopNotificationGate } from '../host/use-desktop-notification';
import {
  Languages,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
  Search,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFrontendTranslation } from '@community-go/i18n';
import type { ReactNode } from 'react';

import { markForwardRouteIntent, pageTransitionTypes } from '../host/route-transition-constants';
import { HostNavigationPortProvider } from '../host/navigation-port';
import { routeTargetResolver } from '../host/route-target-resolver';
import { proceedAfterLeaveConfirm } from '../host/leave-confirm';
import { resolveScrollOption } from '../host/scroll-preference';
import { useRecentVisitRecorder } from '../host/recent-visit-recorder';
import { RouteTransition } from '../host/route-transition';
import { DrawerSurface } from '@community-go/ui-adapter/overlays';
import { TopProgress } from '../host/top-progress';
import { useShellStore } from '../state/use-shell-store';
import { useCommandsPort } from '@community-go/plugin-framework/commands';
import { BrandMark } from './brand-mark';
import { combinedShellNavigationGroups } from './navigation';
import { NotificationCenter } from './notification-center';
import { PageTabs } from './page-tabs';
import { usePageTabsRecorder } from './use-page-tabs-recorder';

const NavigationTree = lazy(() =>
  import('./navigation-tree').then((module) => ({ default: module.NavigationTree })),
);

const subscribeDesktop = (notify: () => void) => {
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};
const desktopSnapshot = () => window.innerWidth >= 768;

const AccountMenu = dynamic(() => import('./account-menu').then((module) => module.AccountMenu), {
  ssr: false,
  loading: () => <Skeleton className="h-control w-control md:w-28" />,
});

const CommandMenu = dynamic(
  () => import('@community-go/ui-adapter/command-menu').then((module) => module.CommandMenu),
  { ssr: false },
);

function NavigationContent({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const { t } = useFrontendTranslation();

  return (
    <>
      <div
        className={`flex h-20 items-center border-b border-border ${compact ? 'justify-center px-3' : 'gap-3 px-5'}`}
      >
        <BrandMark />
        {compact ? null : (
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-ink">
              {t('brand.name')}
            </p>
            <p className="truncate text-xs text-ink-muted">{t('brand.edition')}</p>
          </div>
        )}
      </div>
      <nav
        className={`surface-shell-navigation-viewport min-h-0 flex-1 py-6 ${compact ? 'px-4' : 'space-y-7 px-3'}`}
        aria-label={t('shell.primaryNav')}
      >
        <Suspense
          fallback={combinedShellNavigationGroups.map((group) => (
            <div
              key={group.id}
              className={
                compact ? 'surface-shell-compact-group w-control-lg space-y-1' : 'space-y-1'
              }
              aria-busy="true"
            >
              {compact ? null : <Skeleton className="mb-2 h-4 w-24" />}
              {group.items.map((item) => (
                <Skeleton
                  key={item.id}
                  className={compact ? 'mx-auto h-control-lg w-control-lg' : 'h-10 w-full'}
                />
              ))}
            </div>
          ))}
        >
          <NavigationTree
            compact={compact}
            groups={combinedShellNavigationGroups}
            onNavigate={onNavigate}
          />
        </Suspense>
      </nav>
      {compact ? null : (
        <div className="m-3 rounded-panel border border-brand/15 bg-brand-soft p-4">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="size-4" />
            <span className="text-xs font-bold">{t('shell.preview')}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            React 19 · HeroUI · Tailwind CSS v4
          </p>
        </div>
      )}
    </>
  );
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  useDesktopNotificationGate();
  const shellRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const pageTabsPinned = useShellStore((state) => state.preferences.navigation.pageTabsPinned);
  useEffect(() => {
    const chrome = chromeRef.current;
    const shell = shellRef.current;
    if (!chrome || !shell) return;
    const measure = () =>
      shell.style.setProperty(
        '--shell-chrome-height',
        `${chrome.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(chrome);
    return () => observer.disconnect();
  }, []);
  const { t } = useFrontendTranslation();
  const router = useRouter();
  const desktopTools = useSyncExternalStore(subscribeDesktop, desktopSnapshot, () => false);
  const theme = useShellStore((state) => state.theme);
  const locale = useShellStore((state) => state.locale);
  const mobileNavigationOpen = useShellStore((state) => state.mobileNavigationOpen);
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed);
  const setTheme = useShellStore((state) => state.setTheme);
  const setLocale = useShellStore((state) => state.setLocale);
  const setMobileNavigationOpen = useShellStore((state) => state.setMobileNavigationOpen);
  const setSidebarCollapsed = useShellStore((state) => state.setSidebarCollapsed);
  const shortcutsEnabled = useShellStore((state) => state.preferences.shortcuts.enabled);
  const commandsPort = useCommandsPort();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) setMobileNavigationOpen(false);
    };
    window.addEventListener('resize', closeOnDesktop);
    return () => window.removeEventListener('resize', closeOnDesktop);
  }, [setMobileNavigationOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // 输入框/IME 组合期间避让普通导航/命令快捷键。
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target?.isContentEditable ?? false) ||
        event.isComposing;
      if (!shortcutsEnabled || isTyping) return;
      // Ctrl/Cmd+K：命令菜单（保留既有组合）。
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      // 统一 Alt+Shift 组合 → 命令（同一执行函数与可用性，经 commandsPort.runCommand）。
      if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === 'n') {
          event.preventDefault();
          const result = commandsPort.runCommand('reference-resources.new');
          if (!result.ok) setCommandOpen(true); // 不可用时退回命令菜单呈现原因。
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcutsEnabled, commandsPort]);

  const registeredCommands = useSyncExternalStore(
    (onChange) => commandsPort.subscribe(onChange),
    () => commandsPort.listCommands(),
    () => commandsPort.listCommands(),
  );

  const commandItems = useMemo(() => {
    const navItems = flattenNavigationLeaves(
      combinedShellNavigationGroups.flatMap((group) => group.items as readonly NavigationNode[]),
    ).map(({ leaf, ancestors }) => ({
      id: leaf.href,
      label: t(leaf.labelKey),
      description:
        ancestors.length > 0
          ? ancestors.map((ancestor) => t(ancestor.labelKey)).join(' / ')
          : t('shell.commandDescription'),
    }));
    // 注册命令（global/page）并入命令菜单：id 前缀 `command:` 与导航 href 区分。
    const commandItemsFromRegistry = registeredCommands.map((command) => ({
      id: `command:${command.id}`,
      label: command.label,
      description: command.description,
    }));
    return [...navItems, ...commandItemsFromRegistry];
  }, [t, registeredCommands]);

  // 页面入口 href → 标题（供 recents 记录消费；i18n 解析后 memo，保持引用稳定）。
  const navEntries = useMemo(
    () =>
      flattenNavigationLeaves(
        combinedShellNavigationGroups.flatMap((group) => group.items as readonly NavigationNode[]),
      ).map(({ leaf }) => ({ href: leaf.href, label: t(leaf.labelKey) })),
    [t],
  );
  // 最近访问记录：pathname 页面入口提交时写入 Workbench recents（SET-005-004 消费）。
  useRecentVisitRecorder(navEntries);
  // 页面标签记录：同一提交同时打开顶部标签（pageTabsEnabled 门控）。
  usePageTabsRecorder(navEntries);

  return (
    <ShellRoot collapsed={sidebarCollapsed}>
      <NotificationAlerts />
      <TopProgress />
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface lg:flex">
        <NavigationContent compact={sidebarCollapsed} />
      </aside>

      <DrawerSurface
        triggerLabel={t('shell.menu')}
        title={t('shell.primaryNav')}
        description={t('brand.edition')}
        closeLabel={t('shell.closeNav')}
        isOpen={mobileNavigationOpen}
        onOpenChange={setMobileNavigationOpen}
        placement="left"
        composition="navigation"
      >
        <NavigationContent onNavigate={() => setMobileNavigationOpen(false)} />
      </DrawerSurface>

      <div className="min-w-0" ref={shellRef}>
        <div className="sticky top-0 z-sticky" ref={chromeRef}>
          <header className="flex h-20 items-center gap-3 border-b border-border bg-canvas/90 px-4 backdrop-blur-xl sm:px-6 xl:px-8">
            <div className="lg:hidden">
              <IconAction label={t('shell.menu')} onPress={() => setMobileNavigationOpen(true)}>
                <Menu className="size-5" />
              </IconAction>
            </div>
            <div className="hidden lg:block" data-navigation-control>
              <IconAction
                label={sidebarCollapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')}
                onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="size-4.5" />
                ) : (
                  <PanelLeftClose className="size-4.5" />
                )}
              </IconAction>
            </div>
            <div className="md:hidden">
              <IconAction label={t('shell.search')} onPress={() => setCommandOpen(true)}>
                <Search className="size-5" />
              </IconAction>
            </div>
            <div className="min-w-0 md:flex-1">
              <CommandMenu
                hideTrigger={!desktopTools}
                defaultOpen={false}
                emptyLabel={t('shell.commandEmpty')}
                isOpen={commandOpen}
                items={commandItems}
                searchLabel={t('shell.commandSearchLabel')}
                searchPlaceholder={t('shell.search')}
                title={t('shell.commandTitle')}
                triggerLabel={t('shell.searchShortcut')}
                onAction={(id) => {
                  setCommandOpen(false);
                  if (id.startsWith('command:')) {
                    // 命令执行（同一执行函数与可用性；不可用不执行）。
                    commandsPort.runCommand(id.slice('command:'.length));
                    return;
                  }
                  void proceedAfterLeaveConfirm(id, t('shell.search')).then((proceed) => {
                    if (!proceed) return;
                    markForwardRouteIntent();
                    void router.push(id, {
                      transitionTypes: [pageTransitionTypes.forward],
                      ...resolveScrollOption(),
                    });
                  });
                }}
                onOpenChange={setCommandOpen}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <IconAction
                  label={t('shell.locale')}
                  onPress={() => setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')}
                >
                  <Languages className="size-4.5" />
                </IconAction>
                <IconAction
                  label={t('shell.theme')}
                  onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
                </IconAction>
              </div>
              <NotificationCenter />
              <AccountMenu
                compact={!desktopTools}
                onNavigate={() => {
                  const href = routeTargetResolver.resolveHref({ routeId: 'settings', params: {} });
                  void proceedAfterLeaveConfirm(href, t('shell.account')).then((proceed) => {
                    if (!proceed) return;
                    markForwardRouteIntent();
                    void router.push(href, {
                      transitionTypes: [pageTransitionTypes.forward],
                      ...resolveScrollOption(),
                    });
                  });
                }}
              />
            </div>
          </header>
          {pageTabsPinned ? <PageTabs /> : null}
        </div>
        {pageTabsPinned ? null : <PageTabs />}
        <main className="mx-auto max-w-screen-2xl p-4 sm:p-6 xl:p-8" id="main-content">
          <RouteTransition>
            <PluginLocaleProvider
              port={{
                locale,
                changeLocale: (next) => {
                  if (next === 'en' || next === 'zh-CN') setLocale(next);
                },
              }}
            >
              <HostNavigationPortProvider resolveHref={routeTargetResolver.resolveHref}>
                {children}
              </HostNavigationPortProvider>
            </PluginLocaleProvider>
          </RouteTransition>
        </main>
      </div>
    </ShellRoot>
  );
}
