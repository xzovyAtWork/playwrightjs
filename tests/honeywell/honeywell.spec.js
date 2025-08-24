import {test, expect} from '@playwright/test';
import { devices } from './honeywellDevices';

const {wll, whl, wol, leak} = devices
const {fill, drain} = devices;
const {faceDamper, bypassDamper} = devices;
const {primary, secondary} = devices;
const {sump, bleed, conductivity} = devices;
const {rh1, rh2, maTemp, saTemp} = devices;
const {vfd, vfdEnable, vfdFault, vfdHOA, airflow} = devices;
const {sf1, sf2,sf3, sf4, sf5, sf6} = devices;

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
		await testBinaryDevice(leak, /^Normal/, /^Alarm/)
	})
	test('fill', async()=>{
		await testBinaryIO(fill, /^Closed/, /^Open/)
	})
	test('drain', async()=>{
		await testBinaryIO(drain, /^Closed/, /^Open/)
	})
	test('whl', async  () => {
		await navigateToPage(cpv_1)
		await testBinaryDevice(whl, /^Normal/, /^Warning/)
	})
	test('wol', async  () => {
		await testBinaryDevice(wol, /^Off/, /^On/)
	})
	test('wll', async  () => {
		await testBinaryDevice(wll, /^Warning/, /^Normal/)
	})
	test('face damper', async () => {
		await commandDamper(faceDamper, "0")
		await commandDamper(faceDamper, "50")
		await commandDamper(faceDamper, "100")
	})
	test('bypass damper', async () => {
		await commandDamper(bypassDamper, "0")
		await pollAnalog(bypassDamper, 95, 100)
		
		await commandDamper(bypassDamper, "50")
		await pollAnalog(bypassDamper, 45, 55)
		
		await commandDamper(bypassDamper, "100")
		await pollAnalog(bypassDamper, 0, 5)

	})
})

async function navigateToPage(segment){
	await page.goto(`https://${controllerIp}${segment}`)
	await expect(page.locator('.ux-table')).toBeVisible({timeout: 0})

}
async function commandDamper(device, command){
	await navigateToPage(cpv_1)
	await commandAnalogDevice(device, command)
	await navigateToPage(cpnx)
}
async function getBinaryInput (device, state){
	const {feedbackValue, commandValue, name} = device;
	await expect(page.locator('.ux-table').locator('tr', {hasText: feedbackValue}).locator('td').nth(1)).toHaveText(state)
	console.log(device, state)
}

async function getAnalogInput(device){
	const {name, commandValue, feedbackValue} = device;
	let value = parseFloat(await page.locator('.ux-table').locator('tr', {hasText: feedbackValue}).locator('td').nth(1).textContent());
	console.log(`${name} reading: ${value}`)
	return value;
}

async function testBinaryDevice(device, state1, state2){
	await getBinaryInput(device, state1);
	await getBinaryInput(device, state2)
}
async function commandBinaryDevice (device, value){
	const {feedbackValue, commandValue, name} = device;
	await page.locator('.ux-table').locator('tr', {hasText: commandValue}).locator('td').nth(2).getByRole("button").click()
	await page.getByRole('button', { name: value }).click()
	await page.getByRole('button', { name: 'Ok' }).click()
	await expect(page.locator('.ux-table').locator('tr', {hasText: feedbackValue}).locator('td').nth(1)).toHaveText(value)
	console.log(device, value)
}

async function commandAnalogDevice(device, value){
	const {feedbackValue, commandValue, name} = device;
	await page.waitForTimeout(2000)
	await page.locator('.ux-table').locator('tr', {hasText: commandValue}).locator('td').nth(2).getByRole("button").click()
	await page.getByRole('button', { name: "Override" }).click()
	await page.getByRole('textbox').fill(value)
	await page.getByRole('button', { name: 'Ok' }).click()
	console.log(device, value)
}
async function testBinaryIO(device, value1, value2){
	await commandBinaryDevice(device, value1)
	await commandBinaryDevice(device, value2)
}

async function testAnalogInput(device, command){
	const {feedbackValue, commandValue, name} = device;
	let result;
	getAnalogInput(device)
	for (let i = 0; i < 400; i++) {
		let feedback = getAnalogInput(device)
		console.log(feedback)
		result = parseFloat(feedback);
		console.log(result)
		if (Math.abs(command - result) < 0.1 ) {
			await page.waitForTimeout(500);
			console.log(`${device} feedback: ${feedback}`);
			break;
		}
		feedback = getAnalogInput(device);
		await new Promise(r => setTimeout(r, 7000));
	}
}

// async function pollAnalog(device , lowRange, highRange){
// 	let duration = 2 *60000
// 	await expect.poll(async () => {
// 		let fbk = parseFloat(await page.locator('.ux-table').locator('tr', {hasText: device}).locator('td').nth(1).textContent())
// 		return fbk >= lowRange && fbk <= highRange
// 		}, {
// 		timeout: duration
// 	}).toBe(true);
// 	await page.waitForTimeout(10000);
// 	console.log(parseFloat(device, await page.locator('.ux-table').locator('tr', {hasText: device}).locator('td').nth(1).textContent()))
// }