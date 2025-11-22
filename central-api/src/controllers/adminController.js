const { getPool, sql } = require('../config/database');
const logger = require('../config/logger');

// Device Binding Management

// POST /api/admin/devices/cams - Register or update a camera
async function registerCamera(req, res) {
  try {
    const { cam_uid, serial_number, last_seen_ip, model } = req.body;

    if (!cam_uid || !serial_number) {
      return res.status(400).json({ error: 'cam_uid and serial_number are required' });
    }

    const pool = await getPool();
    await pool.request()
      .input('cam_uid', sql.NVarChar(50), cam_uid)
      .input('serial_number', sql.NVarChar(100), serial_number)
      .input('last_seen_ip', sql.NVarChar(50), last_seen_ip || null)
      .input('model', sql.NVarChar(100), model || null)
      .query(`
        MERGE cams AS target
        USING (SELECT @cam_uid AS cam_uid) AS source
        ON target.cam_uid = source.cam_uid
        WHEN MATCHED THEN
          UPDATE SET serial_number = @serial_number, last_seen_ip = @last_seen_ip, 
                     model = @model, last_updated = GETDATE(), status = 'ONLINE'
        WHEN NOT MATCHED THEN
          INSERT (cam_uid, serial_number, last_seen_ip, model, status)
          VALUES (@cam_uid, @serial_number, @last_seen_ip, @model, 'ONLINE');
      `);

    logger.info(`Camera registered: ${cam_uid} - ${serial_number}`);
    res.json({ success: true, message: 'Camera registered successfully' });
  } catch (error) {
    logger.error('Error registering camera:', error);
    res.status(500).json({ error: 'Failed to register camera', details: error.message });
  }
}

// POST /api/admin/devices/nas - Register or update NAS
async function registerNAS(req, res) {
  try {
    const { nas_uid, serial_number, last_seen_ip, ss_version, hostname } = req.body;

    if (!nas_uid || !serial_number) {
      return res.status(400).json({ error: 'nas_uid and serial_number are required' });
    }

    const pool = await getPool();
    await pool.request()
      .input('nas_uid', sql.NVarChar(50), nas_uid)
      .input('serial_number', sql.NVarChar(100), serial_number)
      .input('last_seen_ip', sql.NVarChar(50), last_seen_ip || null)
      .input('ss_version', sql.NVarChar(50), ss_version || null)
      .input('hostname', sql.NVarChar(100), hostname || null)
      .query(`
        MERGE nas AS target
        USING (SELECT @nas_uid AS nas_uid) AS source
        ON target.nas_uid = source.nas_uid
        WHEN MATCHED THEN
          UPDATE SET serial_number = @serial_number, last_seen_ip = @last_seen_ip,
                     ss_version = @ss_version, hostname = @hostname, 
                     last_updated = GETDATE(), status = 'ONLINE'
        WHEN NOT MATCHED THEN
          INSERT (nas_uid, serial_number, last_seen_ip, ss_version, hostname, status)
          VALUES (@nas_uid, @serial_number, @last_seen_ip, @ss_version, @hostname, 'ONLINE');
      `);

    logger.info(`NAS registered: ${nas_uid} - ${serial_number}`);
    res.json({ success: true, message: 'NAS registered successfully' });
  } catch (error) {
    logger.error('Error registering NAS:', error);
    res.status(500).json({ error: 'Failed to register NAS', details: error.message });
  }
}

// POST /api/admin/devices/scanners - Register or update scanner
async function registerScanner(req, res) {
  try {
    const { scanner_uid, vendor_id, product_id, com_port, station_uid } = req.body;

    if (!scanner_uid || !station_uid) {
      return res.status(400).json({ error: 'scanner_uid and station_uid are required' });
    }

    const pool = await getPool();
    await pool.request()
      .input('scanner_uid', sql.NVarChar(50), scanner_uid)
      .input('vendor_id', sql.NVarChar(50), vendor_id || null)
      .input('product_id', sql.NVarChar(50), product_id || null)
      .input('com_port', sql.NVarChar(20), com_port || null)
      .input('station_uid', sql.NVarChar(50), station_uid)
      .query(`
        MERGE scanners AS target
        USING (SELECT @scanner_uid AS scanner_uid) AS source
        ON target.scanner_uid = source.scanner_uid
        WHEN MATCHED THEN
          UPDATE SET vendor_id = @vendor_id, product_id = @product_id,
                     com_port = @com_port, station_uid = @station_uid,
                     last_updated = GETDATE(), status = 'ONLINE'
        WHEN NOT MATCHED THEN
          INSERT (scanner_uid, vendor_id, product_id, com_port, station_uid, status)
          VALUES (@scanner_uid, @vendor_id, @product_id, @com_port, @station_uid, 'ONLINE');
      `);

    logger.info(`Scanner registered: ${scanner_uid} at station ${station_uid}`);
    res.json({ success: true, message: 'Scanner registered successfully' });
  } catch (error) {
    logger.error('Error registering scanner:', error);
    res.status(500).json({ error: 'Failed to register scanner', details: error.message });
  }
}

