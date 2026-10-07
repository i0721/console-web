import { describe, expect, it } from 'vitest';

import { normalizeSearchTerm, searchSettings, SETTINGS_INDEX } from './settings-index';

/** 简易 i18n resolve：key → zh 文案（仅覆盖测试涉及键；用直出词表保证可读）。 */
function zhResolver(key: string): string {
  const table: Record<string, string> = {
    'settings.categories.appearance': '外观',
    'settings.categories.navigation': '导航',
    'settings.categories.dataDisplay': '数据展示',
    'settings.categories.actionPreferences': '操作偏好',
    'settings.categories.localeRegion': '语言与地区',
    'settings.categories.notifications': '通知',
    'settings.categories.accessibility': '可访问性',
    'settings.categories.shortcuts': '快捷键',
    'settings.appearance.motion': '动效偏好',
    'settings.appearance.motionDescription': '跟随系统、标准或减少动效。',
    'settings.appearance.themeMode': '主题模式',
    'settings.appearance.accent': '强调色',
    'settings.navigation.menuMemory': '记住展开的侧栏菜单',
    'settings.shortcuts.enabled': '启用快捷键',
    'settings.actionPreferences.confirmDelete': '删除前二次确认',
  };
  return table[key] ?? key;
}

describe('settings-index 搜索目录', () => {
  it('“动画”命中外观·动效（同义词）', () => {
    const { categories } = searchSettings('动画', zhResolver);
    expect(categories).toContain('appearance');
    const { entries } = searchSettings('动效', zhResolver);
    expect(entries.some((e) => e.fieldId === 'motion')).toBe(true);
  });

  it('“快捷键”命中 shortcuts.enabled', () => {
    const { entries } = searchSettings('快捷键', zhResolver);
    expect(entries.some((e) => e.fieldId === 'enabled')).toBe(true);
  });

  it('“删除”命中操作偏好 confirmDelete', () => {
    const { entries } = searchSettings('删除', zhResolver);
    expect(entries.some((e) => e.fieldId === 'confirmDelete')).toBe(true);
  });

  it('空查询返回空（页面恢复全部分类）', () => {
    const result = searchSettings('   ', zhResolver);
    expect(result.entries).toHaveLength(0);
  });

  it('无命中返回空', () => {
    const result = searchSettings('zzz-no-such-term-zzz', zhResolver);
    expect(result.entries).toHaveLength(0);
  });

  it('normalizeSearchTerm 小写化', () => {
    expect(normalizeSearchTerm('  Animation ')).toBe('animation');
  });

  it('目录覆盖八分类且每条含 category/fieldId', () => {
    const categories = new Set(SETTINGS_INDEX.map((e) => e.category));
    expect(categories.size).toBeGreaterThanOrEqual(6);
    for (const entry of SETTINGS_INDEX) {
      expect(entry.category.length).toBeGreaterThan(0);
      expect(entry.fieldId.length).toBeGreaterThan(0);
    }
  });
});
