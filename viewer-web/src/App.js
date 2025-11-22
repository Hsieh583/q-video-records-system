import React, { useState } from 'react';
import './App.css';
import OrderSearch from './components/OrderSearch';
import VideoPlayer from './components/VideoPlayer';
import EventTimeline from './components/EventTimeline';

function App() {
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  const handleOrderFound = (data) => {
    setOrderData(data);
    setError(null);
  };

  const handleError = (err) => {
    setError(err);
    setOrderData(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Q Video Records Viewer</h1>
        <p>出貨影像查詢系統</p>
      </header>

      <main className="App-main">
        <OrderSearch onOrderFound={handleOrderFound} onError={handleError} />

        {error && (
          <div className="error-message">
            <h3>查詢失敗</h3>
            <p>{error.message}</p>
            {error.suggestions && (
              <div className="suggestions">
                <h4>可能原因：</h4>
                <ul>
                  {error.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {orderData && (
          <div className="order-results">
            <div className="order-info">
              <h2>訂單資訊</h2>
              <p><strong>訂單號：</strong>{orderData.order_no}</p>
              <p><strong>站點：</strong>{orderData.station_name} ({orderData.location})</p>
              <p><strong>時間：</strong>{new Date(orderData.timestamp).toLocaleString('zh-TW')}</p>
            </div>

            <VideoPlayer cameras={orderData.cameras} playbackRange={orderData.playback_range} />

            <EventTimeline events={orderData.events} />
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>© 2024 Q Video Records System</p>
      </footer>
    </div>
  );
}

export default App;
