import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/demo/');
  await page.locator('iframe[title="Demo dashboard"]').contentFrame().getByRole('textbox', { name: 'Email *' }).click();
  await page.locator('iframe[title="Demo dashboard"]').contentFrame().getByRole('textbox', { name: 'Password *' }).click();
  await page.locator('iframe[title="Demo dashboard"]').contentFrame().getByRole('button', { name: 'Login ' }).click();
  await page.locator('iframe[title="Demo dashboard"]').contentFrame().getByText('Collections').click();

  await page.context().storageState({ path: 'session/001-pocketbase/auth.json' });
});
