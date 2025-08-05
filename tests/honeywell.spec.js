import {test, expect} from '@playwright/test';

const controllerIp = "192.168.200.34";
const cpnx = '/ord/station:%7Cslot:/Drivers/OnboardIONetwork/CPNX/points/AHU%7Cview:webEditors:MultiSheet'
const cpv_1 = '/ord/station:%7Cslot:/Drivers/PanelbusNetwork/CPV_1/points/AHU%7Cview:webEditors:MultiSheet'
const xf823_1 = '/ord/station:%7Cslot:/Drivers/PanelbusNetwork/XF823_1/points/AHU%7Cview:webEditors:MultiSheet'

let page, context;
test.describe.configure({timeout: 0})


test.beforeAll('log in', async ({ browser }) => {
	test.setTimeout(0)
	console.log('logging in to Honeywell...')
	context = await browser.newContext({ bypassCSP: true, ignoreHTTPSErrors: true });
  	page = await context.newPage();
	await page.goto(`https://${controllerIp}`)
	await page.getByRole('textbox').click();
	await page.getByRole('textbox').fill('Operator');
	await page.getByRole('button', { name: 'Login' }).click();
	await page.getByRole('textbox', { name: 'Password:' }).click();
	await page.getByRole('textbox', { name: 'Password:' }).fill('Operator12345');
	await page.getByRole('button', { name: 'Login' }).click();
	await expect(page.locator('#WebShell-toolbar')).toBeVisible({timeout: 0})
	await navigateToPage(cpnx)
	console.log("Logged in to Honeywell");


})

test.afterAll(async () => {
	await context.close();
  });
  
test.describe('low voltage', () => {
	test('spot leak', async  () => {
		await testBinaryDevice("WS01", /^Normal/, /^Alarm/)
	})
	test('fill', async()=>{
		await testBinaryIO('LCV01', /^Closed/, /^Open/)
	})
	test('drain', async()=>{
		await testBinaryIO('LCV02', /^Closed/, /^Open/)
	})
	test('whl', async  () => {
		await navigateToPage(cpv_1)
		await testBinaryDevice("LH01_HL", /^Normal/, /^Warning/)
	})
	test('wol', async  () => {
		await testBinaryDevice("LN01_NL", /^Off/, /^On/)
	})
	test('wll', async  () => {
		await testBinaryDevice("LL01_LL", /^Warning/, /^Normal/)
	})
	test('face damper', async () => {
		await commandDamper('ND01', "0")
		await commandDamper('ND01', "50")
		await commandDamper('ND01', "100")
	})
	test('bypass damper', async () => {
		await commandDamper('ND02', "0")
		await pollAnalog("ND02", 95, 100)
		
		await commandDamper('ND02', "50")
		await pollAnalog("ND02", 45, 55)
		
		await commandDamper('ND02', "100")
		await pollAnalog("ND02", 0, 5)

	})
})

async function navigateToPage(segment){
	await page.goto(`https://${controllerIp}${segment}`)
	await expect(page.locator('.ux-table')).toBeVisible({timeout: 0})

}
async function pollAnalog(device , lowRange, highRange){
	let duration = 2 *60000
	await expect.poll(async () => {
		let fbk = parseFloat(await page.locator('.ux-table').locator('tr', {hasText: device}).locator('td').nth(1).textContent())
		return fbk >= lowRange && fbk <= highRange
		}, {
		timeout: duration
	}).toBe(true);
	await page.waitForTimeout(10000);
	console.log(parseFloat(device, await page.locator('.ux-table').locator('tr', {hasText: device}).locator('td').nth(1).textContent()))
}
async function commandDamper(device, command){
	await navigateToPage(cpv_1)
	await commandAnalogDevice(device, command)
	await navigateToPage(cpnx)
}
async function getBinaryInput (device, state){
	await expect(page.locator('.ux-table').locator('tr', {hasText: device}).locator('td').nth(1)).toHaveText(state)
	console.log(device, state)
}
async function testBinaryDevice(device, state1, state2){
	await getBinaryInput(device, state1);
	await getBinaryInput(device, state2)
}
async function commandBinaryDevice (device, value){
	await page.locator('.ux-table').locator('tr', {hasText: device + '_OC'}).locator('td').nth(2).getByRole("button").click()
	await page.getByRole('button', { name: value }).click()
	await page.getByRole('button', { name: 'Ok' }).click()
	await expect(page.locator('.ux-table').locator('tr', {hasText: device + '_STS'}).locator('td').nth(1)).toHaveText(value)
	console.log(device, value)
}

async function testBinaryIO(device, value1, value2){
	await commandBinaryDevice(device, value1)
	await commandBinaryDevice(device, value2)
}

async function commandAnalogDevice(device, value){
	await page.waitForTimeout(2000)
	await page.locator('.ux-table').locator('tr', {hasText: device + '_CMD'}).locator('td').nth(2).getByRole("button").click()
	await page.getByRole('button', { name: "Override" }).click()
	await page.getByRole('textbox').fill(value)
	await page.getByRole('button', { name: 'Ok' }).click()
	console.log(device, value)
}
async function getAnalogFeedback(device, command, range){
	let result;
	let value = parseFloat(await page.locator('.ux-table').locator('tr', {hasText: device + '_FB'}).locator('td').nth(1).textContent());
	expect(value).toBeGreaterThanOrEqual(0);
	console.log(`${device} initial reading: ${value}`)
	for (let i = 0; i < 400; i++) {
		let feedback = await page.locator('.ux-table').locator('tr', {hasText: device + '_FB'}).locator('td').nth(1).textContent();
		console.log(feedback)
		result = parseFloat(feedback);
		console.log(result)
		if (Math.abs(command - result) < range ) {
			await page.waitForTimeout(500);
			console.log(`${device} feedback: ${feedback}`);
			break;
		}
		feedback = await page.locator('.ux-table').locator('tr', {hasText: device + '_FB'}).locator('td').nth(1).textContent();
		await new Promise(r => setTimeout(r, 7000));
	}
}
