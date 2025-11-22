const express = require('express');
const eventsController = require('../controllers/eventsController');
const ordersController = require('../controllers/ordersController');
const healthController = require('../controllers/healthController');
const adminController = require('../controllers/adminController');
const { apiLimiter, strictLimiter, agentLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Events API - Higher limit for station agents
router.post('/events/log', agentLimiter, eventsController.logEvent);
router.get('/events', apiLimiter, eventsController.getEvents);

// Orders API - Standard limit
router.post('/orders/:order_no/events', apiLimiter, ordersController.getOrderEvents);

// Health API - Higher limit for station agents
router.post('/health/report', agentLimiter, healthController.reportHealth);
router.get('/health/stations', apiLimiter, healthController.getStationsHealth);
router.get('/health/stations/:station_uid', apiLimiter, healthController.getStationHealth);

// Admin API - Strict limit for device management
router.post('/admin/devices/cams', strictLimiter, adminController.registerCamera);
router.post('/admin/devices/nas', strictLimiter, adminController.registerNAS);
router.post('/admin/devices/scanners', strictLimiter, adminController.registerScanner);
router.post('/admin/stations', strictLimiter, adminController.registerStation);
router.post('/admin/station-devices/bind', strictLimiter, adminController.bindDevicesToStation);

// Admin API - Statistics
router.get('/admin/stats/daily', apiLimiter, adminController.getDailyStats);

module.exports = router;
