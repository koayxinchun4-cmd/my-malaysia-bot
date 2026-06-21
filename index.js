const axios = require('axios');
const cheerio = require('cheerio');
const { load: loadYaml } = require('js-yaml');

const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { generateXiaohongshuContent } = require('./xiaohongshu.js');
const { getFuelPrice } = require('./fetcher.js'); // 👈 從新家把油價工具引進門！

// 載入伺服器環境變數
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

// ======== 1. 天氣預報功能 ========
async function getWeather() {
  try {
    console.log("☀️ 正在搜集吉隆坡天氣...");
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kuala+Lumpur&appid=${WEATHER_API_KEY}&units=metric&lang=zh_tw`);
    const data = response.data;
    return `### ☀️ 吉隆坡今日天氣情報\n\n- **當前天氣狀況**：${data.weather[0].description}\n- **目前實際溫度**：${data.main.temp} °C\n- **體感溫度**：${data.main.feels_like} °C\n- **空氣濕度**：${data.main.humidity}%\n- **風速**：${data.wind.speed} m/s\n\n> *更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
  } catch (error) {
    return `### ☀️ 吉隆坡今日天氣情報\n\n⚠️ 天氣數據傳輸異常，暫時無法取得最新預報。`;
  }
}

// ======== 2. 大馬即時新聞 ========
async function getNews() {
  try {
    console.log("📰 正在搜集大馬焦點新聞...");
    const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=my&apiKey=${NEWS_API_KEY}`);
    const articles = response.data.articles.slice(0, 10);
    let text = `### 📰 大馬即時焦點新聞 (今日 Top 10)\n\n`;
    articles.forEach((art, index) => {
      if (art.title && art.url) {
        text += `${index + 1}. **${art.title}**\n   - 🕒 **發布時間**：${new Date(art.publishedAt).toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}\n   - 📰 **新聞來源**：${art.source.name || '本地媒體'}\n   - 🔗 **連結**：[點擊閱讀新聞全文](${art.url})\n\n`;
      }
    });
    return text + `> *更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
  } catch (error) {
    return `### 📰 大馬即時焦點新聞\n\n⚠️ 新聞伺服器連線超時，請稍後再試。`;
  }
}


