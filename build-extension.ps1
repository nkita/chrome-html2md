# Chrome Web Store用の拡張機能パッケージを作成するPowerShellスクリプト

Write-Host "Building Chrome extension package for Chrome Web Store..." -ForegroundColor Green

# 出力ディレクトリを作成
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
New-Item -ItemType Directory -Path "dist" | Out-Null

Write-Host "Copying essential files..." -ForegroundColor Yellow

# 拡張機能の核となるファイル
$essentialFiles = @(
    "manifest.json",
    "background.js", 
    "content.js",
    "turndown.js",
    "popup.html",
    "popup.js",
    "popup.css",
    "settings.html",
    "settings.js"
)

foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Copy-Item $file "dist/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ $file not found" -ForegroundColor Yellow
    }
}

# アイコンディレクトリ（存在する場合）
if (Test-Path "images") {
    Copy-Item -Recurse "images" "dist/" -Force
    Write-Host "  ✓ images/" -ForegroundColor Gray
}

# READMEファイル（存在する場合）
if (Test-Path "README.md") {
    Copy-Item "README.md" "dist/" -Force
    Write-Host "  ✓ README.md" -ForegroundColor Gray
}

# LICENSEファイル（存在する場合）
if (Test-Path "LICENSE") {
    Copy-Item "LICENSE" "dist/" -Force
    Write-Host "  ✓ LICENSE" -ForegroundColor Gray
}

Write-Host "`nExtension package created in 'dist' directory" -ForegroundColor Green
Write-Host "Files included:" -ForegroundColor Cyan
Get-ChildItem "dist" | Format-Table Name, Length, LastWriteTime

Write-Host "`nTo create a ZIP file for Chrome Web Store:" -ForegroundColor Yellow
Write-Host "Compress-Archive -Path 'dist\*' -DestinationPath 'chrome-extension.zip' -Force" -ForegroundColor White

Write-Host "`nThe following files are excluded from the package:" -ForegroundColor Magenta
Write-Host "- node_modules/ (development dependencies)" -ForegroundColor Gray
Write-Host "- test/ (test files)" -ForegroundColor Gray  
Write-Host "- package.json and package-lock.json (Node.js config)" -ForegroundColor Gray
Write-Host "- .kiro/ (development specs)" -ForegroundColor Gray
Write-Host "- vitest.config.js (test configuration)" -ForegroundColor Gray
Write-Host "- Development scripts and logs" -ForegroundColor Gray