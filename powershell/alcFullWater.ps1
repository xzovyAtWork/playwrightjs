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
		npx playwright test $test -g $grep
	}
}

$userInput = Read-Host -Prompt "Begin 1st cycle? (enter 'y' to start)"
if($userInput -eq 'y'){
	npx playwright test $test -g "sump current switch"
	npx playwright test $test -g "conductivity"
	npx playwright test $test -g "bleed"
	npx playwright test $test -g "rinse cycle"
}

for ($i = 0; $i -le 14; $i++) {
	$userInput = Read-Host -Prompt "Begin nth cycle? (enter 'y' to start)"
	if($userInput -eq 'y'){
		npx playwright test $test -g "rinse cycle"
	}
}