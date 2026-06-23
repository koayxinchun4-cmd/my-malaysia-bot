#!/data/data/com.termux/files/usr/bin/bash

# 1. 執行我們的健康檢查 (init.sh)
bash init.sh || { termux-notification --title "Agent 錯誤" --content "健康檢查未通過，任務終止"; exit 1; }

# 2. 執行主程序，並將輸出導向到臨時檔案
LOG_FILE="temp_execution.log"
node xiaohongshu.js > "$LOG_FILE" 2>&1

# 3. 檢查執行結果
if [ $? -eq 0 ]; then
    MSG="執行成功：小紅書文案已生成。"
else
    MSG="執行異常：請檢查 auto_run.log"
fi

# 4. 追加紀錄並發送通知
cat "$LOG_FILE" >> auto_run.log
termux-notification --title "油價 Agent 報告" --content "$MSG"

# 清理臨時檔
rm "$LOG_FILE"
