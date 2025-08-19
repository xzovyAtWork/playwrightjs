Set-Location "C:\Users\$env:USERNAME\Documents\Git\playwrightjs"

$test = "tests\alc"

function test{
	param(
		[string]$prompt,
		[string]$grep
	)
	$userInput = Read-Host -Prompt $prompt
	Write-Host $grep
	if($userInput -eq 'y'){
		npx playwright test $test $grep
	}
}

npx playwright test $test setup.spec.js 

test -prompt "Begin low voltage? (enter 'y' to start)" -grep "lowVoltage.spec.js" 
test -prompt "Begin Evap section? (enter 'y' to start)" -grep "evapBypass.spec.js"
test -prompt "Begin Motor section? (enter 'y' to start)"-grep "motorSection.spec.js"
