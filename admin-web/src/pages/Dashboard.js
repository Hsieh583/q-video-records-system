import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import apiService from '../services/apiService';
import StationHealthCard from '../components/StationHealthCard';

function Dashboard() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStationsHealth();
    const interval = setInterval(fetchStationsHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStationsHealth = async () => {
    try {
      const data = await apiService.getStationsHealth();
      setStations(data.stations || []);
      setError(null);
    } catch (err) {
      setError('無法載入站點健康狀態');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { OK: 0, WARNING: 0, ERROR: 0, OFFLINE: 0 };
    stations.forEach(station => {
      const status = station.health_status || 'OFFLINE';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return <div className="dashboard"><div className="loading">載入中...</div></div>;
  }

  if (error) {
    return <div className="dashboard"><div className="error">{error}</div></div>;
  }

  return (
    <div className="dashboard">
      <h1>系統監控儀表板</h1>

      <div className="summary-cards">
        <div className="summary-card ok">
          <h3>正常運作</h3>
          <div className="count">{statusCounts.OK}</div>
        </div>
        <div className="summary-card warning">
          <h3>警告</h3>
          <div className="count">{statusCounts.WARNING}</div>
        </div>
        <div className="summary-card error">
          <h3>錯誤</h3>
          <div className="count">{statusCounts.ERROR}</div>
        </div>
        <div className="summary-card offline">
          <h3>離線</h3>
          <div className="count">{statusCounts.OFFLINE}</div>
        </div>
      </div>

      <div className="stations-grid">
        {stations.length > 0 ? (
          stations.map(station => (
            <StationHealthCard key={station.station_uid} station={station} />
          ))
        ) : (
          <div className="no-stations">暫無站點資料</div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
