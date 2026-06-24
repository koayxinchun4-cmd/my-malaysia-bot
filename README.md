# 🇲🇾 my-malaysia-bot — BNM Exchange Rate Module

自動爬取馬來西亞令吉（MYR）對主要貨幣匯率，輸出純文字報告。

## 支援貨幣

| 貨幣 | 代碼 | 國家 |
|------|------|------|
| 人民幣 | CNY | 🇨🇳 中國 |
| 美元 | USD | 🇺🇸 美國 |
| 英鎊 | GBP | 🇬🇧 英國 |
| 日圓 | JPY | 🇯🇵 日本 |
| 韓元 | KRW | 🇰🇷 韓國 |

## 架構

- **零外部 API**：純 Node.js 爬蟲，不需申請任何 API Key
- **零 npm 依賴（運行時）**：僅依賴 `dayjs` 處理日期格式
- **三層 fallback**：currencyrate.today → fxrate.org → 硬編碼備援
- **Termux 相容**：可在 Android 手機 Termux 環境執行

## 使用方式

```bash
# 安裝依賴（僅 dayjs）
npm install

# 執行
node index.js
```

輸出範例：
```
═══════════════════════════════════════════
  🇲🇾 BNM Exchange Rates — 2026年06月24日
═══════════════════════════════════════════

  1 MYR =

  🇨🇳 ¥ 1.6678  Chinese Yuan (CNY)
  🇺🇸 $ 0.2465  US Dollar (USD)
  🇬🇧 £ 0.1838  British Pound (GBP)
  🇯🇵 ¥ 39.4753  Japanese Yen (JPY)
  🇰🇷 ₩ 374.12  South Korean Won (KRW)

───────────────────────────────────────────
  📅 Source: BNM / currencyrate.today
  🕐 Updated: 2026-06-24
═══════════════════════════════════════════
```

## Cron 排程（Termux）

```bash
# 每週三 9AM 自動更新
0 9 * * 3 cd ~/my-malaysia-bot && node index.js >> logs/cron.log 2>&1
```
