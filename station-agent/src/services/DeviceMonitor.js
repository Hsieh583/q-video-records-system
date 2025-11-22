const logger = require('../utils/logger');

class DeviceMonitor {
  constructor(config, apiClient) {
    this.config = config;
    this.apiClient = apiClient;
    this.monitorInterval = null;
    this.expectedDevices = config.expected_devices;
  }

  async start() {
    logger.info('Starting device monitor...');
    
    // Initial device check
    await this.checkAllDevices();

    // Schedule periodic checks
    const intervalMs = (this.config.health_check_interval || 30) * 1000;
    this.monitorInterval = setInterval(() => {
      this.checkAllDevices();
    }, intervalMs);

    logger.info(`Device monitor started (interval: ${this.config.health_check_interval}s)`);
  }

  async checkAllDevices() {
    try {
      // Check time drift
      await this.checkTimeDrift();

      // Check IPCAMs
      await this.checkIPCAMs();

      // Check NAS
      await this.checkNAS();

      // Check Scanner
      await this.checkScanner();

    } catch (error) {
      logger.error('Error in device monitoring:', error);
    }
  }

  async checkTimeDrift() {
    try {
      // Get NTP time or server time
      // For simplicity, we'll just check if system time is reasonable
      const systemTime = Date.now();
      const threshold = this.config.time_drift_threshold || 3;

      // In production, compare with NTP server or central API server time
      // For now, just report that time check was performed
      
      await this.apiClient.reportHealth({
        station_uid: this.config.station_uid,
        type: 'TIME_CHECK',
        status: 'OK',
        detail: { system_time: new Date(systemTime).toISOString() }
      });

    } catch (error) {
      logger.error('Time drift check failed:', error);
    }
  }

  async checkIPCAMs() {
    try {
      // ONVIF Discovery
      // This is a simplified version - full implementation would use node-onvif
      const discoveredCams = await this.discoverONVIFDevices();

      for (const expectedCam of this.expectedDevices.ipcams) {
        const found = discoveredCams.find(cam => cam.serial === expectedCam.expected_serial);
        
        if (!found) {
          // Camera missing or offline
          await this.apiClient.reportHealth({
            station_uid: this.config.station_uid,
            type: 'CAM_OFFLINE',
            status: 'ERROR',
            detail: { 
              role: expectedCam.role, 
              expected_serial: expectedCam.expected_serial 
            }
          });
          logger.warn(`Camera offline: ${expectedCam.role} (${expectedCam.expected_serial})`);
        } else if (found.serial !== expectedCam.expected_serial) {
          // Serial number changed
          await this.apiClient.reportHealth({
            station_uid: this.config.station_uid,
            type: 'CAM_SERIAL_CHANGED',
            status: 'ERROR',
            detail: { 
              role: expectedCam.role,
              expected: expectedCam.expected_serial,
              found: found.serial
            }
          });
          logger.error(`Camera serial mismatch: ${expectedCam.role}`);
        } else {
          // Register/update camera
          await this.apiClient.registerCamera({
            cam_uid: `${this.config.station_uid}-${expectedCam.role}`,
            serial_number: found.serial,
            last_seen_ip: found.ip,
            model: found.model
          });
        }
      }

    } catch (error) {
      logger.error('IPCAM check failed:', error);
    }
  }

  async discoverONVIFDevices() {
    // Simplified ONVIF discovery stub
    // In production, use node-onvif or similar library
    logger.debug('Performing ONVIF discovery...');
    
    // Return mock data for now
    return [];
    
    // Real implementation would be:
    // const Onvif = require('node-onvif');
    // const devices = await Onvif.startProbe();
    // return devices.map(device => ({
    //   serial: device.serialNumber,
    //   ip: device.address,
    //   model: device.model
    // }));
  }

  async checkNAS() {
    try {
      // Check NAS connectivity using Synology API
      // This is a simplified version
      const nasStatus = await this.checkSynologyNAS();

      if (!nasStatus.online) {
        await this.apiClient.reportHealth({
          station_uid: this.config.station_uid,
          type: 'NAS_OFFLINE',
          status: 'ERROR',
          detail: { expected_serial: this.expectedDevices.nas.expected_serial }
        });
        logger.warn('NAS offline');
      } else if (nasStatus.serial !== this.expectedDevices.nas.expected_serial) {
        await this.apiClient.reportHealth({
          station_uid: this.config.station_uid,
          type: 'NAS_SERIAL_CHANGED',
          status: 'ERROR',
          detail: {
            expected: this.expectedDevices.nas.expected_serial,
            found: nasStatus.serial
          }
        });
        logger.error('NAS serial number changed');
      } else {
        // Register/update NAS
        await this.apiClient.registerNAS({
          nas_uid: `${this.config.station_uid}-NAS`,
          serial_number: nasStatus.serial,
          last_seen_ip: nasStatus.ip,
          ss_version: nasStatus.ss_version,
          hostname: nasStatus.hostname
        });
      }

    } catch (error) {
      logger.error('NAS check failed:', error);
    }
  }

  async checkSynologyNAS() {
    // Simplified Synology NAS check stub
    // In production, use Synology API to check status
    logger.debug('Checking Synology NAS...');
    
    // Return mock data
    return {
      online: false,
      serial: null,
      ip: null,
      ss_version: null,
      hostname: null
    };
  }

  async checkScanner() {
    try {
      // Check if scanner is connected (USB device check)
      // This would check for specific VendorID/ProductID
      
      logger.debug('Checking barcode scanner...');
      
      // Simplified stub - in production, enumerate USB devices
      // and check for expected scanner VendorID/ProductID

    } catch (error) {
      logger.error('Scanner check failed:', error);
    }
  }

  async stop() {
    logger.info('Stopping device monitor...');
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    logger.info('Device monitor stopped');
  }
}

module.exports = DeviceMonitor;
