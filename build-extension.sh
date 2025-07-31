#!/bin/bash

# Chrome Web Store用の拡張機能パッケージを作成するスクリプト

echo "Building Chrome extension package for Chrome Web Store..."

# 出力ディレクトリを作成
mkdir -p dist

# 必要なファイルのみをdistディレクトリにコピー
echo "Copying essential files..."

# 拡張機能の核となるファイル
cp manifest.json dist/
cp background.js dist/
cp content.js dist/
cp turndown.js dist/

# 共通ライブラリ
cp -r lib dist/

# ポップアップ関連ファイル
cp popup.html dist/
cp popup.js dist/
cp popup.css dist/

# 設定関連ファイル
cp settings.html dist/
cp settings.js dist/

# アイコンファイル（存在する場合）
if [ -d "images" ]; then
    cp -r images dist/
fi

# READMEファイル（存在する場合）
if [ -f "README.md" ]; then
    cp README.md dist/
fi

# LICENSEファイル（存在する場合）
if [ -f "LICENSE" ]; then
    cp LICENSE dist/
fi

echo "Extension package created in 'dist' directory"
echo "Files included:"
ls -la dist/

echo ""
echo "To create a ZIP file for Chrome Web Store:"
echo "cd dist && zip -r ../chrome-extension.zip ."
echo ""
echo "The following files are excluded from the package:"
echo "- node_modules/ (development dependencies)"
echo "- test/ (test files)"
echo "- package.json and package-lock.json (Node.js config)"
echo "- .kiro/ (development specs)"
echo "- vitest.config.js (test configuration)"
echo "- Development scripts and logs"