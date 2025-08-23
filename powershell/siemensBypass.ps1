Set-Location "C:\Users\$env:USERNAME\Documents\Git\playwrightjs"
$test = "tests/siemensBypass.spec.js"

function test{
	param(
		[string]$prompt,
		[string]$grep
	)
	$userInput = Read-Host -Prompt $prompt
	Write-Host $grep
	if($userInput -eq 'y'){
		npx playwright test $test -g $grep
	}
}

test -prompt "Begin low voltage? (enter 'y' to start)" -grep "low voltage"
test -prompt "Begin filling sump tank? (enter 'y' to start)" -grep "fill tank" 
test -prompt "Begin Evap section? (enter 'y' to start)" -grep "evap section"
test -prompt "Begin Motor section? (enter 'y' to start)"-grep "motor section"
test -prompt "Drain tank? (enter 'y' to start)"-grep "drain tank"
test -prompt "Close dampers? (enter 'y' to start)"-grep "close dampers"
