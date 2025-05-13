/**
 * System Audio Capture Module
 * Provides native audio capture functionality for macOS.
 */

const { EventEmitter } = require('events');
const path = require('path');
const AudioRecorder = require('node-audiorecorder');
const fs = require('fs');
const childProcess = require('child_process');

class SystemAudioCapture extends EventEmitter {
  constructor() {
    super();
    this.isRecording = false;
    this.audioRecorder = null;
    this.audioStream = null;
    this.tempDir = path.join(require('os').tmpdir(), 'music-visualizer');
    this.outputPath = path.join(this.tempDir, 'system-audio.wav');
    this.chunkSize = 4096; // Size of chunks to read
    this.audioRecorderOptions = {
      program: 'sox',      // Use SoX for recording
      device: null,        // Default device
      bits: 16,            // Audio bits per sample
      channels: 2,         // Number of channels
      encoding: 'signed-integer',
      rate: 44100,         // Sample rate
      type: 'wav',         // Audio type
      silence: 0,          // Seconds of silence before recording stops
      thresholdStart: 0,   // Silence threshold to start recording
      thresholdStop: 0,    // Silence threshold to stop recording
      keepSilence: true,   // Keep silence in recording
    };
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Get available audio input devices for the system
   * @returns {Promise<Array>} List of available audio devices
   */
  async getSystemAudioDevices() {
    return new Promise((resolve, reject) => {
      // For macOS, we need to detect all possible audio output devices
      if (process.platform === 'darwin') {
        // Always include the system default device
        const outputDevices = [
          { id: 'default', name: 'System Default (automatically detect)', type: 'output' }
        ];
        
        try {
          // Try to get detailed audio device info
          childProcess.exec('system_profiler SPAudioDataType', (error, stdout) => {
            if (error) {
              console.error('Error getting audio devices:', error);
              // Just use our default device that we already added
              resolve(outputDevices);
              return;
            }
            
            try {
              // Parse the output to extract audio devices
              const lines = stdout.split('\n');
              let currentDevice = null;
              let inAudioSection = false;
              
              for (const line of lines) {
                // Look for audio devices section
                if (line.includes('Audio:')) {
                  inAudioSection = true;
                  continue;
                }
                
                // Look for output devices and wireless devices
                if (inAudioSection && 
                    (line.includes('Output:') || 
                     line.includes('Headphone') || 
                     line.includes('Bluetooth') || 
                     line.includes('Wireless'))) {
                  
                  let deviceName = '';
                  
                  // Try to extract the device name
                  if (line.includes('Output:')) {
                    const match = line.match(/Output:\s+(.+)/);
                    if (match && match[1]) deviceName = match[1].trim();
                  } else if (line.includes(':')) {
                    const match = line.match(/(.+):/);
                    if (match && match[1]) deviceName = match[1].trim();
                  } else {
                    deviceName = line.trim();
                  }
                  
                  // If we found a valid device name
                  if (deviceName && !outputDevices.some(d => d.name === deviceName)) {
                    outputDevices.push({
                      id: deviceName,
                      name: deviceName,
                      type: 'output'
                    });
                  }
                }
              }
              
              // Also attempt to get device info via sox
              try {
                const soxDevices = childProcess.execSync('sox -n -d -c 1 2>&1')
                  .toString()
                  .split('\n')
                  .filter(line => line.includes('Audio Device'));
                
                soxDevices.forEach(line => {
                  const match = line.match(/Audio Device: (.+)/);
                  if (match && match[1]) {
                    const deviceName = match[1].trim();
                    if (!outputDevices.some(d => d.name === deviceName)) {
                      outputDevices.push({
                        id: deviceName,
                        name: deviceName,
                        type: 'output'
                      });
                    }
                  }
                });
              } catch (soxErr) {
                console.log('Could not get additional devices from sox command');
              }
              
              // Add special all-audio device
              outputDevices.push({
                id: 'all',
                name: 'All System Audio (hardware monitor)',
                type: 'output'
              });
              
              console.log('Detected audio devices:', outputDevices);
              resolve(outputDevices);
            } catch (parseError) {
              console.error('Error parsing audio devices:', parseError);
              resolve(outputDevices);
            }
          });
        } catch (error) {
          console.error('Error getting audio devices:', error);
          resolve([{ id: 'default', name: 'System Default', type: 'output' }]);
        }
      } else {
        // For other platforms, just return a default device for now
        resolve([{ id: 'default', name: 'System Default', type: 'output' }]);
      }
    });
  }

  /**
   * Start recording system audio
   * @param {string} deviceId - ID of the audio device to record from (optional)
   * @returns {boolean} Success status
   */
  startCapture(deviceId = null) {
    if (this.isRecording) {
      return true; // Already recording
    }

    try {
      // Set the device if specified
      if (deviceId) {
        this.audioRecorderOptions.device = deviceId;
      }

      // For macOS, we need to configure SoX to capture system audio
      if (process.platform === 'darwin') {
        // First check if SoX is installed
        try {
          childProcess.execSync('which sox', { stdio: 'pipe' });
          console.log('SoX is installed, checking for audio capture options...');
          
          // Check if BlackHole is available
          try {
            childProcess.execSync('sox -h | grep -i blackhole', { stdio: 'pipe' });
            console.log('BlackHole audio driver detected, using for audio capture');
            this.audioRecorderOptions.device = 'BlackHole';
          } catch (blackholeErr) {
            console.log('BlackHole not detected, using default audio device');
            this.audioRecorderOptions.device = 'default';
            
            // On macOS, additional setup might be needed for default device
            console.log('Note: For system audio capture, BlackHole virtual audio driver is recommended');
          }
        } catch (soxError) {
          const errorMsg = 'SoX is not installed. Please install SoX using: brew install sox';
          console.error(errorMsg);
          this.emit('error', new Error(errorMsg));
          return false;
        }
      }

      // Create a properly configured logger object with all required methods
      const loggerObject = {
        log: function(message) { console.log(message); },
        warn: function(message) { console.warn(message); },
        error: function(message) { console.error(message); }
      };
      
      console.log('Starting audio capture with device:', this.audioRecorderOptions.device);
      
      // Create audio recorder instance
      this.audioRecorder = new AudioRecorder(this.audioRecorderOptions, loggerObject);

      // Start the recording process
      this.audioStream = this.audioRecorder.start().stream();
      
      // Set up data handling
      const fileStream = fs.createWriteStream(this.outputPath, { flags: 'w' });
      this.audioStream.pipe(fileStream);
      
      // Set up event listeners
      this.audioStream.on('data', (chunk) => {
        // Process the audio chunk
        this.processAudioChunk(chunk);
      });
      
      this.audioStream.on('error', (err) => {
        console.error('Error in audio stream:', err);
        this.emit('error', err);
      });
      
      this.isRecording = true;
      this.emit('started');
      return true;
    } catch (error) {
      console.error('Failed to start dummy audio capture:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Process audio chunk and extract frequency data
   * @param {Buffer} chunk - Raw audio data chunk
   */
  processAudioChunk(chunk) {
    try {
      // Debug info
      console.log(`Processing audio chunk: ${chunk.byteLength} bytes`);
      
      // Convert the chunk to audio samples
      const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.byteLength / 2);
      
      // Calculate overall energy level to check for noise
      let totalEnergy = 0;
      for (let i = 0; i < samples.length; i++) {
        totalEnergy += Math.abs(samples[i]) / 32768.0;
      }
      const averageEnergy = totalEnergy / samples.length;
      
      // DEBUG: Log energy levels
      console.log(`Audio energy level: ${averageEnergy.toFixed(4)}`);
      
      // Apply noise gate - use an extremely low threshold to detect even quiet sounds
      const noiseThreshold = 0.0002; // Ultra-low threshold to pick up even very quiet audio
      
      if (averageEnergy < noiseThreshold) {
        // If audio is below threshold, send silent data
        console.log('Audio below threshold - sending silent data');
        const silentFrequencyData = new Array(64).fill(0);
        const silentBands = {
          bass: 0,
          midLow: 0,
          mid: 0,
          highMid: 0,
          high: 0
        };
        
        this.emit('audioData', {
          frequencyData: silentFrequencyData,
          bands: silentBands,
          isBeat: false,
          timestamp: Date.now()
        });
        return;
      } else {
        console.log('Audio above threshold - processing real audio data');
      }
      
      // Create Float32Array for analysis
      const floatSamples = new Float32Array(samples.length);
      
      // Convert Int16 to Float32 (-1.0 to 1.0)
      for (let i = 0; i < samples.length; i++) {
        floatSamples[i] = samples[i] / 32768.0;
      }
      
      // Perform basic frequency analysis using FFT
      const fftResult = this.simpleFFT(floatSamples);
      
      // Create frequency bands
      const bands = this.calculateFrequencyBands(fftResult);
      
      // Emit audio data event with processed data and debug info
      const audioData = {
        frequencyData: Array.from(fftResult),
        bands,
        isBeat: this.detectBeat(bands),
        timestamp: Date.now(),
        energy: averageEnergy, // Include energy level for debugging
        debug: {
          maxSample: Math.max(...samples.map(s => Math.abs(s))) / 32768.0,
          samplesCount: samples.length,
          peakFrequency: fftResult.indexOf(Math.max(...fftResult)),
          bassEnergy: bands.bass,
          midEnergy: bands.mid
        }
      };
      
      // Debug: log a summary of the audio data
      console.log(`Audio data: energy=${averageEnergy.toFixed(4)}, ` + 
                  `bass=${bands.bass}, mid=${bands.mid}, high=${bands.high}, ` +
                  `isBeat=${audioData.isBeat}`);
      
      this.emit('audioData', audioData);
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }
  
  /**
   * Simple FFT implementation (for demo purposes)
   * In production, use a proper FFT library
   * @param {Float32Array} samples - Audio samples
   * @returns {Uint8Array} Frequency domain data
   */
  simpleFFT(samples) {
    // For simplicity, we'll just do basic power calculation
    // across different portions of the sample
    
    // Use only the first channel if stereo
    const monoSamples = new Float32Array(samples.length / 2);
    for (let i = 0; i < monoSamples.length; i++) {
      monoSamples[i] = samples[i * 2]; // Use left channel
    }
    
    // Split samples into frequency ranges and calculate average power
    const result = new Uint8Array(64); // 64 frequency bins
    const samplesPerBin = Math.floor(monoSamples.length / result.length);
    
    // Additional frequency-specific noise threshold
    const freqNoiseThreshold = 0.001; // Very low frequency-specific threshold
    
    for (let i = 0; i < result.length; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerBin; j++) {
        const idx = i * samplesPerBin + j;
        if (idx < monoSamples.length) {
          sum += Math.abs(monoSamples[idx]);
        }
      }
      
      // Calculate average for this bin
      const binAverage = sum / samplesPerBin;
      
      // Apply frequency-specific noise gate
      if (binAverage < freqNoiseThreshold) {
        result[i] = 0;
      } else {
        // Scale the value (subtract threshold to get cleaner response)
        const scaledValue = (binAverage - freqNoiseThreshold) * 255 * 5;
        result[i] = Math.min(255, Math.floor(scaledValue));
      }
    }
    
    return result;
  }
  
  /**
   * Calculate frequency bands from raw FFT data
   * @param {Uint8Array} fftData - FFT result data
   * @returns {Object} Audio frequency bands
   */
  calculateFrequencyBands(fftData) {
    // Define frequency band ranges
    const bands = {
      bass: 0,
      midLow: 0,
      mid: 0,
      highMid: 0,
      high: 0
    };
    
    // Calculate bass (0-200Hz) - first ~5 bins
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      sum += fftData[i];
    }
    bands.bass = Math.min(255, Math.floor(sum / 5));
    
    // Calculate midLow (200-500Hz) - next ~8 bins
    sum = 0;
    for (let i = 5; i < 13; i++) {
      sum += fftData[i];
    }
    bands.midLow = Math.min(255, Math.floor(sum / 8));
    
    // Calculate mid (500-2000Hz) - next ~20 bins
    sum = 0;
    for (let i = 13; i < 33; i++) {
      sum += fftData[i];
    }
    bands.mid = Math.min(255, Math.floor(sum / 20));
    
    // Calculate highMid (2000-4000Hz) - next ~10 bins
    sum = 0;
    for (let i = 33; i < 43; i++) {
      sum += fftData[i];
    }
    bands.highMid = Math.min(255, Math.floor(sum / 10));
    
    // Calculate high (4000-20000Hz) - remaining bins
    sum = 0;
    for (let i = 43; i < fftData.length; i++) {
      sum += fftData[i];
    }
    bands.high = Math.min(255, Math.floor(sum / (fftData.length - 43)));
    
    return bands;
  }
  
  /**
   * Simple beat detection based on bass energy
   * @param {Object} bands - Frequency bands
   * @returns {boolean} Whether a beat is detected
   */
  detectBeat(bands) {
    if (!this.lastBassValue) {
      this.lastBassValue = bands.bass;
      return false;
    }
    
    const bassIncrease = bands.bass - this.lastBassValue;
    this.lastBassValue = bands.bass;
    
    // Higher threshold for beat detection to avoid false positives with noise
    const beatThreshold = 40;
    const minimumBassEnergy = 150;
    
    // If bass increased significantly, consider it a beat
    return bassIncrease > beatThreshold && bands.bass > minimumBassEnergy;
  }

  /**
   * Stop recording system audio
   */
  stopCapture() {
    if (!this.isRecording) {
      return;
    }

    if (this.audioRecorder) {
      try {
        this.audioRecorder.stop();
      } catch (error) {
        console.error('Error stopping audio recorder:', error);
      }
    }

    if (this.audioStream) {
      this.audioStream.removeAllListeners();
    }

    this.isRecording = false;
    this.audioRecorder = null;
    this.audioStream = null;
    this.emit('stopped');
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopCapture();
    
    // Clean up temp files
    try {
      if (fs.existsSync(this.outputPath)) {
        fs.unlinkSync(this.outputPath);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = SystemAudioCapture;
