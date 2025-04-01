import { test, expect } from '@playwright/test';

test.use({
  storageState: 'session/pocketbase/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/_/#/collections?collection=POWMOh0W6IoLUAI&filter=&sort=-%40rowid');
  await page.getByRole('link', { name: 'poop_1' }).click();
  await expect(page.getByRole('contentinfo')).toContainText('Total found: 1');
  await page.getByRole('cell', { name: 'Hello world' }).click();
  await page.getByLabel('More record options').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await expect(page.getByRole('contentinfo')).toContainText('Total found: 0');
});
