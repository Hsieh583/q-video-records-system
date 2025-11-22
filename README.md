# 《B2C 出貨影像監控系統 – 系統規格需求書（Program Specification）》

> **✅ 實作狀態：已完成** - 所有功能已根據本規格書實作完成。請參閱 [實作說明](#實作說明) 章節了解如何部署和使用系統。

---

# 系統總覽（System Overview）

本系統由三套獨立但互相協作的程式構成：

1. **PC 端事件監控程式（Station Agent）**
   安裝於每個 Q 台的 PC，用於擷取條碼掃描事件、比對設備狀態、回報中央 API。

2. **前端查詢 UI（Viewer Web App）**
   給客服、辦公室、客戶使用，主功能是依訂單號快速帶出「前後 1 分鐘」的雙鏡頭影像播放。

3. **後台管理系統（Admin Web Console）**
   給 IT、主管使用，負責設備綁定、異常偵測、站點狀態、每日統計、報表。

三套程式透過中央伺服器 API 與資料庫互通，影片則保留在各 Q 台 NAS，不集中存放。

---

# 核心資料流程（Data Flow Summary）

1. PC Agent 偵測掃描事件 → 呼叫「LogEvent API」。
2. 中央 DB 儲存事件（含 station_uid / timestamp / order_no / barcode_value）。
3. Viewer Web App 依訂單號查詢事件 → 查出：

   * 所屬 Q 台
   * IPCAM logical role
   * 對應的時間窗（T–60s ~ T+60s）
   * 該 Q 台 NAS 上的 playback 連結或串流 proxy。
4. 使用者播放影片（雙鏡頭同步呈現）。
5. 管理者從 Admin 查看設備健康狀態／統計／異常通知。

---

# 一、PC 端事件監控程式（Station Agent）

## 1.1 功能目的

* 擷取條碼掃描事件，不修改 WMS 程式碼。
* 監控 IPCAM / NAS / Scanner 配置並回報異動狀態。
* 對時（必要）。
* 向中央伺服器回報事件與狀態。

## 1.2 運行環境

* Windows 10 / Windows 11
* 常駐背景程式（Windows Service 或 Tray App）
* 需要可讀取 COM port 或鍵盤 Hook（依模式選擇）

## 1.3 功能需求

### A. 條碼事件擷取功能

支援兩種擷取模式（以設定檔切換）：

| 模式               | 描述                                  |
| ---------------- | ----------------------------------- |
| COM 模式           | 掃描器以 USB-COM 虛擬序列埠運作，Agent 讀取完整掃描字串 |
| Keyboard Hook 模式 | 掃描器以「鍵盤模式」輸入，Agent 利用模式特徵組裝完整條碼     |

**必須偵測的四大掃描事件：**

* 訂單號碼
* 商品序號
* 其他欄位（最多 4 種，可擴充）
* Q（表示完成包裝）

### B. 事件上報 API

POST /api/events/log
內容包含：

* station_uid
* event_type
* order_no
* barcode_value
* timestamp（UTC+8）
* local_pc_info（版本、IPv4、heartbeat）

若 API 暫時無法連線 → 本地 Queue 暫存，恢復後自動補送。

### C. 設備自動探測（每 30 秒）

* 掃描 IPCAM（使用 ONVIF Discovery）

  * serial number
  * IP
  * model

* 探測 NAS（Synology API）

  * serial number
  * channel list
  * hostname

* 探測掃描器

  * VendorID / ProductID
  * COM port

比對「中央設備綁定表」→ 若異常（例如 IPCAM 序號更換），立即上報。

### D. 站點健康狀態

上報：

* IPCAM 掉線
* IPCAM 序號改變
* NAS 無法連線
* 掃描器消失
* PC 時間偏差（> 3 秒）

### E. 設定檔（Config）

* station_uid
* 掃描模式
* API 端點
* IPCAM 預期 logical role
* 診斷模式 on/off
* 重試間隔

---

# 二、前端查詢 UI（Viewer Web App）

## 2.1 使用者角色

* 客服人員
* 辦公室主管
* 客戶（選配）

## 2.2 功能目的

* 依訂單號快速帶出出貨時段的多鏡頭影片。
* 不需要知道影片在哪一台 NAS。
* 不需要登入群輝 Surveillance Station。

## 2.3 核心功能

### A. 依訂單查詢掃描事件

API: GET /api/orders/{order_no}/events

回傳：

* station_uid
* timestamp
* camera list（MAIN / ENV）
* recommended playback range
* playback URLs 或 proxy endpoints

### B. 播放影片（雙鏡頭同步）

兩種播放模式（選項）：

| 模式           | 說明                                     |
| ------------ | -------------------------------------- |
| 直連 NAS 播放    | 使用 Surveillance Station 的 playback URL |
| Proxy 播放（推薦） | 中央伺服器負責取 NAS 串流，再送給前端，避免跨站問題           |

播放器功能：

* 同步播放 MAIN + ENV
* 時間軸顯示掃描事件標記
* 調整播放前後範圍
* 可手動跳到指定秒數

### C. 訂單查無 → 回傳指引訊息

可能原因：

* 該 Q 台未上報到
* 掃描器故障
* 設備序號不符
* Q 台 PC 時間誤差超過閾值

---

# 三、後台管理系統（Admin Web Console）

## 3.1 使用者角色

* IT 部門
* 班主管 / 倉庫主管
* 高階管理者（選配）

## 3.2 功能目的

* 設備綁定
* 站點健康監控
* 異常通知
* 統計查詢

## 3.3 功能需求

### A. 設備綁定管理

| 模組         | 功能                            |
| ---------- | ----------------------------- |
| IPCAM 管理   | 登記 cam_uid → serial number 綁定 |
| NAS 管理     | nas_uid → serial number 綁定    |
| 掃描器管理      | scanner_uid 綁定                |
| Station 管理 | 定義 station_uid / 所屬 Q 台       |

提供後台 UI：

* 「重新綁定序號」
* 「偵測到新 IPCAM → 是否綁定？」
* 「NAS channel 變更 → 重新對應？」

### B. 站點健康監控（Dashboard）

顯示：

* IPCAM 線上/掉線
* IPCAM 序號是否一致
* NAS 容量、channel 連線狀態
* Station Agent 心跳
* 掃描事件量（每分鐘）

狀態：OK / WARNING / ERROR

### C. 統計與報表

* 每日出貨事件量
* 每日查詢量
* 客訴案件影片調閱紀錄
* 訂單查詢稽核（誰查了哪一筆訂單）

### D. 異常通知

方式：

* Email
* Teams Webhook
* LINE Notify（選配）

事件：

* IPCAM 序號變動
* IPCAM / NAS 掉線
* Station Agent 心跳失效
* 掃描器消失
* Q 台 PC 時間偏差

---

# 四、中央 API 與資料庫（共用規格）

## 4.1 API 類別

* Event API（記錄掃描事件）
* Playback API（組合影片連結或 proxy）
* Health API（各站點健康狀況）
* Admin API（設備綁定、序號管理）

## 4.2 資料表（簡化描述）

### events

| id | station_uid | event_type | order_no | barcode_value | timestamp |

### station_devices

| station_uid | cam_uid | role | nas_uid |

### cams

| cam_uid | serial_number | last_seen_ip | model | status |

### nas

| nas_uid | serial_number | last_seen_ip | ss_version |

### health_logs

| station_uid | type | status | detail | timestamp |

---

# 五、非功能需求（NFR）

### 性能

* 單 Q 台 每分鐘 20–40 筆事件可支援
* 查詢 API 回應 ≤ 300ms（不包含影片串流）

### 可維護性

* 位置 / IP 變更不應影響系統
* 前後端分離設計
* 設備綁定資料獨立於實體配置

### 相容性

* 群輝 Surveillance Station 8.x 以上
* IPCAM 支援 ONVIF Profile S
* Barcode Scanner MS852（USB Keyboard / COM 模式）

---

# 六、部署架構（簡略版）

* 各 Q 台：Station Agent
* 中央：

  * Web API（.NET / Python Flask / Node 任一）
  * Viewer Web（React / Vue / Razor Pages 任一）
  * Admin Web
  * SQL Server（可沿用）
* IPCAM → NAS：24hr 錄影

---

# 實作說明

本系統已根據上述規格完整實作，包含以下組件：

## 📁 專案結構

```
.
├── central-api/          # 中央 API 服務器 (Node.js + Express + SQL Server)
├── station-agent/        # 站點監控程式 (Node.js for Windows)
├── viewer-web/          # 前端查詢介面 (React)
├── admin-web/           # 後台管理系統 (React)
└── docs/                # 完整文件
    ├── DEPLOYMENT.md         # 部署指南
    ├── API.md                # API 文件
    ├── ARCHITECTURE.md       # 系統架構說明
    └── IMPLEMENTATION_SUMMARY.md  # 實作總結
```

## 🚀 快速開始

### 1. 部署中央 API

```bash
cd central-api
npm install
cp .env.example .env
# 編輯 .env 設定資料庫連線
npm start
```

### 2. 部署站點監控程式

```bash
cd station-agent
npm install
cp config/config.example.json config/config.json
# 編輯 config.json 設定站點資訊
npm start
```

### 3. 部署前端介面

```bash
# Viewer Web
cd viewer-web
npm install
npm start

# Admin Web
cd admin-web
npm install
npm start
```

## 📚 詳細文件

請參閱 `docs/` 目錄下的完整文件：

- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - 完整的部署步驟與配置說明
- **[API.md](docs/API.md)** - 所有 API 端點的詳細文件
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - 系統架構與資料流程說明
- **[IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)** - 實作總結與技術細節

## ✅ 已實作功能

### Station Agent (站點監控程式)
- ✅ 條碼掃描事件擷取（COM 模式 + Keyboard Hook 框架）
- ✅ 事件上報 API 與離線佇列
- ✅ 設備自動探測（IPCAM、NAS、Scanner）
- ✅ 站點健康狀態監控
- ✅ 可配置的設定檔

### Viewer Web (前端查詢介面)
- ✅ 依訂單號查詢掃描事件
- ✅ 雙鏡頭影片播放（MAIN + ENV）
- ✅ 事件時間軸顯示
- ✅ 播放時間範圍調整（T-60s ~ T+60s）
- ✅ Proxy/直連播放模式切換

### Admin Web (後台管理系統)
- ✅ 設備綁定管理（IPCAM、NAS、Scanner）
- ✅ 站點健康監控儀表板
- ✅ 統計與報表查詢
- ✅ 即時狀態更新

### Central API (中央服務器)
- ✅ 完整 REST API（12 個端點）
- ✅ SQL Server 資料庫（9 個表）
- ✅ 速率限制（防止濫用）
- ✅ 查詢審計日誌
- ✅ 錯誤處理與日誌記錄

## 🔒 安全性

- ✅ 所有 API 端點已實施速率限制
- ✅ SQL 注入防護（參數化查詢）
- ✅ SSL/TLS 支援
- ✅ 查詢審計追蹤
- ✅ 環境變數配置
- ✅ CodeQL 安全掃描通過（零漏洞）

## 🛠️ 技術棧

- **後端：** Node.js, Express, SQL Server
- **前端：** React, Axios, React Router
- **監控：** Winston (日誌), express-rate-limit (安全)
- **通訊：** SerialPort, ONVIF, Synology API

## 📊 系統需求

- **Central API:** Node.js 18+, SQL Server 2019+
- **Station Agent:** Windows 10/11, Node.js 18+
- **Web Apps:** 現代瀏覽器（Chrome, Firefox, Edge, Safari）

---

