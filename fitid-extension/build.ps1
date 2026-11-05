# FitID build: makes a clean, installable copy of the extension and a .zip package.
#   powershell -ExecutionPolicy Bypass -File build.ps1
# Output:
#   dist\fitid-extension\            -> Edge: edge://extensions > Load unpacked > pick this folder
#   dist\fitid-extension-<ver>.zip    -> share it, or upload to Microsoft Edge Add-ons
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version
$dist = Join-Path $root 'dist'
$out = Join-Path $dist 'fitid-extension'
$zip = Join-Path $dist "fitid-extension-$version.zip"

# Only what the extension needs at run time (no tests, demo or docs)
$include = @('manifest.json', 'background.js', 'lib', 'content', 'popup', 'options', 'ui', 'icons')

if (Test-Path $out) { Get-ChildItem $out -Force | Remove-Item -Recurse -Force }
New-Item -ItemType Directory -Force $out | Out-Null
foreach ($item in $include) { Copy-Item (Join-Path $root $item) -Destination $out -Recurse -Force }

# Check every file the manifest and pages reference is in the package
$missing = @()
foreach ($cs in $manifest.content_scripts) { foreach ($f in $cs.js) { if (-not (Test-Path (Join-Path $out $f))) { $missing += $f } } }
foreach ($f in @($manifest.background.service_worker, $manifest.action.default_popup, $manifest.options_page) + @($manifest.icons.PSObject.Properties.Value)) {
  if (-not (Test-Path (Join-Path $out $f))) { $missing += $f }
}
Get-ChildItem $out -Recurse -Filter *.html | ForEach-Object {
  $dir = $_.DirectoryName
  [regex]::Matches((Get-Content $_.FullName -Raw), '(?:src|href)="(\.\./[^"]+|[^":/]+\.(?:js|css))"') | ForEach-Object {
    $p = Join-Path $dir $_.Groups[1].Value
    if (-not (Test-Path $p)) { $missing += "$($_.Groups[1].Value) (from $($_.Name))" }
  }
}
if ($missing.Count) { throw "Build failed, missing files: $($missing -join ', ')" }

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip
# Publish the download and the demo to the website (fitid-web), so fitid-sizes.vercel.app
# serves /downloads/fitid-extension.zip and /demo/ after the next push.
$web = Join-Path (Split-Path $root -Parent) 'fitid-web'
if (Test-Path $web) {
  $dl = Join-Path $web 'downloads'
  New-Item -ItemType Directory -Force $dl | Out-Null
  Copy-Item $zip (Join-Path $dl 'fitid-extension.zip') -Force
  $webDemo = Join-Path $web 'demo'
  New-Item -ItemType Directory -Force (Join-Path $webDemo 'img') | Out-Null
  Copy-Item (Join-Path $root 'demo\index.html') $webDemo -Force
  Copy-Item (Join-Path $root 'demo\img\*') (Join-Path $webDemo 'img') -Force
  Write-Output "  Website: copied zip to fitid-web\downloads and demo to fitid-web\demo"
}

$files = (Get-ChildItem $out -Recurse -File).Count
$kb = [math]::Round((Get-Item $zip).Length / 1KB)
Write-Output "Built FitID $version : $files files"
Write-Output "  Folder: $out"
Write-Output "  Zip:    $zip ($kb KB)"
