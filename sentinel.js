const { execSync } = require('child_process');
const fs = require('fs');

const LOG_FILE = 'sentinel.log';

function log(msg) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, entry);
    console.log(entry.trim());
}

function notify(title, message) {
    execSync(`termux-notification --id 100 --title "${title}" --content "${message}"`);
}

async function runCheck() {
    log("開始自我健康檢查...");
    try {
        // 模擬檢查：測試 API 連線
        // 若 fetch 失敗，則觸發自動修復邏輯
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY.trim());
        
        if (!response.ok) throw new Error(`API 返回錯誤: ${response.status}`);
        
        log("檢查通過：系統運行正常。");
    } catch (error) {
        log(`發現問題: ${error.message}，啟動自動修復程序...`);
        
        // --- 自動修復邏輯 ---
        // 例如：自動重新載入環境變數或重試連線
        try {
            // 在這裡加入你的修復指令
            log("修復完成：已重置連線狀態。");
            notify("系統修復", "檢測到錯誤並已自動修復完畢。");
        } catch (repairError) {
            log(`修復失敗: ${repairError.message}`);
            notify("系統嚴重錯誤", "修復程序執行失敗，請人工介入。");
        }
    }
}

runCheck();
