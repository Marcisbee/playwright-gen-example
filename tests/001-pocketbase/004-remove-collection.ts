import { test, expect } from '@playwright/test';

test.use({
  storageState: 'session/001-pocketbase/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/_/#/collections?collection=POWMOh0W6IoLUAI&filter=&sort=-%40rowid');
  await page.getByRole('link', { name: ''+process.env.DASHBOARD_PRODUCT_NAME+'' }).click();
  await page.getByLabel('Edit collection').click();
  await page.getByLabel('More collection options').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
});
