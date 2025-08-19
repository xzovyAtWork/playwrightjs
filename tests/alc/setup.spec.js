import { test, expect, Page, Context} from '@playwright/test';
import {devices} from "./alcDevices";
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
test.beforeAll('log in', async ({browser}) => {

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