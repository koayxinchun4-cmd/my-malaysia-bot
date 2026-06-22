const { GoogleGenerativeAI } = require("@google/generative-ai");

// 既然是 Private 專案，直接寫死在這裡最安全、最聽話
const apiKey = "AQ.Ab8RN6JKcy970f10OaNM4sjekadW05Gd6boIz5oi6KOp9av4hw";
const genAI = new GoogleGenerativeAI(apiKey);

async function generateXiaohongshuContent(topic, content) {
  try {
    console.log("AI thinking...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Please write a Xiaohongshu post about ${topic}. Context: ${content}. Use emojis, light tone, local Malaysian style.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Error:", error.message);
    return "⚠️ AI 生成失敗";
  }
}

module.exports = { generateXiaohongshuContent };
