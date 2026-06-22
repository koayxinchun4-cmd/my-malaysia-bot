#!/data/data/com.termux/files/usr/bin/bash
# 讓排程知道要去哪裡執行
cd /data/data/com.termux/files/home/my-malaysia-bot
# 暴力執行並將結果與錯誤紀錄到日誌中
/data/data/com.termux/files/usr/bin/node --env-file=.env index.js >> auto_run.log 2>&1
