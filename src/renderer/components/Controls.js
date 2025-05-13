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
      </div>
    </div>
  );
};

export default Controls;
