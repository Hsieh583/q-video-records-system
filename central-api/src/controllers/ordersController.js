const { getPool, sql } = require('../config/database');
const logger = require('../config/logger');

// GET /api/orders/:order_no/events - Get events for a specific order
async function getOrderEvents(req, res) {
  try {
    const { order_no } = req.params;
    const { user_id, ip_address, user_agent } = req.body;

    if (!order_no) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    const pool = await getPool();

    // Log query audit
    await pool.request()
      .input('user_id', sql.NVarChar(100), user_id || 'anonymous')
      .input('order_no', sql.NVarChar(100), order_no)
      .input('ip_address', sql.NVarChar(50), ip_address || req.ip)
      .input('user_agent', sql.NVarChar(500), user_agent || req.headers['user-agent'])
      .query(`
        INSERT INTO query_audit (user_id, order_no, ip_address, user_agent)
        VALUES (@user_id, @order_no, @ip_address, @user_agent)
      `);

    // Get all events for this order
    const eventsResult = await pool.request()
      .input('order_no', sql.NVarChar(100), order_no)
      .query(`
        SELECT e.*, s.station_name, s.location
        FROM events e
        LEFT JOIN stations s ON e.station_uid = s.station_uid
        WHERE e.order_no = @order_no
        ORDER BY e.timestamp
      `);

    if (eventsResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        suggestions: [
          'The Q station may not have reported this event yet',
          'The barcode scanner may not be functioning properly',
          'Device serial numbers may not match configuration',
          'PC time on Q station may be incorrect (>3 seconds drift)'
        ]
      });
    }

    // Get the main scanning event timestamp (usually the first ORDER event or Q event)
    const mainEvent = eventsResult.recordset.find(e => e.event_type === 'Q') || eventsResult.recordset[0];
    const eventTime = new Date(mainEvent.timestamp);
    
    // Calculate playback window: T-60s to T+60s
    const playbackStart = new Date(eventTime.getTime() - 60000);
    const playbackEnd = new Date(eventTime.getTime() + 60000);

    // Get station device configuration
    const station_uid = mainEvent.station_uid;
    const devicesResult = await pool.request()
      .input('station_uid', sql.NVarChar(50), station_uid)
      .query(`
        SELECT 
          sd.role,
          c.cam_uid,
          c.serial_number as cam_serial,
          c.last_seen_ip as cam_ip,
          c.model as cam_model,
          n.nas_uid,
          n.serial_number as nas_serial,
          n.last_seen_ip as nas_ip,
          n.hostname as nas_hostname
        FROM station_devices sd
        LEFT JOIN cams c ON sd.cam_uid = c.cam_uid
        LEFT JOIN nas n ON sd.nas_uid = n.nas_uid
        WHERE sd.station_uid = @station_uid AND sd.is_active = 1
      `);

    // Build camera list with playback URLs
    const cameras = devicesResult.recordset.map(device => ({
      role: device.role,
      cam_uid: device.cam_uid,
      cam_serial: device.cam_serial,
      nas_hostname: device.nas_hostname,
      playback_url: generatePlaybackUrl(device, playbackStart, playbackEnd),
      proxy_url: `/api/playback/proxy/${station_uid}/${device.role}?start=${playbackStart.toISOString()}&end=${playbackEnd.toISOString()}`
    }));

    res.json({
      success: true,
      order_no,
      station_uid,
      station_name: mainEvent.station_name,
      location: mainEvent.location,
      timestamp: mainEvent.timestamp,
      playback_range: {
        start: playbackStart,
        end: playbackEnd
      },
      cameras,
      events: eventsResult.recordset
    });

    logger.info(`Order query: ${order_no} by ${user_id || 'anonymous'}`);
  } catch (error) {
    logger.error('Error fetching order events:', error);
    res.status(500).json({ error: 'Failed to fetch order events', details: error.message });
  }
}

// Helper function to generate playback URL
function generatePlaybackUrl(device, startTime, endTime) {
  if (!device.nas_ip || !device.cam_serial) {
    return null;
  }
  
  // Synology Surveillance Station playback URL format
  // This is a simplified version - actual implementation depends on SS API
  const start = Math.floor(startTime.getTime() / 1000);
  const end = Math.floor(endTime.getTime() / 1000);
  
  return `http://${device.nas_ip}:5000/webapi/entry.cgi?api=SYNO.SurveillanceStation.Streaming&version=1&method=Stream&cameraId=${device.cam_serial}&startTime=${start}&endTime=${end}`;
}

module.exports = {
  getOrderEvents
};
