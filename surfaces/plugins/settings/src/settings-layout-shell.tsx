'use client';

/**
 * settings —— 设置内页 Shell（SET-011：持久化布局壳）。
 *
 * - `SETTINGS_CATEGORIES`：单一映射表（shortId/routeId/模型 key/label/iconId/分组）。
 * - `SettingsShellContext`：layout 一次性装配的偏好 ctx 与失败横幅，下传各分类 page
 *   （page 只渲染分类区段，不重复订阅/装配——切换分类仅换右侧内容，壳不重挂载）。
 * - `SettingsSidebar`：SettingsLayout 左栏（固定顶部搜索 + 分组分类导航，含语义
 *   NavigationIcon 与 active 高亮）。
 * - `useSettingsPersistReport`：统一持久化失败呈现（reportingPort + notSaved + 重试）。
 */
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';

import { useFrontendTranslation } from '@community-go/i18n';
import {
  usePreferencesPort,
  type PersistResult,
  type PreferencesPort,
} from '@community-go/plugin-framework/preferences';
import { route, RouteLink } from '@community-go/plugin-framework/plugin';
import type { NavigationIconId } from '@community-go/surface/shell';
import { NavigationIcon } from '@community-go/surface/icon-presentation';
import type { Preferences } from '@community-go/surface/preferences-model';
import { PageHeader } from '@community-go/surface-foundation/layout';
import { AlertBanner } from '@community-go/ui-adapter/feedback';
import { Panel } from '@community-go/ui-adapter/panel';
import { SearchBox } from '@community-go/ui-adapter/search-box';
import { TriangleAlert } from 'lucide-react';

import type { Ctx } from './category-sections';
import { RestoreAllButton, RestoreCategoryButton } from './restore-defaults';
import { normalizeSearchTerm, searchSettings } from './settings-index';

/** 侧边栏分组（显示与数据 / 偏好与反馈 / 辅助与输入）。 */
export type SettingsNavGroup = 'display' | 'preferences' | 'assistive';

interface SettingsCategoryMetaInner {
  shortId: string;
  targetRouteId: string;
  categoryKey: keyof Preferences;
  labelKey: string;
  /** 语义 Icon id（Surface icon vocabulary，SET-011）。 */
  iconId: NavigationIconId;
  group: SettingsNavGroup;
}

export type SettingsCategoryMeta = Readonly<SettingsCategoryMetaInner>;

export const SETTINGS_CATEGORIES: readonly SettingsCategoryMeta[] = [
  {
    shortId: 'appearance',
    targetRouteId: 'settings',
    categoryKey: 'appearance',
    labelKey: 'settings.categories.appearance',
    iconId: 'palette',
    group: 'display',
  },
  {
    shortId: 'navigation',
    targetRouteId: 'settings.navigation',
    categoryKey: 'navigation',
    labelKey: 'settings.categories.navigation',
    iconId: 'navigation',
    group: 'display',
  },
  {
    shortId: 'data-display',
    targetRouteId: 'settings.data-display',
    categoryKey: 'dataDisplay',
    labelKey: 'settings.categories.dataDisplay',
    iconId: 'data',
    group: 'display',
  },
  {
    shortId: 'actions',
    targetRouteId: 'settings.actions',
    categoryKey: 'actionPreferences',
    labelKey: 'settings.categories.actionPreferences',
    iconId: 'action',
    group: 'preferences',
  },
  {
    shortId: 'locale',
    targetRouteId: 'settings.locale',
    categoryKey: 'localeRegion',
    labelKey: 'settings.categories.localeRegion',
    iconId: 'globe',
    group: 'preferences',
  },
  {
    shortId: 'notifications',
    targetRouteId: 'settings.notifications',
    categoryKey: 'notifications',
    labelKey: 'settings.categories.notifications',
    iconId: 'feedback',
    group: 'preferences',
  },
  {
    shortId: 'accessibility',
    targetRouteId: 'settings.accessibility',
    categoryKey: 'accessibility',
    labelKey: 'settings.categories.accessibility',
    iconId: 'accessibility',
    group: 'assistive',
  },
  {
    shortId: 'shortcuts',
    targetRouteId: 'settings.shortcuts',
    categoryKey: 'shortcuts',
    labelKey: 'settings.categories.shortcuts',
    iconId: 'keyboard',
    group: 'assistive',
  },
] as const;

