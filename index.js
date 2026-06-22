const { getFuelPrice } = require('./fetcher.js');
const fs = require('fs');
const path = require('path');
const { generateXiaohongshuContent } = require('./xiaohongshu.js');

async function updateMultiPageWiki() {
  console.log("⚙️ 多網頁面核心啟動：開始分流採集...");

  // 1. 在這裡定義變數，確保整個函數都能使用
  const updateTime = `*⏰ 訊號最終總更新：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
  
  // 2. 進行並行採集
  // 這裡假設你有這些函數，若還沒完成，請用對應模組替換
  const [fuelContent] = await Promise.all([
    getFuelPrice().catch(err => `⚠️ 油價資訊暫時無法讀取`),
    generateXiaohongshuContent("大馬油價", "RON95 價格為 RM 2.05").catch(err => "AI 休息中")
  ]);

  // 3. 確保變數能在這裡被正確讀取
  let homeContent = `## 🇲🇾 大馬綜合情報導覽總部\n\n${updateTime}\n\n`;
  homeContent += `- ⛽ [點我查看：最新汽車油價](Petrol-Price)\n`;
  homeContent += `\n${fuelContent}`;
  homeContent += `### 💡 AI 生成的小紅書貼文\n${aiPost}`;

  console.log("✅ 變數定義成功，準備進行 Wiki 同步...");
  
  // 這裡接上你的 GitHub 推送邏輯...
  console.log("🎉 系統模擬執行完畢！");
}

updateMultiPageWiki();
