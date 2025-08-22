import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate', async ({ page }) => {
  
  await page.goto('http://localhost:8080/');
  await page.locator('#nameInput').click();
  await page.locator('#nameInput').fill('silent');
  await page.locator('#pass').click();
  await page.locator('#pass').fill('password123');
  await page.getByRole("button", { name: 'Log in' }).click();
 
  await expect(page.locator('#logoButtonSpan').getByRole('img').nth(1)).toBeVisible();
  const ioPoints = page.locator('#facetContent').contentFrame().getByText("I/O Points")
	await ioPoints.click();

  await page.context().storageState({ path: authFile });
});