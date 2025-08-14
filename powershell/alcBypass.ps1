Set-Location "C:\Users\jsteinca\Documents\Git\playwrightjs"
# $tests = @("download program", "check faults", "low voltage", "fill tank", "evap section", "motor section")

# npx playwright test tests/alcBypass.spec.js
$test = "tests/alcBypass.spec.js"

function test($prompt, $grep){
	$userInput = Read-Host -Prompt $prompt
	if($userInput -eq 'y'){
		npx playwright test $test -g $grep
	}
}

npx playwright test $test -g "download" 
npx playwright test $test  -g "check faults" 


test("Begin low voltage? (enter 'y' to start)", "low voltage");
test("Begin filling sump tank? (enter 'y' to start)", "fill tank" )
test("Begin Evap section? (enter 'y' to start)", "evap section")
test("Begin Motor section? (enter 'y' to start)", "motor section")
