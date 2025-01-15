import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/_/#/login');
  await page.getByLabel('Email').click();
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('123456');
  await page.getByRole('button', { name: 'Login ' }).click();
  await expect(page.locator('#app')).toContainText('New collection');

  await page.context().storageState({ path: 'session/pocketbase/auth.json' });
});
