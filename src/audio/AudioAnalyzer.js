/**
 * AudioAnalyzer class handles audio capture and analysis using Web Audio API
 * It provides real-time audio data for visualization
 */
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.isInitialized = false;
    this.animationFrameId = null;
    this.callback = null;
  }

  /**
   * Initializes the audio analyzer with the specified source
   * @param {string} sourceType - Type of audio source ("system" or "microphone")
   * @param {string} deviceId - Optional device ID for system audio
   */
  async initialize(sourceType, deviceId = null) {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyzer node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      // Set source type
      this.sourceType = sourceType;
      
      // Connect to source based on type
      if (sourceType === 'microphone') {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.source = this.audioContext.createMediaStreamSource(stream);
        
        // Connect the source to the analyzer
        this.source.connect(this.analyser);
        
        // Start the analysis loop for microphone
        this.isInitialized = true;
        this.startAnalysis();
      } else if (sourceType === 'system' || sourceType.startsWith('System:')) {
        // For system audio, use electron's IPC to communicate with the native module
        try {
          // Check if we have access to the electron API
          if (window.api) {
            // Set up listener for audio data from main process
            this.setupSystemAudioListener();
            
            // Request the main process to start capturing system audio
            const result = await window.api.startSystemAudioCapture(deviceId);
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to start system audio capture');
            }
            
            // We don't create a source node for system audio as data comes through IPC
            this.isInitialized = true;
            
            return true;
          } else {
            // No fallback option - we need the real Electron API for system audio capture
            console.error('Electron API not available. System audio capture requires Electron runtime.');
            throw new Error('System audio capture requires Electron runtime');
          }
        } catch (systemError) {
          console.error('Error setting up system audio:', systemError);
          throw systemError;
        }
      } else {
        throw new Error(`Unsupported audio source type: ${sourceType}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
      throw error;
    }
  }
  
  /**
   * Sets up a listener for system audio data coming from the main process
   */
  setupSystemAudioListener() {
    if (!window.api) return;
    
    // Remove any existing listeners
    window.api.removeAllListeners('audio-data');
    
    // Set up listener for audio data
    window.api.receive('audio-data', (audioData) => {
      if (!this.isInitialized) return;
      
      // Update our data array with the received frequency data
      if (audioData.frequencyData && audioData.frequencyData.length > 0) {
        // Create a new array if sizes don't match
        if (this.dataArray.length !== audioData.frequencyData.length) {
          this.dataArray = new Uint8Array(audioData.frequencyData.length);
        }
        
        // Copy frequency data to our array
        for (let i = 0; i < audioData.frequencyData.length; i++) {
          this.dataArray[i] = audioData.frequencyData[i];
        }
        
        // Process and send the data to callback
        const processedData = this.processAudioData(this.dataArray);
        
        // Add band data from the main process (more accurate for system audio)
        if (audioData.bands) {
          processedData.bands = audioData.bands;
        }
        
        // Use beat detection from main process if available
        if (typeof audioData.isBeat !== 'undefined') {
          processedData.isBeat = audioData.isBeat;
        }
        
        // Send data to callback
        if (this.callback) {
          this.callback(processedData);
        }
      }
    });
    
    // Set up listener for errors
    window.api.receive('audio-capture-error', (error) => {
      console.error('System audio capture error:', error);
    });
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
    if (!this.isInitialized) return;
    
    const analyzeAudio = () => {
      if (!this.isInitialized) return;
      
      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate additional audio features
      const audioData = this.processAudioData(this.dataArray);
      
      // Send data to callback
      if (this.callback) {
        this.callback(audioData);
      }
      
      // Continue loop
      this.animationFrameId = requestAnimationFrame(analyzeAudio);
    };
    
    analyzeAudio();
  }

  /**
   * Processes raw audio data to extract useful features
   * @param {Uint8Array} rawData - Raw frequency data from analyzer
   * @returns {Object} Processed audio data with useful features
   */
  processAudioData(rawData) {
    // Create a copy of the data
    const data = Array.from(rawData);
    
    // Calculate average volume
    const average = data.reduce((sum, value) => sum + value, 0) / data.length;
    
    // Find peak frequency
    const peakIndex = data.indexOf(Math.max(...data));
    const peakFrequency = peakIndex * this.audioContext.sampleRate / (2 * this.analyser.fftSize);
    
    // Divide the spectrum into frequency bands
    const bands = {
      bass: this.calculateBandAverage(data, 0, 200),
      midLow: this.calculateBandAverage(data, 200, 500),
      mid: this.calculateBandAverage(data, 500, 2000),
      highMid: this.calculateBandAverage(data, 2000, 4000),
      high: this.calculateBandAverage(data, 4000, 20000)
    };
    
    // Detect beats using energy change in bass frequencies
    const isBeat = bands.bass > 200 && bands.bass > 1.5 * this.lastBassAverage;
    this.lastBassAverage = bands.bass;
    
    return {
      frequencyData: data,
      average,
      peak: {
        frequency: peakFrequency,
        amplitude: data[peakIndex]
      },
      bands,
      isBeat
    };
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
    
    return total / (count || 1);
  }

  /**
   * Stops the audio analysis and cleans up resources
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.source) {
      this.source.disconnect();
    }
    
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
    }
    
    // Stop system audio capture if that's what we're using
    if (this.sourceType === 'system' || (this.sourceType && this.sourceType.startsWith('System:'))) {
      if (window.api) {
        window.api.stopSystemAudioCapture();
        window.api.removeAllListeners('audio-data');
        window.api.removeAllListeners('audio-capture-error');
      }
    }
    
    this.isInitialized = false;
  }
}

export default AudioAnalyzer;
