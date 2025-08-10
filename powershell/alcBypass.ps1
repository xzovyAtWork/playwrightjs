Set-Location "C:\Users\jsteinca\Documents\Git\playwrightjs"
# $tests = @("download program", "check faults", "low voltage", "fill tank", "evap section", "motor section")
# if ($userInput -eq 'n') {
# }
# npx playwright test tests/alcBypass.spec.js
npx playwright test alcBypass.spec.js -g "download" 
npx playwright test alcBypass.spec.js  -g "check faults" 
$userInput = Read-Host -Prompt "Begin low voltage? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test alcBypass.spec.js  -g "low voltage" 
}
$userInput = Read-Host -Prompt "Begin filling sump tank? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test  alcBypass.spec.js -g "fill tank" 
}
$userInput = Read-Host -Prompt "Begin Evap section? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test alcBypass.spec.js -g "evap section"
}
$userInput = Read-Host -Prompt "Begin Motor section? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test alcBypass.spec.js -g "motor section"
}
