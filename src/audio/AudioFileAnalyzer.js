/**
 * AudioFileAnalyzer
 * Provides audio analysis for WAV files with complete control over playback
 */

class AudioFileAnalyzer {
  constructor(options = {}) {
    // Audio context and nodes
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.audioElement = null;
    this.gainNode = null;
    this.dataArray = null;
    this.isInitialized = false;
    this.isPlaying = false;
    
    // Analysis options
    this.fftSize = options.fftSize || 2048;
    this.smoothingTimeConstant = options.smoothingTimeConstant || 0.8;
    
    // Beat detection state
    this.lastBassValue = 0;
    this.bassHistory = Array(10).fill(0);
    
    // Callback for sending data
    this.callback = null;
    this.animationFrameId = null;
    
    // Create audio element
    this.audioElement = new Audio();
    this.audioElement.addEventListener('ended', this.handlePlaybackEnded.bind(this));
    this.audioElement.addEventListener('error', this.handlePlaybackError.bind(this));
  }
  
  /**
   * Initializes the audio analyzer
   */
  async initialize() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      
      // Connect gain node to output
      this.gainNode.connect(this.audioContext.destination);
      
      // Set up data array for frequency analysis
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.isInitialized = true;
      console.log('AudioFileAnalyzer initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Error initializing AudioFileAnalyzer:', error);
      throw error;
    }
  }
  
  /**
   * Loads an audio file for analysis
   * @param {File|string} file - The audio file or URL to load
   * @returns {Promise} Promise that resolves when the file is loaded
   */
  loadFile(file) {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        reject(new Error('AudioFileAnalyzer not initialized'));
        return;
      }
      
      try {
        // Stop any current playback and clean up previous connections
        this.stop();
        
        if (this.source) {
          this.source.disconnect();
          this.source = null;
        }
        
        // Create a new audio element each time to avoid conflicts
        if (this.audioElement) {
          this.audioElement.removeEventListener('ended', this.handlePlaybackEnded);
          this.audioElement.removeEventListener('error', this.handlePlaybackError);
        }
        
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = "anonymous";  // Try to avoid CORS issues
        this.audioElement.addEventListener('ended', this.handlePlaybackEnded.bind(this));
        this.audioElement.addEventListener('error', this.handlePlaybackError.bind(this));
        
        // Handle both File objects and URLs
        if (typeof file === 'string') {
          this.audioElement.src = file;
        } else {
          // Create blob URL for file
          const fileURL = URL.createObjectURL(file);
          console.log('Created Blob URL:', fileURL);
          this.audioElement.src = fileURL;
          
          // Store the URL for cleanup
          this._blobURL = fileURL;
        }
        
        // Set up event listeners for file loading
        const onCanPlay = () => {
          console.log('Audio file loaded and ready to play');
          
          try {
            // Create and connect media element source
            this.source = this.audioContext.createMediaElementSource(this.audioElement);
            this.source.connect(this.analyser);
            this.source.connect(this.gainNode);
            
            // Clean up event listeners
            this.audioElement.removeEventListener('canplay', onCanPlay);
            this.audioElement.removeEventListener('error', onError);
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
              this.audioContext.resume();
            }
            
            resolve({
              duration: this.audioElement.duration,
              name: typeof file === 'string' ? file.split('/').pop() : file.name
            });
          } catch (err) {
            console.error('Error connecting audio nodes:', err);
            reject(err);
          }
        };
        
        // Set up error handler
        const onError = (err) => {
          console.error('Error loading audio file:', err);
          this.audioElement.removeEventListener('canplay', onCanPlay);
          this.audioElement.removeEventListener('error', onError);
          reject(err);
        };
        
        // Add event listeners
        this.audioElement.addEventListener('canplay', onCanPlay);
        this.audioElement.addEventListener('error', onError);
        
        // Start loading the file
        this.audioElement.load();
      } catch (error) {
        console.error('Error loading audio file:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Starts audio playback and analysis
   */
  play() {
    if (!this.isInitialized || !this.audioElement.src) {
      console.error('Cannot play: No audio file loaded or not initialized');
      return false;
    }
    
    // Resume audio context if it's suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Start playback
    this.audioElement.play()
      .then(() => {
        this.isPlaying = true;
        this.startAnalysis();
        console.log('Started audio playback and analysis');
      })
      .catch(err => {
        console.error('Error starting audio playback:', err);
      });
    
    return true;
  }
  
  /**
   * Pauses audio playback and analysis
   */
  pause() {
    if (!this.isPlaying) return;
    
    this.audioElement.pause();
    this.isPlaying = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Stops audio playback and analysis, resets to beginning
   */
  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    
    this.isPlaying = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Sets the volume for audio playback
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    if (this.gainNode) {
      const safeVolume = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.value = safeVolume;
    }
  }
  
  /**
   * Seeks to a specific position in the audio file
   * @param {number} time - Time in seconds
   */
  seekTo(time) {
    if (this.audioElement) {
      const safeTime = Math.max(0, Math.min(time, this.audioElement.duration));
      this.audioElement.currentTime = safeTime;
    }
  }
  
  /**
   * Gets the current playback position
   * @returns {number} Current time in seconds
   */
  getCurrentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }
  
  /**
   * Gets the total duration of the audio file
   * @returns {number} Duration in seconds
   */
  getDuration() {
    return this.audioElement ? this.audioElement.duration : 0;
  }
  
  /**
   * Sets the callback function to receive audio data
   * @param {Function} callback - Function to call with audio data
   */
  onAudioData(callback) {
    this.callback = callback;
  }
  
  /**
   * Starts the audio analysis loop
   */
  startAnalysis() {
    if (!this.isInitialized || !this.callback) return;
    
    const analyzeAudio = () => {
      if (!this.isPlaying) return;
      
      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Process audio data
      const audioData = this.processAudioData();
      
      // Send data to callback
      this.callback(audioData);
      
      // Continue loop
      this.animationFrameId = requestAnimationFrame(analyzeAudio);
    };
    
    // Start the analysis loop
    analyzeAudio();
  }
  
  /**
   * Processes the raw frequency data into useful audio features
   * @returns {Object} Processed audio data
   */
  processAudioData() {
    // Convert to regular array
    const frequencyData = Array.from(this.dataArray);
    
    // Calculate frequency bands
    const bands = this.calculateFrequencyBands(frequencyData);
    
    // Detect beats
    const isBeat = this.detectBeat(bands);
    
    // Return processed data
    return {
      frequencyData,
      bands,
      isBeat,
      timestamp: Date.now(),
      position: this.getCurrentTime(),
      duration: this.getDuration()
    };
  }
  
  /**
   * Calculates frequency bands from raw frequency data
   * @param {Array} frequencyData - Raw frequency data
   * @returns {Object} Calculated frequency bands
   */
  calculateFrequencyBands(frequencyData) {
    // Calculate frequency bands
    const bands = {
      bass: this.calculateBandAverage(frequencyData, 0, 200),
      midLow: this.calculateBandAverage(frequencyData, 200, 500),
      mid: this.calculateBandAverage(frequencyData, 500, 2000),
      highMid: this.calculateBandAverage(frequencyData, 2000, 4000),
      high: this.calculateBandAverage(frequencyData, 4000, 20000)
    };
    
    return bands;
  }
  
  /**
   * Calculates the average value for a frequency range
   * @param {Array} data - Frequency data
   * @param {number} lowFreq - Lower bound of frequency range
   * @param {number} highFreq - Upper bound of frequency range
   * @returns {number} Average value in the frequency range
   */
  calculateBandAverage(data, lowFreq, highFreq) {
    if (!this.audioContext) return 0;
    
    const nyquist = this.audioContext.sampleRate / 2;
    const lowIndex = Math.round(lowFreq / nyquist * data.length);
    const highIndex = Math.round(highFreq / nyquist * data.length);
    
    let total = 0;
    let count = 0;
    
    for (let i = lowIndex; i <= highIndex && i < data.length; i++) {
      total += data[i];
      count++;
    }
    
    return count > 0 ? Math.round(total / count) : 0;
  }
  
  /**
   * Detects a beat based on bass frequency energy
   * @param {Object} bands - Frequency bands
   * @returns {boolean} True if a beat is detected
   */
  detectBeat(bands) {
    // Add current bass value to history
    this.bassHistory.push(bands.bass);
    this.bassHistory.shift();
    
    // Calculate average bass energy
    const avgBass = this.bassHistory.reduce((sum, value) => sum + value, 0) / this.bassHistory.length;
    
    // Calculate increase from last value
    const bassIncrease = bands.bass - this.lastBassValue;
    this.lastBassValue = bands.bass;
    
    // Check for significant bass increase and minimum energy
    const beatThreshold = 20;
    const minBassEnergy = 120;
    
    return bassIncrease > beatThreshold && bands.bass > avgBass * 1.2 && bands.bass > minBassEnergy;
  }
  
  /**
   * Handles the audio playback ended event
   */
  handlePlaybackEnded() {
    console.log('Audio playback ended');
    this.isPlaying = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Handles audio playback errors
   * @param {Event} error - Error event
   */
  handlePlaybackError(error) {
    console.error('Audio playback error:', error);
    this.isPlaying = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Cleans up resources when done with analyzer
   */
  dispose() {
    this.stop();
    
    if (this.source) {
      this.source.disconnect();
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    // Remove event listeners
    if (this.audioElement) {
      this.audioElement.removeEventListener('ended', this.handlePlaybackEnded);
      this.audioElement.removeEventListener('error', this.handlePlaybackError);
    }
    
    this.isInitialized = false;
  }
}

export default AudioFileAnalyzer;
