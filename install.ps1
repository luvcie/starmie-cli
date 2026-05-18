$ErrorActionPreference = 'Stop'

$release = Invoke-RestMethod https://api.github.com/repos/luvcie/pokescope/releases/latest
$version = $release.tag_name.TrimStart('v')

$url = "https://github.com/luvcie/pokescope/releases/download/v$version/pokescope-windows-x64.exe"
$installDir = "$env:LOCALAPPDATA\pokescope"
$dest = "$installDir\pokescope.exe"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Write-Host "Downloading pokescope $version..."
Invoke-WebRequest $url -OutFile $dest

$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($currentPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable('Path', "$currentPath;$installDir", 'User')
    Write-Host "Added $installDir to PATH."
    Write-Host "Restart your terminal, then run: pokescope"
} else {
    Write-Host "Installed to $dest"
}
