const axios = require('axios');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

async function getWeather() {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kuala+Lumpur&appid=${WEATHER_API_KEY}&units=metric&lang=zh_tw`);
        const data = response.data;
        return `## 🌤️ 大馬今日天氣 (Kuala Lumpur)\n- **天氣狀況：** ${data.weather[0].description}\n- **目前溫度：** ${data.main.temp} °C\n- **體感溫度：** ${data.main.feels_like} °C\n\n`;
    } catch (error) {
        return `## 🌤️ 大馬今日天氣\n無法取得最新天氣資料。\n\n`;
    }
}

async function getNews() {
    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=my&apiKey=${NEWS_API_KEY}`);
        const articles = response.data.articles.slice(0, 5);
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

async function updateWiki() {
    console.log("🤖 機器人啟動：正在為您蒐集大馬最新資訊...");
    
    const weatherText = await getWeather();
    const newsText = await getNews();
    const updateTime = `*最後更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})} (大馬時間)*\n\n`;
    const wikiContent = `# 🇲🇾 大馬即時資訊看板 (Wiki 自動更新)\n${updateTime}${weatherText}${newsText}--- \n*本頁面由 Railway 雲端機器人自動維護，關閉手機亦會定時更新。*`;

    const wikiRepoDir = path.join(__dirname, 'wiki_repo');

    try {
        if (fs.existsSync(wikiRepoDir)) {
            fs.rmSync(wikiRepoDir, { recursive: true, force: true });
        }
        fs.mkdirSync(wikiRepoDir);

        const wikiUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}.wiki.git`;

        console.log("📦 正在連線到 GitHub Wiki (純程式碼模式)...");
        await git.clone({
            fs,
            http,
            dir: wikiRepoDir,
            url: wikiUrl,
            singleBranch: true,
            depth: 1
        });

        fs.writeFileSync(path.join(wikiRepoDir, 'Home.md'), wikiContent);

        await git.add({ fs, dir: wikiRepoDir, filepath: 'Home.md' });

        console.log("🚀 正在將最新新聞推送到 GitHub Wiki...");
        await git.commit({
            fs,
            dir: wikiRepoDir,
            author: { name: 'MalaysiaInfoBot', email: 'bot@railway.app' },
            message: '🤖 Auto-updated news & weather'
        });

        await git.push({
            fs,
            http,
            dir: wikiRepoDir,
            remote: 'origin',
            ref: 'master',
            onAuth: () => ({ username: GITHUB_TOKEN })
        });
        
        console.log("✅ Wiki 更新成功！請打開你的 GitHub Wiki 查看成果。");
    } catch (error) {
        console.error("❌ 更新 Wiki 時發生錯誤:", error.message);
    }
}

updateWiki();
setInterval(updateWiki, 3600000);
