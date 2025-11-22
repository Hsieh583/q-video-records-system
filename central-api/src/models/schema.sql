-- Q Video Records System Database Schema

-- Events table: stores all barcode scanning events
CREATE TABLE events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    station_uid NVARCHAR(50) NOT NULL,
    event_type NVARCHAR(50) NOT NULL, -- ORDER, PRODUCT, FIELD1-4, Q
    order_no NVARCHAR(100),
    barcode_value NVARCHAR(200),
    timestamp DATETIME2 NOT NULL,
    local_pc_info NVARCHAR(MAX), -- JSON format: version, IPv4, heartbeat
    created_at DATETIME2 DEFAULT GETDATE()
);
CREATE INDEX idx_events_order_no ON events(order_no);
CREATE INDEX idx_events_station_timestamp ON events(station_uid, timestamp);
CREATE INDEX idx_events_timestamp ON events(timestamp);

-- Cameras table: stores IPCAM information
CREATE TABLE cams (
    cam_uid NVARCHAR(50) PRIMARY KEY,
    serial_number NVARCHAR(100) NOT NULL UNIQUE,
    last_seen_ip NVARCHAR(50),
    model NVARCHAR(100),
    status NVARCHAR(20), -- ONLINE, OFFLINE, ERROR
    last_updated DATETIME2 DEFAULT GETDATE()
);

-- NAS table: stores NAS device information
CREATE TABLE nas (
    nas_uid NVARCHAR(50) PRIMARY KEY,
    serial_number NVARCHAR(100) NOT NULL UNIQUE,
    last_seen_ip NVARCHAR(50),
    ss_version NVARCHAR(50), -- Surveillance Station version
    hostname NVARCHAR(100),
    status NVARCHAR(20), -- ONLINE, OFFLINE, ERROR
    last_updated DATETIME2 DEFAULT GETDATE()
);

-- Station devices: binds cameras and NAS to stations
CREATE TABLE station_devices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    station_uid NVARCHAR(50) NOT NULL,
    cam_uid NVARCHAR(50),
    role NVARCHAR(20), -- MAIN, ENV
    nas_uid NVARCHAR(50),
    scanner_uid NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (cam_uid) REFERENCES cams(cam_uid),
    FOREIGN KEY (nas_uid) REFERENCES nas(nas_uid)
);
CREATE INDEX idx_station_devices_station ON station_devices(station_uid);

-- Stations table: stores station information
CREATE TABLE stations (
    station_uid NVARCHAR(50) PRIMARY KEY,
    station_name NVARCHAR(100),
    location NVARCHAR(200),
    agent_version NVARCHAR(20),
    last_heartbeat DATETIME2,
    status NVARCHAR(20), -- ONLINE, OFFLINE, WARNING, ERROR
    config NVARCHAR(MAX), -- JSON format
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Scanners table: stores barcode scanner information
CREATE TABLE scanners (
    scanner_uid NVARCHAR(50) PRIMARY KEY,
    vendor_id NVARCHAR(50),
    product_id NVARCHAR(50),
    com_port NVARCHAR(20),
    station_uid NVARCHAR(50),
    status NVARCHAR(20), -- ONLINE, OFFLINE
    last_updated DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (station_uid) REFERENCES stations(station_uid)
);

-- Health logs: stores system health events
CREATE TABLE health_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    station_uid NVARCHAR(50),
    type NVARCHAR(50) NOT NULL, -- CAM_OFFLINE, NAS_OFFLINE, SCANNER_MISSING, TIME_DRIFT, etc.
    status NVARCHAR(20), -- OK, WARNING, ERROR
    detail NVARCHAR(MAX), -- JSON format with details
    timestamp DATETIME2 DEFAULT GETDATE(),
    resolved BIT DEFAULT 0,
    resolved_at DATETIME2
);
CREATE INDEX idx_health_logs_station ON health_logs(station_uid, timestamp);
CREATE INDEX idx_health_logs_status ON health_logs(status, resolved);

-- Query audit: tracks who queried which orders
CREATE TABLE query_audit (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(100),
    order_no NVARCHAR(100),
    query_time DATETIME2 DEFAULT GETDATE(),
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(500)
);
CREATE INDEX idx_query_audit_order ON query_audit(order_no);
CREATE INDEX idx_query_audit_user ON query_audit(user_id, query_time);

-- Statistics: daily aggregated stats
CREATE TABLE daily_stats (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL,
    station_uid NVARCHAR(50),
    event_count INT DEFAULT 0,
    query_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    UNIQUE(date, station_uid)
);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
