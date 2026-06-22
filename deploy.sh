#!/bin/bash

# 1. 語法檢查：確保 index.js 沒有寫錯符號
echo "🔍 正在檢查程式碼語法..."
node -c index.js
if [ $? -ne 0 ]; then
    echo "❌ 語法有誤！請先修正 index.js 再部署。"
    exit 1
fi

# 2. 自動提交更新
echo "🚀 準備發射代碼到雲端..."
git add .
git commit -m "自動部署: $(date +'%Y-%m-%d %H:%M:%S')"

# 3. 推送並檢查網路連線
echo "📡 正在連線至 GitHub..."
git push
if [ $? -eq 0 ]; then
    echo "✅ 部署成功！Render 將在幾分鐘內自動重啟。"
else
    echo "⚠️ 推送失敗，請檢查網路或權限。"
    exit 1
fi
