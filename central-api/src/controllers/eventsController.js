const { getPool, sql } = require('../config/database');
const logger = require('../config/logger');

// POST /api/events/log - Log a barcode scanning event
async function logEvent(req, res) {
  try {
    const { station_uid, event_type, order_no, barcode_value, timestamp, local_pc_info } = req.body;

    // Validation
    if (!station_uid || !event_type || !timestamp) {
      return res.status(400).json({ 
        error: 'Missing required fields: station_uid, event_type, timestamp' 
      });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .input('event_type', sql.NVarChar(50), event_type)
      .input('order_no', sql.NVarChar(100), order_no || null)
      .input('barcode_value', sql.NVarChar(200), barcode_value || null)
      .input('timestamp', sql.DateTime2, new Date(timestamp))
      .input('local_pc_info', sql.NVarChar(sql.MAX), JSON.stringify(local_pc_info || {}))
      .query(`
        INSERT INTO events (station_uid, event_type, order_no, barcode_value, timestamp, local_pc_info)
        VALUES (@station_uid, @event_type, @order_no, @barcode_value, @timestamp, @local_pc_info);
        SELECT SCOPE_IDENTITY() as id;
      `);

    logger.info(`Event logged: ${event_type} from ${station_uid}`, { order_no, event_id: result.recordset[0].id });

    res.status(201).json({
      success: true,
      event_id: result.recordset[0].id,
      message: 'Event logged successfully'
    });
  } catch (error) {
    logger.error('Error logging event:', error);
    res.status(500).json({ error: 'Failed to log event', details: error.message });
  }
}

// GET /api/events - Get events with filters
async function getEvents(req, res) {
  try {
    const { station_uid, order_no, event_type, from_date, to_date, limit = 100 } = req.query;

    const pool = await getPool();
    let query = 'SELECT * FROM events WHERE 1=1';
    const request = pool.request();

    if (station_uid) {
      query += ' AND station_uid = @station_uid';
      request.input('station_uid', sql.NVarChar(50), station_uid);
    }

    if (order_no) {
      query += ' AND order_no = @order_no';
      request.input('order_no', sql.NVarChar(100), order_no);
    }

    if (event_type) {
      query += ' AND event_type = @event_type';
      request.input('event_type', sql.NVarChar(50), event_type);
    }

    if (from_date) {
      query += ' AND timestamp >= @from_date';
      request.input('from_date', sql.DateTime2, new Date(from_date));
    }

    if (to_date) {
      query += ' AND timestamp <= @to_date';
      request.input('to_date', sql.DateTime2, new Date(to_date));
    }

    query += ' ORDER BY timestamp DESC';
    query += ` OFFSET 0 ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;

    const result = await request.query(query);

    res.json({
      success: true,
      count: result.recordset.length,
      events: result.recordset
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
}

module.exports = {
  logEvent,
  getEvents
};
