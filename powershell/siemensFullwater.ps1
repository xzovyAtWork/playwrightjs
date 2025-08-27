Set-Location "C:\Users\$env:USERNAME\Documents\Git\playwrightjs"
$test = "tests/siemens/siemens.spec.js"

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


test -prompt "Begin 1st cycle? (enter 'y' to start)" -grep "full water"
test -prompt "Begin nth rinse cycle? (enter 'y' to start)" -grep "rinse cycle"