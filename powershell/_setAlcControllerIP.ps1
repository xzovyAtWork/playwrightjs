Write-Host 'Setting IP to 169.254.1.2'
netsh interface ipv4 set address name="Ethernet" static 169.254.1.2

Start-Sleep -Seconds 2

Set-Location "C:\Users\$env:USERNAME\Documents\playwrightjs"

try {
    npx playwright test tests/setControllerIP.spec.ts
} catch {
    Write-Error "set controller IP failed."
}

Start-Sleep -Seconds 2

Write-Host 'Setting IP to 192.168.168.128'
netsh interface ipv4 set address name="Ethernet" static 192.168.168.128
Write-Host '192.168.168.128 set'

Start-Sleep -Seconds 5