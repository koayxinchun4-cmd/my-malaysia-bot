require('dotenv').config();
const { generateXiaohongshuContent } = require('./xiaohongshu.js');

async function updateMultiPageWiki() {
  console.log("Core starting...");
  
  let fuelContent = "RON95: RM 2.05"; // 假設的油價資料
  let aiPost;

  try {
    // 呼叫 AI 函數
    aiPost = await generateXiaohongshuContent("大馬油價", fuelContent);
  } catch (err) {
    console.error("Fetch Error:", err);
    aiPost = "⚠️ AI 貼文生成失敗";
  }

  // 確保 aiPost 就算失敗了也有值，絕對不觸發 ReferenceError
  let homeContent = `## 🇲🇾 大馬綜合情報導覽總部\n\n`;
  homeContent += `### 💡 AI 生成的小紅書貼文\n${aiPost}`;
  
  console.log("\n====== 生成結果 ======");
  console.log(homeContent);
}

updateMultiPageWiki();
