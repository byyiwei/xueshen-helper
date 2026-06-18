$scriptPath = $MyInvocation.MyCommand.Definition
$scriptDir = Split-Path -Path $scriptPath -Parent

Set-Location $scriptDir

Start-Process -FilePath "node.exe" -ArgumentList "server.js" -NoNewWindow -PassThru | Out-Null