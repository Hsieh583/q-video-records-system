const express = require('express');
const eventsController = require('../controllers/eventsController');
const ordersController = require('../controllers/ordersController');
const healthController = require('../controllers/healthController');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Events API
router.post('/events/log', eventsController.logEvent);
router.get('/events', eventsController.getEvents);

// Orders API
router.post('/orders/:order_no/events', ordersController.getOrderEvents);

// Health API
router.post('/health/report', healthController.reportHealth);
router.get('/health/stations', healthController.getStationsHealth);
router.get('/health/stations/:station_uid', healthController.getStationHealth);

// Admin API - Device Management
router.post('/admin/devices/cams', adminController.registerCamera);
router.post('/admin/devices/nas', adminController.registerNAS);
router.post('/admin/devices/scanners', adminController.registerScanner);
router.post('/admin/stations', adminController.registerStation);
router.post('/admin/station-devices/bind', adminController.bindDevicesToStation);

// Admin API - Statistics
router.get('/admin/stats/daily', adminController.getDailyStats);

module.exports = router;
