const logger = console;

// In-memory data store
const store = {
  events: [],
  stations: [],
  station_devices: [],
  cams: [],
  nas: [],
  scanners: [],
  health_logs: [],
  query_audit: [],
  daily_stats: []
};

// Mock Request class
class MockRequest {
  constructor() {
    this.params = {};
    this.inputs = {};
  }

  input(name, type, value) {
    this.inputs[name] = value;
    return this;
  }

  async query(queryStr) {
    // Simple parsing to identify operation
    const lowerQuery = queryStr.toLowerCase();

    if (lowerQuery.includes('insert into events')) {
      return this.mockInsertEvent();
    } else if (lowerQuery.includes('select') && lowerQuery.includes('from events')) {
      return this.mockGetEvents();
    } else if (lowerQuery.includes('insert into health_logs')) {
      return this.mockInsertHealth();
    } else if (lowerQuery.includes('select') && lowerQuery.includes('from stations')) {
      return this.mockGetStations();
    }

    // Default success response for other queries
    return { recordset: [], rowsAffected: [1] };
  }

  async execute(procedure) {
    return { recordset: [], returnValue: 0 };
  }

  // Mock implementations
  mockInsertEvent() {
    const event = {
      id: store.events.length + 1,
      station_uid: this.inputs.station_uid,
      event_type: this.inputs.event_type,
      order_no: this.inputs.order_no,
      barcode_value: this.inputs.barcode_value,
      timestamp: this.inputs.timestamp || new Date()
    };
    store.events.push(event);
    return {
      rowsAffected: [1],
      recordset: [{ id: event.id }]
    };
  }

  mockGetEvents() {
    // Filter logic could be added here if needed
    // For now, return all events matching order_no if provided
    let results = store.events;
    if (this.inputs.order_no) {
      results = results.filter(e => e.order_no === this.inputs.order_no);
    }
    return { recordset: results };
  }

  mockInsertHealth() {
    const log = {
      id: store.health_logs.length + 1,
      station_uid: this.inputs.station_uid,
      type: this.inputs.type,
      status: this.inputs.status,
      detail: this.inputs.detail,
      timestamp: new Date()
    };
    store.health_logs.push(log);
    return { rowsAffected: [1] };
  }

  mockGetStations() {
    // Return a mock station if none exist, to allow binding
    if (store.stations.length === 0) {
      return {
        recordset: [{
          station_uid: 'Q-STATION-001',
          name: 'Simulation Station',
          created_at: new Date()
        }]
      };
    }
    return { recordset: store.stations };
  }
}

// Mock Pool class
class MockPool {
  async connect() {
    logger.info('Connected to MOCK database');
    return this;
  }

  request() {
    return new MockRequest();
  }

  async close() {
    return true;
  }
}

const pool = new MockPool();

async function getPool() {
  return pool;
}

module.exports = { getPool, sql: { VarChar: 'VarChar', Int: 'Int', DateTime: 'DateTime', NVarChar: 'NVarChar' } };
