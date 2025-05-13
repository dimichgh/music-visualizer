import React, { useState, useEffect, useRef } from 'react';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';
import AudioAnalyzer from '../audio/AudioAnalyzer';
import AudioFileAnalyzer from '../audio/AudioFileAnalyzer';

const App = () => {
  // State for visualization settings and audio data
  const [visualizationTheme, setVisualizationTheme] = useState('galaxy');
  const [audioData, setAudioData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSources, setAudioSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [loadedFileName, setLoadedFileName] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // References
  const audioFileAnalyzerRef = useRef(null);
  const fileInputRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  // Initialize audio sources
  useEffect(() => {
    const loadAudioSources = async () => {
      try {
        // Always add file source option
        const sources = [
          { id: 'file', name: 'Audio File (WAV, MP3)', type: 'file' }
        ];
        
        // Use the electron bridge to get available system audio sources if available
        if (window.api) {
          const systemSources = await window.api.getAudioSources();
          // Add system sources
          sources.push(...systemSources);
        } else {
          console.log('Electron API not available. Only file-based audio will be supported.');
        }
        
        setAudioSources(sources);
        // Default to file source
        setSelectedSource('file');
      } catch (error) {
        console.error('Failed to load audio sources:', error);
        setAudioError('Failed to load audio sources');
      }
    };

    loadAudioSources();
  }, []);

  // Initialize AudioFileAnalyzer once
  useEffect(() => {
    const initAudioFileAnalyzer = async () => {
      try {
        // Create the audio file analyzer instance
        const analyzer = new AudioFileAnalyzer();
        await analyzer.initialize();
        
        // Set up callback for audio data
        analyzer.onAudioData((data) => {
          setAudioData(data);
          
          // Update time and duration from the audio data if available
          if (data.position !== undefined) {
            setCurrentTime(data.position);
          }
          
          if (data.duration !== undefined) {
            setDuration(data.duration);
          }
        });
        
        // Store in ref
        audioFileAnalyzerRef.current = analyzer;
      } catch (error) {
        console.error('Failed to initialize AudioFileAnalyzer:', error);
        setAudioError('Failed to initialize audio file analyzer');
      }
    };
    
    initAudioFileAnalyzer();
    
    // Clean up on unmount
    return () => {
      if (audioFileAnalyzerRef.current) {
        audioFileAnalyzerRef.current.dispose();
      }
    };
  }, []);
  
  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setAudioError(null);
      
      // Validate file type
      const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg'];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|ogg)$/i)) {
        throw new Error('Unsupported file type. Please select a WAV, MP3, or OGG file.');
      }
      
      // Check file size (limit to 500MB to prevent browser crashes)
      if (file.size > 500 * 1024 * 1024) {
        throw new Error('File is too large. Please select a file smaller than 500MB.');
      }
      
      console.log('Loading audio file:', file.name, 'type:', file.type, 'size:', file.size);
      
      // Load the selected file
      if (!audioFileAnalyzerRef.current) {
        throw new Error('Audio analyzer not initialized');
      }
      
      const fileInfo = await audioFileAnalyzerRef.current.loadFile(file);
      setLoadedFileName(fileInfo.name);
      
      // Clear the file input value so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // If already playing, restart playback with new file
      if (isPlaying) {
        audioFileAnalyzerRef.current.play();
      }
    } catch (error) {
      console.error('Error loading audio file:', error);
      setAudioError(`Error loading audio file: ${error.message || 'Unknown error'}`);
      setLoadedFileName(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Start or stop audio analysis
  useEffect(() => {
    let audioAnalyzer;

    const startAudioAnalysis = async () => {
      if (!selectedSource || !isPlaying) return;
      
      try {
        // If file source is selected, use the AudioFileAnalyzer
        if (selectedSource === 'file') {
          if (audioFileAnalyzerRef.current) {
            if (!loadedFileName) {
              // Prompt user to select a file if none is loaded
              fileInputRef.current?.click();
              return;
            }
            
            // Start playback of loaded file
            audioFileAnalyzerRef.current.play();
          } else {
            throw new Error('Audio file analyzer not initialized');
          }
          return;
        }
        
        // For system or microphone sources, use regular AudioAnalyzer
        audioAnalyzer = new AudioAnalyzer();
        
        // Determine source type and device ID
        let sourceType, deviceId;
        
        if (selectedSource === 'microphone') {
          sourceType = 'microphone';
          deviceId = null;
        } else {
          // For system audio sources, the ID might be the device ID
          sourceType = 'system';
          deviceId = selectedSource !== 'system' ? selectedSource : null;
        }
        
        await audioAnalyzer.initialize(sourceType, deviceId);

        // Set up data callback
        audioAnalyzer.onAudioData((data) => {
          setAudioData(data);
        });
      } catch (error) {
        console.error('Audio analysis error:', error);
        setAudioError(`Error: ${error.message}`);
        setIsPlaying(false);
      }
    };

    if (isPlaying) {
      startAudioAnalysis();
      
      // Set up time update interval for more frequent updates (every 100ms)
      if (selectedSource === 'file' && audioFileAnalyzerRef.current) {
        timeUpdateIntervalRef.current = setInterval(() => {
          if (audioFileAnalyzerRef.current) {
            setCurrentTime(audioFileAnalyzerRef.current.getCurrentTime());
          }
        }, 100);
      }
    } else {
      // Stop playback
      if (selectedSource === 'file' && audioFileAnalyzerRef.current) {
        audioFileAnalyzerRef.current.pause();
      }
      
      // Clear time update interval
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    }

    return () => {
      // Clean up
      if (audioAnalyzer) {
        audioAnalyzer.stop();
      }
    };
  }, [selectedSource, isPlaying, loadedFileName]);

  // Toggle playback status
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Prompt user to select an audio file
  const promptFileSelection = () => {
    fileInputRef.current?.click();
  };

  const changeTheme = (theme) => {
    setVisualizationTheme(theme);
  };

  // Change selected audio source
  const changeAudioSource = (sourceId) => {
    // If changing to file source, prompt file selection
    if (sourceId === 'file' && !loadedFileName) {
      promptFileSelection();
    }
    
    setSelectedSource(sourceId);
    
    // Stop any current playback first
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Music Visualizer</h1>
      </header>
      
      <main className="main-content">
        <Visualizer 
          audioData={audioData} 
          theme={visualizationTheme} 
          isPlaying={isPlaying}
        />
        
        <Controls 
          isPlaying={isPlaying} 
          togglePlayback={togglePlayback}
          theme={visualizationTheme}
          changeTheme={changeTheme}
          audioSources={audioSources}
          selectedSource={selectedSource}
          changeAudioSource={changeAudioSource}
          loadedFileName={loadedFileName}
          onFileButtonClick={promptFileSelection}
          currentTime={currentTime}
          duration={duration}
        />

        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }} 
          accept="audio/*"
          onChange={handleFileSelect}
        />

        {audioError && (
          <div className="error-message">
            {audioError}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Music Visualizer - Created with Electron and React</p>
      </footer>
    </div>
  );
};

export default App;
