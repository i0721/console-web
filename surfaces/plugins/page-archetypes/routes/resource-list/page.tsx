'use client';

import {
  createReferenceSnapshot,
  filterReferenceRecords,
  getReferenceRecords,
  type ReferenceRecord,
  type ReferenceStatus,
} from '../../src/reference-scenarios';
import { Action } from '@community-go/ui-adapter/action';
import { AsyncRegion } from '@community-go/ui-adapter/async-region';
import { BusyIndicator } from '@community-go/ui-adapter/busy-indicator';
import { DataTable, TabsView, type DataColumn } from '@community-go/ui-adapter/data-display';
import { DescriptionList } from '@community-go/ui-adapter/description-list';
import { useFeedback } from '@community-go/ui-adapter/feedback-context';
import { CheckboxField, SelectField } from '@community-go/ui-adapter/form-field';
import { UserIdentity } from '@community-go/ui-adapter/identity';
import { PaginationControl } from '@community-go/ui-adapter/navigation';
import { ConfirmDialog, DialogSurface, DrawerSurface } from '@community-go/ui-adapter/overlays';
import { Panel } from '@community-go/ui-adapter/panel';
import { ProgressMeter } from '@community-go/ui-adapter/progress-meter';
import { SearchBox } from '@community-go/ui-adapter/search-box';
import { Skeleton } from '@community-go/ui-adapter/skeleton';
import { StateSurface } from '@community-go/ui-adapter/state-surface';
import { StatusPill, type StatusTone } from '@community-go/ui-adapter/status-pill';
import {
  AlertTriangle,
  CloudOff,
  Download,
  FileWarning,
  Filter,
  Inbox,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { formatDate, useFrontendTranslation } from '@community-go/i18n';

import { browserReferenceExport } from '../../src/browser-reference-export';
import {
  FilterBar,
  PageHeader,
  Page,
  Section,
  SectionBody,
  Toolbar,
  SplitView,
} from '@community-go/surface-foundation/layout';
import { usePluginLocale } from '@community-go/plugin-framework/plugin';
import { usePreferencesPort } from '@community-go/plugin-framework/preferences';
import { useWorkspacePort } from '@community-go/plugin-framework/workspace';
import { rehydrateStore } from '@community-go/state-foundation';
import { usePeriodicRefresh } from '@community-go/surface-foundation/use-periodic-refresh';
import { formatDateOnly, type Preferences } from '@community-go/surface/preferences-model';

import { useSearchHistoryStore } from '../../stores/search-history';
import { normalizeColumnLayout, useColumnLayoutStore } from '../../stores/column-layout';

type SceneMode =
  | 'ready'
  | 'loading'
  | 'refreshing'
  | 'background'
  | 'empty'
  | 'partial-error'
  | 'offline'
  | 'permission';

const records = getReferenceRecords();

const statusTone: Record<ReferenceStatus, StatusTone> = {
  healthy: 'success',
  attention: 'warning',
  paused: 'neutral',
};

/**
 * 搜索建议（操作偏好 showSearchSuggestions，默认开）真实消费：键入时从记录集
 * 候选（负责人/地区/状态标签）匹配展示，点击即应用为搜索词。默认开 → 显示；
 * 关 → 不渲染（搜索行为不变）。
 */
function SearchSuggestions({
  query: rawQuery,
  onPick,
}: Readonly<{ query: string; onPick: (value: string) => void }>) {
  const { t } = useFrontendTranslation();
  const query = rawQuery.toLowerCase();
  const candidates: string[] = [];
  const push = (value: string) => {
    if (value.toLowerCase().includes(query) && !candidates.includes(value)) {
      candidates.push(value);
    }
  };
  for (const record of records) {
    push(record.owner);
    push(t(`reference.region.${record.region}`) as string);
    push(t(`reference.status.${record.status}`) as string);
    if (candidates.length >= 6) break;
  }
  if (candidates.length === 0) return null;
  return (
    <div
      aria-label={t('reference.searchSuggestionsLabel')}
      className="mt-2 flex flex-wrap gap-1.5"
      role="list"
    >
      {candidates.map((candidate) => (
        <button
          className="rounded-control border border-border bg-surface px-2.5 py-1 text-xs text-ink outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus-ring"
          key={candidate}
          onClick={() => onPick(candidate)}
          role="listitem"
          type="button"
        >
          {candidate}
        </button>
      ))}
    </div>
  );
}

export default function ReferenceWorkspacePage() {
  const { t } = useFrontendTranslation();
  const { notify } = useFeedback();
  const locale = usePluginLocale().locale;
  const preferencesPort = usePreferencesPort<Preferences>();
  // 订阅偏好：localeRegion.dateFormat（updated 列消费——地区日期格式真实生效）。
  const dateFormat = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().localeRegion.dateFormat,
    () => preferencesPort.getSnapshot().localeRegion.dateFormat,
  );
  // 订阅偏好：dataDisplay.pageSize（分页默认每页数量，全局默认真实生效）。
  const pageSize = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.pageSize,
    () => preferencesPort.getSnapshot().dataDisplay.pageSize,
  );
  // 订阅偏好：actionPreferences.refreshMode（自动刷新：off/on-enter/periodic）。
  const refreshMode = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().actionPreferences.refreshMode,
    () => preferencesPort.getSnapshot().actionPreferences.refreshMode,
  );
  // 订阅偏好：dataDisplay 行分隔/固定表头/空态说明（DataTable 真实消费）。
  const rowSeparators = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.rowSeparators,
    () => preferencesPort.getSnapshot().dataDisplay.rowSeparators,
  );
  const stickyHeader = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.stickyHeader,
    () => preferencesPort.getSnapshot().dataDisplay.stickyHeader,
  );
  const emptyStateHint = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.emptyStateHint,
    () => preferencesPort.getSnapshot().dataDisplay.emptyStateHint,
  );
  // 定期刷新（SET-006-004）：periodic 时按产品预设 60s 周期刷新本地快照时间戳；
  // 后台/离线/提交中/有未提交编辑暂停（文档可见性 + navigator.onLine）。
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  usePeriodicRefresh({
    enabled: refreshMode === 'periodic',
    isPaused: () =>
      document.visibilityState === 'hidden' ||
      (typeof navigator !== 'undefined' && navigator.onLine === false),
    onTick: () => setLastRefreshedAt(Date.now()),
  });
  // 刷新模式=仅页面重新进入时（on-enter）：mount（每次进入本页）刷新一次本地快照时间戳。
  useEffect(() => {
    if (refreshMode !== 'on-enter') return;
    setLastRefreshedAt(Date.now());
  }, [refreshMode]);
  // 搜索时机（操作偏好 searchTrigger，默认 enter）：enter → 键入不立即过滤，回车应用；
  // auto → 键入即时过滤（页面覆盖优先于全局默认的机制与本页密度一致）。
  const searchTrigger = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().actionPreferences.searchTrigger,
    () => preferencesPort.getSnapshot().actionPreferences.searchTrigger,
  );
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [status, setStatus] = useState<ReferenceStatus | 'all'>('all');
  const [region, setRegion] = useState<ReferenceRecord['region'] | 'all'>('all');
  // 搜索历史（操作偏好 rememberSearchHistory/showSearchHistory）：记录/显示分别可关，
  // 独立 clear（"清空搜索历史"明确动作，不随关闭记忆删除）。
  const rememberSearchHistory = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().actionPreferences.rememberSearchHistory,
    () => preferencesPort.getSnapshot().actionPreferences.rememberSearchHistory,
  );
  const showSearchHistory = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().actionPreferences.showSearchHistory,
    () => preferencesPort.getSnapshot().actionPreferences.showSearchHistory,
  );
  const searchHistoryEntries = useSearchHistoryStore((state) => state.entries);
  // 显式 hydration（skipHydration store；持久化写入门控依赖 hydration 已开始）。
  useEffect(() => {
    rehydrateStore(useSearchHistoryStore);
  }, []);
  const recordSearch = (term: string) => {
    if (rememberSearchHistory) useSearchHistoryStore.getState().record(term);
  };
  const applyQueryValue = (value: string) => {
    setAppliedQuery(value);
    recordSearch(value);
  };
  // 全局默认（数据展示 → 表格密度）→ 页面本地覆盖（三档偏好映射到 DataTable 两档表面：
  // compact→compact，standard/comfortable→comfortable；显式页面操作优先于全局默认）。
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() =>
    preferencesPort.getSnapshot().dataDisplay.tableDensity === 'compact'
      ? 'compact'
      : 'comfortable',
  );
  const [sceneMode, setSceneMode] = useState<SceneMode>('ready');
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? '');
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    columnId: string;
    direction: 'ascending' | 'descending';
  }>({ columnId: 'updated', direction: 'descending' });
  const [exported, setExported] = useState(false);
  // 批量操作确认（操作偏好 confirmBulk，默认开）：导出所选 N 条前二次确认。
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const confirmBulk = preferencesPort.getSnapshot().actionPreferences.confirmBulk;

  const activeQuery = searchTrigger === 'auto' ? query : appliedQuery;
  const filteredRecords = useMemo(
    () => filterReferenceRecords(records, { query: activeQuery, status, region }),
    [activeQuery, region, status],
  );
  const selectedRecord =
    filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0];

  const sortedRecords = useMemo(() => {
    const direction = sort.direction === 'ascending' ? 1 : -1;
    return [...filteredRecords].sort((left, right) => {
      const leftValue =
        sort.columnId === 'workstream'
          ? left.name
          : sort.columnId === 'progress'
            ? left.completionPercent
            : sort.columnId === 'updated'
              ? left.updatedAt
              : left[sort.columnId as 'owner' | 'status' | 'region'];
      const rightValue =
        sort.columnId === 'workstream'
          ? right.name
          : sort.columnId === 'progress'
            ? right.completionPercent
            : sort.columnId === 'updated'
              ? right.updatedAt
              : right[sort.columnId as 'owner' | 'status' | 'region'];
      return (
        String(leftValue).localeCompare(String(rightValue), locale, { numeric: true }) * direction
      );
    });
  }, [filteredRecords, locale, sort]);

  // 长文本默认处理（数据展示 → longText，默认 truncate）：工作流名截断/换行。
  const longText = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.longText,
    () => preferencesPort.getSnapshot().dataDisplay.longText,
  );
  // 搜索建议（操作偏好 showSearchSuggestions，默认开）：键入时展示匹配建议。
  const showSearchSuggestions = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().actionPreferences.showSearchSuggestions,
    () => preferencesPort.getSnapshot().actionPreferences.showSearchSuggestions,
  );
  // 保留各页面最近一次搜索条件（操作偏好 keepLastSearchPerPage，默认关）。
  const keepLastSearchPerPage = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().actionPreferences.keepLastSearchPerPage,
    () => preferencesPort.getSnapshot().actionPreferences.keepLastSearchPerPage,
  );

  const columns = useMemo<readonly DataColumn<ReferenceRecord>[]>(
    () => [
      {
        id: 'workstream',
        label: t('reference.columns.workstream'),
        rowHeader: true,
        sortable: true,
        render: (record) => (
          <div className="min-w-48">
            <p
              className={`font-semibold text-ink ${longText === 'wrap' ? 'whitespace-normal break-words' : 'truncate'}`}
              title={record.name}
            >
              {record.name}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">{record.id}</p>
          </div>
        ),
      },
      {
        id: 'owner',
        label: t('reference.columns.owner'),
        sortable: true,
        render: (record) => (
          <UserIdentity
            avatarSize="sm"
            description={t(`reference.region.${record.region}`)}
            name={record.owner}
          />
        ),
      },
      {
        id: 'status',
        label: t('reference.columns.status'),
        sortable: true,
        render: (record) => (
          <StatusPill tone={statusTone[record.status]}>
            {t(`reference.status.${record.status}`)}
          </StatusPill>
        ),
      },
      {
        id: 'region',
        label: t('reference.columns.region'),
        sortable: true,
        render: (record) => t(`reference.region.${record.region}`),
      },
      {
        id: 'progress',
        label: t('reference.columns.progress'),
        sortable: true,
        render: (record) => (
          <div className="min-w-32">
            <ProgressMeter
              label={`${record.completionPercent}%`}
              value={record.completionPercent}
            />
          </div>
        ),
      },
      {
        id: 'updated',
        label: t('reference.columns.updated'),
        sortable: true,
        render: (record) => formatDateOnly(dateFormat, record.updatedAt),
      },
    ],
    [locale, t, dateFormat],
  );

  // 列布局（数据展示 → rememberColumnLayout，默认开）：恢复已存列的显隐/顺序
  // （normalize：退役列过滤 + workstream 标识列保持首位），列设置改动即存。
  const rememberColumnLayout = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.rememberColumnLayout,
    () => preferencesPort.getSnapshot().dataDisplay.rememberColumnLayout,
  );
  const canonicalColumnIds = columns.map((column) => column.id);
  const MANDATORY_COLUMNS = new Set(['workstream']);
  const [visibleOrder, setVisibleOrder] = useState<readonly string[] | null>(null);
  // 订阅已保存布局：hydration setState 落地后反应式恢复（比一次性 rAF 可靠）。
  const savedLayout = useColumnLayoutStore(
    (state) => state.layouts['page-archetypes.resource-list'],
  );
  useEffect(() => {
    if (!rememberColumnLayout) return;
    rehydrateStore(useColumnLayoutStore);
  }, [rememberColumnLayout]);
  useEffect(() => {
    if (!rememberColumnLayout || visibleOrder !== null) return;
    if (savedLayout?.visibleOrder && savedLayout.visibleOrder.length > 0) {
      setVisibleOrder(
        normalizeColumnLayout(canonicalColumnIds, savedLayout.visibleOrder, MANDATORY_COLUMNS),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rememberColumnLayout, savedLayout]);
  const orderedIds = visibleOrder && rememberColumnLayout ? visibleOrder : canonicalColumnIds;
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const displayColumns = useMemo(
    () =>
      orderedIds
        .map((id) => columnById.get(id))
        .filter((column): column is NonNullable<typeof column> => Boolean(column)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedIds.join('|'), columns],
  );
  const persistColumnLayout = (order: readonly string[]) => {
    setVisibleOrder(order);
    if (rememberColumnLayout) {
      const prior = useColumnLayoutStore.getState().layouts['page-archetypes.resource-list'];
      useColumnLayoutStore.getState().saveLayout('page-archetypes.resource-list', {
        visibleOrder: order,
        ...(prior?.sort ? { sort: prior.sort } : {}),
      });
    }
  };
  // 列设置交互（显隐 checkbox + 键盘可操作前移/后移）：显隐序 = orderedIds；
  // 后移一位 = 在 orderedIds 中把 id 前移/后移。
  const moveColumn = (id: string, delta: -1 | 1) => {
    const idx = orderedIds.indexOf(id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= orderedIds.length) return;
    const next = [...orderedIds];
    const [moved] = next.splice(idx, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    persistColumnLayout(next);
  };
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  // 排序记忆（数据展示 → rememberSort，默认关）：页码排序状态变化即存（与列布局
  // 同一 per-page 记录合并），进入页面恢复。
  const rememberSort = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.rememberSort,
    () => preferencesPort.getSnapshot().dataDisplay.rememberSort,
  );
  const persistSort = (nextSort: typeof sort) => {
    useColumnLayoutStore.getState().saveLayout('page-archetypes.resource-list', {
      visibleOrder: orderedIds,
      ...(nextSort ? { sort: nextSort } : {}),
    });
  };
  useEffect(() => {
    if (!rememberSort) return;
    rehydrateStore(useColumnLayoutStore);
    if (savedLayout?.sort) setSort(savedLayout.sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rememberSort, savedLayout]);
  const visibleRecords = sceneMode === 'empty' ? [] : sortedRecords;
  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = visibleRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 列表状态记忆（数据展示 → rememberPagination/rememberFilters，默认关）：
  // registerPageState 声明列表状态白名单（无草稿字段）；开时进入页面恢复已存
  // 页码/筛选（页码按当前页数校正，筛选项逐一校验），状态变化保存。
  const rememberPagination = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.rememberPagination,
    () => preferencesPort.getSnapshot().dataDisplay.rememberPagination,
  );
  const rememberFilters = useSyncExternalStore(
    (onChange) => preferencesPort.subscribe(onChange),
    () => preferencesPort.getSnapshot().dataDisplay.rememberFilters,
    () => preferencesPort.getSnapshot().dataDisplay.rememberFilters,
  );
  const workspacePort = useWorkspacePort<'none'>();
  const listRestored = useRef(false);
  useEffect(() => {
    if (!rememberPagination && !rememberFilters && !keepLastSearchPerPage) return;
    let cancelled = false;
    let frames: number[] = [];
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => {
        if (cancelled) return;
        const restoredList = workspacePort.restorePageState('page-archetypes.resource-list')?.list;
        if (restoredList) {
          if (rememberPagination) {
            const restored = restoredList.page;
            if (typeof restored === 'number' && restored >= 1 && restored <= totalPages) {
              setPage(restored);
            }
          }
          if (rememberFilters) {
            const filters = restoredList.filters;
            const statuses: readonly ReferenceStatus[] = ['healthy', 'attention', 'paused'];
            if (filters['status'] && statuses.includes(filters['status'] as ReferenceStatus)) {
              setStatus(filters['status'] as ReferenceStatus);
            }
            const regions: readonly ReferenceRecord['region'][] = ['apac', 'emea', 'americas'];
            if (
              filters['region'] &&
              regions.includes(filters['region'] as ReferenceRecord['region'])
            ) {
              setRegion(filters['region'] as ReferenceRecord['region']);
            }
          }
          // 保留最近搜索条件（keepLastSearchPerPage）独立于筛选记忆：仅恢复搜索词。
          const restoredFilters = restoredList.filters;
          const savedTerm = restoredFilters['query'];
          if (keepLastSearchPerPage && typeof savedTerm === 'string' && savedTerm !== '') {
            setQuery(savedTerm);
            setAppliedQuery(savedTerm);
          }
        }
        listRestored.current = true;
      });
      frames = [frame2];
    });
    frames = [frame1];
    return () => {
      cancelled = true;
      frames.forEach((frame) => cancelAnimationFrame(frame));
    };
    // 只恢复一次；totalPages/偏好变化不反复改写（用户显式操作优先）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rememberPagination, rememberFilters, keepLastSearchPerPage]);
  useEffect(() => {
    if (
      (!rememberPagination && !rememberFilters && !keepLastSearchPerPage) ||
      !listRestored.current
    )
      return;
    workspacePort.savePageState('page-archetypes.resource-list', {
      list: {
        filters: {
          ...(rememberFilters && status !== 'all' ? { status } : {}),
          ...(rememberFilters && region !== 'all' ? { region } : {}),
          ...((rememberFilters || keepLastSearchPerPage) && activeQuery !== ''
            ? { query: activeQuery }
            : {}),
        },
        page: rememberPagination ? currentPage : 1,
        pageSize,
        scrollTop: 0,
      },
    });
  }, [
    rememberPagination,
    rememberFilters,
    keepLastSearchPerPage,
    currentPage,
    pageSize,
    status,
    region,
    activeQuery,
    workspacePort,
  ]);
  useEffect(() => {
    return workspacePort.registerPageState({
      pageId: 'page-archetypes.resource-list',
      version: 1,
      draftFields: [],
      allowListState: true,
    });
  }, [workspacePort]);
  // sceneMode → AsyncRegion 阶段映射：首次加载、保留内容刷新、后台刷新与替换状态分轨。
  const asyncPhase =
    sceneMode === 'loading'
      ? 'initial'
      : sceneMode === 'refreshing'
        ? 'refreshing'
        : sceneMode === 'background'
          ? 'background'
          : sceneMode === 'empty'
            ? 'empty'
            : sceneMode === 'offline' || sceneMode === 'permission'
              ? 'error'
              : 'ready';

  const metrics = [
    { label: t('reference.metrics.total'), value: String(records.length), tone: 'text-brand' },
    {
      label: t('reference.metrics.attention'),
      value: String(records.filter((record) => record.status === 'attention').length),
      tone: 'text-warning',
    },
    {
      label: t('reference.metrics.highRisk'),
      value: String(records.filter((record) => record.risk === 'high').length),
      tone: 'text-danger',
    },
    {
      label: t('reference.metrics.filtered'),
      value: String(filteredRecords.length),
      tone: 'text-info',
    },
  ] as const;

  const exportSnapshot = async () => {
    await browserReferenceExport.exportTextFile(
      'frontend-reference-snapshot.json',
      createReferenceSnapshot(filteredRecords),
    );
    setExported(true);
    notify({
      title: t('reference.exported'),
      description: t('reference.tableDescription', { count: filteredRecords.length }),
      tone: 'success',
    });
  };

  const exportSelected = async () => {
    const selectedRecords = records.filter((record) => selectedIds.includes(record.id));
    await browserReferenceExport.exportTextFile(
      'frontend-reference-snapshot.json',
      createReferenceSnapshot(selectedRecords),
    );
    setExported(true);
    notify({
      title: t('reference.exported'),
      description: t('reference.selectedCount', { count: selectedRecords.length }),
      tone: 'success',
    });
  };

  return (
    <Page>
      <PageHeader
        breadcrumbLabel={t('layout.breadcrumb')}
        breadcrumbs={[
          { label: t('reference.breadcrumbRoot') },
          { label: t('reference.breadcrumbCurrent'), current: true },
        ]}
        eyebrow={t('reference.eyebrow')}
        title={t('reference.title')}
        description={t('reference.description')}
        actions={
          <>
            <DrawerSurface
              triggerLabel={t('reference.openDrawer')}
              title={t('reference.drawerTitle')}
              description={t('reference.drawerDescription')}
              closeLabel={t('reference.close')}
            >
              <div className="space-y-4">
                {records.slice(0, 8).map((record) => (
                  <div className="rounded-control bg-surface-muted p-3" key={record.id}>
                    <p className="text-sm font-semibold text-ink">{record.name}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">{record.description}</p>
                  </div>
                ))}
              </div>
            </DrawerSurface>
            <DialogSurface
              triggerLabel={t('reference.openDialog')}
              title={t('reference.dialogTitle')}
              description={t('reference.dialogDescription')}
              cancelLabel={t('reference.cancel')}
              confirmLabel={t('reference.confirm')}
              onConfirm={() => setExported(true)}
            >
              <p className="text-sm leading-6 text-ink-muted">{t('reference.dialogBody')}</p>
            </DialogSurface>
            <ConfirmDialog
              cancelLabel={t('reference.cancel')}
              confirmLabel={t('reference.confirm')}
              description={t('reference.bulkExportDescription', {
                count: selectedIds.length,
              })}
              failureMessage={t('reference.exportFailure')}
              impact={t('reference.bulkExportImpact')}
              isOpen={bulkExportOpen}
              onOpenChange={setBulkExportOpen}
              onConfirm={() => void exportSelected()}
              title={t('reference.bulkExportTitle', { count: selectedIds.length })}
              triggerLabel=""
            />
            <ConfirmDialog
              cancelLabel={t('reference.cancel')}
              confirmLabel={t('reference.confirm')}
              description={t('reference.columnSettingsDescription')}
              failureMessage={t('reference.exportFailure')}
              impact={
                <div className="flex flex-col gap-1">
                  {columns.map((column) => {
                    const visible = orderedIds.includes(column.id);
                    const mandatory = MANDATORY_COLUMNS.has(column.id);
                    const idx = orderedIds.indexOf(column.id);
                    return (
                      <div
                        className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 py-2"
                        key={column.id}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-ink">
                          <CheckboxField
                            checked={visible}
                            disabled={mandatory}
                            label={column.label}
                            onCheckedChange={() => {
                              const next = visible
                                ? orderedIds.filter((id) => id !== column.id)
                                : [...orderedIds, column.id];
                              persistColumnLayout(next);
                            }}
                          />
                          {mandatory ? (
                            <span className="text-xs text-ink-muted">
                              {t('reference.columnMandatory')}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-1">
                          <button
                            aria-label={t('reference.columnMoveLeft', { column: column.label })}
                            className="grid size-7 place-items-center rounded-control border border-border bg-surface text-ink-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"
                            disabled={!visible || idx <= 0}
                            onClick={() => moveColumn(column.id, -1)}
                            type="button"
                          >
                            ←
                          </button>
                          <button
                            aria-label={t('reference.columnMoveRight', { column: column.label })}
                            className="grid size-7 place-items-center rounded-control border border-border bg-surface text-ink-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"
                            disabled={!visible || idx < 0 || idx >= orderedIds.length - 1}
                            onClick={() => moveColumn(column.id, 1)}
                            type="button"
                          >
                            →
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              }
              isOpen={columnSettingsOpen}
              onOpenChange={setColumnSettingsOpen}
              onConfirm={() => setColumnSettingsOpen(false)}
              title={t('reference.columnSettingsTitle')}
              triggerLabel=""
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Panel className="p-5" key={metric.label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {metric.label}
            </p>
            <p className={`mt-3 text-3xl font-extrabold ${metric.tone}`}>{metric.value}</p>
          </Panel>
        ))}
      </div>

      <Toolbar
        label={t('layout.toolbar')}
        primary={
          <div className="min-w-64 flex-1">
            {searchTrigger === 'enter' ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  applyQueryValue(query);
                }}
              >
                <SearchBox
                  label={t('reference.searchLabel')}
                  placeholder={t('reference.searchPlaceholder')}
                  value={query}
                  onValueChange={setQuery}
                />
              </form>
            ) : (
              <SearchBox
                label={t('reference.searchLabel')}
                placeholder={t('reference.searchPlaceholder')}
                value={query}
                onValueChange={(value) => {
                  setQuery(value);
                  applyQueryValue(value);
                }}
              />
            )}
            {showSearchSuggestions && query.trim() !== '' ? (
              <SearchSuggestions
                onPick={(value) => {
                  setQuery(value);
                  applyQueryValue(value);
                }}
                query={query.trim()}
              />
            ) : null}
            {showSearchHistory && searchHistoryEntries.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-ink-muted">{t('reference.recentSearches')}</span>
                {searchHistoryEntries.slice(0, 5).map((entry) => (
                  <button
                    className="rounded-control border border-border bg-surface px-2 py-0.5 text-xs text-ink hover:bg-surface-muted"
                    key={entry.term}
                    type="button"
                    onClick={() => {
                      setQuery(entry.term);
                      applyQueryValue(entry.term);
                    }}
                  >
                    {entry.term}
                  </button>
                ))}
                <button
                  className="text-xs text-ink-muted underline hover:text-ink"
                  type="button"
                  onClick={() => useSearchHistoryStore.getState().clear()}
                >
                  {t('reference.clearSearchHistory')}
                </button>
              </div>
            ) : null}
          </div>
        }
        secondary={
          <>
            {exported ? <StatusPill tone="success">{t('reference.exported')}</StatusPill> : null}
            <Action
              size="sm"
              variant="secondary"
              leadingIcon={<Download className="size-4" />}
              onPress={() => void exportSnapshot()}
            >
              {t('reference.export')}
            </Action>
          </>
        }
      />

      <FilterBar>
        <SelectField
          label={t('reference.statusLabel')}
          value={status}
          options={[
            { value: 'all', label: t('reference.all') },
            { value: 'healthy', label: t('reference.status.healthy') },
            { value: 'attention', label: t('reference.status.attention') },
            { value: 'paused', label: t('reference.status.paused') },
          ]}
          onValueChange={(value) => {
            setStatus(value as ReferenceStatus | 'all');
            setPage(1);
          }}
        />
        <SelectField
          label={t('reference.regionLabel')}
          value={region}
          options={[
            { value: 'all', label: t('reference.all') },
            { value: 'apac', label: t('reference.region.apac') },
            { value: 'emea', label: t('reference.region.emea') },
            { value: 'americas', label: t('reference.region.americas') },
          ]}
          onValueChange={(value) => {
            setRegion(value as ReferenceRecord['region'] | 'all');
            setPage(1);
          }}
        />
        <SelectField
          label={t('reference.densityLabel')}
          value={density}
          options={[
            { value: 'comfortable', label: t('reference.comfortable') },
            { value: 'compact', label: t('reference.compact') },
          ]}
          onValueChange={(value) => setDensity(value as 'comfortable' | 'compact')}
        />
        <SelectField
          label={t('reference.sceneModeLabel')}
          value={sceneMode}
          options={[
            { value: 'ready', label: t('reference.sceneMode.ready') },
            { value: 'loading', label: t('reference.sceneMode.loading') },
            { value: 'refreshing', label: t('reference.sceneMode.refreshing') },
            { value: 'background', label: t('reference.sceneMode.background') },
            { value: 'empty', label: t('reference.sceneMode.empty') },
            { value: 'partial-error', label: t('reference.sceneMode.partialError') },
            { value: 'offline', label: t('reference.sceneMode.offline') },
            { value: 'permission', label: t('reference.sceneMode.permission') },
          ]}
          onValueChange={(value) => setSceneMode(value as SceneMode)}
        />
      </FilterBar>

      {sceneMode === 'partial-error' ? (
        <div className="flex items-start gap-3 rounded-panel border border-warning/30 bg-warning-soft p-4 text-warning">
          <FileWarning className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">{t('reference.partialErrorTitle')}</p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              {t('reference.partialErrorDescription')}
            </p>
          </div>
        </div>
      ) : null}

      <AsyncRegion
        label={t('reference.tableLabel')}
        phase={asyncPhase}
        loading={
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton className="h-12 w-full" key={index} />
            ))}
          </div>
        }
        refreshing={
          <div className="mb-3 flex items-center gap-2 rounded-control bg-info-soft px-3 py-2 text-sm text-info">
            <BusyIndicator label={t('reference.sceneMode.refreshing')} />
            <span>{t('reference.sceneMode.refreshing')}</span>
          </div>
        }
        empty={
          <Panel>
            <StateSurface
              compact
              state="empty"
              icon={<Inbox className="size-5" />}
              title={t('reference.emptyTitle')}
              description={t('reference.emptyDescription')}
              actionLabel={t('reference.clearFilters')}
              onAction={() => {
                setQuery('');
                setAppliedQuery('');
                setStatus('all');
                setRegion('all');
                setSceneMode('ready');
              }}
            />
          </Panel>
        }
        error={
          sceneMode === 'offline' || sceneMode === 'permission' ? (
            <Panel>
              <StateSurface
                state={sceneMode === 'offline' ? 'offline' : 'permission-denied'}
                icon={
                  sceneMode === 'offline' ? (
                    <CloudOff className="size-5" />
                  ) : (
                    <LockKeyhole className="size-5" />
                  )
                }
                title={t(`reference.${sceneMode}Title`)}
                description={t(`reference.${sceneMode}Description`)}
                actionLabel={t('reference.retry')}
                onAction={() => setSceneMode('ready')}
              />
            </Panel>
          ) : null
        }
      >
        <SplitView
          master={
            <Section
              title={t('reference.tableTitle')}
              description={t('reference.tableDescription', { count: visibleRecords.length })}
              action={
                <>
                  <Filter className="size-4 text-ink-muted" />
                  {rememberColumnLayout ? (
                    <button
                      aria-label={t('reference.columnSettings')}
                      className="rounded-control px-1.5 text-xs font-semibold text-ink-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
                      onClick={() => setColumnSettingsOpen(true)}
                      type="button"
                    >
                      {t('reference.columnSettings')}
                    </button>
                  ) : null}
                </>
              }
            >
              <>
                {refreshMode === 'periodic' || refreshMode === 'on-enter' ? (
                  <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-ink-muted">
                    <RefreshCw className="size-3.5 shrink-0 text-info" />
                    <span>
                      {lastRefreshedAt === null
                        ? refreshMode === 'periodic'
                          ? t('reference.autoRefreshPending')
                          : t('reference.autoRefreshOnEnter')
                        : t('reference.lastAutoRefresh', {
                            time: new Date(lastRefreshedAt).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            }),
                          })}
                    </span>
                  </div>
                ) : null}
                {selectedIds.length > 0 ? (
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-brand-soft px-4 py-3">
                    <span className="text-sm font-semibold text-brand">
                      {t('reference.selectedCount', { count: selectedIds.length })}
                    </span>
                    <Action
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        if (confirmBulk) setBulkExportOpen(true);
                        else void exportSelected();
                      }}
                    >
                      {t('reference.exportSelected')}
                    </Action>
                  </div>
                ) : null}
                <DataTable
                  emptyStateHint={emptyStateHint}
                  label={t('reference.tableLabel')}
                  columns={displayColumns}
                  density={density}
                  emptyContent={t('reference.emptyDescription')}
                  rowSeparators={rowSeparators}
                  rows={pageRecords}
                  stickyHeader={stickyHeader}
                  selection={{
                    mode: 'multiple',
                    selectedIds,
                    onSelectionChange: (ids) => {
                      setSelectedIds(ids);
                      const latestId = ids.at(-1);
                      if (latestId) setSelectedId(latestId);
                    },
                  }}
                  sort={{
                    ...sort,
                    onSortChange: (columnId, direction) => {
                      setSort({ columnId, direction });
                      if (rememberSort) persistSort({ columnId, direction });
                      setPage(1);
                    },
                  }}
                />
                <div className="flex justify-end border-t border-border p-4">
                  <PaginationControl
                    getPageLabel={(pageNumber) => t('reference.pageLabel', { page: pageNumber })}
                    label={t('reference.paginationLabel')}
                    nextLabel={t('reference.nextPage')}
                    onPageChange={setPage}
                    page={currentPage}
                    previousLabel={t('reference.previousPage')}
                    totalPages={totalPages}
                  />
                </div>
              </>
            </Section>
          }
          detail={
            <Panel className="overflow-hidden">
              {selectedRecord ? (
                <>
                  <div className="border-b border-border p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand">
                          {selectedRecord.id}
                        </p>
                        <h2 className="mt-2 text-lg font-bold text-ink">{selectedRecord.name}</h2>
                      </div>
                      <StatusPill tone={statusTone[selectedRecord.status]}>
                        {t(`reference.status.${selectedRecord.status}`)}
                      </StatusPill>
                    </div>
                  </div>
                  <SectionBody>
                    <TabsView
                      label={t('reference.detailTabsLabel')}
                      variant="section"
                      items={[
                        {
                          id: 'summary',
                          label: t('reference.tabs.summary'),
                          content: (
                            <div className="space-y-5 text-sm leading-6 text-ink-muted">
                              <p>{selectedRecord.description}</p>
                              <DescriptionList
                                label={t('reference.detailTabsLabel')}
                                items={[
                                  {
                                    id: 'owner',
                                    term: t('reference.columns.owner'),
                                    description: (
                                      <UserIdentity
                                        description={t(`reference.region.${selectedRecord.region}`)}
                                        name={selectedRecord.owner}
                                      />
                                    ),
                                  },
                                  {
                                    id: 'updated',
                                    term: t('reference.columns.updated'),
                                    description: formatDate(locale, selectedRecord.updatedAt, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    }),
                                  },
                                ]}
                              />
                            </div>
                          ),
                        },
                        {
                          id: 'activity',
                          label: t('reference.tabs.activity'),
                          content: (
                            <ol className="space-y-3">
                              {[0, 1, 2].map((item) => (
                                <li className="flex gap-3 text-sm" key={item}>
                                  <RefreshCw className="mt-0.5 size-4 shrink-0 text-info" />
                                  <span className="leading-6 text-ink-muted">
                                    {t('reference.activityItem', { number: item + 1 })}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          ),
                        },
                        {
                          id: 'risk',
                          label: t('reference.tabs.risk'),
                          content: (
                            <div className="flex gap-3 rounded-control bg-warning-soft p-3 text-warning">
                              <AlertTriangle className="size-4 shrink-0" />
                              <p className="text-sm leading-6">{t('reference.riskDescription')}</p>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </SectionBody>
                </>
              ) : null}
            </Panel>
          }
        />
      </AsyncRegion>
    </Page>
  );
}
