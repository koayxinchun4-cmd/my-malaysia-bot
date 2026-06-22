require('dotenv').config();
console.log("偵測到的 API KEY:", process.env.GEMINI_API_KEY ? "已找到 (長度: " + process.env.GEMINI_API_KEY.length + ")" : "找不到！");
