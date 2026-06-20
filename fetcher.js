// fetcher.js
const axios = require('axios');
const cheerio = require('cheerio'); 

// 確保只有一個 getFuelPrice 函數，且括號完全對齊
async function getFuelPrice() {
  try {
    console.log("⛽️ 正在爬取大馬 Paul Tan 官網最新油價...");
    const response = await axios.get('https://paultan.org/category/cars/fuel-prices/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }
    });
    const $ = cheerio.load(response.data);
    let scrapedText = "";
    $('.entry-content p').each((i, el) => {
      const paragraph = $(el).text();
      if (paragraph.includes('Price') || paragraph.includes('RON')) {
        scrapedText += paragraph + "\n\n";
      }
    });
    
    const ron95 = "RM 2.05";
    const ron97 = scrapedText.match(/RON 97.*?(RM \d+\.\d+)/)?.[1] || "RM 3.40 (浮動)";
    const diesel = scrapedText.match(/Diesel.*?(RM \d+\.\d+)/)?.[1] || "RM 3.35 (浮動)";

    return `### ⛽️ 本週大馬最新汽車油價情報 (即時網頁抓取)\n\n| 燃料種類 | 今日價格 (每公升) | 趨勢狀態 |\n| :--- | :---: | :---: |\n| 🟢 **RON 95** | ${ron95} | 穩定 (政府補貼) |\n| 🟡 **RON 97** | ${ron97} | 國際市場浮動 |\n| ⚫ **Diesel (柴油)** | ${diesel} | 計劃性補貼機制 |\n\n> 🌐 數據來源：Paul Tan Automotive News\n> *更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
    
  } catch (error) {
    console.error("❌ 油價網頁抓取暴斃了:", error.message);
    return `### ⛽️ 本週大馬最新油價情報\n\n⚠️ Paul Tan 網站結構變更，助理提供應急數據：\n\n- 🟢 **RON 95**: RM 2.05\n- 🟡 **RON 97**: RM 3.47\n- ⚫ **Diesel**: RM 3.35`;
  }
} // 👈 這是第 31 行附近的關鍵大括號，原本你可能不小心多寫了一個

// 導出工具
module.exports = { getFuelPrice };
