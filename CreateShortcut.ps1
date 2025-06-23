$WshShell = New-Object -ComObject WScript.Shell

# Get Desktop folder path dynamically
$desktopPath = [Environment]::GetFolderPath("Desktop")

# Define paths relative to the script location
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$batPath = Join-Path $scriptDir "numeros-de-TikTok.bat"
$icoPath = Join-Path $scriptDir "logo.ico"

# Shortcut path on Desktop
$shortcutPath = Join-Path $desktopPath "numeros-de-TikTok.lnk"

# Create the shortcut on Desktop
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $batPath
$Shortcut.IconLocation = $icoPath
$Shortcut.Save()

Write-Host "Shortcut created on Desktop: $shortcutPath"
