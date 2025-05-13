/**
 * CanvasManager class
 * Manages canvas rendering optimizations, buffering, and scaling
 */

import PerformanceMonitor from './PerformanceMonitor';

class CanvasManager {
  constructor(options = {}) {
    // Canvas elements
    this.mainCanvas = null;
    this.bufferCanvas = null;
    this.effectsCanvas = null;
    this.layerCanvases = [];
    
    // Canvas contexts
    this.mainContext = null;
    this.bufferContext = null;
    this.effectsContext = null;
    this.layerContexts = [];
    
    // Dimensions and scaling
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.pixelRatio = window.devicePixelRatio || 1;
    this.scaleFactor = 1;
    
    // Performance monitoring
    this.performanceMonitor = options.performanceMonitor || new PerformanceMonitor();
    
    // Rendering options
    this.useBuffering = options.useBuffering !== undefined ? options.useBuffering : true;
    this.useEffects = options.useEffects !== undefined ? options.useEffects : true;
    this.layerCount = options.layerCount || 2;
    this.frameSkip = 0;
    this.frameCount = 0;
    
    // Active visualization and rendering
    this.activeVisualization = null;
    this.customRenderer = null;
    
    // Initialization
    if (options.parentElement) {
      this.initialize(options.parentElement);
    }
  }
  
  /**
   * Initialize canvas elements
   * @param {HTMLElement} parentElement - Container element for canvases
   */
  initialize(parentElement) {
    // Clear any existing canvases
    parentElement.innerHTML = '';
    
    // Create main display canvas
    this.mainCanvas = document.createElement('canvas');
    this.mainCanvas.width = this.width * this.pixelRatio;
    this.mainCanvas.height = this.height * this.pixelRatio;
    this.mainCanvas.style.width = `${this.width}px`;
    this.mainCanvas.style.height = `${this.height}px`;
    this.mainCanvas.style.position = 'absolute';
    this.mainCanvas.style.top = '0';
    this.mainCanvas.style.left = '0';
    parentElement.appendChild(this.mainCanvas);
    this.mainContext = this.mainCanvas.getContext('2d');
    
    // Create buffer canvas (not added to DOM)
    this.bufferCanvas = document.createElement('canvas');
    this.bufferCanvas.width = this.width * this.pixelRatio;
    this.bufferCanvas.height = this.height * this.pixelRatio;
    this.bufferContext = this.bufferCanvas.getContext('2d');
    
    // Create effects canvas (not added to DOM)
    this.effectsCanvas = document.createElement('canvas');
    this.effectsCanvas.width = this.width * this.pixelRatio;
    this.effectsCanvas.height = this.height * this.pixelRatio;
    this.effectsContext = this.effectsCanvas.getContext('2d');
    
    // Create layer canvases
    this.layerCanvases = [];
    this.layerContexts = [];
    
    for (let i = 0; i < this.layerCount; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width * this.pixelRatio;
      canvas.height = this.height * this.pixelRatio;
      const context = canvas.getContext('2d');
      
      this.layerCanvases.push(canvas);
      this.layerContexts.push(context);
    }
    
    // Apply initial scale
    this.applyDPIScaling();
  }
  
  /**
   * Apply device pixel ratio scaling to all contexts
   */
  applyDPIScaling() {
    const contexts = [
      this.mainContext,
      this.bufferContext,
      this.effectsContext,
      ...this.layerContexts
    ];
    
    contexts.forEach(ctx => {
      if (ctx) {
        ctx.scale(this.pixelRatio * this.scaleFactor, this.pixelRatio * this.scaleFactor);
      }
    });
  }
  
  /**
   * Resize all canvases
   * @param {number} width - New width in pixels
   * @param {number} height - New height in pixels
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    
    const canvases = [
      this.mainCanvas,
      this.bufferCanvas,
      this.effectsCanvas,
      ...this.layerCanvases
    ];
    
    // Resize all canvases
    canvases.forEach(canvas => {
      if (canvas) {
        canvas.width = width * this.pixelRatio * this.scaleFactor;
        canvas.height = height * this.pixelRatio * this.scaleFactor;
        if (canvas === this.mainCanvas) {
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      }
    });
    
    // Reapply scaling
    this.applyDPIScaling();
  }
  
  /**
   * Set the active visualization
   * @param {Object} visualization - Visualization object with render method
   */
  setVisualization(visualization) {
    this.activeVisualization = visualization;
  }
  
  /**
   * Set a custom renderer function for transitions
   * @param {Function} rendererFn - Custom renderer function that takes (ctx, dimensions, audioData) as parameters
   */
  setCustomRenderer(rendererFn) {
    this.customRenderer = rendererFn;
  }
  
  /**
   * Clear the custom renderer and return to normal visualization rendering
   */
  clearCustomRenderer() {
    this.customRenderer = null;
  }
  
  /**
   * Clear all canvas layers
   */
  clearAll() {
    const contexts = [
      this.mainContext,
      this.bufferContext,
      this.effectsContext,
      ...this.layerContexts
    ];
    
    contexts.forEach(ctx => {
      if (ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
      }
    });
  }
  
