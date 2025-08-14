Set-Location "C:\Users\$env:USERNAME\Documents\Git\playwrightjs"

$test = "tests/siemensBypass.spec.js"

function test($prompt, $grep){
	$userInput = Read-Host -Prompt $prompt
	if($userInput -eq 'y'){
		npx playwright test $test -g $grep
	}
}

test("Begin low voltage? (enter 'y' to start)", "low voltage");
test("Begin filling sump tank? (enter 'y' to start)", "fill tank" )
test("Begin Evap section? (enter 'y' to start)", "evap section")
test("Begin Motor section? (enter 'y' to start)", "motor section")
