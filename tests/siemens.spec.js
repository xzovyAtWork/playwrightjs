import {test, expect} from '@playwright/test';
import  devices  from '../siemensDevices.js';
require('log-timestamp')(()=>`${new Date().toLocaleTimeString()}`);

const {wll, whl, wol, leak} = devices
const {fill, drain} = devices;
const {faceDamper, bypassDamper} = devices;
const {primary, secondary} = devices;
const {sump, bleed, conductivity} = devices;
const {rh1, rh2, maTemp, saTemp} = devices;
const {vfd, vfdEnable, vfdFault, vfdHOA, airflow} = devices;
const {sf1, sf2,sf3, sf4, sf5, sf6} = devices;

let page, context;
let actionContent
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
	test('spot leak', async ()=>{
		await testBinaryInput(leak, "Off", "On")
	})
	test('fill valve', async ()=>{
		await testBinaryIO(fill, "Close", "Open")
	})
	test('drain valve', async ()=>{
		await testBinaryIO(drain, "Close", "Open")
	})
	test('wll', async ()=>{
		await testBinaryInput(wll, "On", "Off")
	})
	test('wol', async ()=>{
		await testBinaryInput(wol, "On", "Off")
	})
	test('whl', async ()=>{
		await testBinaryInput(whl, "Normal", "Warning")
	})
	test("rh1", async () => {
		await getAnalogFeedback(rh1)
	})
	test("rh2", async () => {
		await getAnalogFeedback(rh2)
	})
	test("s/a temp", async () => {
		await getAnalogFeedback(saTemp)
	})
	test("m/a temp", async () => {
		await getAnalogFeedback(maTemp)
	})
	test("face damper", async ()=>{
		await testAnalogIO(faceDamper, 0);
		await testAnalogIO(faceDamper, 50);
		await testAnalogIO(faceDamper, 100);
	})
	test("bypass damper", async ()=>{
		await testAnalogIO(bypassDamper, 0);
		await testAnalogIO(bypassDamper, 50);
		await testAnalogIO(bypassDamper, 100);
	})
})
test("fill tank", async()=> {
	await commandBinaryDevice(fill, "Open")
	await commandBinaryDevice(drain, "Close")
	console.log("waiting for WOL to change state...")
	await getBinaryFeedback(wol, "On")
})
test.describe("bypass", ()=> {
	test("sump current switch", async ()=> {
		await commandBinaryDevice(sump, "On");
		await testBinaryInput(sump, "Off", "On")
	})
	test("conductivity", async () => {
		await getAnalogFeedback(conductivity)
	})
	test("bleed", async () => {
		await commandBinaryDevice(bleed, "On")
		await page.waitForTimeout(5 * 60000);
		console.log('bleed on for 5 minutes');
		await commandBinaryDevice(bleed, "Off");
		console.log('bleed off. turn off main water supply')
	})
	test('run bypass', async ()=>{
		test.setTimeout(31 * 60000)
		console.log('running bypass for additional 25 minutes')
		await page.waitForTimeout(25 * 60000);
		await commandBinaryDevice(sump, "Off");
		console.log('bypass test done. check for leaks')
	})
	test('drain tank', async () => {
		await commandBinaryDevice(drain, "Open");
	})
})

test.describe('motor section', async () => {
	test('secondary power status', async() => {
		await testBinaryInput(secondary, 'Off', 'On');
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
			await testBinaryInput(fan, 'Off', 'On');
		}
	})	
	test('vfd HOA', async () => {
		test.setTimeout(10 * 60000);
		await testBinaryInput(vfdHOA, 'Off', 'On');
	})

	test('vfd feedback and airflow', async () => {
		test.setTimeout(0);
		await commandBinaryDevice(vfdEnable, 'On')
		const getAirflowReading = async () => {
			getAnalogFeedback(airflow)
		}
		await testAnalogIO(vfd, 0);
		console.log(await getAirflowReading())
		await testAnalogIO(vfd, 25);
		console.log(await getAirflowReading())
		await testAnalogIO(vfd, 50);
		console.log(await getAirflowReading())
		await testAnalogIO(vfd, 75);
		console.log(await getAirflowReading())
		await testAnalogIO(vfd, 100);
		await page.waitForTimeout(3000);
		let final = await getAirflowReading()
		expect(final).toBeGreaterThanOrEqual(45000);
		await page.waitForTimeout(3000);
	})
	test('run fans and test VFD enable', async () => {
		test.setTimeout(0)
		console.log('running fans for 30 minutes')
		await page.waitForTimeout(20 * 60000);
		await commandBinaryDevice(vfdEnable, 'Disable');
	})
})




async function getBinaryFeedback (device, state){
	await expect(page.locator("ul.list-group").locator("div", {hasText: device}).first().locator("div.text-primary")).toContainText(state);
	console.log(`${device}: ${state}`)
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