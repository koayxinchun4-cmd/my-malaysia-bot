#!/bin/bash
# 自動化部署腳本
echo "🚀 準備發射代碼到雲端..."
git add .
git commit -m "自動部署: $(date +'%Y-%m-%d %H:%M:%S')"
git push
echo "✅ 部署完成，機器人即將重啟！"
