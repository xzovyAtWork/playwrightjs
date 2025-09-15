Set-Location "C:\Users\$env:USERNAME\Documents\playwrightjs"
$test = "tests/alc.spec.js"

function test{
	param(
		[string]$prompt,
		[string]$grep
	)
	$userInput = Read-Host -Prompt $prompt
	Write-Host $grep
	if($userInput -eq 'y'){
		npx playwright test $test -g $grep --retries 1 --headed
	}
}

Write-Host "press enter to skip tests. 'y' to begin test."

$specificTest = Read-Host "Test specific device?(press enter to skip)"
if($specificTest -ne ''){
	npx playwright test $test -g $specificTest --headed
}
test -prompt "Begin download? (enter 'y' to start)" -grep "download"
test -prompt "Begin check faults? (enter 'y' to start)" -grep "check faults"
test -prompt "Begin low voltage? (enter 'y' to start)" -grep "low voltage"
test -prompt "Begin filling sump tank? (enter 'y' to start)" -grep "fill tank" 
test -prompt "Begin Evap section? (enter 'y' to start)" -grep "evap section"
test -prompt "Begin Motors and Primary Secondary? (enter 'y' to start)"-grep "motor section"
test -prompt "Ramp Fans? (enter 'y' to start)"-grep "ramp fans"
test -prompt "Start fan timer? (enter 'y' to start)"-grep "run on timer"
test -prompt "Close dampers? (enter 'y' to start)"-grep "close dampers"
