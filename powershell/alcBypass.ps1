Set-Location "C:\Users\jsteinca\Documents\Git\playwrightjs"
# $tests = @("download program", "check faults", "low voltage", "evap section", "bypass", "motor section")

npx playwright test tests/alcBypass.spec.js
# try {
	# foreach ($test in $tests) {
	# }
# } catch {
    # Write-Error "an error occured $_"
# }