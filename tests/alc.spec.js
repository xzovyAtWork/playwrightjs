import { test, expect, Page, Context} from '@playwright/test';
import { devices } from '../devices/alcDevices';
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

test.describe.configure({timeout: 10 * 60000})
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
test.describe('download and check faults', () => {

	test('download program', async () => {
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
})

test.describe('low voltage', () => {
	test('setup', async ()=>{
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

	test('leak', async () => {
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
		await testBinaryIO(fill, "Open", "Close");
	})
	test('drain actuator', async () => {
		await testBinaryIO(drain, "Open", "Close");
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
		await testAnalogInput(maTemp)
	})
	test('rh1', async ()=>{
		await testAnalogInput(rh1)
	})
	test('rh2', async ()=>{
		await testAnalogInput(rh2)
	})
	test('sa temp', async ()=>{
		let value = getAnalogInput(saTemp.feedbackValue)
		test.skip( value < 0,`${saTemp.name} faulty`);
		await getAnalogInput(saTemp)
	})
	test('face damper', async () => {
		test.setTimeout(5 * 60000);
		await testAnalogIO(faceDamper, 20);
		await testAnalogIO(faceDamper, 50);
		await testAnalogIO(faceDamper, 100);
	})
	test('bypass damper', async () => {
		test.setTimeout(5 * 60000)
		await testAnalogIO(bypassDamper, 100);
		await testAnalogIO(bypassDamper, 50);
		await testAnalogIO(bypassDamper, 20);

		await commandAnalogDevice(bypassDamper, 100)
		await commandAnalogDevice(faceDamper, 20);
	})
})
test('fill tank', async ()=>{
	await commandBinaryDevice(fill, 'Open');
	await commandBinaryDevice(drain, 'Close')
	console.log("waiting for WOL to change state...")
	await getBinaryInput(wol, 'Normal')
})
test.describe("evap section", ()=> {
	test('sump current switch', async () => {
		await commandBinaryDevice(sump, "On");
		await testBinaryInput(sump, 'Off', 'On');
	})
	test('conductivity', async () => {
		const conductivityReading = parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${conductivity.feedbackValue}"]`).textContent());
		await testAnalogInput(conductivity);
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
		console.log('check that motor protectors control the correct motor..')
	})	
	test('vfd HOA', async () => {
		test.setTimeout(10 * 60000);
		await testBinaryInput(vfdHOA, 'Off', 'On');
	})

})
test('ramp fans', async () => {
	test.setTimeout(0);
	await commandBinaryDevice(vfdEnable, 'Enable')

	await testAnalogIO(vfd, 0);
	console.log(await getAnalogInput(airflow))
	await testAnalogIO(vfd, 25);
	console.log(await getAnalogInput(airflow))
	await testAnalogIO(vfd, 50);
	console.log(await getAnalogInput(airflow))
	await testAnalogIO(vfd, 75);
	console.log(await getAnalogInput(airflow))
	await testAnalogIO(vfd, 100);
	await page.waitForTimeout(3000);
	let final = await getAnalogInput(airflow)
	expect(final).toBeGreaterThanOrEqual(45000);
	await page.waitForTimeout(3000);
})
test('run on timer', async () => {
	test.setTimeout(0)
	console.log('running fans for 30 minutes')
	await page.waitForTimeout(30 * 60000);
	await commandBinaryDevice(vfdEnable, 'Disable');
})
test.describe('full water', async () => {
	const conductivityReadings = [];
	async function getConductivityValue(){
		await page.waitForTimeout(10000);
		const conductivityReading = parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${conductivity.feedbackValue}"]`).textContent());
		conductivityReadings.push(conductivityReading)
		return conductivityReading;
	}
	test('rinse cycle', async () => {
		test.setTimeout(0);
		await commandBinaryDevice(fill, 'Open')
		await commandBinaryDevice(drain, 'Close');
		console.log('waiting for tank to fill...')
		await expect(await actionContent.locator("#bodyTable").locator(`[primid="prim_${wol.feedbackValue}"]`)).toHaveText("Normal", {timeout: 10 * 60000})
		await commandBinaryDevice(sump, 'On');
		const startValue = await getConductivityValue();
		console.log(`starting cycle. Conductivity: ${startValue}. running for 30 minutes...` )
		await page.waitForTimeout(10 * 60000);
		console.log("..")
		await page.waitForTimeout(10 * 60000);
		console.log("..")
		await page.waitForTimeout(10 * 60000);
		console.log(`cycle complete. Draining tank. Conductivity: ${await getConductivityValue()}`)
		await commandBinaryDevice(fill, 'Close');
		await commandBinaryDevice(drain, 'Open');
		await commandBinaryDevice(sump, 'Off');
		await commandBinaryDevice(bleed, 'Off');
		await getBinaryInput(wll, "Low")
		console.log('Conductivity Readings', conductivityReadings);
	})
})

test("close dampers", async ()=>{
	await commandAnalogDevice(faceDamper, 100)
	await commandAnalogDevice(bypassDamper, 100)
	await testAnalogIO(faceDamper, 100)
})

////
///Binary devices
////
async function getBinaryInput(device, value){
	const {feedbackValue, commandValue, lockedValue, name} = device
	console.log(`Waiting for ${name} to be ${value}...`)
	await expect(actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`)).toContainText(value)
	console.log(`${name} ${value}`)
}
async function commandBinaryDevice(device, value, retries = 0){
	const {lockedValue, commandValue, name} = device
	console.log(`commanding ${name}: ${value}`)
	const currentLockedValue = await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).locator('span').first().textContent();
	console.log('Current value:',currentLockedValue)
	if(currentLockedValue === value){console.log(`${device.name} already ${value}`); return;}
	await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).click();
	const dropdown = await actionContent.locator('div.ControlLightDropList-WidgetLightDropList-rowinactive:visible').filter({hasText: value})
	if(retries <=3){

		try{
			await expect.soft(dropdown, "").toBeVisible();
			await dropdown.click();
			await accept()
			await expect.soft(actionContent.locator("#bodyTable").locator(`[primid="prim_${commandValue}"]`), ` ${name}: ${commandValue}`).toHaveText(value, {timeout: 2000})
			
		}catch(error){
			console.log(error);
			console.log("Command Failed, trying again...")
			await commandBinaryDevice(device, value, retries++)
		}
	}
		
	console.log(`${name}: ${value}`)
};

async function testBinaryInput(device, state1, state2){
	const {feedbackValue, name} = device;
	await getBinaryInput(device, state1)
	await getBinaryInput(device, state2)
	console.log(`${name}: ${state2}`)
}
async function testBinaryIO(device, state1, state2) {
	await commandBinaryDevice(device, state1);
	await getBinaryInput(device, state1);
	await commandBinaryDevice(device, state2);
	await getBinaryInput(device, state2);
}



////
/// Analog Devices
////
async function getAnalogInput(device){
	const {feedbackValue, name} = device
	let value = parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent());
	console.log(`${name} reading: ${value}`)
	if (isNaN(value) || value < 0) {
		value = parseFloat(await actionContent.locator("#bodyTable").locator(`[primid="prim_${feedbackValue}"]`).textContent());
	}
	expect.soft(value).toBeGreaterThan(0);
	return value;
}

async function testAnalogInput(device){
	const {name, feedbackValue} = device;
	let feedback;
	let initial = await getAnalogInput(device);
	for(let i = 0; i < 400; i++){
		feedback = await getAnalogInput(device);
		if(Math.abs(feedback - initial) >= 0.3){
			await page.waitForTimeout(500);
			feedback = await getAnalogInput(device);
			console.log(`${name} feedback: ${feedback}`);
			break;
		}
		feedback = await getAnalogInput(device);
		await new Promise(r => setTimeout(r, 7000));
	}
	return parseInt(feedback);
}

async function commandAnalogDevice(device, value){
	const { lockedValue, commandValue } = device
	const currentValue = parseInt(await actionContent.locator("#bodyTable").locator(`[updateid="prim_${commandValue}_ctrlid1"]`).textContent());
	if(currentValue !== value){
		await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).click();
		await actionContent.locator("#bodyTable").locator(`[updateid="prim_${lockedValue}_ctrlid1"]`).fill(`${value}`);
		await page.keyboard.press("Enter")
		await accept();
	}else {
		console.log(`${device.name} ${value}`)
	}
}

async function testAnalogIO(device, value) {
	await commandAnalogDevice(device, value);
	for (let i = 0; i < 40; i++) {
		let feedback = await getAnalogInput(device)
		if (Math.abs(value - feedback) < 5) {
			await page.waitForTimeout(5000);
			feedback = await getAnalogInput(device)
			console.log(`feedback: ${feedback}`);
			break;
		}
		await new Promise(r => setTimeout(r, 7000));
	}
}

async function accept(){
	await expect(page.getByRole('cell', { name: 'Accept Cancel' })).toBeVisible();
	await page.locator('#acceptSpan').getByText('Accept').click();
}