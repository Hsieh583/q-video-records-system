import React from 'react';
import './StationHealthCard.css';

function StationHealthCard({ station }) {
  const getStatusColor = (status) => {
    const colors = {
      'OK': '#52c41a',
      'WARNING': '#faad14',
      'ERROR': '#f5222d',
      'OFFLINE': '#8c8c8c'
    };
    return colors[status] || '#8c8c8c';
  };

  const formatHeartbeatAge = (seconds) => {
    if (seconds < 60) return `${seconds}秒前`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分鐘前`;
    return `${Math.floor(seconds / 3600)}小時前`;
  };

  const status = station.health_status || 'OFFLINE';
  const statusColor = getStatusColor(status);

  return (
    <div className="station-health-card">
      <div className="card-header" style={{ borderLeftColor: statusColor }}>
        <div className="station-info">
          <h3>{station.station_name || station.station_uid}</h3>
          <p className="location">{station.location || 'N/A'}</p>
        </div>
        <div className="status-badge" style={{ backgroundColor: statusColor }}>
          {status}
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">站點ID:</span>
          <span className="value">{station.station_uid}</span>
        </div>
        
        <div className="info-row">
          <span className="label">Agent版本:</span>
          <span className="value">{station.agent_version || 'N/A'}</span>
        </div>
        
        <div className="info-row">
          <span className="label">最後心跳:</span>
          <span className="value">
            {station.last_heartbeat 
              ? formatHeartbeatAge(station.heartbeat_age_seconds || 0)
              : '從未連線'}
          </span>
        </div>

        <div className="alerts">
          {station.active_errors > 0 && (
            <div className="alert error">
              ⚠️ {station.active_errors} 個錯誤
            </div>
          )}
          {station.active_warnings > 0 && (
            <div className="alert warning">
              ⚡ {station.active_warnings} 個警告
            </div>
          )}
          {station.active_errors === 0 && station.active_warnings === 0 && status === 'OK' && (
            <div className="alert ok">
              ✓ 運作正常
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StationHealthCard;
