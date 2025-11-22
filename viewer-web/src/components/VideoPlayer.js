import React, { useState } from 'react';
import './VideoPlayer.css';

function VideoPlayer({ cameras, playbackRange }) {
  const [useProxy, setUseProxy] = useState(true);

  const getVideoUrl = (camera) => {
    return useProxy ? camera.proxy_url : camera.playback_url;
  };

  const mainCamera = cameras.find(cam => cam.role === 'MAIN');
  const envCamera = cameras.find(cam => cam.role === 'ENV');

  return (
    <div className="video-player">
      <div className="video-header">
        <h2>影像播放</h2>
        <div className="playback-info">
          <p>播放時間範圍：{new Date(playbackRange.start).toLocaleTimeString('zh-TW')} - {new Date(playbackRange.end).toLocaleTimeString('zh-TW')}</p>
          <label>
            <input 
              type="checkbox" 
              checked={useProxy} 
              onChange={(e) => setUseProxy(e.target.checked)}
            />
            使用代理模式
          </label>
        </div>
      </div>

      <div className="video-grid">
        {mainCamera && (
          <div className="video-container">
            <h3>主鏡頭 (MAIN)</h3>
            <div className="video-wrapper">
              {mainCamera.playback_url || mainCamera.proxy_url ? (
                <video controls width="100%">
                  <source src={getVideoUrl(mainCamera)} type="video/mp4" />
                  您的瀏覽器不支援影片播放
                </video>
              ) : (
                <div className="video-placeholder">
                  <p>無可用影像</p>
                  <small>NAS: {mainCamera.nas_hostname || '未連線'}</small>
                </div>
              )}
            </div>
          </div>
        )}

        {envCamera && (
          <div className="video-container">
            <h3>環境鏡頭 (ENV)</h3>
            <div className="video-wrapper">
              {envCamera.playback_url || envCamera.proxy_url ? (
                <video controls width="100%">
                  <source src={getVideoUrl(envCamera)} type="video/mp4" />
                  您的瀏覽器不支援影片播放
                </video>
              ) : (
                <div className="video-placeholder">
                  <p>無可用影像</p>
                  <small>NAS: {envCamera.nas_hostname || '未連線'}</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!mainCamera && !envCamera && (
        <div className="no-cameras">
          <p>此站點尚未配置攝影機</p>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
