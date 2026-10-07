'use client';

import { useFrontendTranslation } from '@community-go/i18n';
import type { PreferencesPort } from '@community-go/plugin-framework/preferences';
import type { Preferences } from '@community-go/surface/preferences-model';
import { TIME_ZONE_OPTIONS } from '@community-go/surface/preferences-model';
import { RadioGroupField, SelectField, SwitchField } from '@community-go/ui-adapter/form-field';
import { TextLink } from '@community-go/ui-adapter/navigation';
import type { ReactNode } from 'react';

/**
 * 分类设置区段（settings 插件）—— 每个区段真实消费 preferences-model 的对应分类，
 * 复用现有 Radio/Select/Switch；改动经 PreferencesPort.updateCategory 即时生效。
 *
 * 统一规则：
 * - 产品强制（错误/安全/高风险不可关、危险输入确认不可削弱、numbersFollowLocale 跟随
 *   地区不可关闭）以 disabled + 说明表达，不渲染可关开关；
 * - 同义设置共享字段：可访问性中的字号/动效/对比度其实只是"引用外观值"的展示，不重复
 *   建开关（增强项才是 accessibility 自有）。
 */

export type Ctx = {
  port: PreferencesPort<Preferences>;
  prefs: Preferences;
};

function SectionShell({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="grid gap-6 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">{title}</h3>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 外观 Appearance                                                      */
/* ------------------------------------------------------------------ */

export function AppearanceSection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const appearance = ctx.prefs.appearance;
  return (
    <SectionShell title={t('settings.categories.appearance')}>
      <RadioGroupField
        hint={t('settings.appearance.themeModeDescription')}
        label={t('settings.appearance.themeMode')}
        options={[
          {
            description: t('settings.appearance.themeFollowSystem'),
            label: t('settings.appearance.themeSystem'),
            value: 'system',
          },
          { label: t('settings.appearance.themeLight'), value: 'light' },
          { label: t('settings.appearance.themeDark'), value: 'dark' },
        ]}
        value={appearance.themeMode}
        onValueChange={(value) =>
          ctx.port.updateCategory('appearance', { themeMode: value } as never)
        }
      />
      <RadioGroupField
        hint={t('settings.appearance.accentDescription')}
        label={t('settings.appearance.accent')}
        options={[
          { label: t('settings.appearance.accentPurple'), value: 'purple' },
          { label: t('settings.appearance.accentBlue'), value: 'blue' },
          { label: t('settings.appearance.accentGreen'), value: 'green' },
          { label: t('settings.appearance.accentOrange'), value: 'orange' },
        ]}
        value={appearance.accent}
        onValueChange={(value) => ctx.port.updateCategory('appearance', { accent: value } as never)}
      />
      <RadioGroupField
        hint={t('settings.appearance.densityDescription')}
        label={t('settings.appearance.density')}
        options={[
          { label: t('settings.appearance.densityCompact'), value: 'compact' },
          { label: t('settings.appearance.densityStandard'), value: 'standard' },
          { label: t('settings.appearance.densityComfortable'), value: 'comfortable' },
        ]}
        value={appearance.density}
        onValueChange={(value) =>
          ctx.port.updateCategory('appearance', { density: value } as never)
        }
      />
      <RadioGroupField
        hint={t('settings.appearance.fontScaleDescription')}
        label={t('settings.appearance.fontScale')}
        options={[
          { label: t('settings.appearance.fontSmall'), value: 'small' },
          { label: t('settings.appearance.fontStandard'), value: 'standard' },
          { label: t('settings.appearance.fontLarge'), value: 'large' },
        ]}
        value={appearance.fontScale}
        onValueChange={(value) =>
          ctx.port.updateCategory('appearance', { fontScale: value } as never)
        }
      />
      <RadioGroupField
        hint={t('settings.appearance.contentWidthDescription')}
        label={t('settings.appearance.contentWidth')}
        options={[
          { label: t('settings.appearance.widthAuto'), value: 'auto' },
          { label: t('settings.appearance.widthStandard'), value: 'standard' },
          { label: t('settings.appearance.widthWide'), value: 'wide' },
        ]}
        value={appearance.contentWidth}
        onValueChange={(value) =>
          ctx.port.updateCategory('appearance', { contentWidth: value } as never)
        }
      />
      <RadioGroupField
        hint={t('settings.appearance.motionDescription')}
        label={t('settings.appearance.motion')}
        options={[
          { label: t('settings.appearance.motionSystem'), value: 'system' },
          { label: t('settings.appearance.motionStandard'), value: 'standard' },
          { label: t('settings.appearance.motionReduced'), value: 'reduced' },
        ]}
        value={appearance.motion}
        onValueChange={(value) => ctx.port.updateCategory('appearance', { motion: value } as never)}
      />
      <RadioGroupField
        hint={t('settings.appearance.contrastDescription')}
        label={t('settings.appearance.contrast')}
        options={[
          { label: t('settings.appearance.contrastSystem'), value: 'system' },
          { label: t('settings.appearance.contrastStandard'), value: 'standard' },
          { label: t('settings.appearance.contrastHigh'), value: 'high' },
        ]}
        value={appearance.contrast}
        onValueChange={(value) =>
          ctx.port.updateCategory('appearance', { contrast: value } as never)
        }
      />
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* 导航 Navigation                                                      */
/* ------------------------------------------------------------------ */

function switchRow(
  ctx: Ctx,
  category: keyof Preferences,
  field: string,
  checked: boolean,
  label: string,
  description: string,
) {
  return (
    <SwitchField
      checked={checked}
      description={description}
      label={label}
      onCheckedChange={(next) => ctx.port.updateCategory(category, { [field]: next } as never)}
    />
  );
}

export function NavigationSection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const nav = ctx.prefs.navigation;
  return (
    <SectionShell title={t('settings.categories.navigation')}>
      {switchRow(
        ctx,
        'navigation',
        'scrollToTopOnNavigate',
        nav.scrollToTopOnNavigate,
        t('settings.navigation.scrollToTopOnNavigate'),
        '',
      )}
      {switchRow(
        ctx,
        'navigation',
        'breadcrumbs',
        nav.breadcrumbs,
        t('settings.navigation.breadcrumbs'),
        '',
      )}
      {switchRow(
        ctx,
        'navigation',
        'pageTabsEnabled',
        nav.pageTabsEnabled,
        t('settings.navigation.pageTabsEnabled'),
        '',
      )}
      {switchRow(
        ctx,
        'navigation',
        'restoreLastTabs',
        nav.restoreLastTabs,
        t('settings.navigation.restoreLastTabs'),
        '',
      )}
      <SelectField
        hint={t('settings.navigation.tabCloseBehaviorHint')}
        label={t('settings.navigation.tabCloseBehavior')}
        options={[
          { label: t('settings.navigation.tabCloseRecent'), value: 'recent' },
          { label: t('settings.navigation.tabCloseRight'), value: 'right' },
          { label: t('settings.navigation.tabCloseLeft'), value: 'left' },
        ]}
        value={nav.tabCloseBehavior}
        onValueChange={(value) =>
          ctx.port.updateCategory('navigation', { tabCloseBehavior: value } as never)
        }
      />
      {switchRow(
        ctx,
        'navigation',
        'menuMemory',
        nav.menuMemory,
        t('settings.navigation.menuMemory'),
        '',
      )}
      {switchRow(
        ctx,
        'navigation',
        'rememberRecents',
        nav.rememberRecents,
        t('settings.navigation.rememberRecents'),
        '',
      )}
      {switchRow(
        ctx,
        'navigation',
        'showRecents',
        nav.showRecents,
        t('settings.navigation.showRecents'),
        '',
      )}
      {switchRow(
        ctx,
        'navigation',
        'autoRestoreWorkspace',
        nav.autoRestoreWorkspace,
        t('settings.navigation.autoRestoreWorkspace'),
        '',
      )}
      <RadioGroupField
        hint=""
        label={t('settings.navigation.sidebarBehavior')}
        options={[
          { label: t('settings.appearance.sidebarExpanded'), value: 'expanded' },
          { label: t('settings.appearance.sidebarCollapsed'), value: 'collapsed' },
          { label: t('settings.appearance.sidebarRemember'), value: 'remember' },
        ]}
        value={nav.sidebarBehavior}
        onValueChange={(value) =>
          ctx.port.updateCategory('navigation', { sidebarBehavior: value } as never)
        }
      />
      <RadioGroupField
        hint={t('settings.navigation.newPageOpenModeHint')}
        label={t('settings.navigation.newPageOpenMode')}
        options={[
          { label: t('settings.navigation.newPageCurrent'), value: 'current' },
          { label: t('settings.navigation.newPageBrowserTab'), value: 'browser-tab' },
          { label: t('settings.navigation.newPagePageTab'), value: 'page-tab' },
        ]}
        value={nav.newPageOpenMode}
        onValueChange={(value) =>
          ctx.port.updateCategory('navigation', { newPageOpenMode: value } as never)
        }
      />
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* 数据展示 Data display                                                */
/* ------------------------------------------------------------------ */

export function DataDisplaySection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const data = ctx.prefs.dataDisplay;
  return (
    <SectionShell title={t('settings.categories.dataDisplay')}>
      <SelectField
        hint=""
        label={t('settings.dataDisplay.pageSize')}
        options={[10, 20, 50, 100].map((size) => ({ label: String(size), value: String(size) }))}
        value={String(data.pageSize)}
        onValueChange={(value) =>
          ctx.port.updateCategory('dataDisplay', { pageSize: Number(value) } as never)
        }
      />
      <RadioGroupField
        hint=""
        label={t('settings.dataDisplay.tableDensity')}
        options={[
          { label: t('settings.appearance.densityCompact'), value: 'compact' },
          { label: t('settings.appearance.densityStandard'), value: 'standard' },
          { label: t('settings.appearance.densityComfortable'), value: 'comfortable' },
        ]}
        value={data.tableDensity}
        onValueChange={(value) =>
          ctx.port.updateCategory('dataDisplay', { tableDensity: value } as never)
        }
      />
      {switchRow(
        ctx,
        'dataDisplay',
        'rowSeparators',
        data.rowSeparators,
        t('settings.dataDisplay.rowSeparators'),
        '',
      )}
      {switchRow(
        ctx,
        'dataDisplay',
        'stickyHeader',
        data.stickyHeader,
        t('settings.dataDisplay.stickyHeader'),
        '',
      )}
      {switchRow(
        ctx,
        'dataDisplay',
        'rememberColumnLayout',
        data.rememberColumnLayout,
        t('settings.dataDisplay.rememberColumnLayout'),
        '',
      )}
      {switchRow(
        ctx,
        'dataDisplay',
        'rememberSort',
        data.rememberSort,
        t('settings.dataDisplay.rememberSort'),
        '',
      )}
      {switchRow(
        ctx,
        'dataDisplay',
        'rememberFilters',
        data.rememberFilters,
        t('settings.dataDisplay.rememberFilters'),
        '',
      )}
      {switchRow(
        ctx,
        'dataDisplay',
        'rememberPagination',
        data.rememberPagination,
        t('settings.dataDisplay.rememberPagination'),
        '',
      )}
      {switchRow(
        ctx,
        'dataDisplay',
        'emptyStateHint',
        data.emptyStateHint,
        t('settings.dataDisplay.emptyStateHint'),
        '',
      )}
      <RadioGroupField
        hint=""
        label={t('settings.dataDisplay.longText')}
        options={[
          { label: t('settings.dataDisplay.truncate'), value: 'truncate' },
          { label: t('settings.dataDisplay.wrap'), value: 'wrap' },
        ]}
        value={data.longText}
        onValueChange={(value) =>
          ctx.port.updateCategory('dataDisplay', { longText: value } as never)
        }
      />
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* 语言与地区 Locale & region                                           */
/* ------------------------------------------------------------------ */

export function LocaleRegionSection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const region = ctx.prefs.localeRegion;
  return (
    <SectionShell title={t('settings.categories.localeRegion')}>
      <RadioGroupField
        hint=""
        label={t('settings.localeRegion.language')}
        options={[
          { label: '简体中文', value: 'zh-CN' },
          { label: 'English', value: 'en' },
        ]}
        value={region.language}
        onValueChange={(value) =>
          ctx.port.updateCategory('localeRegion', { language: value } as never)
        }
      />
      <SelectField
        hint=""
        label={t('settings.localeRegion.dateFormat')}
        options={['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'].map((format) => ({
          label: format,
          value: format,
        }))}
        value={region.dateFormat}
        onValueChange={(value) =>
          ctx.port.updateCategory('localeRegion', { dateFormat: value } as never)
        }
      />
      <SelectField
        hint={t('settings.localeRegion.timeZoneHint')}
        label={t('settings.localeRegion.timeZone')}
        options={TIME_ZONE_OPTIONS.map((zone) => ({
          label: zone === 'auto' ? t('settings.localeRegion.timeZoneAuto') : zone,
          value: zone,
        }))}
        value={region.timeZone}
        onValueChange={(value) =>
          ctx.port.updateCategory('localeRegion', { timeZone: value } as never)
        }
      />
      <RadioGroupField
        hint=""
        label={t('settings.localeRegion.hourCycle')}
        options={[
          { label: t('settings.localeRegion.h24'), value: 'h24' },
          { label: t('settings.localeRegion.h12'), value: 'h12' },
        ]}
        value={region.hourCycle}
        onValueChange={(value) =>
          ctx.port.updateCategory('localeRegion', { hourCycle: value } as never)
        }
      />
      {switchRow(
        ctx,
        'localeRegion',
        'showSeconds',
        region.showSeconds,
        t('settings.localeRegion.showSeconds'),
        '',
      )}
      <RadioGroupField
        hint=""
        label={t('settings.localeRegion.relativeTime')}
        options={[
          { label: t('settings.localeRegion.relative'), value: 'relative' },
          { label: t('settings.localeRegion.exact'), value: 'exact' },
        ]}
        value={region.relativeTime}
        onValueChange={(value) =>
          ctx.port.updateCategory('localeRegion', { relativeTime: value } as never)
        }
      />
      <RadioGroupField
        hint=""
        label={t('settings.localeRegion.weekStart')}
        options={[
          { label: t('settings.localeRegion.monday'), value: 'monday' },
          { label: t('settings.localeRegion.sunday'), value: 'sunday' },
        ]}
        value={region.weekStart}
        onValueChange={(value) =>
          ctx.port.updateCategory('localeRegion', { weekStart: value } as never)
        }
      />
      {/* numbersFollowLocale 产品固定：说明 + disabled（不渲染可关开关）。 */}
      <div className="rounded-panel border border-border bg-surface-muted p-4 text-sm text-ink-muted">
        {t('settings.localeRegion.numbersFollowLocale')}：
        {t('settings.localeRegion.numbersFollowLocaleFixed')}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* 通知 Notifications                                                   */
/* ------------------------------------------------------------------ */

export function NotificationsSection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const n = ctx.prefs.notifications;
  return (
    <SectionShell title={t('settings.categories.notifications')}>
      {switchRow(
        ctx,
        'notifications',
        'inAppNotifications',
        n.inAppNotifications,
        t('settings.notifications.inAppNotifications'),
        '',
      )}
      {switchRow(
        ctx,
        'notifications',
        'unreadReminder',
        n.unreadReminder,
        t('settings.notifications.unreadReminder'),
        '',
      )}
      {switchRow(
        ctx,
        'notifications',
        'showBadge',
        n.showBadge,
        t('settings.notifications.showBadge'),
        '',
      )}
      {switchRow(ctx, 'notifications', 'sound', n.sound, t('settings.notifications.sound'), '')}
      {switchRow(
        ctx,
        'notifications',
        'desktopNotifications',
        n.desktopNotifications,
        t('settings.notifications.desktopNotifications'),
        '',
      )}
      {switchRow(
        ctx,
        'notifications',
        'collectNonCriticalToCenter',
        n.collectNonCriticalToCenter,
        t('settings.notifications.collectNonCriticalToCenter'),
        '',
      )}
      <RadioGroupField
        hint=""
        label={t('settings.notifications.toastDuration')}
        options={[
          { label: t('settings.notifications.toastShort'), value: 'short' },
          { label: t('settings.notifications.toastStandard'), value: 'standard' },
          { label: t('settings.notifications.toastLong'), value: 'long' },
        ]}
        value={n.toastDuration}
        onValueChange={(value) =>
          ctx.port.updateCategory('notifications', { toastDuration: value } as never)
        }
      />
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* 可访问性 Accessibility（自有增强项；动效/对比度/字号同义引用外观，不重复建开关） */
/* ------------------------------------------------------------------ */

export function AccessibilitySection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const a = ctx.prefs.accessibility;
  const appearance = ctx.prefs.appearance;
  const fontScaleLabel = {
    small: t('settings.appearance.fontSmall'),
    standard: t('settings.appearance.fontStandard'),
    large: t('settings.appearance.fontLarge'),
  }[appearance.fontScale];
  const motionLabel = {
    system: t('settings.appearance.motionSystem'),
    standard: t('settings.appearance.motionStandard'),
    reduced: t('settings.appearance.motionReduced'),
  }[appearance.motion];
  const contrastLabel = {
    system: t('settings.appearance.contrastSystem'),
    standard: t('settings.appearance.contrastStandard'),
    high: t('settings.appearance.contrastHigh'),
  }[appearance.contrast];
  return (
    <SectionShell title={t('settings.categories.accessibility')}>
      {/* 同义共享字段：外观的字号/动效/对比度在此统一查看（同一 preferences 字段）。 */}
      <div className="rounded-panel border border-border bg-surface-muted p-4">
        <p className="text-sm font-bold text-ink">{t('settings.accessibility.sharedTitle')}</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          {t('settings.accessibility.sharedDescription')}
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">{t('settings.accessibility.sharedFontScale')}</dt>
            <dd className="font-medium text-ink">{fontScaleLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">{t('settings.accessibility.sharedMotion')}</dt>
            <dd className="font-medium text-ink">{motionLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">{t('settings.accessibility.sharedContrast')}</dt>
            <dd className="font-medium text-ink">{contrastLabel}</dd>
          </div>
        </dl>
        <TextLink href="#appearance">{t('settings.accessibility.goToAppearance')}</TextLink>
      </div>
      {switchRow(
        ctx,
        'accessibility',
        'enhanceFocus',
        a.enhanceFocus,
        t('settings.accessibility.enhanceFocus'),
        '',
      )}
      {switchRow(
        ctx,
        'accessibility',
        'enhanceTargetSize',
        a.enhanceTargetSize,
        t('settings.accessibility.enhanceTargetSize'),
        '',
      )}
      {switchRow(
        ctx,
        'accessibility',
        'showKeyboardHints',
        a.showKeyboardHints,
        t('settings.accessibility.showKeyboardHints'),
        '',
      )}
      {switchRow(
        ctx,
        'accessibility',
        'followSystemAssistive',
        a.followSystemAssistive,
        t('settings.accessibility.followSystemAssistive'),
        '',
      )}
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* 快捷键 Shortcuts                                                     */
/* ------------------------------------------------------------------ */

export function ShortcutsSection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const s = ctx.prefs.shortcuts;
  return (
    <SectionShell title={t('settings.categories.shortcuts')}>
      {switchRow(ctx, 'shortcuts', 'enabled', s.enabled, t('settings.shortcuts.enabled'), '')}
      {switchRow(ctx, 'shortcuts', 'showHints', s.showHints, t('settings.shortcuts.showHints'), '')}
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* 操作偏好 Action preferences                                          */
/* ------------------------------------------------------------------ */

export function ActionPreferencesSection({ ctx }: Readonly<{ ctx: Ctx }>) {
  const { t } = useFrontendTranslation();
  const p = ctx.prefs.actionPreferences;
  return (
    <SectionShell title={t('settings.categories.actionPreferences')}>
      <RadioGroupField
        hint=""
        label={t('settings.actionPreferences.editSuccessDestination')}
        options={[
          { label: t('settings.actionPreferences.stay'), value: 'stay' },
          { label: t('settings.actionPreferences.list'), value: 'list' },
          { label: t('settings.actionPreferences.detail'), value: 'detail' },
        ]}
        value={p.editSuccessDestination}
        onValueChange={(value) =>
          ctx.port.updateCategory('actionPreferences', { editSuccessDestination: value } as never)
        }
      />
      <RadioGroupField
        hint=""
        label={t('settings.actionPreferences.createSuccessDestination')}
        options={[
          { label: t('settings.actionPreferences.list'), value: 'list' },
          { label: t('settings.actionPreferences.continueCreating'), value: 'continue' },
          {
            description: t('settings.actionPreferences.detailNotApplicableHint'),
            label: t('settings.actionPreferences.detail'),
            value: 'detail',
          },
        ]}
        value={p.createSuccessDestination}
        onValueChange={(value) =>
          ctx.port.updateCategory('actionPreferences', {
            createSuccessDestination: value,
          } as never)
        }
      />
      {switchRow(
        ctx,
        'actionPreferences',
        'autosaveDrafts',
        p.autosaveDrafts,
        t('settings.actionPreferences.autosaveDrafts'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'confirmLeave',
        p.confirmLeave,
        t('settings.actionPreferences.confirmLeave'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'confirmReset',
        p.confirmReset,
        t('settings.actionPreferences.confirmReset'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'confirmDelete',
        p.confirmDelete,
        t('settings.actionPreferences.confirmDelete'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'confirmBulk',
        p.confirmBulk,
        t('settings.actionPreferences.confirmBulk'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'focusFirstField',
        p.focusFirstField,
        t('settings.actionPreferences.focusFirstField'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'focusFirstError',
        p.focusFirstError,
        t('settings.actionPreferences.focusFirstError'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'copyFeedback',
        p.copyFeedback,
        t('settings.actionPreferences.copyFeedback'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'expandDetailInfo',
        p.expandDetailInfo,
        t('settings.actionPreferences.expandDetailInfo'),
        '',
      )}
      <RadioGroupField
        hint={t('settings.actionPreferences.detailModeHint')}
        label={t('settings.actionPreferences.detailMode')}
        options={[
          { label: t('settings.actionPreferences.detailCompact'), value: 'compact' },
          { label: t('settings.actionPreferences.detailFull'), value: 'full' },
        ]}
        value={p.detailMode}
        onValueChange={(value) =>
          ctx.port.updateCategory('actionPreferences', { detailMode: value } as never)
        }
      />
      <RadioGroupField
        hint=""
        label={t('settings.actionPreferences.refreshMode')}
        options={[
          { label: t('settings.actionPreferences.refreshOff'), value: 'off' },
          { label: t('settings.actionPreferences.refreshOnEnter'), value: 'on-enter' },
          { label: t('settings.actionPreferences.refreshPeriodic'), value: 'periodic' },
        ]}
        value={p.refreshMode}
        onValueChange={(value) =>
          ctx.port.updateCategory('actionPreferences', { refreshMode: value } as never)
        }
      />
      <RadioGroupField
        hint=""
        label={t('settings.actionPreferences.searchTrigger')}
        options={[
          { label: t('settings.actionPreferences.searchAuto'), value: 'auto' },
          { label: t('settings.actionPreferences.searchEnter'), value: 'enter' },
        ]}
        value={p.searchTrigger}
        onValueChange={(value) =>
          ctx.port.updateCategory('actionPreferences', { searchTrigger: value } as never)
        }
      />
      {switchRow(
        ctx,
        'actionPreferences',
        'rememberSearchHistory',
        p.rememberSearchHistory,
        t('settings.actionPreferences.rememberSearchHistory'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'showSearchHistory',
        p.showSearchHistory,
        t('settings.actionPreferences.showSearchHistory'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'showSearchSuggestions',
        p.showSearchSuggestions,
        t('settings.actionPreferences.showSearchSuggestions'),
        '',
      )}
      {switchRow(
        ctx,
        'actionPreferences',
        'keepLastSearchPerPage',
        p.keepLastSearchPerPage,
        t('settings.actionPreferences.keepLastSearchPerPage'),
        '',
      )}
    </SectionShell>
  );
}
