# 🇲🇾 Malaysia Info Bot (my-malaysia-bot)

這是一個運行於雲端、自動化收集大馬生活情報的 AI 機器人，專為個人使用與學習而設計。

## 🚀 核心功能
* **油價情報**：定期爬取 [Paul Tan](https://paultan.org/) 網站，獲取最新馬來西亞燃油價格。
* **金融數據**：抓取 BNM (馬來西亞國家銀行) 匯率資訊。
* **娛樂資訊**：監控電影與藝文活動情報。
* **AI Agent**：結合 **Google Gemini Flash API**，自動處理蒐集到的數據，並生成小紅書風格的社群媒體草稿。

## 🛠 技術架構
* **Runtime**: Node.js
* **部署平台**: Render (Free Tier)
* **自動化部署**: Git + GitHub
* **遙控終端**: Termux (Android)
* **關鍵技術**: 
    * 使用 `axios` 進行網路請求。
    * 使用 `http.createServer` 注入技巧以繞過 Render 端口檢查。
    * 使用 GitHub 隱私信箱與 Token 機制實現全自動化推送。

## 📁 目錄結構
* `index.js`：機器人主程式與邏輯。
* `package.json`：專案依賴與部署指令（含 Render 繞過邏輯）。
* `deploy.sh`：一鍵自動化部署腳本。

## 💡 自動化操作指南
本專案已實現一鍵部署。在 Termux 中執行以下指令即可更新機器人：

```bash
./deploy.sh

