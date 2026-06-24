# 從 my-malaysia-bot 重構到 Hermes Agent 安裝全記錄

> 一份技術筆記，記錄從匯率爬蟲重構、GitHub API 推送，到在 Android Termux 上折騰 Hermes Agent 的完整過程與技術概念拆解。

---

## 1. my-malaysia-bot 重構

### 背景

舊版 `my-malaysia-bot` 是「大馬綜合情報」專案，內含油價爬蟲、BNM 匯率、小紅書 AI 文案生成（透過 Gemini API）。專案逐漸臃腫，且油價功能已獨立成 `malaysia-fuel-bot`。

### 重構內容

| 項目 | 舊版 | 新版 |
|------|------|------|
| 功能 | 油價 + 匯率 + AI 文案 | 純 BNM 匯率 |
| API 依賴 | Gemini API | 零外部 API |
| 爬取目標 | setel.com 油價 | currencyrate.today 匯率 |
| npm 依賴 | 多個套件 | 僅 dayjs |
| 貨幣範圍 | 僅油價相關 | MYR → CNY/USD/GBP/JPY/KRW |

### 新架構

```
my-malaysia-bot/
├── index.js          # 主程式，格式化輸出匯率報告
├── fetcher.js        # 三層 fallback 爬蟲模組
├── package.json      # 僅 dayjs 依賴
├── README.md
├── crontab.txt       # 每週三 9AM 定時排程
├── .gitignore
└── .github/          # CI workflow（保留）
```

### fetcher.js 三層 Fallback 設計

```
Layer 1: currencyrate.today
  → 單次 HTTP GET 取得全部 5 種貨幣匯率
  → 正則表達式從 HTML 中提取數字

Layer 2: fxrate.org
  → 逐一對每種貨幣發 5 次 HTTP GET
  → 備援來源

Layer 3: 硬編碼備援值
  → 網路完全中斷時的最後兜底
  → 需定期手動更新數值
```

### GitHub API 推送（無 git 環境）

雲端環境沒有安裝 git，改用 GitHub REST API 逐層建立 commit：

```
流程：blob → tree → commit → update ref

blob: 上傳每個檔案的內容，取得 blob SHA
tree: 將所有 blob SHA + 路徑打包成 tree 物件
commit: 基於 tree SHA + parent commit SHA 建立新 commit
ref: 將 HEAD ref 指到新 commit SHA
```

#### 踩坑記錄：tree 類型的條目必須帶 sha

GitHub API 建立 tree 時，若從舊 tree 複製目錄（type=tree）條目，必須同時帶入 `sha` 欄位，否則 API 回傳 422。修正：

```python
# 錯誤（缺少 sha）
{"path": ".github", "mode": "040000", "type": "tree"}

# 正確
{"path": ".github", "mode": "040000", "type": "tree", "sha": item["sha"]}
```

---

## 2. SIGSEGV — 記憶體分段錯誤

### 定義

**SIGSEGV = Segmentation Fault**。當程式試圖存取不屬於它的記憶體位置時，作業系統核心直接發送 SIGSEGV 信號終止程式。

### 類比

你有自己房間的鑰匙。程式突然拿鑰匙去開鄰居家的門。門鎖（OS kernel）不跟你廢話，直接把你踹出去。

### 在本次場景中的觸發

`jiter`（Rust 編寫的 JSON 解析器）在 Android/Termux 上執行時，Rust 編譯出的機器碼試圖存取 Android 核心（bionic libc）不允許的記憶體區塊，瞬間 crash。

---

## 3. Rust 與 Android 的相容性問題

### Rust 是什麼

系統級程式語言，主打「記憶體安全 + 零成本抽象」。不需要垃圾回收（GC），而是在**編譯期**透過「所有權系統 + 借用檢查器」證明程式不會有記憶體漏洞。

### 為什麼在 Android 上常出事

| 比較點 | 桌機 Linux | Android/Termux |
|--------|-----------|----------------|
| C 標準庫 | glibc | bionic libc |
| 動態連結器 | ld-linux | linker (Android 變體) |
| 核心 API | 完整 POSIX | 部分限制 |

許多 Rust crate 在撰寫時預設目標是 glibc 環境。當 `maturin`（Rust→Python 綁定工具）在 bionic 上編譯時，部分系統呼叫、記憶體佈局假設失效，導致 SIGSEGV。

---

## 4. jiter — OpenAI SDK 的 Rust 依賴

### 本質

OpenAI Python SDK（v1.x 後期）引入的依賴。以 Rust 撰寫的高效能 JSON 增量解析器，用於加速 API 回應串流處理。

### 問題鏈

```
pip install openai
  → 依賴解析觸發 jiter
    → jiter 需要 maturin 從原始碼編譯 Rust
      → maturin 在 bionic/ARM64 上支援有限
        → 編譯成功也無法正常執行（SIGSEGV）
```

### 社群現狀

Termux 社群公認的死穴。Android 上的 Rust 跨平台支持在複雜綁定場景（Python + Rust）下仍不成熟。

---

## 5. 方案一失敗分析：termux-openai

Hermes 安裝受阻後，搜尋到的解決方案之一是安裝 `termux-openai`——宣稱是「社群專為 Termux 打包的免 Rust 版 OpenAI 客戶端」。

```
pip install termux-openai --no-build-isolation
ERROR: Could not find a version that satisfies the requirement termux-openai
```

