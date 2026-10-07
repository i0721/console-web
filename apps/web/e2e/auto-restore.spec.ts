import { expect, test } from '@playwright/test';

async function resetAll(page: import('@playwright/test').Page) {
  await page.goto('/settings/navigation');
  await page.evaluate(() => {
    window.localStorage.removeItem('community-go.shell');
    window.localStorage.removeItem('community-go.workspace');
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

async function enableAutoRestore(page: import('@playwright/test').Page) {
  await page.goto('/settings/navigation');
  await page.getByRole('heading', { name: '导航' }).first().scrollIntoViewIfNeeded();
  const sw = page.getByRole('switch', { name: '自动恢复未完成工作' });
  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toBeChecked();
  await page.waitForTimeout(300);
}

async function enableAutosave(page: import('@playwright/test').Page) {
  await page.goto('/settings/actions');
  await page.getByRole('heading', { name: '操作偏好' }).first().scrollIntoViewIfNeeded();
  const sw = page.getByRole('switch', { name: '本地草稿自动保存' });
  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toBeChecked();
  await page.waitForTimeout(300);
}

test('自动恢复未完成工作默认关：有草稿时进入首页不重定向', async ({ page }) => {
  await resetAll(page);
  await enableAutosave(page);
  // 输入草稿后回首页。
  await page.goto('/reference-resources/create');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await page.getByLabel('名称').fill('未完成的工作草稿');
  await page.waitForTimeout(400);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await page.waitForTimeout(600);
  await expect(page).not.toHaveURL(/reference-resources\/create/);
});

test('开启 自动恢复未完成工作：有草稿时首页重定向回草稿页', async ({ page }) => {
  await resetAll(page);
  await enableAutoRestore(page);
  await enableAutosave(page);
  await page.goto('/reference-resources/create');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await page.getByLabel('名称').fill('未完成的工作草稿');
  await page.waitForTimeout(400);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(page).toHaveURL(/reference-resources\/create/);
  await expect(page.getByLabel('名称')).toHaveValue('未完成的工作草稿');
});
