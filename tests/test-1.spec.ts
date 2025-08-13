import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('chrome-error://chromewebdata/');
  await page.getByRole('button', { name: 'Advanced' }).click();
  await page.getByRole('link', { name: 'Proceed to 192.168.1.100 (' }).click();
  await page.getByRole('textbox', { name: 'User name' }).click();
  await page.getByRole('textbox', { name: 'User name' }).fill('AHUmfg');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('AHUmfg.1');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByRole('link', { name: ' Device ' }).click();
  await page.getByRole('link', { name: '' }).click();
  await page.getByRole('link', { name: ' Application ' }).click();
  await page.getByRole('link', { name: ' MKE17 C1 CE1 AHU01 MKE17\'' }).click();
});