import React, { useState, useEffect } from 'react';
import './Statistics.css';

function Statistics() {
  const [stats, setStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      // API call would go here
      console.log('Fetching stats for:', dateRange);
      // Mock data
      setStats([
        { date: '2024-11-15', station_uid: 'Q-STATION-001', event_count: 234, query_count: 12, error_count: 1 },
        { date: '2024-11-16', station_uid: 'Q-STATION-001', event_count: 256, query_count: 15, error_count: 0 },
        { date: '2024-11-17', station_uid: 'Q-STATION-001', event_count: 189, query_count: 8, error_count: 2 }
      ]);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="statistics">
      <h1>統計報表</h1>

      <div className="filter-card">
        <h3>日期範圍</h3>
        <div className="date-filters">
          <div className="form-group">
            <label>開始日期</label>
            <input 
              type="date"
              value={dateRange.start_date}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>結束日期</label>
            <input 
              type="date"
              value={dateRange.end_date}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
            />
          </div>
          <button onClick={fetchStats} className="btn-primary">查詢</button>
        </div>
      </div>

      <div className="stats-card">
        <h3>每日統計</h3>
        
        {stats.length > 0 ? (
          <table className="stats-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>站點</th>
                <th>事件數</th>
                <th>查詢數</th>
                <th>錯誤數</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.date}</td>
                  <td>{stat.station_uid}</td>
                  <td>{stat.event_count}</td>
                  <td>{stat.query_count}</td>
                  <td className={stat.error_count > 0 ? 'error' : ''}>{stat.error_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">暫無統計資料</div>
        )}
      </div>
    </div>
  );
}

export default Statistics;
