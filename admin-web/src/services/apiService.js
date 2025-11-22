import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiService = {
  // Health monitoring
  async getStationsHealth() {
    const response = await axios.get(`${API_BASE_URL}/health/stations`);
    return response.data;
  },

  async getStationHealth(stationUid) {
    const response = await axios.get(`${API_BASE_URL}/health/stations/${stationUid}`);
    return response.data;
  },

  // Device management
  async registerCamera(camData) {
    const response = await axios.post(`${API_BASE_URL}/admin/devices/cams`, camData);
    return response.data;
  },

  async registerNAS(nasData) {
    const response = await axios.post(`${API_BASE_URL}/admin/devices/nas`, nasData);
    return response.data;
  },

  async registerScanner(scannerData) {
    const response = await axios.post(`${API_BASE_URL}/admin/devices/scanners`, scannerData);
    return response.data;
  },

  // Station management
  async registerStation(stationData) {
    const response = await axios.post(`${API_BASE_URL}/admin/stations`, stationData);
    return response.data;
  },

  async bindDevicesToStation(bindingData) {
    const response = await axios.post(`${API_BASE_URL}/admin/station-devices/bind`, bindingData);
    return response.data;
  },

  // Statistics
  async getDailyStats(params) {
    const response = await axios.get(`${API_BASE_URL}/admin/stats/daily`, { params });
    return response.data;
  }
};

export default apiService;
