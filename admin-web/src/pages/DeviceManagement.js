import React, { useState } from 'react';
import './DeviceManagement.css';

function DeviceManagement() {
  const [activeTab, setActiveTab] = useState('cameras');
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e, deviceType) => {
    e.preventDefault();
    console.log(`Registering ${deviceType}:`, formData);
    // API call would go here
    alert(`${deviceType} 註冊成功`);
    setFormData({});
  };

  const renderCameraForm = () => (
    <form onSubmit={(e) => handleSubmit(e, 'camera')} className="device-form">
      <h2>註冊攝影機 (IPCAM)</h2>
      <div className="form-group">
        <label>攝影機 UID *</label>
        <input 
          type="text" 
          required
          value={formData.cam_uid || ''}
          onChange={(e) => setFormData({...formData, cam_uid: e.target.value})}
          placeholder="例: CAM-001"
        />
      </div>
      <div className="form-group">
        <label>序列號 *</label>
        <input 
          type="text" 
          required
          value={formData.serial_number || ''}
          onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
          placeholder="攝影機序列號"
        />
      </div>
      <div className="form-group">
        <label>IP 位址</label>
        <input 
          type="text"
          value={formData.last_seen_ip || ''}
          onChange={(e) => setFormData({...formData, last_seen_ip: e.target.value})}
          placeholder="192.168.1.100"
        />
      </div>
      <div className="form-group">
        <label>型號</label>
        <input 
          type="text"
          value={formData.model || ''}
          onChange={(e) => setFormData({...formData, model: e.target.value})}
          placeholder="攝影機型號"
        />
      </div>
      <button type="submit" className="btn-primary">註冊攝影機</button>
    </form>
  );

  const renderNASForm = () => (
    <form onSubmit={(e) => handleSubmit(e, 'NAS')} className="device-form">
      <h2>註冊 NAS 設備</h2>
      <div className="form-group">
        <label>NAS UID *</label>
        <input 
          type="text" 
          required
          value={formData.nas_uid || ''}
          onChange={(e) => setFormData({...formData, nas_uid: e.target.value})}
          placeholder="例: NAS-001"
        />
      </div>
      <div className="form-group">
        <label>序列號 *</label>
        <input 
          type="text" 
          required
          value={formData.serial_number || ''}
          onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
          placeholder="NAS 序列號"
        />
      </div>
      <div className="form-group">
        <label>IP 位址</label>
        <input 
          type="text"
          value={formData.last_seen_ip || ''}
          onChange={(e) => setFormData({...formData, last_seen_ip: e.target.value})}
          placeholder="192.168.1.200"
        />
      </div>
      <div className="form-group">
        <label>主機名稱</label>
        <input 
          type="text"
          value={formData.hostname || ''}
          onChange={(e) => setFormData({...formData, hostname: e.target.value})}
          placeholder="NAS 主機名稱"
        />
      </div>
      <button type="submit" className="btn-primary">註冊 NAS</button>
    </form>
  );

  const renderScannerForm = () => (
    <form onSubmit={(e) => handleSubmit(e, 'scanner')} className="device-form">
      <h2>註冊掃描器</h2>
      <div className="form-group">
        <label>掃描器 UID *</label>
        <input 
          type="text" 
          required
          value={formData.scanner_uid || ''}
          onChange={(e) => setFormData({...formData, scanner_uid: e.target.value})}
          placeholder="例: SCANNER-001"
        />
      </div>
      <div className="form-group">
        <label>站點 UID *</label>
        <input 
          type="text" 
          required
          value={formData.station_uid || ''}
          onChange={(e) => setFormData({...formData, station_uid: e.target.value})}
          placeholder="所屬站點"
        />
      </div>
      <div className="form-group">
        <label>Vendor ID</label>
        <input 
          type="text"
          value={formData.vendor_id || ''}
          onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
          placeholder="USB Vendor ID"
        />
      </div>
      <div className="form-group">
        <label>Product ID</label>
        <input 
          type="text"
          value={formData.product_id || ''}
          onChange={(e) => setFormData({...formData, product_id: e.target.value})}
          placeholder="USB Product ID"
        />
      </div>
      <div className="form-group">
        <label>COM Port</label>
        <input 
          type="text"
          value={formData.com_port || ''}
          onChange={(e) => setFormData({...formData, com_port: e.target.value})}
          placeholder="COM3"
        />
      </div>
      <button type="submit" className="btn-primary">註冊掃描器</button>
    </form>
  );

  return (
    <div className="device-management">
      <h1>設備管理</h1>

      <div className="tabs">
        <button 
          className={activeTab === 'cameras' ? 'active' : ''}
          onClick={() => setActiveTab('cameras')}
        >
          攝影機管理
        </button>
        <button 
          className={activeTab === 'nas' ? 'active' : ''}
          onClick={() => setActiveTab('nas')}
        >
          NAS 管理
        </button>
        <button 
          className={activeTab === 'scanners' ? 'active' : ''}
          onClick={() => setActiveTab('scanners')}
        >
          掃描器管理
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'cameras' && renderCameraForm()}
        {activeTab === 'nas' && renderNASForm()}
        {activeTab === 'scanners' && renderScannerForm()}
      </div>
    </div>
  );
}

export default DeviceManagement;