  /**
   * Apply post-processing effects
   * @param {string} effect - Effect type to apply
   * @param {Object} params - Effect parameters
   */
  applyEffect(effect, params = {}) {
    if (!this.useEffects) return;
    
    const ctx = this.effectsContext;
    
    switch (effect) {
      case 'blur':
        // Simple blur by drawing slightly transparent copies
        ctx.globalAlpha = params.intensity || 0.3;
        ctx.drawImage(
          this.bufferCanvas,
          -params.amount || -1, -params.amount || -1,
          this.width + (params.amount || 1) * 2,
          this.height + (params.amount || 1) * 2
        );
        ctx.globalAlpha = 1;
        break;
        
      case 'bloom':
        // Simple bloom effect
        const bloomIntensity = params.intensity || 0.5;
        const threshold = params.threshold || 0.5;
        
        // Draw original image
        ctx.drawImage(this.bufferCanvas, 0, 0, this.width, this.height);
        
        // Extract bright areas
        ctx.globalCompositeOperation = 'lighter';
        ctx.filter = `brightness(${threshold * 100}%) contrast(400%)`;
        
        // Add multiple bloom layers
        for (let i = 0; i < 3; i++) {
          const size = (i + 1) * 2;
          ctx.globalAlpha = bloomIntensity / (i + 1);
          ctx.drawImage(
            this.bufferCanvas,
            -size, -size,
            this.width + size * 2,
            this.height + size * 2
          );
        }
        
        // Reset
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        break;
        
      case 'trails':
        // Persistence effect
        ctx.globalAlpha = 1 - (params.decay || 0.1);
        ctx.drawImage(this.effectsCanvas, 0, 0, this.width, this.height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.bufferCanvas, 0, 0, this.width, this.height);
        break;
        
      case 'colorShift':
        // RGB shift effect
        ctx.drawImage(this.bufferCanvas, 0, 0, this.width, this.height);
        
        // Red channel
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(params.amount || 2, 0, this.width, this.height);
        
        // Blue channel
        ctx.fillStyle = 'rgba(0,0,255,0.3)';
        ctx.fillRect(-(params.amount || 2), 0, this.width, this.height);
        
        ctx.globalCompositeOperation = 'source-over';
        break;
    }
  }
  
  /**
   * Render a frame with the active visualization
   * @param {Object} audioData - Audio data for visualization
   */
  render(audioData) {
    if (!this.activeVisualization) return;
    
    // Performance monitoring
    this.performanceMonitor.startFrame();
    
    // Check if we should skip this frame for performance
    if (this.frameSkip > 0) {
      this.frameCount++;
      if (this.frameCount % this.frameSkip !== 0) {
        this.performanceMonitor.endFrame();
        return;
      }
    }
    
    // Get quality settings
    const qualitySettings = this.performanceMonitor.getQualitySettings();
    
    // Adjust scale factor based on quality
    const newScaleFactor = qualitySettings.resolution;
    if (newScaleFactor !== this.scaleFactor) {
      this.scaleFactor = newScaleFactor;
      this.resize(this.width, this.height);
    }
    
    // Determine target canvas
    const targetCtx = this.useBuffering ? this.bufferContext : this.mainContext;
    
    // Clear the target canvas
    targetCtx.clearRect(0, 0, this.width, this.height);
    
    // If custom renderer is set, use it instead of the active visualization
    if (this.customRenderer) {
      this.customRenderer(targetCtx, {
        width: this.width,
        height: this.height
      }, audioData, qualitySettings);
    } else if (this.activeVisualization) {
      // Otherwise, render the active visualization
      this.activeVisualization.render(targetCtx, {
        width: this.width,
        height: this.height
      }, audioData, qualitySettings);
    }
    
    // Apply post-processing if enabled
    if (this.useEffects && this.useBuffering) {
      // Clear effects canvas if not using trails effect
      if (qualitySettings.effects !== 'minimal') {
        if (qualitySettings.effects === 'enhanced') {
          this.applyEffect('bloom', { intensity: 0.5 + (audioData?.bands?.high / 255) * 0.5 });
        } else if (qualitySettings.effects === 'standard') {
          this.applyEffect('trails', { decay: 0.1 + (audioData?.bands?.mid / 255) * 0.1 });
        }
      }
      
      // Copy to main canvas
      this.mainContext.clearRect(0, 0, this.width, this.height);
      
      if (qualitySettings.effects === 'minimal') {
        this.mainContext.drawImage(this.bufferCanvas, 0, 0, this.width, this.height);
      } else {
        this.mainContext.drawImage(this.effectsCanvas, 0, 0, this.width, this.height);
      }
    }
    
    // Draw FPS counter if in development mode
    if (process.env.NODE_ENV === 'development') {
      this.drawPerformanceMetrics();
    }
    
    // End frame and update performance stats
    this.performanceMonitor.endFrame();
    
    // Adjust frame skip based on performance
    this.updateFrameSkip();
  }
  
  /**
   * Draw performance metrics on the canvas
   */
  drawPerformanceMetrics() {
    const metrics = this.performanceMonitor.getMetrics();
    const ctx = this.mainContext;
    
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 150, 60);
    
    ctx.font = '12px monospace';
    ctx.fillStyle = metrics.fps < 30 ? '#ff5555' : '#ffffff';
    ctx.fillText(`FPS: ${metrics.fps.toFixed(1)}`, 20, 30);
    ctx.fillStyle = metrics.cpu > 0.8 ? '#ff5555' : '#ffffff';
    ctx.fillText(`CPU: ${(metrics.cpu * 100).toFixed(1)}%`, 20, 50);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Quality: ${metrics.quality}`, 20, 70);
    ctx.restore();
  }
  
  /**
   * Update frame skip value based on performance
   */
  updateFrameSkip() {
    const metrics = this.performanceMonitor.getMetrics();
    
    // Adjust frame skip based on FPS
    if (metrics.fps < 20) {
      this.frameSkip = 3; // Render 1 frame out of 3
    } else if (metrics.fps < 30) {
      this.frameSkip = 2; // Render every other frame
    } else {
      this.frameSkip = 0; // Render all frames
    }
  }
}

export default CanvasManager;
