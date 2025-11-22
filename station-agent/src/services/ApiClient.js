const axios = require('axios');
const logger = require('../utils/logger');

class ApiClient {
  constructor(config) {
    this.config = config;
    this.baseURL = config.api_endpoint;
    this.retryInterval = (config.retry_interval || 5) * 1000;
  }

  async logEvent(event) {
    try {
      const response = await axios.post(`${this.baseURL}/events/log`, event, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.debug('Event logged successfully:', { event_id: response.data.event_id });
      return response.data;
    } catch (error) {
      logger.error('Failed to log event:', { error: error.message });
      throw error;
    }
  }

  async reportHealth(healthData) {
    try {
      const response = await axios.post(`${this.baseURL}/health/report`, healthData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.debug('Health reported successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to report health:', { error: error.message });
      throw error;
    }
  }

  async registerCamera(camData) {
    try {
      const response = await axios.post(`${this.baseURL}/admin/devices/cams`, camData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.debug('Camera registered:', { cam_uid: camData.cam_uid });
      return response.data;
    } catch (error) {
      logger.error('Failed to register camera:', { error: error.message });
      throw error;
    }
  }

  async registerNAS(nasData) {
    try {
      const response = await axios.post(`${this.baseURL}/admin/devices/nas`, nasData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.debug('NAS registered:', { nas_uid: nasData.nas_uid });
      return response.data;
    } catch (error) {
      logger.error('Failed to register NAS:', { error: error.message });
      throw error;
    }
  }

  async registerScanner(scannerData) {
    try {
      const response = await axios.post(`${this.baseURL}/admin/devices/scanners`, scannerData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.debug('Scanner registered:', { scanner_uid: scannerData.scanner_uid });
      return response.data;
    } catch (error) {
      logger.error('Failed to register scanner:', { error: error.message });
      throw error;
    }
  }
}

module.exports = ApiClient;
