import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import DeviceManagement from './pages/DeviceManagement';
import StationManagement from './pages/StationManagement';
import Statistics from './pages/Statistics';

function App() {
  return (
    <div className="App">
      <nav className="App-nav">
        <div className="nav-header">
          <h1>Q Video Records Admin</h1>
          <p>後台管理系統</p>
        </div>
        <ul className="nav-links">
          <li><Link to="/">儀表板</Link></li>
          <li><Link to="/devices">設備管理</Link></li>
          <li><Link to="/stations">站點管理</Link></li>
          <li><Link to="/statistics">統計報表</Link></li>
        </ul>
      </nav>

      <main className="App-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<DeviceManagement />} />
          <Route path="/stations" element={<StationManagement />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
