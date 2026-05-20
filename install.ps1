$ErrorActionPreference = 'Stop'

$release = Invoke-RestMethod https://api.github.com/repos/luvcie/starmie-cli/releases/latest
$version = $release.tag_name.TrimStart('v')

$url = "https://github.com/luvcie/starmie-cli/releases/download/v$version/starmie-cli-windows-x64.exe"
$installDir = "$env:LOCALAPPDATA\starmie-cli"
$dest = "$installDir\starmie-cli.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Write-Host "Downloading starmie-cli $version..."
Invoke-WebRequest $url -OutFile $dest

$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($currentPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable('Path', "$currentPath;$installDir", 'User')
    Write-Host "Added $installDir to PATH."
    Write-Host "Restart your terminal, then run: starmie-cli"
} else {
    Write-Host "Installed to $dest"
}