/** 默认分类（外观）：canonical 在根路由 /settings。 */
export const appearanceMeta: SettingsCategoryMeta = SETTINGS_CATEGORIES[0]!;

/** 分组顺序与 label key（i18n）。 */
export const SETTINGS_NAV_GROUPS: ReadonlyArray<{
  group: SettingsNavGroup;
  labelKey: string;
}> = [
  { group: 'display', labelKey: 'settings.navGroups.display' },
  { group: 'preferences', labelKey: 'settings.navGroups.preferences' },
  { group: 'assistive', labelKey: 'settings.navGroups.assistive' },
];

/* ------------------------------------------------------------------ */
/* 偏好订阅 + 持久化失败统一呈现                                          */
/* ------------------------------------------------------------------ */

export function useSettingsPersistReport(): {
  reportingPort: PreferencesPort<Preferences>;
  banner: ReactNode;
  setLastResult: (result: PersistResult) => void;
  ctxFor: (prefs: Preferences) => Ctx;
} {
  const { t } = useFrontendTranslation();
  const port = usePreferencesPort<Preferences>();
  const [lastResult, setLastResult] = useState<PersistResult | null>(null);
  const [lastApply, setLastApply] = useState<(() => PersistResult) | null>(null);

  const reportingPort: PreferencesPort<Preferences> = {
    getSnapshot: port.getSnapshot.bind(port),
    subscribe: port.subscribe.bind(port),
    updateCategory: (category, patch) => {
      const run = () => port.updateCategory(category, patch);
      const result = run();
      setLastApply(() => run);
      setLastResult(result);
      return result;
    },
    resetCategory: (category) => {
      const run = () => port.resetCategory(category);
      const result = run();
      setLastApply(() => run);
      setLastResult(result);
      return result;
    },
    resetAll: () => {
      const run = () => port.resetAll();
      const result = run();
      setLastApply(() => run);
      setLastResult(result);
      return result;
    },
  };

  const banner =
    lastResult && !lastResult.ok ? (
      <AlertBanner
        actionLabel={t('settings.retry')}
        description={t('settings.notSavedDescription')}
        icon={<TriangleAlert className="size-4" aria-hidden="true" />}
        onAction={() => {
          if (lastApply) setLastResult(lastApply());
        }}
        title={t('settings.notSaved')}
        tone="warning"
      />
    ) : null;

  const ctxFor = (prefs: Preferences): Ctx => ({ port: reportingPort, prefs });
  return { reportingPort, banner, setLastResult, ctxFor };
}

/** 响应式 prefs 订阅（layout 单实例，供 ctx 构造）。 */
export function useSettingsPreferences(): Preferences {
  const port = usePreferencesPort<Preferences>();
  return useSyncExternalStore(port.subscribe, port.getSnapshot, port.getSnapshot);
}

/* ------------------------------------------------------------------ */
/* 壳 Context：layout 一次性装配，page 消费                                */
/* ------------------------------------------------------------------ */

export type SettingsShellValue = Ctx;

const SettingsShellContext = createContext<SettingsShellValue | null>(null);

/** layout 安装壳 ctx 供分类 page 消费（page 内 useSettingsShell() 取用）。 */
export function SettingsShellProvider({
  ctx,
  children,
}: Readonly<{ ctx: Ctx; children: ReactNode }>) {
  return <SettingsShellContext.Provider value={ctx}>{children}</SettingsShellContext.Provider>;
}

/** 分类 page 取壳 ctx（必须在 SettingsShellProvider 内）。 */
export function useSettingsShell(): Ctx {
  const value = useContext(SettingsShellContext);
  if (!value) {
    throw new Error('useSettingsShell 必须在 SettingsShellProvider 内使用（layout 提供）');
  }
  return value;
}

/* ------------------------------------------------------------------ */
/* 跨目录搜索                                                            */
/* ------------------------------------------------------------------ */

