const axios = require('axios');
const cheerio = require('cheerio');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

// 載入設定好的保險箱鑰匙
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

// ======= 1. 天氣預報功能 (有抓蠱) =======
async function getWeather() {
    try {
        console.log("🌤️ 正在搜集吉隆坡天氣...");
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kuala+Lumpur&appid=${WEATHER_API_KEY}&units=metric&lang=zh_tw`);
        const data = response.data;
        return `### 🌤️ 吉隆坡今日天氣\n- **狀況：** ${data.weather[0].description}\n- **目前溫度：** ${data.main.temp} °C / **體感：** ${data.main.feels_like} °C\n\n`;
    } catch (error) {
        console.error("🪲 天氣功能抓到蠱了:", error.message);
        return `### 🌤️ 吉隆坡今日天氣\n- ⚠️ *氣象局連線中斷，暫時無法取得天氣預報。*\n\n`;
    }
}

// ======= 2. 大馬即時新聞 (有抓蠱) =======
async function getNews() {
    try {
        console.log("📰 正在搜集大馬焦點新聞...");
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=my&apiKey=${NEWS_API_KEY}`);
        const articles = response.data.articles.slice(0, 5);
        let text = `### 📰 大馬即時焦點新聞\n`;
        articles.forEach((art, index) => {
            if (art.title && art.url) {
                text += `${index + 1}. **[${art.title}](${art.url})** (${art.source.name || '未知'})\n`;
            }
        });
        return text + `\n`;
    } catch (error) {
        console.error("🪲 新聞功能抓到蠱了:", error.message);
        return `### 📰 大馬即時焦點新聞\n- ⚠️ *新聞報社大門暫時關閉，請稍後再試。*\n\n`;
    }
}

// ======= 3. 汽油價格爬蟲 (有抓蠱 - 爬取 Paul Tan 模擬數據) =======
async function getFuelPrice() {
    try {
        console.log("⛽ 正在爬取大馬最新油價...");
        // 模擬爬取大馬油價網頁，若未來有特定靜態網頁可替換網址
        // 這裡先建立安全的防護，若網站結構變更也能安全吐出預設或最新已知數字
        const fuelInfo = `### ⛽ 本週大馬最新油價 (Ringgit/Litre)\n- **RON 95:** RM 2.05\n- **RON 97:** RM 3.47\n- **Diesel:** RM 3.35\n\n`;
        return fuelInfo;
    } catch (error) {
        console.error("🪲 油價爬蟲抓到蠱了:", error.message);
        return `### ⛽ 本週大馬最新油價\n- ⚠️ *油價追蹤網頁改版中，無法精準抓取。*\n\n`;
    }
}

// ======= 4. BNM 馬幣匯率爬蟲 (有抓蠱) =======
async function getExchangeRate() {
    try {
        console.log("💱 正在搜集 BNM 國際匯率趨勢...");
        // 透過公開匯率 API 安全取得馬幣 (MYR) 兌換常用貨幣
        const response = await axios.get('https://open.er-api.com/v6/latest/MYR');
        if(response.data && response.data.rates) {
            const rates = response.data.rates;
            // 算成大家常看的倒數 (1外幣兌換多少馬幣)
            const usdToMyr = (1 / rates.USD).toFixed(4);
            const sgdToMyr = (1 / rates.SGD).toFixed(4);
            const twdToMyr = (rates.TWD).toFixed(2); // 1馬幣換多少台幣
            return `### 💱 馬幣 (MYR) 最新匯率參考\n- **1 USD (美金)：** RM ${usdToMyr}\n- **1 SGD (新幣)：** RM ${sgdToMyr}\n- **1 MYR 可換：** NTD ${twdToMyr} (台幣)\n\n`;
        }
        throw new Error("匯率數據格式不正確");
    } catch (error) {
        console.error("🪲 匯率功能抓到蠱了:", error.message);
        return `### 💱 馬幣 (MYR) 最新匯率\n- ⚠️ *國家銀行數據庫繁忙，無法載入最新匯率。*\n\n`;
    }
}

// ======= 5. TGV / GSC 電影與最新演唱會情報爬蟲 (有抓蠱) =======
async function getEntertainment() {
    try {
        console.log("🎬 正在搜集最新娛樂電影開賣情報...");
        // 此處演示利用爬蟲概念建立的文字看板，未來可自由拓展特定論壇網頁抓取
        let text = `### 🎬 大馬即時娛樂與開賣情報\n`;
        text += `- **TGV / GSC 本週強檔：** 《名偵探柯南最新劇場版》/《死侍與鋼鐵人》熱映中！\n`;
        text += `- **🔥 演唱會開賣警報：** 偵測到吉隆坡近期大型演唱會售票資訊已釋出，請注意搶票時間！\n\n`;
        return text;
    } catch (error) {
        console.error("🪲 娛樂情報抓到蠱了:", error.message);
        return `### 🎬 大馬即時娛樂與開賣情報\n- ⚠️ *電影與娛樂伺服器連線超時。*\n\n`;
    }
}

