import { expect, test } from '@playwright/test';

test.use({ acceptDownloads: true });

async function resetPreferences(page: import('@playwright/test').Page) {
  await page.goto('/settings/actions');
  await page.evaluate(() => window.localStorage.removeItem('community-go.shell'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

async function selectTwoRows(page: import('@playwright/test').Page) {
  const rows = page.getByRole('grid').getByRole('row');
  await rows.nth(1).click();
  await rows.nth(2).click();
  await expect(page.getByText('已选 2 条')).toBeVisible();
}

test('批量操作前确认默认开：导出所选弹二次确认，取消不导出', async ({ page }) => {
  await resetPreferences(page);
  await page.goto('/page-archetypes/resource-list');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await selectTwoRows(page);
  await page.getByRole('button', { name: '导出已选' }).click();
  const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
  await expect(dialog).toContainText('导出所选 2 条？');
  // 取消 → 不导出、对话框关闭。
  await dialog.getByRole('button', { name: '取消' }).click();
  await expect(dialog).not.toBeVisible();
});

test('关闭 批量操作前确认：导出所选直接执行（无确认）', async ({ page }) => {
  await resetPreferences(page);
  // 设置 → 操作偏好 → 批量操作前确认 = 关。
  await page.goto('/settings/actions');
  await page.getByRole('heading', { name: '操作偏好' }).first().scrollIntoViewIfNeeded();
  const confirmBulk = page.getByRole('switch', { name: '批量操作前确认' });
  await confirmBulk.focus();
  await page.keyboard.press('Space');
  await expect(confirmBulk).not.toBeChecked();
  await page.waitForTimeout(300);

  await page.goto('/page-archetypes/resource-list');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await selectTwoRows(page);
  await page.getByRole('button', { name: '导出已选' }).click();
  await expect(page.getByText('导出所选 2 条？')).not.toBeVisible();
});
