import { test, expect, Page, Context} from '@playwright/test';
import {devices} from "../alcDevices";
require('log-timestamp')(()=>`${new Date().toLocaleTimeString()}`);

const {wll, whl, wol, leak1, leak2} = devices
const {fill, drain} = devices;
const {faceDamper, bypassDamper} = devices;
const {primary, secondary} = devices;
const {sump, bleed, conductivity} = devices;
const {rh1, rh2, maTemp, saTemp} = devices;
const {vfd, vfdEnable, vfdFault, vfdHOA, airflow} = devices;
const {sf1, sf2,sf3, sf4, sf5, sf6} = devices;


let page;
let context;
let actionContent;


async function commandAnalogDevice(device, value){
	const { lockedValue, commandValue } = device
	try{
		const currentValue = parseInt(await actionContent.locator("#bodyTable").locator(`[updateid="prim_${commandValue}_ctrlid1"]`).textContent());
		if(currentValue !== value){
			await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).click();
			await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).fill(`${value}`);
			await page.keyboard.press("Enter")
		}else {
			console.log(`${device.name} ${value}`)
		}
	}catch(err){
		console.log(`commanding ${device.name} failed`)
	}
}
// page.locator('iframe[name="actionContent"]').contentFrame().getByText('Close').first()
//locator('iframe[name="actionContent"]').contentFrame().locator('div').filter({ hasText: 'Close' }).nth(3)
async function commandBinaryDevice(device, state, attempt = 1){
	const {lockedValue, commandValue, name} = device
	console.log(`commanding ${name}: ${state}, attempt: ${attempt}`)
	const currentLockedValue = await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).locator('span').first().textContent();
	if(currentLockedValue === state){console.log(`${device.name} already ${state}`); return;}
	await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).click();
	try{
		try{
			await actionContent.locator('div.ControlLightDropList-WidgetLightDropList-rowinactive').getByText(state).click();
		}catch(err){
				await actionContent.locator('div.ControlLightDropList-WidgetLightDropList-rowinactive').getByText(state).nth(1).click();
				console.log(e)
			}
			await expect(actionContent.locator("#bodyTable").locator(`[primid="prim_${commandValue}"]`)).toHaveText(state, {timeout: 2000})
			
	}catch(err){
		if(attempt >3 ){
			console.log(`commanding ${device.name} failed, aborting`);
			return ;
		}
		console.log(`commanding ${device.name} failed, trying again`);
		commandBinaryDevice(device, state, attempt+=1);
	}
};
async function getAnalogFeedback(device){
	const {feedbackValue} = device
	let result;
	let value = parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent());
	console.log(`${device.name} initial reading: ${value}`)
	for (let i = 0; i < 400; i++) {
		let feedback = await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent();
		result = parseFloat(feedback);
		if (Math.abs(value - result) > 0.1 ) {
			await page.waitForTimeout(500);
			feedback = await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent();
			console.log(`${device.name} feedback: ${feedback}`);
			break;
		}
		feedback = await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent();
		await new Promise(r => setTimeout(r, 7000));
	}
}
async function testAnalogIO(device, value) {
	const {feedbackValue, commandValue, lockedValue} = device
	await commandAnalogDevice(device, value);
	let result = 100;
	for (let i = 0; i < 40; i++) {
		let feedback = await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent();
		result = parseInt(feedback);
		if (Math.abs(value - result) < 5) {
			await page.waitForTimeout(5000);
			feedback = await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent();
			console.log(`feedback: ${feedback}`);
			break;
		}
		feedback = await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent();
		await new Promise(r => setTimeout(r, 7000));
	}
	expect(Math.abs(result - value)).toBeLessThanOrEqual(5);
}
async function testBinaryIO(device, state) {
	const {commandValue, feedbackValue} = device;
	await commandBinaryDevice(device, state);
	await expect(actionContent.locator("#bodyTable").locator(`[primid="prim_${commandValue}"]`)).toHaveText(state);
	await expect(actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`)).toHaveText(state);
	console.log(`${device.name} ${state}`)
}
async function testBinaryInput(device, state1, state2){
	const {feedbackValue} = device;
	expect(actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`)).not.toBe("?")
	await expect(actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`)).toHaveText(state1);
	console.log(`${device.name}: ${state1} Waiting for state change...`);
	await expect(actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`)).toHaveText(state2);
	console.log(`${device.name}: ${state2}`)
}

