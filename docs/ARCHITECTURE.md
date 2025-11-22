# Q Video Records System - 系統架構說明

## 系統概覽

Q Video Records System 是一個 B2C 出貨影像監控系統，用於記錄和查詢出貨過程中的影像資料。

## 架構圖

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Station Agent  │────▶│  Central API    │◀────│   Viewer Web    │
│  (Windows PC)   │     │  (Node.js)      │     │   (React App)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                         │
        │                       │                         │
        ▼                       ▼                         │
┌─────────────────┐     ┌─────────────────┐             │
│  Barcode Scanner│     │   SQL Server    │             │
│  IPCAM / NAS    │     │   Database      │             │
└─────────────────┘     └─────────────────┘             │
                                │                         │
                                │                         │
                                └─────────────────────────┘
                                          │
                                          ▼
                                ┌─────────────────┐
                                │   Admin Web     │
                                │  (React App)    │
                                └─────────────────┘
```

## 組件說明

### 1. Station Agent (站點監控程式)

**技術棧：** Node.js, SerialPort, ONVIF

**主要功能：**
- 條碼掃描事件擷取（COM 模式 / Keyboard Hook 模式）
- 設備自動探測（IPCAM, NAS, Scanner）
- 健康狀態監控
- 事件佇列管理
- 本地離線緩存

**部署位置：** 每個 Q 台的 Windows PC

**通訊方式：**
- 透過 HTTP REST API 與中央伺服器通訊
- 使用 SerialPort 讀取條碼掃描器
- 使用 ONVIF 協定偵測 IPCAM

### 2. Central API (中央 API 服務器)

**技術棧：** Node.js, Express, MSSQL

**主要功能：**
- 事件記錄 API
- 訂單查詢 API
- 健康監控 API
- 設備管理 API
- 統計報表 API

**部署位置：** 中央伺服器（可使用 Azure App Service）

**資料庫：** SQL Server
- 儲存掃描事件
- 設備綁定資訊
- 健康狀態日誌
- 查詢審計記錄

### 3. Viewer Web (前端查詢介面)

**技術棧：** React, Axios

**主要功能：**
- 訂單號碼查詢
- 雙鏡頭影片播放
- 事件時間軸顯示
- 播放時間範圍調整

**使用者：**
- 客服人員
- 辦公室主管
- 客戶（可選）

**部署方式：** 靜態網站（Nginx / Apache / Azure Static Web Apps）

### 4. Admin Web (後台管理系統)

**技術棧：** React, React Router, Recharts

**主要功能：**
- 設備綁定管理（IPCAM, NAS, Scanner）
- 站點健康監控儀表板
- 統計報表查詢
- 異常通知管理

**使用者：**
- IT 部門
- 倉庫主管
- 高階管理者

**部署方式：** 靜態網站（內部網路）

## 資料流程

### 1. 掃描事件流程

```
Barcode Scanner
    │
    ▼
Station Agent (檢測掃描)
    │
    ▼
Event Queue (本地佇列)
    │
    ▼
Central API (/events/log)
    │
    ▼
SQL Server (events 表)
```

### 2. 訂單查詢流程

```
Viewer Web (輸入訂單號)
    │
    ▼
Central API (/orders/:order_no/events)
    │
    ├──▶ 查詢 events 表
    │
    ├──▶ 查詢 station_devices 表
    │
    ├──▶ 計算播放時間窗 (T-60s ~ T+60s)
    │
    └──▶ 產生影片連結
         │
         ▼
Viewer Web (播放雙鏡頭影片)
```

### 3. 健康監控流程

```
Station Agent (每 30 秒)
    │
    ├──▶ 偵測 IPCAM (ONVIF Discovery)
    │
    ├──▶ 偵測 NAS (Synology API)
    │
    ├──▶ 偵測 Scanner (USB 裝置)
    │
    └──▶ 檢查時間偏移
         │
         ▼
Central API (/health/report)
    │
    ▼
SQL Server (health_logs 表)
    │
    ▼
Admin Web (即時顯示)
```

## 資料庫架構

### 核心表格

1. **events** - 掃描事件記錄
   - 儲存所有條碼掃描事件
   - 包含訂單號、時間戳、站點資訊

2. **stations** - 站點資訊
   - 站點基本資料
   - Agent 版本、心跳時間

3. **station_devices** - 設備綁定
   - 站點與設備的對應關係
   - 攝影機角色 (MAIN/ENV)

4. **cams** - 攝影機資訊
   - 序列號、IP、型號
   - 線上狀態

5. **nas** - NAS 設備資訊
   - 序列號、IP、版本
   - 連線狀態

6. **scanners** - 掃描器資訊
   - VendorID/ProductID
   - COM port

7. **health_logs** - 健康狀態日誌
   - 異常事件記錄
   - 告警狀態

8. **query_audit** - 查詢審計
   - 記錄誰查詢了哪些訂單
   - 稽核追蹤

## 影片存取策略

### 直連模式

```
Viewer Web ──▶ NAS Surveillance Station ──▶ 影片檔案
```

**優點：** 簡單、直接
**缺點：** 需要處理跨域問題，NAS 需對外開放

### Proxy 模式（推薦）

```
Viewer Web ──▶ Central API Proxy ──▶ NAS ──▶ 影片檔案
```

**優點：**
- 統一存取控制
- 解決跨域問題
- 可加入存取日誌

**缺點：** 增加中央伺服器負載

## 安全考量

1. **資料傳輸**
   - 使用 HTTPS 加密所有連線
   - API 認證機制

2. **存取控制**
   - 角色權限管理
   - 查詢審計記錄

3. **資料保護**
   - 資料庫加密
   - 定期備份

4. **網路隔離**
   - Station Agent 僅需連出
   - NAS 可放在內部網路

## 擴展性考量

1. **水平擴展**
   - Central API 可部署多個實例
   - 使用 Load Balancer 分散負載

2. **資料庫分片**
   - 依日期分區事件表
   - 定期歸檔舊資料

3. **快取策略**
   - Redis 快取常用查詢
   - CDN 加速靜態資源

4. **監控告警**
   - 整合 Prometheus + Grafana
   - 設置告警規則

## 災難復原

1. **資料備份**
   - 每日自動備份資料庫
   - 異地備份機制

2. **高可用性**
   - API 服務雙機熱備
   - 資料庫主從複製

3. **故障轉移**
   - Station Agent 本地佇列
   - 自動重試機制

## 效能指標

- 單 Q 台：20-40 筆事件/分鐘
- 查詢回應時間：< 300ms
- 影片載入時間：< 5 秒
- 系統可支援：100+ 站點同時運作
