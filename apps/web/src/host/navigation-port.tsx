'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PluginNavigationProvider,
  type PluginPortLinkProps,
} from '@community-go/plugin-framework/plugin';

import { proceedAfterLeaveConfirm } from './leave-confirm';
import { markForwardRouteIntent, pageTransitionTypes } from './route-transition-constants';
import { resolveScrollOption } from './scroll-preference';

/**
 * Host Navigation Port —— 唯一的 Router 接入点。
 *
 * 由 Composition Root 一次性安装；Plugin 通过 usePluginNavigation/RouteLink
 * 间接导航，绝不直接使用 Next Link/Router 或全局 location。
 * resolveHref 使用真实 Registry（由 AppShell 以 targetResolver 注入）——本模块
 * 只接收已解析的 href 委托 Next router。所有导航入口统一过
 * proceedAfterLeaveConfirm（no-op 短路 + 离开确认前置）。
 */

export type HostNavigationPortProps = Readonly<{
  /** 把 routeId 解析为 href；抛错保持失败语义。 */
  resolveHref: (
    target: Readonly<{ routeId: string; params: Readonly<Record<string, string>> }>,
  ) => string;
  children: ReactNode;
}>;

export function HostNavigationPortProvider({ resolveHref, children }: HostNavigationPortProps) {
  const router = useRouter();

  const renderLink = (props: PluginPortLinkProps) => (
    <Link
      className={props.className}
      href={props.href}
      transitionTypes={[pageTransitionTypes.forward]}
      {...(props.ariaLabel ? { 'aria-label': props.ariaLabel } : {})}
      {...(props.title ? { title: props.title } : {})}
      onClick={(event) => {
        event.preventDefault();
        if (props.onNavigate) queueMicrotask(props.onNavigate);
        void proceedAfterLeaveConfirm(props.href, 'plugin navigation').then((proceed) => {
          if (!proceed) return;
          markForwardRouteIntent();
          void router.push(props.href, {
            transitionTypes: [pageTransitionTypes.forward],
            ...resolveScrollOption(),
          });
        });
      }}
    >
      {props.children}
    </Link>
  );

  return (
    <PluginNavigationProvider
      port={{
        resolveHref: (target) => resolveHref(target),
        navigate: (href) => {
          void proceedAfterLeaveConfirm(href, 'plugin navigation').then((proceed) => {
            if (!proceed) return;
            markForwardRouteIntent();
            void router.push(href, {
              transitionTypes: [pageTransitionTypes.forward],
              ...resolveScrollOption(),
            });
          });
        },
        replace: (href) => {
          void proceedAfterLeaveConfirm(href, 'plugin navigation').then((proceed) => {
            if (!proceed) return;
            markForwardRouteIntent();
            void router.replace(href, {
              transitionTypes: [pageTransitionTypes.forward],
              ...resolveScrollOption(),
            });
          });
        },
        renderLink,
      }}
    >
      {children}
    </PluginNavigationProvider>
  );
}
