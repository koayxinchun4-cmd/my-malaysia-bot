#!/bin/bash
# 喚醒機器人的 URL
URL="https://my-malaysia-bot3.onrender.com"

echo "💓 正在向 $URL 發送心跳訊號..."
curl -s -o /dev/null -w "%{http_code}" $URL
echo " -> 機器人回應狀態碼 (200 代表清醒)"
