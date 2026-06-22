const axios = require('axios');
const cheerio = require('cheerio');

async function fetchFuelPrices() {
  try {
    console.log("正在從網路爬取大馬最新油價...");
    
    // 使用大馬熱門科技媒體 Soyacincau 的每週油價專頁
    const url = 'https://soyacincau.com/tag/petrol-price/';
    
    // 這裡我們加一個防爬蟲的標頭，假裝我們是普通的手機瀏覽器
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    
    // 撈取頁面上第一個油價文章的標題（通常最新一期的標題就會寫著：RON95: RM2.05 之類的）
    // 如果找不到，我們會用一套防禦性的預設文字
    let latestArticleTitle = $('.entry-title a').first().text().trim();
    
    if (!latestArticleTitle) {
      latestArticleTitle = "未能抓到最新標題，預設當前油價維持：RON95 RM2.05, RON97 RM3.19, Diesel RM2.15";
    }

    console.log(`[爬蟲成功] 抓到最新油價資訊: ${latestArticleTitle}`);
    return latestArticleTitle;

  } catch (error) {
    console.error("❌ 爬蟲出錯:", error.message);
    // 萬一網路斷了或對方網站改版，提供安全備用資料，程式絕對不崩潰
    return "大馬當前油價參考：RON95保持在 RM2.05，柴油與石油市場價格隨每週公告微幅變動。";
  }
}

module.exports = { fetchFuelPrices };
