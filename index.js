const { generateXiaohongshuContent } = require('./xiaohongshu.js');
const { fetchFuelPrices } = require('./fetcher.js'); // 1. 引入爬蟲模組

async function updateMultiPageWiki() {
  console.log("Core starting...");
  
  // 2. 自動從網路上爬取最新的真實油價數據
  let fuelContent = await fetchFuelPrices();
  
  let aiPost;

  try {
    // 3. 把新鮮抓到的真實油價數據，直接丟給 AI 去發想文案
    aiPost = await generateXiaohongshuContent("大馬本週最新油價情報", fuelContent);
  } catch (err) {
    console.error("Fetch Error:", err);
    aiPost = "⚠️ AI 貼文生成失敗";
  }

  let homeContent = `## 🇲🇾 大馬綜合情報導覽總部\n\n`;
  homeContent += `### 💡 AI 生成的小紅書貼文\n${aiPost}`;
  
  console.log("\n====== 100% 全自動生成結果 ======");
  console.log(homeContent);
}

updateMultiPageWiki();
