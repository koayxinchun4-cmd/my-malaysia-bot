// fetcher.js
const axios = require('axios');
const cheerio = require('cheerio'); // 因為爬油價需要用到網頁解析工具

// 🛠️ 這裡等一下要放你剪下來的油價函數
async function getFuelPrice() {
  // 先空著，等一下從 index.js 剪過來
}

// ⚠️ 關鍵：把工具導出，別人才拿得到！
module.exports = { getFuelPrice };
