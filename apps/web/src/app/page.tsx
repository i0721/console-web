'use client';

import { Card, CardContent } from '@community-go/ui-adapter/card';
import { ProgressMeter } from '@community-go/ui-adapter/progress-meter';
import { StatusPill } from '@community-go/ui-adapter/status-pill';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleGauge,
  Layers3,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useFrontendTranslation } from '@community-go/i18n';
import { Page, PageHeader, Section } from '@community-go/surface-foundation/layout';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { RouterTextLink } from '../host/router-text-link';
import { ViewportReveal } from '@community-go/surface-foundation/viewport-reveal';
import { useShellStore } from '../state/use-shell-store';
import { useWorkbenchStore } from '../state/use-workbench-store';
import { useWorkspaceStore } from '../state/use-workspace-store';

const capabilityDefinitions = [
  { id: 'design', progress: 78, icon: Layers3, status: 'ready' },
  { id: 'adapter', progress: 64, icon: Boxes, status: 'inProgress' },
  { id: 'hosts', progress: 46, icon: MonitorSmartphone, status: 'inProgress' },
  { id: 'gates', progress: 72, icon: ShieldCheck, status: 'ready' },
] as const;

const metrics = [
  { value: '6', label: 'boundaries', detail: 'ready', icon: Workflow },
  { value: '24', label: 'tokens', detail: 'shared', icon: Sparkles },
  { value: '10', label: 'states', detail: 'ready', icon: CircleGauge },
  { value: '2', label: 'hosts', detail: 'shared', icon: MonitorSmartphone },
] as const;

export default function OverviewPage() {
  const { t } = useFrontendTranslation();
  // 首页工作区段（SET-005-005）：收藏 + 最近访问（Host store 直接消费；显示开关
  // 由导航偏好 showRecents 控制；最近记录由 recent-visit-recorder 驱动）。
  const recents = useWorkbenchStore((state) => state.recents);
  const favorites = useWorkbenchStore((state) => state.favorites);
  const showRecents = useShellStore((state) => state.preferences.navigation.showRecents);
  const showWorkbench = showRecents && recents.length > 0;
  const showFavorites = favorites.length > 0;

  // 自动恢复未完成工作（导航偏好 autoRestoreWorkspace，默认关）：进入首页根入口时，
  // 若存在含未提交草稿的页面记录 → 重定向回该草稿页（工作恢复目标优先于首页）。
  const autoRestoreWorkspace = useShellStore(
    (state) => state.preferences.navigation.autoRestoreWorkspace,
  );
  const router = useRouter();
  useEffect(() => {
    if (!autoRestoreWorkspace) return;
    const records = useWorkspaceStore.getState().records;
    const pagePathByRecordId: Readonly<Record<string, string>> = {
      'reference-resources.create': '/reference-resources/create',
      'reference-resources.edit': '/reference-resources/edit',
    };
    const restoreTarget = Object.keys(records)
      .map((pageId) => ({ pageId, record: records[pageId] }))
      .find(({ pageId, record }) => {
        const path = pagePathByRecordId[pageId];
        if (!path) return false;
        // 草稿有实际内容才视为未完成工作。
        const draft = record?.draft;
        return (
          draft !== undefined &&
          Object.values(draft).some((value) => typeof value === 'string' && value !== '')
        );
      });
    if (restoreTarget) {
      const href = pagePathByRecordId[restoreTarget.pageId];
      if (href) void router.replace(href);
    }
    // 只在首页根入口挂载时评估一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRestoreWorkspace]);

  return (
    <Page>
      <PageHeader
        eyebrow={t('overview.eyebrow')}
        title={t('overview.title')}
        description={t('overview.description')}
        actions={
          <>
            <RouterTextLink href="/foundations" leadingIcon={<Layers3 className="size-4" />}>
              {t('overview.action')}
            </RouterTextLink>
            <RouterTextLink href="/states" tone="neutral">
              {t('overview.secondaryAction')}
            </RouterTextLink>
          </>
        }
      />

      <div
        aria-label={t('overview.metricsLabel')}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ value, label, detail, icon: Icon }) => (
          <Card key={label}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-muted">
                    {t(`overview.metrics.${label}`)}
                  </p>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
                  <p className="mt-1 text-xs text-ink-muted">{t(`overview.metrics.${detail}`)}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
                  <Icon className="size-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(showWorkbench || showFavorites) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {showFavorites ? (
            <Section title={t('overview.favoritesTitle')}>
              <ul className="flex flex-col gap-1 p-5">
                {favorites.map((favorite) => (
                  <li key={favorite.pathname}>
                    <RouterTextLink href={favorite.pathname}>{favorite.title}</RouterTextLink>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          {showWorkbench ? (
            <Section title={t('overview.recentsTitle')}>
              <ul className="flex flex-col gap-1 p-5">
                {recents.slice(0, 6).map((recent) => (
                  <li key={recent.pathname}>
                    <RouterTextLink href={recent.pathname}>{recent.title}</RouterTextLink>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      )}

      <ViewportReveal>
        <Section
          id="overview-progress"
          title={t('overview.progressTitle')}
          description={t('overview.progressDescription')}
          action={<StatusPill tone="success">4 / 4 tracked</StatusPill>}
        >
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {capabilityDefinitions.map(({ id, progress, icon: Icon, status }) => (
              <Card key={id} appearance="flat">
                <CardContent>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface text-brand">
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-ink">{t(`capability.${id}`)}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">
                        {t(`capability.${id}Description`)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressMeter value={progress} label={t(`capability.${status}`)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </ViewportReveal>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          id="overview-quality"
          title={t('overview.qualityTitle')}
          description={t('overview.qualityDescription')}
        >
          <ul className="space-y-3 p-5">
            {['Import boundaries', 'HeroUI isolation', 'Token governance', 'Host leakage'].map(
              (gate) => (
                <li
                  key={gate}
                  className="flex items-center gap-3 rounded-control bg-surface-muted px-3 py-2.5"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">{gate}</span>
                  <span className="text-xs font-semibold text-success">Active</span>
                </li>
              ),
            )}
          </ul>
        </Section>

        <Section
          id="overview-activity"
          title={t('overview.activityTitle')}
          description={t('overview.activityDescription')}
        >
          <ol className="space-y-4 p-5">
            {[
              'Token contract established',
              'Web Host shell composed',
              'UI Adapter boundary active',
            ].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 border-b border-border pb-4 text-sm font-medium text-ink last:border-0 last:pb-0">
                  <span>{item}</span>
                  <ArrowRight className="size-4 shrink-0 text-ink-muted" />
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </Page>
  );
}
