$location = "C:\Users\$env:USERNAME\Documents"
Set-Location $location
Invoke-WebRequest 'https://github.com/xzovyAtWork/playwrightjs/archive/refs/heads/master.zip' -OutFile .\playwright.zip
Write-Host "repository fetched"
Expand-Archive .\playwright.zip .\
Rename-Item .\playwrightjs-master .\playwright
Remove-Item .\playwright.zip
Set-Location .\playwright
Write-Host "Initializing project..."
npm init -y
Write-Host "Installing @playwright/test..."
npm install -D @playwright/test@latest
Write-Host "Installing chromium..."
npx playwright install  chromium --with-deps
Write-Host "Installation complete"