import React, { useState } from 'react';
import './StationManagement.css';

function StationManagement() {
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Creating station:', formData);
    alert('站點建立成功');
    setFormData({});
  };

  return (
    <div className="station-management">
      <h1>站點管理</h1>

      <div className="content-card">
        <form onSubmit={handleSubmit} className="station-form">
          <h2>建立 / 更新站點</h2>
          
          <div className="form-group">
            <label>站點 UID *</label>
            <input 
              type="text" 
              required
              value={formData.station_uid || ''}
              onChange={(e) => setFormData({...formData, station_uid: e.target.value})}
              placeholder="例: Q-STATION-001"
            />
          </div>

          <div className="form-group">
            <label>站點名稱 *</label>
            <input 
              type="text" 
              required
              value={formData.station_name || ''}
              onChange={(e) => setFormData({...formData, station_name: e.target.value})}
              placeholder="例: Q台-1號"
            />
          </div>

          <div className="form-group">
            <label>位置 *</label>
            <input 
              type="text" 
              required
              value={formData.location || ''}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="例: 倉庫 A 區"
            />
          </div>

          <div className="form-group">
            <label>設備綁定</label>
            <div className="device-binding">
              <h4>主鏡頭 (MAIN)</h4>
              <input 
                type="text"
                value={formData.main_cam_uid || ''}
                onChange={(e) => setFormData({...formData, main_cam_uid: e.target.value})}
                placeholder="主鏡頭 Camera UID"
              />

              <h4>環境鏡頭 (ENV)</h4>
              <input 
                type="text"
                value={formData.env_cam_uid || ''}
                onChange={(e) => setFormData({...formData, env_cam_uid: e.target.value})}
                placeholder="環境鏡頭 Camera UID"
              />

              <h4>NAS 設備</h4>
              <input 
                type="text"
                value={formData.nas_uid || ''}
                onChange={(e) => setFormData({...formData, nas_uid: e.target.value})}
                placeholder="NAS UID"
              />

              <h4>掃描器</h4>
              <input 
                type="text"
                value={formData.scanner_uid || ''}
                onChange={(e) => setFormData({...formData, scanner_uid: e.target.value})}
                placeholder="Scanner UID"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">建立站點</button>
        </form>
      </div>
    </div>
  );
}

export default StationManagement;
