import { test, expect } from '@playwright/test';

test.use({
  storageState: 'session/pocketbase/auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://pocketbase.io/_/#/collections?collection=POWMOh0W6IoLUAI&filter=&sort=-%40rowid');
  await page.getByRole('button', { name: ' New collection' }).click();
  await page.getByPlaceholder('eg. "posts"').click();
  await page.getByPlaceholder('eg. "posts"').fill('poop_1');
  await page.getByRole('button', { name: 'New field' }).click();
  await page.getByRole('menuitem', { name: 'Plain text' }).click();
  await page.getByPlaceholder('Field name').nth(1).click();
  await page.getByPlaceholder('Field name').nth(1).fill('data');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('link', { name: 'poop_1' }).click();
});