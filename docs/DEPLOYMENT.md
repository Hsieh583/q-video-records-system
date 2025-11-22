# Q Video Records System - 部署指南

## 系統架構

本系統由四個主要組件構成：

1. **Central API** - 中央 API 服務器
2. **Station Agent** - 站點監控程式 (Windows PC)
3. **Viewer Web** - 前端查詢介面
4. **Admin Web** - 後台管理系統

## 前置需求

### 所有組件
- Node.js 18+ 
- npm 或 yarn

### Central API
- SQL Server 2019+（或 Azure SQL）
- Node.js 運行環境

### Station Agent
- Windows 10/11
- 可讀取 COM port 權限
- 網路連接至中央 API

## 部署步驟

### 1. 資料庫設置

```bash
# 連接到 SQL Server 並執行 schema
sqlcmd -S localhost -U sa -P YourPassword -i central-api/src/models/schema.sql
```

### 2. Central API 部署

```bash
cd central-api

# 安裝依賴
npm install

# 設置環境變數
cp .env.example .env
# 編輯 .env 填入資料庫連接資訊

# 啟動服務
npm start
```

**生產環境建議：**
- 使用 PM2 或 systemd 管理程序
- 配置 Nginx 作為反向代理
- 啟用 HTTPS

```bash
# 使用 PM2
npm install -g pm2
pm2 start src/server.js --name q-video-api
pm2 startup
pm2 save
```

### 3. Station Agent 部署

```bash
cd station-agent

# 安裝依賴
npm install

# 設置配置
cp config/config.example.json config/config.json
# 編輯 config.json 填入站點資訊和 API 端點

# 測試運行
npm start
```

**Windows Service 安裝：**

使用 [node-windows](https://www.npmjs.com/package/node-windows) 將 Agent 安裝為 Windows 服務：

```bash
npm install -g node-windows
node install-service.js
```

### 4. Viewer Web 部署

```bash
cd viewer-web

# 安裝依賴
npm install

# 設置 API 端點
# 創建 .env 文件
echo "REACT_APP_API_URL=http://your-api-server:3000/api" > .env

# 開發環境
npm start

# 生產環境構建
npm run build

# 部署 build 目錄到 Web 服務器 (Nginx, Apache, etc.)
```

**Nginx 配置範例：**

```nginx
server {
    listen 80;
    server_name viewer.example.com;

    root /var/www/viewer-web/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. Admin Web 部署

```bash
cd admin-web

# 安裝依賴
npm install

# 設置 API 端點
echo "REACT_APP_API_URL=http://your-api-server:3000/api" > .env

# 開發環境
npm start

# 生產環境構建
npm run build
```

## 配置說明

### Station Agent 配置

編輯 `station-agent/config/config.json`：

```json
{
  "station_uid": "Q-STATION-001",
  "station_name": "Q台-1號",
  "api_endpoint": "http://api-server:3000/api",
  "scan_mode": "COM",
  "com_port": "COM3",
  "barcode_patterns": {
    "ORDER": "^ORD-",
    "PRODUCT": "^PRD-",
    "Q": "^Q$"
  },
  "expected_devices": {
    "ipcams": [
      {"role": "MAIN", "expected_serial": "CAM-001"},
      {"role": "ENV", "expected_serial": "CAM-002"}
    ],
    "nas": {"expected_serial": "NAS-001"}
  },
  "health_check_interval": 30
}
```

### Central API 環境變數

編輯 `central-api/.env`：

```env
PORT=3000
NODE_ENV=production

DB_SERVER=your-sql-server
DB_PORT=1433
DB_NAME=q_video_records
DB_USER=api_user
DB_PASSWORD=secure_password

# 通知設置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@example.com
EMAIL_PASSWORD=app_password

TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
```

## 監控與維護

### 健康檢查

```bash
# API 健康檢查
curl http://localhost:3000/health

# 站點狀態
curl http://localhost:3000/api/health/stations
```

### 日誌查看

```bash
# API 日誌
tail -f central-api/logs/combined.log

# Station Agent 日誌
tail -f station-agent/logs/combined.log
```

### 備份建議

1. 每日備份資料庫
2. 保留事件記錄至少 90 天
3. 定期備份配置文件

## 故障排除

### Station Agent 無法連接 API

1. 檢查網路連接
2. 驗證 API 端點 URL
3. 檢查防火牆設置
4. 查看 Agent 日誌

### 攝影機無法檢測

1. 確認 ONVIF 已啟用
2. 檢查網路設定（同一子網）
3. 驗證攝影機序列號

### 掃描器無法工作

1. 檢查 COM port 設置
2. 驗證 USB 連接
3. 確認掃描器模式（COM/Keyboard）

## 效能優化

1. 資料庫索引優化
2. API 緩存策略
3. 影片串流使用 Proxy 模式
4. 定期清理舊事件記錄

## 安全建議

1. 使用 HTTPS 連接
2. 限制 API 訪問來源
3. 定期更新密碼
4. 啟用資料庫加密
5. 實施訪問控制和身份驗證
