import { test, expect } from '@playwright/test';

test.use({
  storageState: 'session/001-pocketbase/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/_/#/collections?collection=POWMOh0W6IoLUAI&filter=&sort=-%40rowid');
  await page.getByRole('link', { name: ''+process.env.DASHBOARD_PRODUCT_NAME+'' }).click();
  await page.getByRole('main').locator('header').getByRole('button', { name: ' New record' }).click();
  await page.getByLabel('data').click();
  await page.getByLabel('data').fill('Hello world');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('tbody')).toContainText('Hello world');
});
