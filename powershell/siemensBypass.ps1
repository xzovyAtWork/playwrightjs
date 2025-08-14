Set-Location "C:\Users\jsteinca\Documents\Git\playwrightjs"
# $tests = @("download program", "check faults", "low voltage", "fill tank", "evap section", "motor section")

# npx playwright test tests/alcBypass.spec.js
$test = siemensBypass.spec.js
$userInput = Read-Host -Prompt "Begin low voltage? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test $test  -g "low voltage" 
}
$userInput = Read-Host -Prompt "Begin filling sump tank? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test  $test -g "fill tank" 
}
$userInput = Read-Host -Prompt "Begin Evap section? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test $test -g "evap section"
}
$userInput = Read-Host -Prompt "Begin Motor section? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test $test -g "motor section"
}