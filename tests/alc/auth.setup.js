import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('http://localhost:8080/');
  await page.locator('#nameInput').click();
  await page.locator('#nameInput').fill('silent');
  await page.locator('#pass').click();
  await page.locator('#pass').fill('password123');
  await page.getByRole("button", { name: 'Log in' }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.locator('#logoButtonSpan').getByRole('img').nth(1)).toBeVisible();
  const ioPoints = page.locator('#facetContent').contentFrame().getByText("I/O Points")
	await ioPoints.click();
	

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});