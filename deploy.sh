#!/bin/bash
echo "🚀 開始自動部署流程..."
# git add . 會自動把所有「新增、修改、刪除」的檔案打包
git add .
git commit -m "更新內容: $(date +'%Y-%m-%d %H:%M:%S')"
git push
echo "✅ 部署完成！GitHub 與 Render 已同步。"
