const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 這些密鑰等一下會安全地設定在 Railway 的環境變數裡，不用擔心外洩
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER; // 你的 GitHub 帳號名
const REPO_NAME = process.env.REPO_NAME;   // 你的儲存庫名字

// 1. 抓取大馬今日天氣 (以吉隆坡為例)
async function getWeather() {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kuala+Lumpur&appid=${WEATHER_API_KEY}&units=metric&lang=zh_tw`);
        const data = response.data;
        return `## 🌤️ 大馬今日天氣 (Kuala Lumpur)\n- **天氣狀況：** ${data.weather[0].description}\n- **目前溫度：** ${data.main.temp} °C\n- **體感溫度：** ${data.main.feels_like} °C\n\n`;
    } catch (error) {
        return `## 🌤️ 大馬今日天氣\n無法取得最新天氣資料。\n\n`;
    }
}

// 2. 抓取大馬即時新聞
async function getNews() {
    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=my&apiKey=${NEWS_API_KEY}`);
        const articles = response.data.articles.slice(0, 5); // 只取前 5 條焦點新聞
        let newsMarkdown = `## 📰 大馬即時焦點新聞\n`;
        articles.forEach((art, index) => {
            if (art.title && art.url) {
                newsMarkdown += `${index + 1}. **[${art.title}](${art.url})**\n   *來源：${art.source.name || '未知'} | 發布時間：${new Date(art.publishedAt).toLocaleString()}*\n\n`;
            }
        });
        return newsMarkdown;
    } catch (error) {
        return `## 📰 大馬即時焦點新聞\n無法取得最新新聞資料。\n\n`;
    }
}

// 3. 使用 Linux Git 指令將資料推送到 GitHub Wiki
async function updateWiki() {
    console.log("🤖 機器人啟動：正在為您蒐集大馬最新資訊...");
    
    const weatherText = await getWeather();
    const newsText = await getNews();
    const updateTime = `*最後更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})} (大馬時間)*\n\n`;
    
    // 組裝 Wiki 的 Markdown 內文
    const wikiContent = `# 🇲🇾 大馬即時資訊看板 (Wiki 自動更新)\n${updateTime}${weatherText}${newsText}--- \n*本頁面由 Railway 雲端機器人自動維護，關閉手機亦會定時更新。*`;

    const wikiRepoDir = path.join(__dirname, 'wiki_repo');

    try {
        // 如果舊的暫存資料夾存在，先刪除它
        if (fs.existsSync(wikiRepoDir)) {
            fs.rmSync(wikiRepoDir, { recursive: true, force: true });
        }

        // 構造帶有 Token 的安全 Wiki Git 網址
        const wikiUrl = `https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.wiki.git`;

        console.log("📦 正在連線到 GitHub Wiki...");
        // 利用 Linux 指令把 Wiki 下載（Clone）到 Railway 伺服器內
        execSync(`git clone ${wikiUrl} ${wikiRepoDir}`);

        // 寫入 Wiki 的首頁檔案 (Home.md)
        fs.writeFileSync(path.join(wikiRepoDir, 'Home.md'), wikiContent);

        // 設定 Linux Git 的機器人身份（讓 GitHub 知道是誰更新的）
        execSync(`git config --global user.email "bot@railway.app"`);
        execSync(`git config --global user.name "MalaysiaInfoBot"`);

        // 進入資料夾，提交並推送到 GitHub Wiki
        console.log("🚀 正在將最新新聞推送到 GitHub Wiki...");
        execSync(`cd ${wikiRepoDir} && git add Home.md && git commit -m "🤖 Auto-updated news & weather" && git push origin master`);
        
        console.log("✅ Wiki 更新成功！請打開你的 GitHub Wiki 查看成果。");
    } catch (error) {
        console.error("❌ 更新 Wiki 時發生錯誤:", error.message);
    }
}

// 執行第一次
updateWiki();

// 設定每 1 小時 (3600000 毫秒) 自動重新執行一次
setInterval(updateWiki, 3600000);
