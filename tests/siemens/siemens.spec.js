import {test, expect} from '@playwright/test';
import {devices} from "./siemensDevices.js"
require('log-timestamp')(()=>`${new Date().toLocaleTimeString()}`);
const readline = require("readline");
const rl = readline.createInterface({input: process.stdin, output: process.stdout});

const {wll, whl, wol, leak} = devices
const {fill, drain} = devices;
const {faceDamper, bypassDamper} = devices;
const {primary, secondary} = devices;
const {sump, bleed, conductivity} = devices;
const {rh1, rh2, maTemp, saTemp} = devices;
const {vfd, vfdEnable, vfdFault, vfdHOA, airflow} = devices;
const {sf1, sf2,sf3, sf4, sf5, sf6} = devices;

let page, context;
test.describe.configure({timeout: 0});

test.beforeAll('login', async ({browser}) => {
	context = await browser.newContext({ bypassCSP: true });
	page = await context.newPage();
	// await page.goto('chrome-error://chromewebdata/');
	// await page.getByRole('button', { name: 'Advanced' }).click();
	// await page.getByRole('link', { name: 'Proceed to 192.168.1.100 (' }).click();
	await page.goto('http://192.168.1.100');
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

test.afterAll(async () => {
	await page.getByRole('menuitem', { name: 'A' }).click();
	await page.getByRole('menuitem', { name: 'Log out' })
	await page.waitForTimeout(500)
	await context.close();
})
test.beforeEach(async ({ }, testInfo) => {
	console.log(`🔴 Started ${testInfo.title}...`);
})
test.afterEach(async ({ }, testInfo) => {
	console.log(`✅ Completed test: ${testInfo.title}`);
});

test.describe('low voltage', ()=>{
	
	test('setup', async () => {

		await commandBinaryDevice(fill, "Close");
		await commandBinaryDevice(drain, "Open");
		await commandBinaryDevice(vfdEnable, "Off");
		await commandAnalogDevice(faceDamper, 100)
		await commandAnalogDevice(bypassDamper, 0)
	})
	
	test('spot leak', async ()=>{
		await testBinaryInput(leak, "Off", "On")
	})
	test('fill valve', async ()=>{
		await testBinaryIO(fill, "Open", "Close")
	})
	test('drain valve', async ()=>{
		await testBinaryIO(drain, "Close", "Open")
	})
	test('wll', async ()=>{
		await testBinaryInput(wll, "Off", "On")
	})
	test('wol', async ()=>{
		await testBinaryInput(wol, "Off", "On")
	})
	test('whl', async ()=>{
		await testBinaryInput(whl, "Normal", "Warning")
	})
	test("rh1", async () => {
		await testAnalogInput(rh1)
	})
	test("rh2", async () => {
		await testAnalogInput(rh2)
	})
	test("sa temp", async () => {
		await testAnalogInput(saTemp)
	})
	
	test("ma temp", async () => {
		await testAnalogInput(maTemp);
	})
	test("face damper", async ()=>{
		await testAnalogIO(faceDamper, 100);
		await testAnalogIO(faceDamper, 50);
		await testAnalogIO(faceDamper, 0);
	})

	test("bypass damper", async ()=>{
		await testAnalogIO(bypassDamper, 0);
		await testAnalogIO(bypassDamper, 50);
		await testAnalogIO(bypassDamper, 100);

		await commandAnalogDevice(bypassDamper, 0);
		await commandAnalogDevice(faceDamper, 100)
	})
})
test("fill tank", async()=> {
	await commandBinaryDevice(fill, "Open")
	await commandBinaryDevice(drain, "Open")
	console.log("waiting for WOL to change state...")
	await getBinaryInput(wol, "On")
})
test.describe("evap section", ()=> {
	test("sump current switch", async ()=> {
		await commandBinaryDevice(sump, "On");
		await testBinaryInput(sump, "Off", "On")
	})
	test("conductivity", async () => {
		await testAnalogInput(conductivity)
	})
	test("bleed", async () => {
		await commandBinaryDevice(bleed, "Open")
		console.log('bleed on for 5 minutes');
		await page.waitForTimeout(5 * 60000);
		await commandBinaryDevice(bleed, "Close");
		console.log('bleed off. turn off main water supply if test is bypass')
	})
	test('run bypass', async ()=>{
		test.setTimeout(31 * 60000)
		console.log('running bypass for additional 25 minutes. record sump current draw')
		await page.waitForTimeout(25 * 60000);
		await commandBinaryDevice(sump, "Off");
		console.log('bypass test done. check for leaks')
	})
	test('drain tank', async () => {
		await commandBinaryDevice(drain, "Close");
	})
})

test.describe('motor section', async () => {
	test('secondary power status', async() => {
		await testBinaryInput(secondary, 'On', 'Off');
	})
	test('primary power status', async() => {
		await testBinaryInput(primary, 'On', 'Off')
	})
	test('vfd fault', async () => {
		await testBinaryInput(vfdFault, 'Off', 'On');
	})
	test('motor current switches', async () => {
		const fans = [sf1, sf2, sf3, sf4, sf5, sf6]
		for(const fan of fans){
			console.log(fan.name)
			await testBinaryInput(fan, 'On', 'Off');
		}
	})	
	test('vfd HOA', async () => {
		test.setTimeout(10 * 60000);
		await testBinaryInput(vfdHOA, 'Off', 'On');
	})
})
	test('ramp fans', async () => {
		test.setTimeout(0);
		await commandBinaryDevice(vfdEnable, 'On')
		
		await testAnalogIO(vfd, 0);
		console.log(await getAnalogInput(airflow))
		await testAnalogIO(vfd, 25);
		console.log(await getAnalogInput(airflow))
		await testAnalogIO(vfd, 50);
		console.log(await getAnalogInput(airflow))
		await testAnalogIO(vfd, 75);
		console.log(await getAnalogInput(airflow))
		await testAnalogIO(vfd, 100);
		getAnalogInput(conductivity)
		await page.waitForTimeout(5000);
		let final = await getAnalogInput(airflow)
		expect(final).toBeGreaterThanOrEqual(45000);
		await page.waitForTimeout(3000);
	})
	test('run on timer', async () => {
		test.setTimeout(0)
		console.log('running fans for 30 minutes')
		await page.waitForTimeout(30 * 60000);
		await commandBinaryDevice(vfdEnable, 'Off');
	})


test.describe('full water', async () => {
	const conductivityReadings = [];
	async function getConductivityValue(){
		await page.waitForTimeout(10000);
		const conductivityReading = await getAnalogInput(conductivity)
		conductivityReadings.push(conductivityReading)
		return conductivityReading;
	}
	test('rinse cycle', async () => {
		test.setTimeout(0);
		await commandBinaryDevice(fill, 'Open');
		await commandBinaryDevice(drain, 'Open');
		await commandAnalogDevice(faceDamper, 100);
		await commandAnalogDevice(bypassDamper, 0);
		console.log('waiting for tank to fill...')
		await getBinaryInput(wol, "On")
		await commandBinaryDevice(sump, 'On');
		const startValue = await getConductivityValue();
		console.log(`starting cycle. Conductivity: ${startValue}`)

		await page.waitForTimeout(30 * 60000);

		const reading = await getConductivityValue();
		console.log(`cycle complete. Draining tank. Conductivity: ${reading}`)
		await commandBinaryDevice(fill, 'Close');
		await commandBinaryDevice(drain, 'Close');
		await commandBinaryDevice(sump, 'Off');
		await getBinaryInput(wll, "Off")
		console.log('Conductivity Readings', conductivityReadings);
	})
})

test("close dampers", async ()=>{
	await commandAnalogDevice(faceDamper, 0)
	await commandAnalogDevice(bypassDamper, 0)
	await testAnalogIO(faceDamper, 0)
	await testAnalogIO(bypassDamper, 0)
})

test("hand", () => {
	test.setTimeout(0)
	return new Promise(() => { })
})

async function getBinaryInput (device, state){
	const {name, commandValue, feedbackValue} = device
	await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").click();
	await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").scrollIntoViewIfNeeded();
	await expect(page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary")).toContainText(state);
	console.log(`${name}: ${state}`)
}
async function commandBinaryDevice(device, value){
	const {name, commandValue, feedbackValue} = device
	console.log(`commanding ${name}: ${value}`)
	if(await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("div.ba-object-form").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("div.text-primary").click();
	}
	if(await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("i.element-manual-filled").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("button.element-manual").click();// locator('si-manual-button')
	}
	await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("select").selectOption(value);
	await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("button.element-ok").click();
	await page.getByRole('button', { name: 'OK' }).click();
	await expect(page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("div.text-primary")).toContainText(value, {timeout: 3000});
	console.log(`${name}: ${value}`)
}
async function testBinaryInput(device, state1, state2){
	const {name, commandValue, feedbackValue} = device;
	await getBinaryInput(device, state1)
	console.log(`${name}: ${state1} Waiting for state change...`);
	await getBinaryInput(device, state2)
	console.log(`${name}: ${state2}`)
}
async function testBinaryIO(device, state1, state2){
	await commandBinaryDevice(device, state1)
	await getBinaryInput(device, state1)
	await commandBinaryDevice(device, state2)
	await getBinaryInput(device, state2)
}
async function testAnalogInput(device){
	const {name, commandValue, feedbackValue} = device;
	let feedback;
	let initial = await getAnalogInput(device);
	expect(initial)
	for (let i = 0; i < 400; i++) {
		feedback = await getAnalogInput(device);
		if (Math.abs(feedback - initial) >= 1 ) {
			await page.waitForTimeout(500);
			feedback = await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").textContent()
			console.log(`${name} feedback: ${feedback}`);
			break;
		}
		feedback = await getAnalogInput(device)
		await new Promise(r => setTimeout(r, 7000));
	}
	return parseInt(feedback)
}
async function getAnalogInput(device){
	const {name, commandValue, feedbackValue} = device;
	await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").click();
	await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").scrollIntoViewIfNeeded();
	let value = parseFloat(await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").textContent());
	console.log(`${name} reading: ${value}`)
	expect(value).toBeGreaterThan(0)
	return value;
}

async function commandAnalogDevice(device, value){
	const {name, commandValue, feedbackValue} = device;
	console.log(`commanding ${name}: ${value}`)
	if(await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("div.ba-object-form").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("div.text-primary").click();
	}
	if(await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("i.element-manual-filled").isHidden()){
		await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("button.element-manual").click();// locator('si-manual-button')
	}
	await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("input").fill(`${value}`);
	await page.locator("ul.list-group").locator("div", {hasText: commandValue}).first().locator("button.element-ok").click();
	await page.getByRole('button', { name: 'OK' }).click();
	console.log(`${name}: ${value}`);
	return value;
}

async function testAnalogIO(device, value){
	const {name, commandValue, feedbackValue} = device;
	await commandAnalogDevice(device, value);
	let result;
	await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").scrollIntoViewIfNeeded();
	for (let i = 0; i < 400; i++) {
		let feedback =  await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").textContent();
		result = parseFloat(feedback);
		if (Math.abs(value - result) <= 5 ) {
			await page.waitForTimeout(5000);
			feedback = await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").textContent();
			console.log(`${name} feedback: ${feedback}`);
			break;	
		}
		feedback = await page.locator("ul.list-group").locator("div", {hasText: feedbackValue}).first().locator("div.text-primary").textContent();
		await new Promise(r => setTimeout(r, 7000));
	}
}