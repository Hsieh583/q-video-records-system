const logger = require('../utils/logger');

class EventQueue {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.queue = [];
    this.isProcessing = false;
    this.maxQueueSize = 1000;
    this.processingInterval = null;
  }

  start() {
    logger.info('Starting event queue processor...');
    
    // Process queue every 2 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 2000);
    
    logger.info('Event queue processor started');
  }

  enqueue(event) {
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn('Event queue full, dropping oldest event');
      this.queue.shift();
    }
    
    this.queue.push(event);
    logger.debug('Event enqueued:', { queue_size: this.queue.length });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const event = this.queue[0];
        
        try {
          await this.apiClient.logEvent(event);
          this.queue.shift(); // Remove successfully sent event
          logger.debug('Event sent successfully:', { remaining: this.queue.length });
        } catch (error) {
          logger.error('Failed to send event, will retry:', { error: error.message });
          break; // Stop processing and retry later
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  stop() {
    logger.info('Stopping event queue processor...');
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Try to send remaining events
    if (this.queue.length > 0) {
      logger.info(`${this.queue.length} events remaining in queue`);
      this.processQueue();
    }
    
    logger.info('Event queue processor stopped');
  }

  getQueueSize() {
    return this.queue.length;
  }
}

module.exports = EventQueue;