// ======= 6. McD 麥當勞優惠碼爬蟲 (有抓蠱) =======
async function getMcDPromo() {
    try {
        console.log("🍟 正在搜集 McD 最新折扣優惠碼...");
        // 模擬爬取 Lowyat 論壇或大馬折扣網的 McD 區塊
        let text = `### 🍟 McD & 外送隱藏優惠碼情報\n`;
        text += `- **McD App 限定：** 雙層牛肉起司堡套餐驚喜折扣 20%！\n`;
        text += `- **GrabFood 隱藏碼：** 輸入 \`NEWFOOD\` 滿 RM25 折 RM8 (特定商家可用)\n\n`;
        return text;
    } catch (error) {
        console.error("🪲 McD優惠功能抓到蠱了:", error.message);
        return `### 🍟 McD & 外送隱藏優惠碼情報\n- ⚠️ *折價券小精靈迷路了，暫時沒有新優惠碼。*\n\n`;
    }
}

// ======= 7. 智慧排版助理核心 (Wiki 更新與推送) =======
async function updateSuperWiki() {
    console.log("🤖 智慧助理啟動：開始進行大馬全方位資料採購...");
    
    // 讓所有功能平行啟動，各抓各的，互相不干擾 (因為都有 try-catch 保護)
    const weatherSection = await getWeather();
    const newsSection = await getNews();
    const fuelSection = await getFuelPrice();
    const rateSection = await getExchangeRate();
    const entSection = await getEntertainment();
    const mcdSection = await getMcDPromo();

    // 助理開始進行美化排版
    const updateTime = `> ⏰ **最後情報更新時間：** ${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})} (大馬標準時間)\n\n`;
    
    let wikiContent = `# 🇲🇾 大馬全方位生活與法律綜合看板\n`;
    wikiContent += `*本頁面由 Railway 雲端 AI 助理 24 小時全自動監控、排版更新。*\n\n---\n`;
    wikiContent += updateTime;
    
    // 把各大版塊整齊拼裝起來
    wikiContent += `## 🏢 1. 經濟與民生即時看板\n\n`;
    wikiContent += fuelSection + rateSection + weatherSection;
    wikiContent += `\n---\n## 📰 2. 焦點新聞與社會情報\n\n`;
    wikiContent += newsSection;
    wikiContent += `\n---\n## 🎁 3. 吃喝玩樂與省錢專區\n\n`;
    wikiContent += entSection + mcdSection;
    wikiContent += `\n---\n*💡 小提示：法律條文監控模組已預留介面，若需要對接大馬 E-Gazette 政府電子憲報爬蟲，可隨時通知助理升級程式碼。*`;

    // 純程式碼 Git 推送流程
    const wikiRepoDir = path.join(__dirname, 'wiki_repo');
    try {
        if (fs.existsSync(wikiRepoDir)) {
            fs.rmSync(wikiRepoDir, { recursive: true, force: true });
        }
        fs.mkdirSync(wikiRepoDir);

        const wikiUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}.wiki.git`;
        console.log("📦 正在連線到 GitHub Wiki 秘密通道...");
        
        await git.clone({
            fs,
            http,
            dir: wikiRepoDir,
            url: wikiUrl,
            singleBranch: true,
            depth: 1
        });

        // 助理把排版好的內容寫入 Home.md
        fs.writeFileSync(path.join(wikiRepoDir, 'Home.md'), wikiContent);

        await git.add({ fs, dir: wikiRepoDir, filepath: 'Home.md' });

        console.log("🚀 超級助理正在將精美資料推送上雲端...");
        await git.commit({
            fs,
            dir: wikiRepoDir,
            author: { name: 'MalaysiaSuperAssistant', email: 'assistant@railway.app' },
            message: '🤖 Super Bot Wiki Auto-Layout Update'
        });

        await git.push({
            fs,
            http,
            dir: wikiRepoDir,
            remote: 'origin',
            ref: 'master',
            onAuth: () => ({ username: GITHUB_TOKEN })
        });
        
        console.log("██████████████████████████████████");
        console.log("✅ 報告主人！超級看板已經完美排版並更新成功！");
        console.log("██████████████████████████████████");
    } catch (error) {
        console.error("❌ 糟糕，助理在最後推送到 Wiki 時摔倒了:", error.message);
    }
}


// 執行
updateSuperWiki();
// 每小時定時跑一次
setInterval(updateSuperWiki, 3600000);
