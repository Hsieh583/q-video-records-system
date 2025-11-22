const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const logger = require('../utils/logger');

class BarcodeScanner {
  constructor(config, eventQueue) {
    this.config = config;
    this.eventQueue = eventQueue;
    this.port = null;
    this.parser = null;
    this.currentOrder = null;
  }

  async start() {
    if (this.config.scan_mode === 'COM') {
      await this.startCOMMode();
    } else if (this.config.scan_mode === 'KEYBOARD') {
      await this.startKeyboardMode();
    } else {
      throw new Error(`Unknown scan mode: ${this.config.scan_mode}`);
    }
  }

  async startCOMMode() {
    try {
      logger.info(`Starting barcode scanner in COM mode on ${this.config.com_port}`);
      
      this.port = new SerialPort({
        path: this.config.com_port,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.parser.on('data', (line) => {
        this.processBarcodeData(line.trim());
      });

      this.port.on('error', (err) => {
        logger.error('Serial port error:', err);
        this.reportScannerHealth('ERROR', { error: err.message });
      });

      logger.info('Barcode scanner COM mode started successfully');
    } catch (error) {
      logger.error('Failed to start COM mode:', error);
      this.reportScannerHealth('ERROR', { error: error.message });
      throw error;
    }
  }

  async startKeyboardMode() {
    logger.warn('Keyboard Hook mode not fully implemented - requires platform-specific hooks');
    // This would require platform-specific keyboard hooks
    // For Windows: using node-global-key-listener or similar
    // Implementation would capture keyboard input and detect barcode patterns
    
    logger.info('Barcode scanner Keyboard mode initialized (stub)');
  }

  processBarcodeData(barcodeValue) {
    if (!barcodeValue) return;

    logger.debug('Barcode scanned:', { value: barcodeValue });

    // Identify barcode type based on patterns
    const eventType = this.identifyBarcodeType(barcodeValue);
    
    if (!eventType) {
      logger.warn('Unknown barcode pattern:', { value: barcodeValue });
      return;
    }

    // Store order number for subsequent scans
    if (eventType === 'ORDER') {
      this.currentOrder = barcodeValue;
    }

    // Create event
    const event = {
      station_uid: this.config.station_uid,
      event_type: eventType,
      order_no: this.currentOrder,
      barcode_value: barcodeValue,
      timestamp: new Date().toISOString(),
      local_pc_info: {
        version: require('../../package.json').version,
        ipv4: this.getLocalIP()
      }
    };

    // Queue event for sending
    this.eventQueue.enqueue(event);
    logger.info('Barcode event queued:', { type: eventType, order: this.currentOrder });

    // If Q is scanned, complete the order
    if (eventType === 'Q') {
      logger.info('Order completed:', { order_no: this.currentOrder });
      this.currentOrder = null;
    }
  }

  identifyBarcodeType(barcodeValue) {
    const patterns = this.config.barcode_patterns;
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const regex = new RegExp(pattern);
      if (regex.test(barcodeValue)) {
        return type;
      }
    }
    
    return null;
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

  async reportScannerHealth(status, detail) {
    try {
      const ApiClient = require('./ApiClient');
      const apiClient = new ApiClient(this.config);
      
      await apiClient.reportHealth({
        station_uid: this.config.station_uid,
        type: 'SCANNER_STATUS',
        status,
        detail
      });
    } catch (error) {
      logger.error('Failed to report scanner health:', error);
    }
  }

  async stop() {
    logger.info('Stopping barcode scanner...');
    
    if (this.port && this.port.isOpen) {
      await this.port.close();
      logger.info('Serial port closed');
    }
  }
}

module.exports = BarcodeScanner;
