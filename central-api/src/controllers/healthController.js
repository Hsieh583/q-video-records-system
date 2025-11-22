const { getPool, sql } = require('../config/database');
const logger = require('../config/logger');

// POST /api/health/report - Report health status from station agent
async function reportHealth(req, res) {
  try {
    const { station_uid, type, status, detail } = req.body;

    if (!station_uid || !type || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: station_uid, type, status' 
      });
    }

    const pool = await getPool();
    await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .input('type', sql.NVarChar(50), type)
      .input('status', sql.NVarChar(20), status)
      .input('detail', sql.NVarChar(sql.MAX), JSON.stringify(detail || {}))
      .query(`
        INSERT INTO health_logs (station_uid, type, status, detail)
        VALUES (@station_uid, @type, @status, @detail)
      `);

    // Update station heartbeat
    await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .query(`
        UPDATE stations
        SET last_heartbeat = GETDATE()
        WHERE station_uid = @station_uid
      `);

    logger.info(`Health report: ${type} - ${status} from ${station_uid}`);

    res.json({ success: true, message: 'Health status reported' });
  } catch (error) {
    logger.error('Error reporting health:', error);
    res.status(500).json({ error: 'Failed to report health', details: error.message });
  }
}

// GET /api/health/stations - Get health status of all stations
async function getStationsHealth(req, res) {
  try {
    const pool = await getPool();
    
    // Get all stations with recent heartbeat and health issues
    const result = await pool.request()
      .query(`
        SELECT 
          s.station_uid,
          s.station_name,
          s.location,
          s.agent_version,
          s.last_heartbeat,
          s.status,
          DATEDIFF(SECOND, s.last_heartbeat, GETDATE()) as heartbeat_age_seconds,
          COUNT(DISTINCT CASE WHEN hl.resolved = 0 AND hl.status = 'ERROR' THEN hl.id END) as active_errors,
          COUNT(DISTINCT CASE WHEN hl.resolved = 0 AND hl.status = 'WARNING' THEN hl.id END) as active_warnings
        FROM stations s
        LEFT JOIN health_logs hl ON s.station_uid = hl.station_uid 
          AND hl.timestamp > DATEADD(HOUR, -24, GETDATE())
        GROUP BY s.station_uid, s.station_name, s.location, s.agent_version, s.last_heartbeat, s.status
        ORDER BY s.station_name
      `);

    const stations = result.recordset.map(station => ({
      ...station,
      health_status: getHealthStatus(station)
    }));

    res.json({
      success: true,
      count: stations.length,
      stations
    });
  } catch (error) {
    logger.error('Error fetching stations health:', error);
    res.status(500).json({ error: 'Failed to fetch stations health', details: error.message });
  }
}

// GET /api/health/stations/:station_uid - Get detailed health info for a station
async function getStationHealth(req, res) {
  try {
    const { station_uid } = req.params;
    const pool = await getPool();

    // Get station info
    const stationResult = await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .query(`
        SELECT * FROM stations WHERE station_uid = @station_uid
      `);

    if (stationResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Get recent health logs
    const healthResult = await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .query(`
        SELECT TOP 50 * FROM health_logs
        WHERE station_uid = @station_uid
        ORDER BY timestamp DESC
      `);

    // Get device status
    const devicesResult = await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .query(`
        SELECT 
          sd.role,
          c.cam_uid,
          c.status as cam_status,
          c.last_seen_ip as cam_ip,
          c.model as cam_model,
          n.nas_uid,
          n.status as nas_status,
          n.last_seen_ip as nas_ip,
          s.scanner_uid,
          s.status as scanner_status,
          s.com_port
        FROM station_devices sd
        LEFT JOIN cams c ON sd.cam_uid = c.cam_uid
        LEFT JOIN nas n ON sd.nas_uid = n.nas_uid
        LEFT JOIN scanners s ON s.station_uid = sd.station_uid
        WHERE sd.station_uid = @station_uid AND sd.is_active = 1
      `);

    res.json({
      success: true,
      station: stationResult.recordset[0],
      devices: devicesResult.recordset,
      recent_health_logs: healthResult.recordset
    });
  } catch (error) {
    logger.error('Error fetching station health:', error);
    res.status(500).json({ error: 'Failed to fetch station health', details: error.message });
  }
}

// Helper function to determine overall health status
function getHealthStatus(station) {
  const heartbeatAge = station.heartbeat_age_seconds;
  
  if (heartbeatAge > 300) { // 5 minutes
    return 'ERROR';
  }
  
  if (station.active_errors > 0) {
    return 'ERROR';
  }
  
  if (heartbeatAge > 120 || station.active_warnings > 0) { // 2 minutes
    return 'WARNING';
  }
  
  return 'OK';
}

module.exports = {
  reportHealth,
  getStationsHealth,
  getStationHealth
};
