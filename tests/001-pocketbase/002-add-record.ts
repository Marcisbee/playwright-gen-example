import { test, expect } from '@playwright/test';

test.use({
  storageState: 'session/pocketbase/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/_/#/collections?collection=POWMOh0W6IoLUAI&filter=&sort=-%40rowid');
  await page.getByRole('link', { name: 'poop_1' }).click();
  await page.getByRole('main').locator('header').getByRole('button', { name: ' New record' }).click();
  await page.getByLabel('data').click();
  await page.getByLabel('data').fill('Hello world');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('tbody')).toContainText('Hello world');
});