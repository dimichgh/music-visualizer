import React from 'react';
import '../styles/Controls.css';

// Helper function to format time in MM:SS format
const formatTime = (timeInSeconds) => {
  if (timeInSeconds === undefined || isNaN(timeInSeconds)) return '0:00';
  
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Controls = ({
  isPlaying,
  togglePlayback,
  theme,
  changeTheme,
  audioSources,
  selectedSource,
  changeAudioSource,
  loadedFileName,
  onFileButtonClick,
  currentTime = 0,
  duration = 0
}) => {
  // Available visualization themes
  const themes = [
    { id: 'cosmic', name: 'Cosmic' },
    { id: 'fractal', name: '3D Fractals' },
    { id: 'galaxy', name: 'Galaxy' },
    { id: 'nightsky', name: 'Night Sky' },
    { id: 'concert', name: 'Concert' }
  ];

  return (
    <div className="controls-container">
      <div className="control-section">
        <h3>Audio Source</h3>
        <div className="control-options">
          <select 
            value={selectedSource || ''}
            onChange={(e) => changeAudioSource(e.target.value)}
            disabled={isPlaying}
          >
            <option value="" disabled>Select Audio Source</option>
            {audioSources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
          
          {/* Show file selection UI when file source is selected */}
          {selectedSource === 'file' && (
            <div className="file-selection">
              <button 
                className="file-select-button"
                onClick={onFileButtonClick}
                disabled={isPlaying}
              >
                Select Audio File
              </button>
              {loadedFileName && (
                <div className="loaded-file">
                  <span className="file-label">Loaded file:</span>
                  <span className="file-name">{loadedFileName}</span>
                  
                  {/* Audio progress indicator */}
                  {isPlaying && currentTime !== undefined && duration !== undefined && (
                    <div className="audio-progress">
                      <div className="progress-time">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${(currentTime / duration || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="control-section">
        <h3>Visualization Theme</h3>
        <div className="control-options theme-options-grid">
          {themes.map(themeOption => (
            <button
              key={themeOption.id}
              className={`theme-button ${theme === themeOption.id ? 'active' : ''}`}
              onClick={() => changeTheme(themeOption.id)}
            >
              {themeOption.name}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Playback</h3>
        <div className="control-options">
          <button 
            className={`playback-button ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlayback}
          >
            {isPlaying ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Visualization Controls</h3>
        
        {/* Galaxy-specific controls */}
        {theme === 'galaxy' && (
          <div className="control-options sliders">
            <div className="slider-control">
              <label>Camera Distance</label>
              <input 
                type="range" 
                min="20" 
                max="150" 
                defaultValue="60" 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  console.log(`Camera Distance slider changed to: ${value}`);
                  
                  // Try to use the bridge to update the config
                  if (window.visualizationBridge) {
                    // Try to debug the bridge first
                    window.visualizationBridge.debug && window.visualizationBridge.debug();
                    
                    // Update via the bridge method
                    window.visualizationBridge.updateGalaxyConfig('cameraDistance', value);
                    
                    // Also try direct update as a fallback
                    const galaxy = window.visualizationBridge.getCurrentGalaxy && window.visualizationBridge.getCurrentGalaxy();
                    if (galaxy) {
                      galaxy.updateConfig('cameraDistance', value);
                    }
                  } else {
                    console.error('visualizationBridge not found on window!');
                  }
                }}
              />
            </div>
            <div className="slider-control">
              <label>Camera Speed</label>
              <input 
                type="range" 
                min="0.01" 
                max="0.5" 
                step="0.01"
                defaultValue="0.12" 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  console.log(`Camera Speed slider changed to: ${value}`);
                  if (window.visualizationBridge) {
                    window.visualizationBridge.updateGalaxyConfig('cameraSpeed', value);
                  } else {
                    console.error('visualizationBridge not found on window!');
                  }
                }}
              />
            </div>
            <div className="slider-control">
              <label>Motion Damping</label>
              <input 
                type="range" 
                min="0.8" 
                max="0.99" 
                step="0.01"
                defaultValue="0.98" 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  console.log(`Motion Damping slider changed to: ${value}`);
                  if (window.visualizationBridge) {
                    window.visualizationBridge.updateGalaxyConfig('cameraDamping', value);
                  } else {
                    console.error('visualizationBridge not found on window!');
                  }
                }}
              />
            </div>
            <div className="slider-control">
              <label>Brightness</label>
              <input 
                type="range" 
                min="0.1" 
                max="3.0" 
                step="0.05"
                defaultValue="1.0" 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  console.log(`Brightness slider changed to: ${value}`);
                  if (window.visualizationBridge) {
                    window.visualizationBridge.updateGalaxyConfig('brightness', value);
                  } else {
                    console.error('visualizationBridge not found on window!');
                  }
                }}
              />
            </div>
            <div className="slider-control">
              <label>Glow Strength</label>
              <input 
                type="range" 
                min="0.1" 
                max="2.0" 
                step="0.05"
                defaultValue="0.7" 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  console.log(`Glow Strength slider changed to: ${value}`);
                  if (window.visualizationBridge) {
                    window.visualizationBridge.updateGalaxyConfig('bloomStrength', value);
                  } else {
                    console.error('visualizationBridge not found on window!');
                  }
                }}
              />
            </div>
            <div className="slider-control">
              <label>Glow Threshold</label>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                defaultValue="0.85" 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  console.log(`Glow Threshold slider changed to: ${value}`);
                  if (window.visualizationBridge) {
                    window.visualizationBridge.updateGalaxyConfig('bloomThreshold', value);
                  } else {
                    console.error('visualizationBridge not found on window!');
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {/* Default controls for other visualizations */}
        {theme !== 'galaxy' && (
          <div className="control-options sliders">
            <div className="slider-control">
              <label>Sensitivity</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="50" 
              />
            </div>
            <div className="slider-control">
              <label>Speed</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="50" 
              />
            </div>
            <div className="slider-control">
              <label>Intensity</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="50" 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Controls;
