#!/data/data/com.termux/files/usr/bin/bash

TARGET_DIR="/sdcard/projects/oil-price-bot"
cd "$TARGET_DIR" || exit 1

echo "[1/3] 檢查環境依賴 (C)..."
if [ ! -d "node_modules" ]; then
    echo "偵測到缺少依賴，正在自動執行 npm install..."
    npm install
fi

echo "[2/3] 檢查程式碼更新 (B)..."
# 獲取遠端分支狀態，但不直接合併以免造成衝突
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "偵測到 GitHub 有新版本，正在自動更新..."
    git pull origin main
    npm install # 更新後重新安裝可能的新套件
else
    echo "程式碼已是最新版本。"
fi

echo "[3/3] 環境健康檢查..."
if [ -f ".env" ]; then
    echo "系統狀態：健康。準備就緒。"
else
    echo "錯誤：缺少 .env 檔案！"
    exit 1
fi