// POST /api/admin/stations - Create or update station
async function registerStation(req, res) {
  try {
    const { station_uid, station_name, location, config } = req.body;

    if (!station_uid) {
      return res.status(400).json({ error: 'station_uid is required' });
    }

    const pool = await getPool();
    await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .input('station_name', sql.NVarChar(100), station_name || null)
      .input('location', sql.NVarChar(200), location || null)
      .input('config', sql.NVarChar(sql.MAX), JSON.stringify(config || {}))
      .query(`
        MERGE stations AS target
        USING (SELECT @station_uid AS station_uid) AS source
        ON target.station_uid = source.station_uid
        WHEN MATCHED THEN
          UPDATE SET station_name = @station_name, location = @location,
                     config = @config, status = 'ONLINE'
        WHEN NOT MATCHED THEN
          INSERT (station_uid, station_name, location, config, status)
          VALUES (@station_uid, @station_name, @location, @config, 'ONLINE');
      `);

    logger.info(`Station registered: ${station_uid}`);
    res.json({ success: true, message: 'Station registered successfully' });
  } catch (error) {
    logger.error('Error registering station:', error);
    res.status(500).json({ error: 'Failed to register station', details: error.message });
  }
}

// POST /api/admin/station-devices/bind - Bind devices to a station
async function bindDevicesToStation(req, res) {
  try {
    const { station_uid, cam_uid, role, nas_uid, scanner_uid } = req.body;

    if (!station_uid) {
      return res.status(400).json({ error: 'station_uid is required' });
    }

    const pool = await getPool();
    await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .input('cam_uid', sql.NVarChar(50), cam_uid || null)
      .input('role', sql.NVarChar(20), role || null)
      .input('nas_uid', sql.NVarChar(50), nas_uid || null)
      .input('scanner_uid', sql.NVarChar(50), scanner_uid || null)
      .query(`
        INSERT INTO station_devices (station_uid, cam_uid, role, nas_uid, scanner_uid)
        VALUES (@station_uid, @cam_uid, @role, @nas_uid, @scanner_uid)
      `);

    logger.info(`Device binding: ${station_uid} - cam:${cam_uid}, nas:${nas_uid}`);
    res.json({ success: true, message: 'Devices bound to station successfully' });
  } catch (error) {
    logger.error('Error binding devices:', error);
    res.status(500).json({ error: 'Failed to bind devices', details: error.message });
  }
}

// GET /api/admin/stats/daily - Get daily statistics
async function getDailyStats(req, res) {
  try {
    const { start_date, end_date, station_uid } = req.query;
    const pool = await getPool();

    let query = 'SELECT * FROM daily_stats WHERE 1=1';
    const request = pool.request();

    if (start_date) {
      query += ' AND date >= @start_date';
      request.input('start_date', sql.Date, new Date(start_date));
    }

    if (end_date) {
      query += ' AND date <= @end_date';
      request.input('end_date', sql.Date, new Date(end_date));
    }

    if (station_uid) {
      query += ' AND station_uid = @station_uid';
      request.input('station_uid', sql.NVarChar(50), station_uid);
    }

    query += ' ORDER BY date DESC, station_uid';

    const result = await request.query(query);

    res.json({
      success: true,
      count: result.recordset.length,
      stats: result.recordset
    });
  } catch (error) {
    logger.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats', details: error.message });
  }
}

module.exports = {
  registerCamera,
  registerNAS,
  registerScanner,
  registerStation,
  bindDevicesToStation,
  getDailyStats
};
