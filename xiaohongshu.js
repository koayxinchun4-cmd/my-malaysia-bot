// 徹底拋棄不編寫死金鑰的安全直連版！

async function generateXiaohongshuContent(topic, content) {
  try {
    console.log("AI thinking (Direct HTTPS Fetch Mode)...");
    
    // ⭕️ 從環境變數讀取，並用 .trim() 確保絕對沒有被 Node.js 讀取時夾帶隱形雜質！
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) {
      throw new Error("找不到 GEMINI_API_KEY 環境變數，請確認是否有設定！");
    }
    const apiKey = rawKey.trim();
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `你是一個精通馬來西亞在地生活的小紅書爆款文案專家。
請根據以下最新抓取到的主題和數據，寫一篇吸引人、多用 Emoji、排版精美的小紅書貼文。
主題：${topic}
最新數據：${content}
請包含吸引人的標題、正文、熱門標籤（如 #馬來西亞 #大馬油價 #penang 等）。`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Google API 回報錯誤 [${response.status}]: ${JSON.stringify(data)}`);
    }

    return data.candidates[0].content.parts[0].text;
    
  } catch (err) {
    console.error("Gemini 直連核心出錯:", err.message);
    throw err;
  }
}

module.exports = { generateXiaohongshuContent };
