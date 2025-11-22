import React, { useState } from 'react';
import './OrderSearch.css';
import apiService from '../services/apiService';

function OrderSearch({ onOrderFound, onError }) {
  const [orderNo, setOrderNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderNo.trim()) {
      return;
    }

    setLoading(true);

    try {
      const data = await apiService.getOrderEvents(orderNo.trim());
      
      if (data.success) {
        onOrderFound(data);
      } else {
        onError({ 
          message: data.message || '查無此訂單',
          suggestions: data.suggestions 
        });
      }
    } catch (error) {
      onError({ 
        message: error.response?.data?.error || '系統錯誤，請稍後再試',
        suggestions: error.response?.data?.suggestions
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-search">
      <h2>訂單查詢</h2>
      <form onSubmit={handleSubmit}>
        <div className="search-input-group">
          <input
            type="text"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="請輸入訂單號碼"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !orderNo.trim()}>
            {loading ? '查詢中...' : '查詢'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrderSearch;
