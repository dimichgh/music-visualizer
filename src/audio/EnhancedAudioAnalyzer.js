/**
 * EnhancedAudioAnalyzer class
 * Advanced audio analysis with improved beat detection, tempo estimation,
 * and spectral analysis for visualization
 */

class EnhancedAudioAnalyzer {
  constructor(options = {}) {
    // Audio context and nodes
    this.audioContext = null;
    this.analyser = null;
    this.energyAnalyser = null;
    this.dataArray = null;
    this.energyArray = null;
    this.source = null;
    this.isInitialized = false;
    
    // Analysis options
    this.fftSize = options.fftSize || 2048;
    this.smoothingTimeConstant = options.smoothingTimeConstant || 0.8;
    this.beatDetectionThreshold = options.beatDetectionThreshold || 1.5;
    this.beatDecay = options.beatDecay || 0.95;
    
    // Beat detection
    this.beatDetectors = {
      bass: { threshold: this.beatDetectionThreshold, energy: 0, history: [], lastBeat: 0 },
      mid: { threshold: this.beatDetectionThreshold * 0.8, energy: 0, history: [], lastBeat: 0 },
      high: { threshold: this.beatDetectionThreshold * 1.2, energy: 0, history: [], lastBeat: 0 }
    };
    
    // Tempo estimation
    this.tempoData = {
      beatTimes: [],
      currentTempo: 0,
      confidence: 0
    };
    
    // Energy history for tracking changes
    this.energyHistory = Array(10).fill(0);
    this.energyIndex = 0;
    
    // History data for visualization smoothing
    this.bandHistory = {
      bass: Array(5).fill(0),
      midLow: Array(5).fill(0),
      mid: Array(5).fill(0),
      highMid: Array(5).fill(0),
      high: Array(5).fill(0)
    };
    
    // Spectral flux for transient detection
    this.previousSpectrum = null;
    this.fluxHistory = Array(20).fill(0);
    this.fluxThreshold = 0.5;
    
    // Callback for sending data
    this.callback = null;
    this.animationFrameId = null;
  }
  
