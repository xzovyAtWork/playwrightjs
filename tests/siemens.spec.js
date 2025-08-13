import {test, expect} from '@playwright/test';
require('log-timestamp')(()=>`${new Date().toLocaleTimeString()}`);

let page, context;
let actionContent
test.describe.configure({timeout: 0});

test.beforeAll('login', async ({browser}) => {
	context = await browser.newContext({ bypassCSP: true });
	page = await context.newPage();
	await page.goto('http://192.168.1.100');
	// await page.getByRole('button', { name: 'Advanced' }).click();
	// await page.getByRole('link', { name: 'Proceed to 192.168.1.100 (' }).click();
	await page.getByRole('textbox', { name: 'User name' }).click();
	await page.getByRole('textbox', { name: 'User name' }).fill('AHUmfg');
	await page.getByRole('textbox', { name: 'Password' }).click();
	await page.getByRole('textbox', { name: 'Password' }).fill('AHUmfg.1');
	await page.getByRole('textbox', { name: 'Password' }).click();
	await page.getByRole('button', { name: 'Log in' }).click();
	await page.getByRole('link', { name: ' Application ' }).click();
	await page.getByRole('link', { name: ' MKE17 C1 CE1 AHU01 MKE17\'' }).click();
	// actionContent = page.locator("ul.list-group")
});

test.describe('low voltage', ()=>{
	test('spot leak', async ()=>{
		await testBinaryInput("WS01", "Off", "On")
	})
	test('fill valve', async ()=>{
		await testBinaryIO("LCV01", "Close", "Open")
	})
	test('drain valve', async ()=>{
		await testBinaryIO("LCV02", "Close", "Open")
	})
	test('wll', async ()=>{
		await testBinaryInput("LL01_LL", "On", "Off")
	})
	test('wol', async ()=>{
		await testBinaryInput("LN01_NL", "On", "Off")
	})
	test('whl', async ()=>{
		await testBinaryInput("LH01_HL", "Normal", "Warning")
	})
	test("m/a temp", async () => {
		await getAnalogFeedback("TT02_MAT")
	})
	test("face damper", async ()=>{
		await testAnalogIO("ND01", 0);
		await testAnalogIO("ND01", 50);
		await testAnalogIO("ND01", 100);
	})
	test("bypass damper", async ()=>{
		await testAnalogIO("ND02", 0);
		await testAnalogIO("ND02", 50);
		await testAnalogIO("ND02", 100);
	})
	test("rh1", async () => {
		await getAnalogFeedback("NT01_SAH")
	})
	test("rh2", async () => {
		await getAnalogFeedback("NT02_SAH")
	})
	test("s/a temp", async () => {
		await getAnalogFeedback("TT01_SAT")
	})
})


async function getBinaryFeedback (device, state){
	await expect(page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary")).toContainText(state);
}
async function commandBinaryDevice(device, value){
	console.log(`commanding ${device}: ${state}`)
	if(await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.ba-object-form").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary").click();
	}
	if(await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("i.text-danger").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("button.btn-danger").click(); locator('si-manual-button')
	}
	await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("select").selectOption(value);
	await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("button.element-ok").click();
	await page.getByRole('button', { name: 'OK' }).click();
	console.log(`${device}: ${value}`)
}
async function testBinaryInput(device, state1, state2){
	await getBinaryFeedback(device, state1)
	console.log(`${device}: ${state1} Waiting for state change...`);
	await getBinaryFeedback(device, state2)
	console.log(`${device}: ${state2}`)
}
async function testBinaryIO(device, state1, state2){
	await commandBinaryDevice(device + "_OC", state1)
	await getBinaryFeedback(device + "_FB", state1)
	await commandBinaryDevice(device + "_OC", state2)
	await getBinaryFeedback(device + "_FB", state2)
}

async function getAnalogFeedback(device){
	device = device + "_FB"
	// let commandValue = parseFloat(await page.locator("ul.list-group").locator("div", {hasText: deviceCommand}).first().locator("div.text-primary").textContent());
	let feedbackValue = parseFloat(await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary").textContent());
	console.log(`${device} initial reading: ${feedbackValue}`)
	for (let i = 0; i < 400; i++) {
		let feedback = await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary").textContent()
		result = parseFloat(feedback);
		if (Math.abs(feedbackValue - result) > 0.1 ) {
			await page.waitForTimeout(500);
			feedback = await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary").textContent()
			console.log(`${device.name} feedback: ${feedback}`);
			break;
		}
		feedback = await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary").textContent()
		await new Promise(r => setTimeout(r, 7000));
	}
	return parseInt(feedback)
}

async function commandAnalogDevice(device, value){
	device = device + "_CMD";
	console.log(`commanding ${device}: ${value}`)
	if(await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.ba-object-form").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary").click();
	}
	if(await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("i.text-danger").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("button.btn-danger").click(); locator('si-manual-button')
	}
	await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("input").fill(`${value}`);
	await page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("button.element-ok").click();
	await page.getByRole('button', { name: 'OK' }).click();
	console.log(`${device}: ${value}`);
	return value;
}

async function testAnalogIO(device, value){

	await commandAnalogDevice(device, value);
		let result;
		for (let i = 0; i < 400; i++) {
			let feedback =  await page.locator("ul.list-group").locator("div", {hasText: device + "_FB"}).first().locator("div.text-primary").textContent();
			result = parseFloat(feedback);
			if (Math.abs(value - result) <= 5 ) {
				await page.waitForTimeout(500);
				feedback = await page.locator("ul.list-group").locator("div", {hasText: device + "_FB"}).first().locator("div.text-primary").textContent();
				console.log(`${device} feedback: ${feedback}`);
				break;
			}
			feedback = await await page.locator("ul.list-group").locator("div", {hasText: device + "_FB"}).first().locator("div.text-primary").textContent();
			await new Promise(r => setTimeout(r, 7000));
		}

}

