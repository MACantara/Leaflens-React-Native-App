$ErrorActionPreference = 'SilentlyContinue'

Write-Host "Checking Android setup..."

$androidHome = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
$androidSdkRoot = [Environment]::GetEnvironmentVariable('ANDROID_SDK_ROOT', 'User')

if (-not $androidHome) {
  $androidHome = $env:ANDROID_HOME
}
if (-not $androidSdkRoot) {
  $androidSdkRoot = $env:ANDROID_SDK_ROOT
}

$adbPath = Get-Command adb | Select-Object -ExpandProperty Source -First 1

# If env vars are missing, infer a usable SDK root from adb location.
if ($adbPath -and (-not $androidHome -or -not $androidSdkRoot)) {
  $adbDir = Split-Path $adbPath -Parent
  if ((Split-Path $adbDir -Leaf) -ieq 'platform-tools') {
    $inferredSdkRoot = Split-Path $adbDir -Parent
    if (-not $androidHome) {
      $androidHome = $inferredSdkRoot
    }
    if (-not $androidSdkRoot) {
      $androidSdkRoot = $inferredSdkRoot
    }
  }
}

Write-Host "ANDROID_HOME: $androidHome"
Write-Host "ANDROID_SDK_ROOT: $androidSdkRoot"

if ($adbPath) {
  Write-Host "adb: FOUND ($adbPath)"
} else {
  Write-Host "adb: NOT FOUND"
}

$defaultSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (Test-Path $defaultSdk) {
  Write-Host "Default SDK dir: FOUND ($defaultSdk)"
} else {
  Write-Host "Default SDK dir: NOT FOUND ($defaultSdk)"
}

if ($androidHome -and (Test-Path $androidHome)) {
  Write-Host "Resolved SDK dir: FOUND ($androidHome)"
} elseif ($androidHome) {
  Write-Host "Resolved SDK dir: NOT FOUND ($androidHome)"
}

if ($adbPath) {
  Write-Host "Connected devices:"
  adb devices
} else {
  Write-Host "Skipping device check because adb is unavailable."
}

Write-Host ""
Write-Host "Tips:"
Write-Host "1. If no device is listed, connect an Android phone and enable USB debugging."
Write-Host "2. Or open Android Studio -> More Actions -> SDK Manager, install SDK + Emulator + system image, then create an AVD in Device Manager."
