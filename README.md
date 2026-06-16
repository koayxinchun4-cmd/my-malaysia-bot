# 🇲🇾 Malaysia Super Wiki Bot (v3.0.0)

一個專為大馬設計的自動化綜合情報助理！利用 Node.js 爬蟲與 API，定期抓取民生、理財、娛樂及即時新聞，並自動分流部署至 GitHub Wiki，打造專屬的獨立多網頁情報站。

---

## 🚀 核心亮點功能

*   🕒 **智能定時排程**：精準鎖定大馬時間（MYT）**每晚 21:00** 自動執行。
*   📜 **每日歷史存檔**：全新 3.0.0 雙軌制，除了更新當日看板，還會自動生成帶有日期的歷史檔案（如 `Petrol-Price-YYYY-MM-DD.md`），資料永不丟失！
*   📂 **多網頁分流架構**：打破單一長網頁限制，自動生成 Home、天氣、新聞、油價、匯率、電影 6 大獨立 Wiki 頁面。
*   🛡️ **全核心自癒系統**：每個模組皆有獨立 `try-catch` 防護網，就算單一網站癱瘓，其餘板塊依然能正常運作更新。

---

## 📊 數據採集板塊

| 板塊名稱 | 數據來源 | 抓取技術 |
| :--- | :--- | :--- |
| 🌦️ **吉隆坡即時天氣** | OpenWeatherMap API | 國際標準 JSON 請求 |
| 📰 **大馬即時焦點新聞** | NewsAPI (Top 10 Headlines) | 即時新聞分流過濾 |
| ⛽ **每週最新汽車油價** | Paul Tan Automotive News | Cheerio 網頁黑盒爬蟲 |
| 💱 **大馬國家銀行匯率** | Open Exchange Rates | 逆向匯率精準換算 |
| 🎬 **TGV & GSC 強檔電影** | 電影院與大型演藝情報 | 娛樂趨勢模組 |

---

## 🔑 環境變數配置 (Environment Variables)

若要重新部署此專案，請在託管平台（如 Railway）中配置以下保險箱變數：

*   `GITHUB_TOKEN`：具備 Wiki 寫入權限的 GitHub 個人訪問權杖 (PAT)
*   `REPO_OWNER`：您的 GitHub 使用者名稱
*   `REPO_NAME`：此專案的儲存庫名稱
*   `WEATHER_API_KEY`：OpenWeatherMap 申請的 API Key
*   `NEWS_API_KEY`：NewsAPI 申請的 API Key

---

## 🛠️ 開發技術棧 (Tech Stack)

*   **Runtime**: Node.js
*   **HTTP Client**: Axios
*   **Web Scraper**: Cheerio
*   **Git Automation**: Isomorphic-git & Memfs (虛擬記憶體檔案系統)

---
💡 *本專案由大馬開發者親手調教，持續為大馬民生情報自動化做出貢獻。*
