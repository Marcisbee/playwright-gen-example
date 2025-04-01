import { test, expect } from '@playwright/test';

test.use({
  storageState: 'session/001-pocketbase/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/_/#/collections?collection=POWMOh0W6IoLUAI&filter=&sort=-%40rowid');
  await page.getByRole('button', { name: ' New collection' }).click();
  await page.getByPlaceholder('eg. "posts"').click();
  await page.getByPlaceholder('eg. "posts"').fill(''+process.env.DASHBOARD_PRODUCT_NAME+'');
  await page.getByRole('button', { name: 'New field' }).click();
  await page.getByRole('menuitem', { name: 'Plain text' }).click();
  await page.getByPlaceholder('Field name').nth(1).click();
  await page.getByPlaceholder('Field name').nth(1).fill('data');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('link', { name: ''+process.env.DASHBOARD_PRODUCT_NAME+'' }).click();
});
