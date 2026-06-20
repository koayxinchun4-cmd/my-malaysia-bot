// xiaohongshu.js
const axios = require('axios');

async function generateXiaohongshuContent(newsContent) {
  console.log("🤖 小紅書 AI Agent 正在連線 Gemini 大腦...");

  // 1. 從 Railway 的安全後台讀取你剛剛設定的鑰匙 (這樣就不會洩漏在 Code 裡了！)
  const apiKey = process.env.GEMINI_API_KEY; 
  
  if (!apiKey) {
    console.error("❌ 找不到 GEMINI_API_KEY，請檢查 Railway 的 Variables 設定！");
    return "API Key 缺失";
  }

  // 2. 設定 Google Gemini 的網址 (就是主人你挖到的那串 URL)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;


  // 3. 設定你的爆款小紅書提示詞 (Prompt)
  const prompt = `
    你現在是一個精通馬來西亞人日常與大馬趨勢的小紅書爆款文案專家。
    請根據以下抓取到的原始新聞素材，寫一篇吸引人的小紅書風格文案：
    
    【原始素材】：${newsContent}
    
    【寫作要求】：
    1. 標題必須極度吸睛，多用「家人們誰懂啊」、「大馬人注意」、「直接封神」等網感詞。
    2. 內文要活潑，必須穿插大量的 Emoji 符號（✨, 🔥, 😱, 🇲🇾）。
    3. 段落要短，多用驚嘆號，並帶有大馬當地的語氣。
    4. 請保留素材中的新聞超連結，並融合在文案中。
    5. 結尾必須自動附帶熱門標籤，例如：#馬來西亞 #大馬日常 #小紅書爆款。
  `;

  try {
    // 4. 用 axios 把資料發送給 Google (對應你的 -d '{ "contents": ... }')
    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            { text: prompt } // 把我們設計好的爆款提示詞餵給 AI
          ]
        }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' } // 對應你的 -H 'Content-Type...'
    });

    // 5. 解析 Gemini 回傳的精美文案
    const aiText = response.data.candidates[0].content.parts[0].text;
    return aiText;

  } catch (error) {
    console.error("❌ Gemini 大腦連線失敗:", error.response?.data || error.message);
    return "⚠️ AI 大腦暫時斷線，請稍後再試。";
  }
}

module.exports = { generateXiaohongshuContent };
