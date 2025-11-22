# Q Video Records System - API 文件

## Base URL

```
http://localhost:3000/api
```

## 端點總覽

### Events API
- `POST /events/log` - 記錄掃描事件
- `GET /events` - 查詢事件列表

### Orders API
- `GET /orders/:order_no/events` - 查詢訂單相關事件

### Health API
- `POST /health/report` - 回報健康狀態
- `GET /health/stations` - 取得所有站點健康狀態
- `GET /health/stations/:station_uid` - 取得特定站點詳細健康資訊

### Admin API
- `POST /admin/devices/cams` - 註冊攝影機
- `POST /admin/devices/nas` - 註冊 NAS
- `POST /admin/devices/scanners` - 註冊掃描器
- `POST /admin/stations` - 註冊站點
- `POST /admin/station-devices/bind` - 綁定設備到站點
- `GET /admin/stats/daily` - 取得每日統計

---

## 詳細端點說明

### POST /events/log

記錄條碼掃描事件。

**請求範例：**

```json
{
  "station_uid": "Q-STATION-001",
  "event_type": "ORDER",
  "order_no": "ORD-2024-001",
  "barcode_value": "ORD-2024-001",
  "timestamp": "2024-11-22T10:30:00Z",
  "local_pc_info": {
    "version": "1.0.0",
    "ipv4": "192.168.1.100",
    "heartbeat": true
  }
}
```

**回應範例：**

```json
{
  "success": true,
  "event_id": 12345,
  "message": "Event logged successfully"
}
```

**事件類型：**
- `ORDER` - 訂單號碼
- `PRODUCT` - 商品序號
- `FIELD1`, `FIELD2`, `FIELD3`, `FIELD4` - 自定義欄位
- `Q` - 完成包裝

---

### GET /orders/:order_no/events

根據訂單號查詢相關事件和影片資訊。

**請求範例：**

```
GET /api/orders/ORD-2024-001/events
```

**回應範例：**

```json
{
  "success": true,
  "order_no": "ORD-2024-001",
  "station_uid": "Q-STATION-001",
  "station_name": "Q台-1號",
  "location": "倉庫A區",
  "timestamp": "2024-11-22T10:30:00Z",
  "playback_range": {
    "start": "2024-11-22T10:29:00Z",
    "end": "2024-11-22T10:31:00Z"
  },
  "cameras": [
    {
      "role": "MAIN",
      "cam_uid": "CAM-001",
      "cam_serial": "ABC123",
      "nas_hostname": "nas-001",
      "playback_url": "http://nas-ip:5000/...",
      "proxy_url": "/api/playback/proxy/Q-STATION-001/MAIN?start=..."
    },
    {
      "role": "ENV",
      "cam_uid": "CAM-002",
      "cam_serial": "DEF456",
      "nas_hostname": "nas-001",
      "playback_url": "http://nas-ip:5000/...",
      "proxy_url": "/api/playback/proxy/Q-STATION-001/ENV?start=..."
    }
  ],
  "events": [
    {
      "id": 1,
      "event_type": "ORDER",
      "barcode_value": "ORD-2024-001",
      "timestamp": "2024-11-22T10:30:00Z"
    },
    {
      "id": 2,
      "event_type": "Q",
      "barcode_value": "Q",
      "timestamp": "2024-11-22T10:30:45Z"
    }
  ]
}
```

**錯誤回應（404）：**

```json
{
  "success": false,
  "message": "Order not found",
  "suggestions": [
    "The Q station may not have reported this event yet",
    "The barcode scanner may not be functioning properly",
    "Device serial numbers may not match configuration",
    "PC time on Q station may be incorrect (>3 seconds drift)"
  ]
}
```

---

### POST /health/report

Station Agent 回報健康狀態。

**請求範例：**

```json
{
  "station_uid": "Q-STATION-001",
  "type": "CAM_OFFLINE",
  "status": "ERROR",
  "detail": {
    "role": "MAIN",
    "expected_serial": "CAM-001"
  }
}
```

**健康狀態類型：**
- `HEARTBEAT` - 心跳
- `CAM_OFFLINE` - 攝影機離線
- `CAM_SERIAL_CHANGED` - 攝影機序號變更
- `NAS_OFFLINE` - NAS 離線
- `NAS_SERIAL_CHANGED` - NAS 序號變更
- `SCANNER_MISSING` - 掃描器消失
- `TIME_DRIFT` - 時間偏移

**狀態值：**
- `OK` - 正常
- `WARNING` - 警告
- `ERROR` - 錯誤

---

### GET /health/stations

取得所有站點的健康狀態。

**回應範例：**

```json
{
  "success": true,
  "count": 2,
  "stations": [
    {
      "station_uid": "Q-STATION-001",
      "station_name": "Q台-1號",
      "location": "倉庫A區",
      "agent_version": "1.0.0",
      "last_heartbeat": "2024-11-22T10:35:00Z",
      "status": "ONLINE",
      "heartbeat_age_seconds": 30,
      "active_errors": 0,
      "active_warnings": 1,
      "health_status": "WARNING"
    }
  ]
}
```

---

### POST /admin/devices/cams

註冊或更新攝影機資訊。

**請求範例：**

```json
{
  "cam_uid": "CAM-001",
  "serial_number": "ABC123456",
  "last_seen_ip": "192.168.1.101",
  "model": "AXIS M3045-V"
}
```

---

### POST /admin/stations

註冊或更新站點資訊。

**請求範例：**

```json
{
  "station_uid": "Q-STATION-001",
  "station_name": "Q台-1號",
  "location": "倉庫A區",
  "config": {
    "scan_mode": "COM",
    "com_port": "COM3"
  }
}
```

---

### POST /admin/station-devices/bind

綁定設備到站點。

**請求範例：**

```json
{
  "station_uid": "Q-STATION-001",
  "cam_uid": "CAM-001",
  "role": "MAIN",
  "nas_uid": "NAS-001",
  "scanner_uid": "SCANNER-001"
}
```

---

### GET /admin/stats/daily

取得每日統計資料。

**查詢參數：**
- `start_date` - 開始日期 (YYYY-MM-DD)
- `end_date` - 結束日期 (YYYY-MM-DD)
- `station_uid` - 特定站點 (可選)

**請求範例：**

```
GET /api/admin/stats/daily?start_date=2024-11-01&end_date=2024-11-22
```

**回應範例：**

```json
{
  "success": true,
  "count": 22,
  "stats": [
    {
      "date": "2024-11-22",
      "station_uid": "Q-STATION-001",
      "event_count": 234,
      "query_count": 12,
      "error_count": 1
    }
  ]
}
```

---

## 錯誤碼

- `400` - Bad Request (缺少必要參數)
- `404` - Not Found (資源不存在)
- `500` - Internal Server Error (伺服器錯誤)

## 速率限制

目前未實施速率限制，建議在生產環境中實施適當的速率限制策略。

## 認證

目前 API 未實施認證機制。在生產環境中建議實施：
- API Key 認證
- JWT Token 認證
- OAuth 2.0

## CORS

API 預設允許所有來源的請求。可在 `.env` 中設定 `CORS_ORIGIN` 限制允許的來源。