// ======== 4. BNM 國家銀行匯率功能 ========
async function getExchangeRate() {
  try {
    console.log("💱 正在搜集 BNM 匯率...");
    const response = await axios.get('https://open.er-api.com/v6/latest/MYR');
    if (response.data && response.data.rates) {
      const rates = response.data.rates;
      const usdToMyr = (1 / rates.USD).toFixed(4);
      const sgdToMyr = (1 / rates.SGD).toFixed(4);
      const twdToMyr = (rates.TWD).toFixed(2);

      return `### 💱 大馬國家銀行 (BNM) 國際匯率看板\n\n💵 **外幣兌換馬幣 (越低代表馬幣越強勢)**：\n- **1 USD (美金)** 可兌換：**RM ${usdToMyr}**\n- **1 SGD (新幣)** 可兌換：**RM ${sgdToMyr}**\n\n🇲🇾 **馬幣兌換外幣 (越高代表可以換更多)**：\n- **1 MYR (馬幣)** 可兌換：**NTD $ ${twdToMyr} (台幣)**\n\n> *更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
    }
    throw new Error();
  } catch (error) {
    return `### 💱 國際匯率看板\n\n⚠️ 匯率資料庫更新中。`;
  }
}

// ======== 5. TGV / GSC 映演功能 ========
async function getEntertainment() {
  try {
    console.log("🎬 正在搜集電影院與演藝情報...");
    return `### 🎬 TGV & GSC 強檔電影與映演情報\n\n🔥 **本週熱門強片推薦**：\n1. 🎬 **《名偵探柯南：最新劇場版》** - 熱映中\n2. 🎬 **《死侍與鋼鐵人》** - IMAX 爆米花首選\n\n🎤 **吉隆坡大型活動/演唱會**：\n- 🚨 **最新限時警報**：偵測到近期有多場大型售票演藝演出，排隊網路官方伺服器混亂，請搞好網路關注官方管道。 \n\n> *更新時間：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})}*`;
  } catch (error) {
    return `### 🎬 映演與電影情報\n\n⚠️ 情報小精靈趕工中。`;
  }
}

// ======== 🚀 多網頁全核心執行序 ========
async function updateMultiPageWiki() {
  console.log("⚙️ 多網頁面核心啟動：開始分流採集各大板塊資料...");

  const weatherContent = await getWeather();
  const newsContent = await getNews();
  const fuelContent = await getFuelPrice();
  const rateContent = await getExchangeRate();
  const entContent = await getEntertainment();

  const updateTime = `*⏰ 訊號最終總更新：${new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'})} (大馬標準時間)*\n\n`;
  const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Kuala_Lumpur'}); 
// 💡 這行程式碼會跑出像 "2026-06-17" 這樣超乾淨的日期字串！
  
  let homeContent = `## 🇲🇾 大馬綜合情報導覽總部\n\n${updateTime}`;
  homeContent += `歡迎來到您的專屬大馬助理情報站！為了方便閱讀，我已經把所有功能**拆分成了獨立的全新分頁**。請點擊下方連結直接跳轉主頁：\n\n`;
  homeContent += `- 💰 **1. 民生與理財板塊**\n`;
  homeContent += `  - ⛽ [點我查看：最新汽車油價](Petrol-Price)\n`;
  homeContent += `  - 💱 [點我查看：BNM 國際匯率](BNM-Exchange)\n`;
  homeContent += `  - 🌦️ [點我查看：吉隆坡今日天氣](KL-Weather)\n\n`;
  homeContent += `- 📰 **2. 社會即時焦點**\n`;
  homeContent += `  - 🇲🇾 [點我查看：大馬新聞 Top 10](Malaysia-News)\n\n`;
  //這是小紅書在wiki//
  homeContent += `  - 📕 [點我查看：小紅書爆款文案草稿](Xiaohongshu)\n\n`;
  //（這是為了讓你的 Wiki 首頁多出一個專屬的「小紅書精準備份」點擊連結
  homeContent += `  - 📸 [點我查看：小紅書精準多媒體備份](Xiaohongshu-Backup)\n\n`;

  homeContent += `- 🍔 **3. 娛樂與吃喝玩樂**\n`;
  homeContent += `  - 🎬 [點我查看：TGV/GSC 電影強檔](Movie-Info)\n\n`;
  homeContent += `--- \n> 💡 **防蠱小別註**：每個頁面都是獨立模組化更新的，並備有「自癒系統」，絕不卡死！`;

  const wikiRepoDir = path.join(__dirname, 'wiki_repo');
  try {
    if (fs.existsSync(wikiRepoDir)) {
      fs.rmSync(wikiRepoDir, { recursive: true, force: true });
    }
    fs.mkdirSync(wikiRepoDir);

    const wikiUrl = `https://${REPO_OWNER}:${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.wiki.git`;
    console.log("🔄 正在連線 GitHub Wiki 多網頁通道...");
  
    // 假設我們想用 newsContent 當素材
const xhsDraft = await generateXiaohongshuContent(newsContent);
    // 🚀 發動大老神裝：精準扒光指定的小紅書貼文！
const xhsTargetUrl = "https://www.xiaohongshu.com/explore/665ed5b0000000000d00bb39"; 
    // ↑ 主人隨時可以換成你想抓的網址
const xhsBackupData = await parseXiaohongshu(xhsTargetUrl);
console.log("📸 小紅書多媒體數據已成功扒光儲存！");
console.log("✨ AI 已為主人生成小紅書草稿：", xhsDraft);

    
    await git.clone({
      fs,
      http,
      dir: wikiRepoDir,
      url: wikiUrl,
      singleBranch: true,
      depth: 1
    });

    
    // 🔄「最新 + 歷史備份雙軌制」：
fs.writeFileSync(path.join(wikiRepoDir, 'Home.md'), homeContent);

// 油價：存一份最新、一份歷史
fs.writeFileSync(path.join(wikiRepoDir, 'Petrol-Price.md'), fuelContent);
fs.writeFileSync(path.join(wikiRepoDir, `Petrol-Price-${todayStr}.md`), fuelContent);

// 匯率：存一份最新、一份歷史
fs.writeFileSync(path.join(wikiRepoDir, 'BNM-Exchange.md'), rateContent);
fs.writeFileSync(path.join(wikiRepoDir, `BNM-Exchange-${todayStr}.md`), rateContent);

// 天氣：存一份最新、一份歷史
fs.writeFileSync(path.join(wikiRepoDir, 'KL-Weather.md'), weatherContent);
fs.writeFileSync(path.join(wikiRepoDir, `KL-Weather-${todayStr}.md`), weatherContent);

// 新聞：存一份最新、一份歷史
fs.writeFileSync(path.join(wikiRepoDir, 'Malaysia-News.md'), newsContent);
fs.writeFileSync(path.join(wikiRepoDir, `Malaysia-News-${todayStr}.md`), newsContent);

// 💥小紅書
// 💥 完美大合體：把小紅書文案和今日新聞原文黏在一起
const finalContent = `${xhsDraft}\n\n---\n\n### 🔗 本日爆款文案對應之新聞原文來源：\n\n${newsContent}`;

// 寫入 Wiki，同時存一份最新、一份歷史
fs.writeFileSync(path.join(wikiRepoDir, 'Xiaohongshu.md'), finalContent);
fs.writeFileSync(path.join(wikiRepoDir, `Xiaohongshu-${todayStr}.md`), finalContent);
    // 💥 組裝小紅書高清多媒體備份網頁
if (xhsBackupData) {
  let backupMd = `## 📸 小紅書高清備份：${xhsBackupData.title}\n\n`;
  backupMd += `- 👤 **原作者**：${xhsBackupData.author}\n`;
  backupMd += `- 📝 **完整原作內文**：\n\n> ${xhsBackupData.content.index ? xhsBackupData.content : xhsBackupData.content.replace(/\n/g, '\n> ')}\n\n`;
  backupMd += `--- \n### 🖼️ 高清無水印原圖清單：\n\n`;
  
    // 自動將大老抓下來的高清 Token 網址，轉化為 Wiki 網頁看得到的圖片標籤
  xhsBackupData.images.forEach((imgUrl, i) => {
    backupMd += `#### 🖼️ 第 ${i + 1} 張大圖\n![小紅書高清圖片](${imgUrl})\n\n`;
  });
  
  fs.writeFileSync(path.join(wikiRepoDir, 'Xiaohongshu-Backup.md'), backupMd);
  fs.writeFileSync(path.join(wikiRepoDir, `Xiaohongshu-Backup-${todayStr}.md`), backupMd);
}

    


// 電影：存一份最新、一份歷史
fs.writeFileSync(path.join(wikiRepoDir, 'Movie-Info.md'), entContent);
fs.writeFileSync(path.join(wikiRepoDir, `Movie-Info-${todayStr}.md`), entContent);

//  自動掃描資料夾裡所有的檔案，不管叫什麼名字通通上傳
const allFiles = fs.readdirSync(wikiRepoDir); 
for (const file of allFiles) {
  if (file !== '.git') {
    await git.add({ fs, dir: wikiRepoDir, filepath: file });
  }
}


    console.log("🚀 正在推送 5 個全新獨立 Wiki 頁面上雲端...");
    await git.commit({
      fs,
      dir: wikiRepoDir,
      author: { name: 'MalaysiaMultiPageAssistant', email: 'assistant@railway.app' },
      message: '📝 Daily Wiki Update at 21:00 MYT'
    });

    await git.push({
      fs,
      http,
      dir: wikiRepoDir,
      remote: 'origin',
      ref: 'master',
      onAuth: () => ({ username: GITHUB_TOKEN })
    });
    
    // 🔍 找到原本的 console.log("✅ 報告主人！..."); 的「上一行」，手動換成這段代碼：

    // 📬 1. 配置發信的郵件伺服器（這裡設定使用 Gmail 通道）
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // 你的 Gmail 帳號
        pass: process.env.EMAIL_PASS  // 你的 Gmail 應用程式密碼
      }
    });

    // 📝 2. 把今天採集到的精華資料，組裝成電子郵件的內文
    const emailHtml = `
      <h2>🔔 大馬綜合情報助理 v3.0.0 日報</h2>
      <p>主人，大馬時間晚上 9 點已到！今日（<b>${todayStr}</b>）的民生與理財數據已完美封存入庫。</p>
      <hr/>
      ${weatherContent}
      <hr/>
      ${fuelContent}
      <hr/>
      ${rateContent}
      <hr/>
      ${entContent}
      <hr/>
      <p>🌐 完整歷史日記與精美排版請至：<a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/wiki">GitHub Wiki 總部</a></p>
    `;

    // 🚀 3. 純 Code 發射！直接寄到你的信箱
    await transporter.sendMail({
      from: `"大馬情報助理" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // 自己寄給自己，省事又安全
      subject: `🇲🇾 大馬情報日報 - ${todayStr}`,
      html: emailHtml // 丟入上面組裝好的精美 Markdown/HTML 內文
    });

    console.log("📱 郵件快遞已成功發射！請檢查手機 Gmail 通知！");

    
  } catch (error) {
    console.error("❌ 多網頁推進失敗:", error.message);
  }
}

// ======== ⏰ 智能定時器：精準鎖定大馬時間晚上 9 點 ========
function scheduleDailyUpdate() {
  // 1. 先手跑一次：確保每次專案重啟（或開機）時，能立刻拿到最新資料
  updateMultiPageWiki();

  const now = new Date();
  // 轉換成大馬（吉隆坡）當前的時間資訊
  const kualaLumpurTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
  
  const target = new Date(kualaLumpurTime);
  target.setHours(21, 0, 0, 0); // 目標設定在當天的 21:00:00

  // 如果現在時間已經超過今天的晚上 9 點，目標就順延到明晚 9 點
  if (kualaLumpurTime >= target) {
    target.setDate(target.getDate() + 1);
  }

  // 計算距離目標時間還有多少毫秒
  const delay = target.getTime() - kualaLumpurTime.getTime();
  console.log(`⏰ 定時器已啟動！距離下一次晚上 9 點更新還有 ${(delay / 1000 / 60 / 60).toFixed(2)} 小時。`);

  // 設定第一次等待
  setTimeout(() => {
    updateMultiPageWiki();
    // 第一次觸發後，開啟每 24 小時（86400000 ms）執行一次的循環
    setInterval(updateMultiPageWiki, 86400000);
  }, delay);
}

// 啟動排程系統
scheduleDailyUpdate();


// ==========================================
// 📕 核心功能：扒光小紅書網頁，抓出高清無水印圖文
// ==========================================
async function parseXiaohongshu(inputUrl) {
    try {
        // 1. 整理網址格式
        const urlObj = new URL(inputUrl);
        const m = urlObj.pathname.match(/\/(?:discovery\/item|explore)\/([0-9a-zA-Z]+)/);
        let canonical = inputUrl;
        if (m && m[1]) {
            const token = urlObj.searchParams.get('xsec_token') || '';
            const canonicalUrl = new URL(`https://www.xiaohongshu.com/discovery/item/${m[1]}`);
            if (token) {
                canonicalUrl.searchParams.set('xsec_token', token);
                canonicalUrl.searchParams.set('xsec_source', 'pc_user');
            }
            canonical = canonicalUrl.toString();
        }

        // 2. 爬取網頁原始碼
        const response = await axios.get(canonical, {
            timeout: 10000,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'referer': 'https://www.xiaohongshu.com/'
            }
        });

        const html = response.data;
        if (!html) throw new Error('空網頁回應');

        // 3. 提取隱藏數據庫 window.__INITIAL_STATE__
        const scripts = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi))
            .map(m => (m[1] || '').trim())
            .reverse();

        const script = scripts.find(item => item.startsWith('window.__INITIAL_STATE__'));
        if (!script) throw new Error('找不到小紅書初始隱藏數據庫');

        const jsonText = script.replace(/^window\.__INITIAL_STATE__\s*=\s*/, '');
        const state = loadYaml(jsonText);

        // 4. 一層一層剝開，抓出文案資料
        const note = (state && state.noteData && state.noteData.data && state.noteData.data.noteData)
                  || (state && state.note && state.note.noteDetailMap && state.note.noteDetailMap['-1'] && state.note.noteDetailMap['-1'].note)
                  || {};

        const title = String(note.title || '未命名筆記');
        const content = String(note.desc || '');
        const author = String((note.user && (note.user.nickname || note.user.nickName)) || '未知作者');

        // 5. 提取圖片網址並還原高清
        const images = [];
        if (Array.isArray(note.imageList)) {
            for (const item of note.imageList) {
                const imgUrl = String(item.urlDefault || item.url || '');
                if (!imgUrl) continue;
                
                const cleanUrl = imgUrl.replace(/\\\//g, '/').replace(/&amp;/g, '&');
                const parts = cleanUrl.split('/').slice(5);
                if (parts.length) {
                    const token = parts.join('/').split('!')[0];
                    if (token) {
                        images.push(`https://sns-img-bd.xhscdn.com/${token}`);
                    }
                }
            }
        }

        return { title, content, author, images };
    } catch (error) {
        console.error('抓取小紅書失敗:', error.message);
        return null;
    }
}
