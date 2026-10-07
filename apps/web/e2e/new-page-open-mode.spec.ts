import { expect, test } from '@playwright/test';

async function resetPreferences(page: import('@playwright/test').Page) {
  await page.goto('/settings/navigation');
  await page.evaluate(() => window.localStorage.removeItem('community-go.shell'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

test('新页面打开方式默认当前页：点击链接同页导航', async ({ page }) => {
  await resetPreferences(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await page.getByRole('link', { name: '查看基座地图' }).click();
  await expect(page).toHaveURL(/\/foundations/);
});

test('新页面打开方式=浏览器新标签页：声明允许入口在新标签打开', async ({ page }) => {
  await resetPreferences(page);
  // 设置 → 导航 → 新页面打开方式 = 浏览器新标签页。
  await page.goto('/settings/navigation');
  await page.getByRole('heading', { name: '导航' }).first().scrollIntoViewIfNeeded();
  await page
    .getByRole('radiogroup', { name: '新页面打开方式' })
    .getByText('浏览器新标签页', { exact: true })
    .click();
  await page.waitForTimeout(300);

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '查看基座地图' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(popup.url()).toContain('/foundations');
  // 当前页仍在首页（未被导航离开）。
  await expect(page).toHaveURL(/\/$/);
});