/** 跨目录设置搜索（固定在侧边栏顶部；命中跳对应分类页）。 */
export function SettingsSearch() {
  const { t } = useFrontendTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const resolveEntryText = (key: string) => {
    const resolved = t(key);
    return typeof resolved === 'string' ? resolved : key;
  };
  const searchResults = searchSettings(searchQuery, resolveEntryText);
  const searching = normalizeSearchTerm(searchQuery) !== '';

  return (
    <div className="grid gap-2">
      <SearchBox
        label={t('settings.searchLabel')}
        placeholder={t('settings.searchPlaceholder')}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      {searching ? (
        <div className="grid gap-1">
          {searchResults.entries.length === 0 ? (
            <p className="px-1 text-xs leading-5 text-ink-muted">
              {t('settings.searchEmpty')} · {t('settings.searchNoResultsDescription')}
            </p>
          ) : (
            searchResults.entries.map((entry) => {
              const meta = SETTINGS_CATEGORIES.find((item) => item.categoryKey === entry.category);
              if (!meta) return null;
              return (
                <RouteLink
                  ariaLabel={t(entry.nameKey)}
                  className="flex w-full items-center justify-between gap-2 rounded-control px-2.5 py-2 text-start text-sm outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus-ring"
                  key={`${entry.category}.${entry.fieldId}`}
                  target={route(meta.targetRouteId)}
                >
                  <span className="min-w-0 truncate font-medium text-ink">{t(entry.nameKey)}</span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {t(entry.categoryLabelKey)}
                  </span>
                </RouteLink>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 侧边栏（搜索顶部 + 分组分类导航）                                      */
/* ------------------------------------------------------------------ */

/** 分类导航项（含语义 Icon + active 高亮；沿用主导航 leaf 视觉规律）。 */
function NavItem({ meta, active }: Readonly<{ meta: SettingsCategoryMeta; active: string }>) {
  const { t } = useFrontendTranslation();
  const isActive = active === meta.categoryKey;
  return (
    <RouteLink
      ariaLabel={t(meta.labelKey)}
      className={`flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring ${
        isActive
          ? 'bg-brand-soft/60 font-semibold text-brand'
          : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
      }`}
      target={route(meta.targetRouteId)}
    >
      <NavigationIcon
        className={isActive ? 'size-4 shrink-0' : 'size-4 shrink-0'}
        iconId={meta.iconId}
      />
      <span className="min-w-0 truncate">{t(meta.labelKey)}</span>
    </RouteLink>
  );
}

/** SettingsLayout 左栏：固定顶部搜索 + 分组分类导航。 */
export function SettingsSidebar({ active }: Readonly<{ active: string }>) {
  const { t } = useFrontendTranslation();
  return (
    <Panel className="p-3">
      <SettingsSearch />
      <nav aria-label={t('settings.navLabel')} className="mt-4 grid gap-4">
        {SETTINGS_NAV_GROUPS.map((groupMeta) => (
          <div className="grid gap-0.5" key={groupMeta.group}>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {t(groupMeta.labelKey)}
            </p>
            {SETTINGS_CATEGORIES.filter((meta) => meta.group === groupMeta.group).map((meta) => (
              <NavItem active={active} key={meta.shortId} meta={meta} />
            ))}
          </div>
        ))}
      </nav>
    </Panel>
  );
}

/** 内容区 wrapper（分类区段 + 失败横幅）。 */
export function SettingsContentFrame({
  banner,
  children,
}: Readonly<{ banner?: ReactNode; children: ReactNode }>) {
  return (
    <div className="min-w-0 space-y-5">
      {banner}
      {children}
    </div>
  );
}

/** 分类页 PageHeader（layout 按当前分类渲染，含分类恢复 + 恢复全部默认）。 */
export function SettingsCategoryHeader({
  meta,
  onResult,
}: Readonly<{
  meta: SettingsCategoryMeta;
  onResult: (result: PersistResult) => void;
}>) {
  const { t } = useFrontendTranslation();
  return (
    <PageHeader
      actions={
        <>
          <RestoreCategoryButton
            category={meta.categoryKey}
            categoryLabel={t(meta.labelKey)}
            onResult={onResult}
          />
          <RestoreAllButton onResult={onResult} />
        </>
      }
      eyebrow={t('settings.eyebrow')}
      title={t(meta.labelKey)}
      description={t(`settings.categoryIntro.${meta.shortId}`)}
    />
  );
}