**失敗原因**：此套件名在 PyPI 上不存在。原始來源可能是某個 GitHub Gist 或個人倉庫的臨時方案，並未正式發布到套件索引。

---

## 6. proot-distro — 使用者空間虛擬化

### 原理

proot 透過 `ptrace` 攔截系統呼叫，讓一個目錄內的 Linux rootfs「以為」自己是根目錄。不使用完整虛擬化（無獨立 kernel），效能損耗僅 5-10%。

### 架構

```
┌──────────────────────────────┐
│  Ubuntu (glibc, apt, gcc)    │  ← 你在這裡操作
│  ──────────────────────────  │
│  proot (ptrace 系統呼叫攔截)  │  ← 透明轉譯層
│  ──────────────────────────  │
│  Android kernel (bionic)     │  ← 真實底層
└──────────────────────────────┘
```

### 為何能解決 jiter 問題

Ubuntu rootfs 自帶完整的 glibc + gcc + binutils 編譯鏈。Rust 程式編譯時看到的是標準 Linux 環境（glibc），完全不知道底層是 Android（bionic）。因此 jiter 能正常編譯且不會觸發 SIGSEGV。

### 代價

- 約 200-300MB 磁碟空間
- CPU 效能 5-10% 損耗（ptrace 開銷）
- 無 GPU 加速

---

## 7. Hermes Agent 安裝過程

### 什麼是 Hermes Agent

Nous Research 開發的開源 AI 智能體框架。核心概念：在你的裝置上跑一個本地中控台，它能自動拆解任務、調用工具，然後呼叫雲端模型來執行。

### 與 Marvis 的對比

|  | Marvis | Hermes Agent |
|--|--------|-------------|
| 運行位置 | 騰訊雲端 | 手機 Termux 本地 |
| 模型來源 | 騰訊混元/DeepSeek | 使用者自行配置 |
| API 依賴 | 無需設定 | 需提供 OpenRouter/OpenAI Key |
| 自由度 | 限定功能 | 完全自由可控 |
| 關係 | 與使用者對話 | 使用者與 Hermes 對話 |

兩者不衝突，可以同時使用。

### 安裝時間線

```
1. 直接執行官方安裝腳本 → jiter SIGSEGV
2. 嘗試方案一 termux-openai → PyPI 不存在
3. 方案二 proot-distro Ubuntu → 成功繞過
4. OAuth 登入 → 授權碼過期 / 無效
5. 改用 OpenRouter API Key → 成功配對
6. 選模型 hy3-preview:free → 免費期已結束
7. 換 nemotron-3-super-120b-a12b:free → 可用但慢
8. 最終結論：120B 模型在手機上延遲過高，不實用
```

### 目前可用的 OpenRouter 免費模型（2026年6月）

| 模型 | 參數量 | 速度 | 備註 |
|------|--------|------|------|
| `nvidia/nemotron-3-super-120b-a12b:free` | 120B | 慢 | NVIDIA 旗艦，品質好 |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 550B | 極慢 | 超大模型，手機不推薦 |
| `inclusionai/ring-2.6-1t:free` | 1T | 極慢 | 1 兆參數，不建議手機使用 |
| `poolside/laguna-m.1:free` | 較小 | 中等 | 專為程式碼設計 |

### 儲值方案（若要更實用）

OpenRouter 儲值 $5，即可使用付費快速模型：
- `google/gemini-3.5-flash` — 極快，日常對話
- `deepseek/deepseek-v4-flash` — 便宜，中文好

一個月日常使用不到幾毛美元。

---

## 8. 技術關鍵詞速查表

| 術語 | 一句話解釋 |
|------|-----------|
| SIGSEGV | 程式存取非法記憶體，被 OS 強制終止 |
| Rust | 無 GC 的系統語言，編譯期保證記憶體安全 |
| bionic | Android 的 C 標準庫，替代 Linux 上的 glibc |
| glibc | 標準 Linux 的 C 標準庫，Rust 預設目標 |
| jiter | OpenAI SDK 的 Rust JSON 解析器，Termux 死穴 |
| maturin | Rust→Python 綁定編譯工具，Android 支援有限 |
| proot | 使用者空間容器，攔截系統呼叫欺騙 rootfs |
| proot-distro | Termux 上的 proot 管理器，一鍵裝 Ubuntu |
| ptrace | Linux 系統呼叫追蹤機制，proot 的底層依賴 |
| blob | Git 內部儲存檔案內容的物件 |
| tree | Git 內部儲存目錄結構的物件 |
| OpenRouter | 統一 API 網關，一個 Key 存取 300+ 模型 |

---

## 9. 心得總結

1. **零 API 爬蟲可行**：Node.js 內建模組 + 正則表達式就能穩定爬匯率，三層 fallback 保證可用性。

2. **Android 不是 Linux**：bionic ≠ glibc。任何依賴原生編譯（C/Rust/C++）的 Python 套件在 Termux 上都可能翻車。

3. **proot 是手機開發的萬能鑰匙**：遇到編譯問題，進 Ubuntu proot 幾乎都能解決，代價很低。

4. **不要把大模型塞進手機**：即使用雲端 API，120B+ 參數的模型延遲也難以接受。日常使用 7B-30B 的 flash 版本更實際。

5. **免費模型的宿命**：廠商免費模型是引流工具，隨時可能轉付費。重要任務請備妥付費 API Key。

---

*記錄日期：2026-06-24*