  /**
   * Initializes the audio analyzer with the specified source
   * @param {string} sourceType - Type of audio source ("system" or "microphone")
   */
  async initialize(sourceType) {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create main analyzer node for frequency data
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
      
      // Create secondary analyzer for energy detection with less smoothing
      this.energyAnalyser = this.audioContext.createAnalyser();
      this.energyAnalyser.fftSize = 512; // Smaller FFT for energy detection
      this.energyAnalyser.smoothingTimeConstant = 0.5; // Less smoothing for transients
      
      // Create data arrays
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.energyArray = new Uint8Array(this.energyAnalyser.frequencyBinCount);
      
      // Create source based on type
      if (sourceType === 'microphone') {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.source = this.audioContext.createMediaStreamSource(stream);
      } else if (sourceType === 'file') {
        // Will be connected later when playing a file
        this.source = null;
      } else if (sourceType === 'system') {
        // For system audio, we expect data to come from another source
        // Don't create a mock oscillator
        console.log('System audio requires data from main process - no oscillator fallback');
        this.source = null;
      } else {
        throw new Error(`Unsupported audio source type: ${sourceType}`);
      }
      
      // Connect the source to analyzers if available
      if (this.source) {
        this.source.connect(this.analyser);
        this.source.connect(this.energyAnalyser);
      }
      
      this.isInitialized = true;
      this.startAnalysis();
      
      return true;
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
      throw error;
    }
  }
  
  /**
   * Setup an audio element as the source
   * @param {HTMLAudioElement} audioElement - Audio element to analyze
   */
  setupAudioElementSource(audioElement) {
    if (!this.isInitialized) return;
    
    // Disconnect existing source if any
    if (this.source) {
      this.source.disconnect();
    }
    
    // Create new media element source
    this.source = this.audioContext.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
    this.source.connect(this.energyAnalyser);
    
    // Connect to destination to hear the audio
    this.source.connect(this.audioContext.destination);
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
      this.energyAnalyser.getByteFrequencyData(this.energyArray);
      
      // Process and extract audio features
      const audioData = this.processAudioData();
      
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
   * Processes raw audio data to extract detailed features
   * @returns {Object} Processed audio data with features
   */
  processAudioData() {
    // Convert Uint8Array to regular arrays
    const frequencyData = Array.from(this.dataArray);
    const energyData = Array.from(this.energyArray);
    
    // Calculate average volume
    const average = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
    
    // Calculate frequency bands with history-based smoothing
    const bands = this.calculateFrequencyBands(frequencyData);
    
    // Detect beats in different frequency ranges
    const beats = this.detectBeats(bands);
    
    // Estimate tempo
    this.updateTempoEstimation(beats);
    
    // Calculate spectral flux (rate of change of the spectrum)
    const flux = this.calculateSpectralFlux(frequencyData);
    
    // Find dominant frequencies
    const dominantFrequencies = this.findDominantFrequencies(frequencyData);
    
    // Create the final audio data object
    return {
      frequencyData,
      energyData,
      average,
      bands,
      beats,
      tempo: this.tempoData.currentTempo,
      tempoConfidence: this.tempoData.confidence,
      flux,
      dominantFrequencies,
      // Original beat detection for backward compatibility
      isBeat: beats.bass || beats.mid || beats.high
    };
  }
  
  /**
   * Calculate frequency bands with smoothing based on history
   * @param {Array} frequencyData - Raw frequency data
   * @returns {Object} Frequency bands data
   */
  calculateFrequencyBands(frequencyData) {
    // Calculate raw band values
    const rawBands = {
      bass: this.calculateBandAverage(frequencyData, 0, 200),
      midLow: this.calculateBandAverage(frequencyData, 200, 500),
      mid: this.calculateBandAverage(frequencyData, 500, 2000),
      highMid: this.calculateBandAverage(frequencyData, 2000, 4000),
      high: this.calculateBandAverage(frequencyData, 4000, 20000)
    };
    
    // Smooth with history for each band
    const smoothedBands = {};
    
    for (const band in rawBands) {
      // Add to history
      this.bandHistory[band].push(rawBands[band]);
      this.bandHistory[band].shift();
      
      // Calculate smoothed value (weighted average, more recent = more weight)
      let totalWeight = 0;
      let weightedSum = 0;
      
      this.bandHistory[band].forEach((value, index) => {
        const weight = index + 1;
        weightedSum += value * weight;
        totalWeight += weight;
      });
      
      smoothedBands[band] = weightedSum / totalWeight;
    }
    
    return smoothedBands;
  }
  
  /**
   * Advanced beat detection using energy analysis and thresholds
   * @param {Object} bands - Frequency bands data
   * @returns {Object} Beat detection results for each band
   */
  detectBeats(bands) {
    const now = this.audioContext ? this.audioContext.currentTime : performance.now() / 1000;
    const result = {};
    
    // Process each frequency band for beat detection
    for (const band in this.beatDetectors) {
      const detector = this.beatDetectors[band];
      const energy = bands[band];
      
      // Update energy history
      detector.history.push(energy);
      if (detector.history.length > 20) detector.history.shift();
      
      // Calculate average energy in the history
      const avgEnergy = detector.history.reduce((sum, e) => sum + e, 0) / detector.history.length;
      
      // Dynamic threshold based on recent energy levels
      const dynamicThreshold = avgEnergy * detector.threshold;
      
      // Declare a beat if energy exceeds threshold and some time has passed since last beat
      const minTimeBetweenBeats = band === 'bass' ? 0.2 : 0.1; // seconds
      const isBeat = energy > dynamicThreshold && now - detector.lastBeat > minTimeBetweenBeats;
      
      if (isBeat) {
        detector.lastBeat = now;
      }
      
      result[band] = isBeat;
    }
    
    return result;
  }
  
  /**
   * Update tempo estimation based on beat timings
   * @param {Object} beats - Beat detection results
   */
  updateTempoEstimation(beats) {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Track bass beats for tempo estimation as they're usually aligned with the beat
    if (beats.bass) {
      // Add current time to beat times array
      this.tempoData.beatTimes.push(now);
      
      // Keep only recent beats for estimation (last 6 seconds)
      const oldestAllowed = now - 6;
      this.tempoData.beatTimes = this.tempoData.beatTimes.filter(time => time >= oldestAllowed);
      
      // Need at least 4 beats to estimate tempo
      if (this.tempoData.beatTimes.length >= 4) {
        // Calculate intervals between beats
        const intervals = [];
        for (let i = 1; i < this.tempoData.beatTimes.length; i++) {
          intervals.push(this.tempoData.beatTimes[i] - this.tempoData.beatTimes[i - 1]);
        }
        
        // Calculate average interval
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        // Calculate BPM from average interval
        const bpm = 60 / avgInterval;
        
        // Calculate standard deviation to determine confidence
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Normalize to a confidence value between 0 and 1
        // Lower standard deviation = higher confidence
        const confidence = Math.max(0, Math.min(1, 1 - (stdDev / avgInterval)));
        
        // Round BPM to nearest integer and store
        this.tempoData.currentTempo = Math.round(bpm);
        this.tempoData.confidence = confidence;
      }
    }
  }
  
  /**
   * Calculate spectral flux (rate of change of the spectrum)
   * @param {Array} frequencyData - Current frequency data
   * @returns {Object} Spectral flux information
   */
  calculateSpectralFlux(frequencyData) {
    // If no previous spectrum, store current and return default values
    if (!this.previousSpectrum) {
      this.previousSpectrum = [...frequencyData];
      return { value: 0, isOnset: false };
    }
    
    // Calculate flux (sum of square differences)
    let flux = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      // Use only positive changes (increases in energy)
      const diff = Math.max(0, frequencyData[i] - this.previousSpectrum[i]);
      flux += diff * diff;
    }
    
    // Normalize
    flux = Math.sqrt(flux) / frequencyData.length;
    
    // Add to history
    this.fluxHistory.push(flux);
    this.fluxHistory.shift();
    
    // Calculate average flux
    const avgFlux = this.fluxHistory.reduce((sum, f) => sum + f, 0) / this.fluxHistory.length;
    
    // Detect onset (sudden increase in spectral change)
    const isOnset = flux > avgFlux * this.fluxThreshold;
    
    // Store current spectrum for next comparison
    this.previousSpectrum = [...frequencyData];
    
    return {
      value: flux,
      isOnset: isOnset
    };
  }
  
  /**
   * Find dominant frequencies in the spectrum
   * @param {Array} frequencyData - Frequency data array
   * @returns {Array} Array of dominant frequency objects
   */
  findDominantFrequencies(frequencyData) {
    if (!this.audioContext) return [];
    
    // Find local maxima in the spectrum
    const peaks = [];
    const nyquist = this.audioContext.sampleRate / 2;
    const binSize = nyquist / frequencyData.length;
    
    for (let i = 2; i < frequencyData.length - 2; i++) {
      // Check if this bin is a local maximum
      if (frequencyData[i] > frequencyData[i - 1] && 
          frequencyData[i] > frequencyData[i - 2] && 
          frequencyData[i] > frequencyData[i + 1] && 
          frequencyData[i] > frequencyData[i + 2] && 
          frequencyData[i] > 100) { // Amplitude threshold
        
        // Estimate the frequency
        const frequency = i * binSize;
        
        peaks.push({
          frequency: frequency,
          amplitude: frequencyData[i],
          index: i
        });
      }
    }
    
    // Sort by amplitude and take the top 3
    peaks.sort((a, b) => b.amplitude - a.amplitude);
    return peaks.slice(0, 3);
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
    
    this.isInitialized = false;
  }
}

export default EnhancedAudioAnalyzer;