test.describe.configure({timeout: 10 * 60000})
// test.describe.configure({mode: "parallel"})
test.beforeAll('log in', async ({ browser }) => {

	console.log('logging in to ALC...')
	context = await browser.newContext({ bypassCSP: true });
  	page = await context.newPage();

	page.goto('http://localhost:8080');
	await page.locator('#nameInput').fill('silent');
	await page.locator('#pass').fill('password123');
	await page.getByRole("button", { name: 'Log in' }).click();
	console.log("Logged in to ALC");

})
test.beforeAll('navigate to I/O points', async () => {
	const ioPoints = page.locator('#facetContent').contentFrame().getByText("I/O Points")
	await ioPoints.click();
	actionContent = page.locator("#actionContent").contentFrame();
});
test.beforeAll('setup auto click', async () => {
	await page.evaluate(()=>{
		let  setUpObserver = () => {
			let acceptNode = document.querySelector("#MainBarTR > td.actionSection.fill-horz.barBg").children[1];
			let cb = () => handleAcceptButton();
			let autoAccept = new MutationObserver(cb);
			let config = { attributes: true, childList: true, subtree: true };
			autoAccept.observe(acceptNode, config);
		}
		setUpObserver();
	})
})
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
test('download program', async ({ browser }) => {
	await page.waitForTimeout(2000);
	let saValue = await actionContent.locator("#bodyTable").locator(`[primid="prim_${saTemp.feedbackValue}"]`).textContent()
	test.skip(saValue !== '?', "Program already downloaded")
	test.setTimeout(10 * 60000)
	let text;
	console.log('downloading controller program...');
	await page.waitForLoadState();
	await page.evaluate(() => window.invokeManualCommand('download'));
	await expect(actionContent.locator("#ch_message_div", {hasText: "Downloading"})).toBeVisible({timeout: 5000});
	while(await actionContent.locator("#ch_message_div", {hasText: "Downloading"}).isVisible()){
		text = await actionContent.locator("#ch_message_div").first().textContent();
		console.log(`${text}`);
		await page.waitForTimeout(5000);
	}
	await expect(actionContent.locator("#ch_message_div", {hasText: "Downloading"})).not.toBeVisible()
	console.log(await actionContent.locator("#ch_message_div").first().textContent())
	await expect(await actionContent.locator("#ch_message_div").first()).not.toBeVisible({timeout: 5000})
	console.log(text)
	console.log('program download complete');
})
test('check faults', async () =>{
	async function checkFaults(quantityFaulted = 0){

		for(let i = 0; i < 58; ++i){
			let firstColumn = await actionContent.locator('#bodyTable').locator('tr').nth(i).locator('td').first().locator('span')
			const color = await firstColumn.evaluate(el =>
				window.getComputedStyle(el).getPropertyValue('color')
				);
				if(color == 'rgb(255, 0, 0)'){
					console.log(`${await firstColumn.textContent()} faulted`)
					quantityFaulted++;
				}
		}
		if(quantityFaulted>2){
			console.log(`${quantityFaulted} faults, checking again in 10s`);
			await page.waitForTimeout(10000);
			return await checkFaults()
		}else{
			console.log('done')
			return 
		}	
	}
	await checkFaults();
})
test.describe('low voltage', () => {
	test.beforeAll(async ()=>{
		await page.waitForTimeout(5000)
		await commandBinaryDevice(fill, "Close");
		await commandBinaryDevice(drain, "Close");
		await commandBinaryDevice(bleed, "Off");
		await commandBinaryDevice(sump, "Off");
		await commandBinaryDevice(vfdEnable, "Disable");
		await commandAnalogDevice(vfd, 0);
		await commandAnalogDevice(faceDamper, 20);
		await commandAnalogDevice(bypassDamper, 100);
	})
	test('mech gallery leak / mpdc', async () => {
		test.setTimeout(60000);
		const mpdc = testBinaryInput(leak1, 'Normal', 'Alarm');
		const mechGalleryLeak = testBinaryInput(leak2, 'Normal', 'Alarm');
		try {
			await Promise.any([mechGalleryLeak, mpdc]);
		} catch (err) {
			console.error('Both tests failed, aborting...');
			throw err;
		}
	});
	test('fill actuator', async () => {
		expect(await actionContent.locator("#bodyTable").locator(`[primid="prim_${fill.feedbackValue}"]`)).toHaveText("Open", {timeout: 10 * 60000})
		await testBinaryIO(fill, "Open");
		await testBinaryIO(fill, "Close");
	})
	test('drain actuator', async () => {
		expect(await actionContent.locator("#bodyTable").locator(`[primid="prim_${drain.feedbackValue}"]`)).toHaveText("Close", {timeout: 10 * 60000})
		await testBinaryIO(drain, "Open");
		await testBinaryIO(drain , "Close");
	})
	test('wll', async () => {
		await testBinaryInput(wll, 'Low', 'Normal');
	})
	test('wol', async () => {
		await testBinaryInput(wol, 'Low', 'Normal');
	})
	test('whl', async () => {
		await testBinaryInput(whl, 'Normal', 'Alarm');
	})
	test('ma temp', async ()=>{
		await getAnalogFeedback(maTemp)
	})
	test('rh1', async ()=>{
		await getAnalogFeedback(rh1)
	})
	test('rh2', async ()=>{
		await getAnalogFeedback(rh2)
	})
	test('sa temp', async ()=>{
		let value = parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${saTemp.feedbackValue}"]`).textContent())
		test.skip( value < 0,`${saTemp.name} faulty`);
		await getAnalogFeedback(saTemp)
	})
	test('face damper', async () => {
		test.setTimeout(5 * 60000);
		await testAnalogIO(faceDamper, 20);
		await testAnalogIO(faceDamper, 50);
		await testAnalogIO(faceDamper, 100);
		await commandAnalogDevice(faceDamper, 20);
	})
	test('bypass damper', async () => {
		test.setTimeout(5 * 60000)
		await testAnalogIO(bypassDamper, 100);
		await testAnalogIO(bypassDamper, 50);
		await testAnalogIO(bypassDamper, 20);
		await commandAnalogDevice(bypassDamper, 100)
	})
})
test('fill tank',async() => {
	test.setTimeout(0)
	await commandBinaryDevice(fill, 'Open');
	await commandBinaryDevice(drain, 'Close');
	console.log("waiting for WOL to change state")
	await expect(await actionContent.locator("#bodyTable").locator(`[primid="prim_${wol.feedbackValue}"]`)).toHaveText("Normal", {timeout: 10 * 60000})
})
test.describe('bypass', async () => {
	test.describe.configure({ mode: 'serial' });
	test.beforeEach(async ()=>{
		await page.waitForLoadState();
	})
	test('sump current switch', async () => {
		await commandBinaryDevice(sump, "On");
		await testBinaryInput(sump, 'Off', 'On');
	})
	test('conductivity', async () => {
		const conductivityReading = parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${conductivity.feedbackValue}"]`).textContent());
		expect(conductivityReading).toBeGreaterThan(100);
		await getAnalogFeedback(conductivity);
	})
	test('bleed', async ()=>{
		test.setTimeout(6 * 60000)
		await commandBinaryDevice(bleed, "On");
		console.log('bleed on for 5 minutes')
		await page.waitForTimeout(5 * 60000);
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
	test.describe.configure({ mode: 'serial' });
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
			await testBinaryInput(fan, 'On', 'Off');
		}
	})	
	test('vfd HOA', async () => {
		test.setTimeout(10 * 60000);
		await testBinaryInput(vfdHOA, 'Off', 'On');
	})

	test('vfd feedback and airflow', async () => {
		test.setTimeout(0);
		await commandBinaryDevice(vfdEnable, 'Enable')
		const getAirflowReading = async () => {
			return parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${airflow.feedbackValue}"]`).textContent())
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