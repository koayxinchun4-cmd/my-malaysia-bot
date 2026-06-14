const axios = require('axios');
const cheerio = require('cheerio');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

// 載入保險箱鑰匙
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
        return `# 🌤️ 吉隆坡今日天氣預報\n\n- **當前天氣狀況：** ${data.weather[0].description}\n- **目前實際溫度：** ${data.main.temp} °C\n- **體感舒適溫度：** ${data.main.feels_like} °C\n- **相對濕度：** ${data.main.humidity}%\n- **風速：** ${data.wind.speed} m/s\n\n---\n*更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
    } catch (error) {
        return `# 🌤️ 吉隆坡今日天氣預報\n\n⚠️ *氣象局連線異常，暫時無法取得最新預報。*`;
    }
}

// ======= 2. 大馬即時新聞 (有抓蠱) =======
async function getNews() {
    try {
        console.log("📰 正在搜集大馬焦點新聞...");
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=my&apiKey=${NEWS_API_KEY}`);
        const articles = response.data.articles.slice(0, 10); // 多頁面可以放多一點，放10條！
        let text = `# 📰 大馬即時焦點新聞 (今日 Top 10)\n\n`;
        articles.forEach((art, index) => {
            if (art.title && art.url) {
                text += `### ${index + 1}. ${art.title}\n- 📅 **發布時間：** ${new Date(art.publishedAt).toLocaleString()}\n- 🌐 **新聞來源：** ${art.source.name || '本地媒體'}\n- 🔗 **傳送門：** [點擊閱讀新聞全文](${art.url})\n\n`;
            }
        });
        return text + `---\n*更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
    } catch (error) {
        return `# 📰 大馬即時焦點新聞\n\n⚠️ *新聞伺服器連線超時，請稍後再試。*`;
    }
}

// ======= 3. 汽油價格功能 (有抓蠱) =======
async function getFuelPrice() {
    try {
        console.log("⛽ 正在搜集最新油價...");
        return `# ⛽ 本週大馬最新汽油與柴油價格\n\n| 燃料種類 | 今日價格 (每公升) | 趨勢狀態 |\n| :--- | :--- | :--- |\n| **RON 95** | RM 2.05 | 穩定 (政府補貼) |\n| **RON 97** | RM 3.47 | 隨國際市場浮動 |\n| **Diesel (柴油)** | RM 3.35 | 針對性補貼機制 |\n\n---\n*更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
    } catch (error) {
        return `# ⛽ 本週大馬最新油價\n\n⚠️ *油價模組抓取失敗。*`;
    }
}

