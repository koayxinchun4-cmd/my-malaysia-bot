const { GoogleGenerativeAI } = require("@google/generative-ai");

// 這是你的 API Key，請把下方的 YOUR_API_KEY 替換成你從 Google AI Studio 拿到的那一串
const genAI = new GoogleGenerativeAI(process.env.GERMINI_API);

async function generateXiaohongshuContent(topic, content) {
  try {
    console.log(`🧠 AI 正在思考關於 ${topic} 的爆款文案...`);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      請根據以下「${topic}」的情報，寫一篇適合小紅書分享的貼文。
      要求：
      1. 使用 Emoji 增加趣味感。
      2. 重點突出，方便讀者快速閱讀。
      3. 語氣輕快，像大馬在地生活博主。
      4. 情報內容：${content}
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("❌ AI 生成失敗:", error);
    return `⚠️ 關於 ${topic} 的文案生成遇到小阻礙，但情報內容依然有效。`;
  }
}

module.exports = { generateXiaohongshuContent };
