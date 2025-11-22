const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const BarcodeScanner = require('./services/BarcodeScanner');
const DeviceMonitor = require('./services/DeviceMonitor');
const ApiClient = require('./services/ApiClient');
const EventQueue = require('./services/EventQueue');

class StationAgent {
  constructor() {
    this.config = this.loadConfig();
    this.apiClient = new ApiClient(this.config);
    this.eventQueue = new EventQueue(this.apiClient);
    this.barcodeScanner = null;
    this.deviceMonitor = null;
    this.isRunning = false;
  }

  loadConfig() {
    try {
      const configPath = process.env.CONFIG_PATH || path.join(__dirname, '../config/config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      logger.info('Configuration loaded successfully', { station_uid: config.station_uid });
      return config;
    } catch (error) {
      logger.error('Failed to load configuration:', error);
      process.exit(1);
    }
  }

  async start() {
    logger.info('Starting Station Agent...', { 
      station_uid: this.config.station_uid,
      version: require('../package.json').version
    });

    try {
      // Initialize barcode scanner
      this.barcodeScanner = new BarcodeScanner(this.config, this.eventQueue);
      await this.barcodeScanner.start();
      logger.info('Barcode scanner initialized');

      // Initialize device monitor
      this.deviceMonitor = new DeviceMonitor(this.config, this.apiClient);
      await this.deviceMonitor.start();
      logger.info('Device monitor initialized');

      // Start event queue processor
      this.eventQueue.start();
      logger.info('Event queue started');

      this.isRunning = true;
      logger.info('Station Agent started successfully');

      // Send initial heartbeat
      await this.sendHeartbeat();

      // Setup heartbeat interval
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 60000); // Every minute

    } catch (error) {
      logger.error('Failed to start Station Agent:', error);
      process.exit(1);
    }
  }

  async sendHeartbeat() {
    try {
      const pcInfo = {
        version: require('../package.json').version,
        ipv4: this.getLocalIP(),
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };

      await this.apiClient.reportHealth({
        station_uid: this.config.station_uid,
        type: 'HEARTBEAT',
        status: 'OK',
        detail: pcInfo
      });

      logger.debug('Heartbeat sent');
    } catch (error) {
      logger.error('Failed to send heartbeat:', error);
    }
  }

  getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return '127.0.0.1';
  }

  async stop() {
    logger.info('Stopping Station Agent...');
    this.isRunning = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.barcodeScanner) {
      await this.barcodeScanner.stop();
    }

    if (this.deviceMonitor) {
      await this.deviceMonitor.stop();
    }

    if (this.eventQueue) {
      this.eventQueue.stop();
    }

    logger.info('Station Agent stopped');
  }
}

// Handle process signals
const agent = new StationAgent();

agent.start().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await agent.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await agent.stop();
  process.exit(0);
});

module.exports = StationAgent;