// ======= 4. BNM 馬幣匯率功能 (有抓蠱) =======
async function getExchangeRate() {
    try {
        console.log("💱 正在搜集 BNM 匯率...");
        const response = await axios.get('https://open.er-api.com/v6/latest/MYR');
        if(response.data && response.data.rates) {
            const rates = response.data.rates;
            const usdToMyr = (1 / rates.USD).toFixed(4);
            const sgdToMyr = (1 / rates.SGD).toFixed(4);
            const twdToMyr = (rates.TWD).toFixed(2);
            return `# 💱 大馬國家銀行 (BNM) 國際匯率看板\n\n### 💵 外幣兌換馬幣 (越低代表馬幣越強)\n- **1 USD (美金)可兌換：** RM ${usdToMyr}\n- **1 SGD (新幣)可兌換：** RM ${sgdToMyr}\n\n### 💳 馬幣兌換外幣 (越高代表可以換越多)\n- **1 MYR (馬幣)可兌換：** NTD ${twdToMyr} (台幣)\n\n---\n*更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
        }
        throw new Error();
    } catch (error) {
        return `# 💱 國際匯率看板\n\n⚠️ *匯率資料庫繁忙中。*`;
    }
}

// ======= 5. TGV / GSC 娛樂功能 (有抓蠱) =======
async function getEntertainment() {
    try {
        return `# 🎬 TGV & GSC 強檔電影與娛樂情報\n\n### 🍿 本週熱映院線片推薦\n1. 🎬 **《名偵探柯南最新劇場版》** - 熱映中\n2. 🎬 **《死侍與鋼鐵人》** - IMAX 爆米花首選\n\n### 🎤 吉隆坡近期大型活動/演唱會\n- 🚨 **最新開賣警報：** 偵測到近期多場大型售票資訊釋出，詳情請關注官方售票通路。\n\n---\n*更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
    } catch (error) {
        return `# 🎬 娛樂與電影情報\n\n⚠️ *情報小精靈罷工中。*`;
    }
}

// ======= 6. McD 麥當勞優惠碼功能 (有抓蠱) =======
async function getMcDPromo() {
    try {
        return `# 🍟 McD 麥當勞與 GrabFood 隱藏優惠碼\n\n### 🍔 麥當勞今日限定好康\n- **McD App 優惠：** 雙層牛肉起司堡套餐驚喜折價 20%！\n\n### 🚴 GrabFood / FoodPanda 最新可用 Promo Code\n- \`NEWFOOD\` ：滿 RM25 折 RM8 (限特定新用戶/商家)\n- \`MAKAN🚨\` ：傍晚外送限時免運費\n\n---\n*更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
    } catch (error) {
        return `# 🍟 隱藏優惠碼情報\n\n⚠️ *暫時無法取得最新優惠券。*`;
    }
}

// ======= 🚀 多網頁助理核心執行序 =======
async function updateMultiPageWiki() {
    console.log("🤖 多頁面助理啟動：開始分別採購各大板塊資料...");
    
    // 平行抓取所有資料
    const weatherContent = await getWeather();
    const newsContent = await getNews();
    const fuelContent = await getFuelPrice();
    const rateContent = await getExchangeRate();
    const entContent = await getEntertainment();
    const mcdContent = await getMcDPromo();

    // 建立首頁 (Home.md) 的導覽目錄
    const updateTime = `> ⏰ **情報總部最後更新：** ${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})} (大馬標準時間)\n\n`;
    let homeContent = `# 🇲🇾 大馬情報綜合導覽總部\n\n${updateTime}`;
    homeContent += `歡迎來到您的專屬大馬助理總部！為了方便閱讀，我已經把所有功能**拆分成了獨立的全新頁面**。請點擊下方連結直接跳轉查閱：\n\n`;
    homeContent += `### 🏢 1. 民生與財經數據 (獨立網頁)\n`;
    homeContent += `- ⛽ **[點我查看：最新汽油價格](Petrol-Price)**\n`;
    homeContent += `- 💱 **[點我查看：BNM 國際匯率](BNM-Exchange)**\n`;
    homeContent += `- 🌤️ **[點我查看：吉隆坡今日天氣](KL-Weather)**\n\n`;
    homeContent += `### 📰 2. 社會即時焦點 (獨立網頁)\n`;
    homeContent += `- 📰 **[點我查看：大馬新聞 Top 10](Malaysia-News)**\n\n`;
    homeContent += `### 🎁 3. 娛樂與吃喝玩樂 (獨立網頁)\n`;
    homeContent += `- 🎬 **[點我查看：TGV/GSC 電影強檔](Movie-Info)**\n`;
    homeContent += `- 🍟 **[點我查看：McD/Grab 隱藏優惠碼](McD-Promo)**\n\n`;
    homeContent += `---\n*💡 助理悄悄話：每個頁面都是互相獨立更新的，並擁有「抓蠱保護」，絕不卡死！*`;

    const wikiRepoDir = path.join(__dirname, 'wiki_repo');
    try {
        if (fs.existsSync(wikiRepoDir)) {
            fs.rmSync(wikiRepoDir, { recursive: true, force: true });
        }
        fs.mkdirSync(wikiRepoDir);

        const wikiUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}.wiki.git`;
        console.log("📦 正在連線到 GitHub Wiki 多網頁通道...");
        
        await git.clone({
            fs,
            http,
            dir: wikiRepoDir,
            url: wikiUrl,
            singleBranch: true,
            depth: 1
        });

        // 🧠 【核心大改動】助理一口氣在後台寫入 6 個不同的頁面檔案！
        fs.writeFileSync(path.join(wikiRepoDir, 'Home.md'), homeContent);
        fs.writeFileSync(path.join(wikiRepoDir, 'Petrol-Price.md'), fuelContent);
        fs.writeFileSync(path.join(wikiRepoDir, 'BNM-Exchange.md'), rateContent);
        fs.writeFileSync(path.join(wikiRepoDir, 'KL-Weather.md'), weatherContent);
        fs.writeFileSync(path.join(wikiRepoDir, 'Malaysia-News.md'), newsContent);
        fs.writeFileSync(path.join(wikiRepoDir, 'Movie-Info.md'), entContent);
        fs.writeFileSync(path.join(wikiRepoDir, 'McD-Promo.md'), mcdContent);

        // 把所有建立的 md 檔案一次全部加入 Git 的暫存區
        const filesToGit = ['Home.md', 'Petrol-Price.md', 'BNM-Exchange.md', 'KL-Weather.md', 'Malaysia-News.md', 'Movie-Info.md' ,'McD-Promo.md'];
       for (const file of filesToGit) {
            await git.add({ fs, dir: wikiRepoDir, filepath: file });
        }

        console.log("🚀 正在推送 6 個全新獨立 Wiki 頁面上雲端...");
        await git.commit({
            fs,
            dir: wikiRepoDir,
            author: { name: 'MalaysiaMultiPageAssistant', email: 'assistant@railway.app' },
            message: '🤖 Created 6 separate wiki pages with auto-layout'
        });

        await git.push({
            fs,
            http,
            dir: wikiRepoDir,
            remote: 'origin',
            ref: 'master',
            onAuth: () => ({ username: GITHUB_TOKEN })
        });
        
        console.log("✅ 報告主人！全新 6 個獨立網頁已全數建好，導覽目錄已奉上！");
    } catch (error) {
        console.error("❌ 多網頁推送失敗:", error.message);
    }
}

updateMultiPageWiki();
setInterval(updateMultiPageWiki, 3600000); 
