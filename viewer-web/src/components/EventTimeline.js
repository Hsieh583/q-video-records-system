import React from 'react';
import './EventTimeline.css';

function EventTimeline({ events }) {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventTypeName = (type) => {
    const typeNames = {
      'ORDER': '訂單掃描',
      'PRODUCT': '商品序號',
      'FIELD1': '欄位1',
      'FIELD2': '欄位2',
      'FIELD3': '欄位3',
      'FIELD4': '欄位4',
      'Q': '完成包裝'
    };
    return typeNames[type] || type;
  };

  const getEventIcon = (type) => {
    const icons = {
      'ORDER': '📦',
      'PRODUCT': '🏷️',
      'Q': '✅'
    };
    return icons[type] || '📋';
  };

  return (
    <div className="event-timeline">
      <h2>掃描事件時間軸</h2>
      <div className="timeline">
        {events && events.length > 0 ? (
          events.map((event, index) => (
            <div key={event.id || index} className="timeline-item">
              <div className="timeline-marker">
                <span className="icon">{getEventIcon(event.event_type)}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-time">{formatTime(event.timestamp)}</div>
                <div className="timeline-type">{getEventTypeName(event.event_type)}</div>
                <div className="timeline-value">{event.barcode_value}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-events">無掃描事件紀錄</p>
        )}
      </div>
    </div>
  );
}

export default EventTimeline;
