require('log-timestamp')(()=>`${new Date().toLocaleTimeString()}`);
import { test, expect, page, Context} from '@playwright/test'

test('setup', async ({page})=> {
	await page.goto('http://169.254.1.1/ports');
	await expect(page.getByText('DHCP IP Address ? Subnet Mask')).toBeVisible();

 await page.getByRole('radio', { name: 'Default IP Address' }).check();
 await page.getByRole('button', { name: 'Save' }).click();
 await expect(page.getByText('Restarting device. Please wait')).toBeVisible();
 await page.goto('http://169.254.1.1/ports');
 await expect(page.getByText('IP Address 192.168.168.1')).toBeVisible();
})