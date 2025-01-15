import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc/#/');
  await page.getByPlaceholder('What needs to be done?').click();
  await page.getByPlaceholder('What needs to be done?').fill('Get milk');
  await page.getByPlaceholder('What needs to be done?').press('Enter');
  await page.getByPlaceholder('What needs to be done?').fill('Get bread');
  await page.getByPlaceholder('What needs to be done?').press('Enter');
  await expect(page.locator('body')).toContainText('Get milk');
  await expect(page.locator('body')).toContainText('Get bread');
});
