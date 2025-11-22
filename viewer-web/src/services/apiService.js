import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiService = {
  async getOrderEvents(orderNo) {
    const response = await axios.post(`${API_BASE_URL}/orders/${orderNo}/events`, {
      user_id: 'viewer_user',
      ip_address: window.location.hostname
    });
    return response.data;
  },

  async getHealth() {
    const response = await axios.get(`${API_BASE_URL}/health/stations`);
    return response.data;
  }
};

export default apiService;
