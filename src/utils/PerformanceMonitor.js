/**
 * PerformanceMonitor utility class
 * Tracks performance metrics and provides adaptive quality recommendations
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.targetFPS = options.targetFPS || 60;
    this.sampleSize = options.sampleSize || 60; // Number of frames to average
    this.warningThreshold = options.warningThreshold || 0.8; // % of target FPS
    this.criticalThreshold = options.criticalThreshold || 0.6; // % of target FPS
    
    // Performance metrics
    this.frames = [];
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.avgFPS = 0;
    this.lastFPS = 0;
    this.performanceScore = 1.0; // 0 to 1 quality multiplier
    
    // CPU monitoring
    this.cpuStartTime = 0;
    this.cpuUsage = [];
    this.avgCPUUsage = 0;
    
    // Quality settings
    this.currentQualityLevel = 'high'; // 'low', 'medium', 'high', 'ultra'
    this.qualityLevels = {
      low: { particleCount: 0.25, resolution: 0.5, effects: 'minimal' },
      medium: { particleCount: 0.5, resolution: 0.75, effects: 'basic' },
      high: { particleCount: 1.0, resolution: 1.0, effects: 'standard' },
      ultra: { particleCount: 1.5, resolution: 1.0, effects: 'enhanced' }
    };
    
    // Auto-adjust settings
    this.autoAdjust = options.autoAdjust !== undefined ? options.autoAdjust : true;
    this.adjustmentCooldown = 0;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize performance monitoring
   */
  init() {
    this.lastFrameTime = performance.now();
    this.cpuStartTime = performance.now();
    
    // Check if the performance API is available
    if (window.performance && performance.memory) {
      this.memoryAvailable = true;
    }
  }
  
  /**
   * Start monitoring a frame render cycle
   */
  startFrame() {
    this.cpuStartTime = performance.now();
  }
  
  /**
   * End a frame render cycle and update metrics
   */
  endFrame() {
    const now = performance.now();
    const frameDuration = now - this.lastFrameTime;
    const cpuFrameTime = now - this.cpuStartTime;
    
    // Track frame time
    this.frames.push(frameDuration);
    if (this.frames.length > this.sampleSize) {
      this.frames.shift();
    }
    
    // Track CPU usage (time spent rendering as % of frame time)
    const cpuUsage = Math.min(1, cpuFrameTime / (1000 / this.targetFPS));
    this.cpuUsage.push(cpuUsage);
    if (this.cpuUsage.length > this.sampleSize) {
      this.cpuUsage.shift();
    }
    
    // Calculate average values
    this.avgCPUUsage = this.cpuUsage.reduce((sum, value) => sum + value, 0) / this.cpuUsage.length;
    
    // Calculate performance metrics
    this.lastFPS = 1000 / frameDuration;
    this.avgFPS = 1000 / (this.frames.reduce((sum, value) => sum + value, 0) / this.frames.length);
    
    // Update performance score
    this.updatePerformanceScore();
    
    // Auto-adjust quality if enabled
    if (this.autoAdjust && this.adjustmentCooldown <= 0) {
      this.adjustQuality();
      this.adjustmentCooldown = 180; // Wait ~3 seconds before next adjustment
    } else if (this.adjustmentCooldown > 0) {
      this.adjustmentCooldown--;
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
  }
  
  /**
   * Update the performance score based on current metrics
   */
  updatePerformanceScore() {
    // Calculate score as ratio of actual to target FPS
    let fpsRatio = Math.min(1, this.avgFPS / this.targetFPS);
    
    // Penalize heavy CPU usage
    const cpuPenalty = Math.pow(this.avgCPUUsage, 2);
    
    // Calculate final score (0 to 1)
    this.performanceScore = Math.max(0.1, fpsRatio * (1 - cpuPenalty * 0.5));
  }
  
  /**
   * Adjust quality settings based on performance
   */
  adjustQuality() {
    const fps = this.avgFPS;
    const targetFPS = this.targetFPS;
    const warningFPS = targetFPS * this.warningThreshold;
    const criticalFPS = targetFPS * this.criticalThreshold;
    
    // Determine appropriate quality level
    let newQuality;
    
    if (fps < criticalFPS) {
      newQuality = 'low';
    } else if (fps < warningFPS) {
      newQuality = 'medium';
    } else if (fps >= targetFPS * 1.2 && this.currentQualityLevel === 'high') {
      newQuality = 'ultra';
    } else {
      newQuality = 'high';
    }
    
    // Only update if quality level changes
    if (newQuality !== this.currentQualityLevel) {
      this.currentQualityLevel = newQuality;
      console.log(`Performance: Adjusting quality to ${newQuality} (FPS: ${fps.toFixed(1)})`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the current quality settings
   * @returns {Object} Current quality settings
   */
  getQualitySettings() {
    return {
      ...this.qualityLevels[this.currentQualityLevel],
      performanceScore: this.performanceScore
    };
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Current performance metrics
   */
  getMetrics() {
    return {
      fps: this.avgFPS,
      cpu: this.avgCPUUsage,
      quality: this.currentQualityLevel,
      score: this.performanceScore
    };
  }
  
  /**
   * Check if performance is currently problematic
   * @returns {boolean} True if performance issues detected
   */
  hasPerformanceIssues() {
    return this.avgFPS < this.targetFPS * this.warningThreshold;
  }
}

export default PerformanceMonitor;
