/**
 * BaseVisualization
 * Abstract base class for visualizations that provides common functionality
 * and standardized interface for the visualization system
 */

import ParticleSystem from './ParticleSystem';

class BaseVisualization {
  constructor(options = {}) {
    // General properties
    this.name = options.name || 'Base Visualization';
    this.description = options.description || 'Abstract base visualization';
    this.author = options.author || 'Music Visualizer';
    
    // Rendering context and dimensions
    this.ctx = null;
    this.dimensions = { width: 0, height: 0 };
    
    // Animation and timing
    this.startTime = Date.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    
    // Particle systems
    this.particleSystems = {};
    
    // Audio data and state
    this.audioData = null;
    this.beatCount = 0;
    this.lastBeat = 0;
    
    // Visual elements and layers
    this.layers = {};
    this.elements = {};
    
    // Configuration
    this.config = {
      useParticles: options.useParticles !== undefined ? options.useParticles : true,
      particleCount: options.particleCount || 200,
      colorPalette: options.colorPalette || {
        primary: { r: 255, g: 255, b: 255, a: 1 },
        secondary: { r: 100, g: 100, b: 255, a: 1 },
        accent: { r: 255, g: 100, b: 100, a: 1 },
        background: { r: 0, g: 0, b: 0, a: 1 }
      },
      sensitivity: options.sensitivity || {
        bass: 1.0,
        mid: 1.0,
        high: 1.0
      }
    };
    
    // Initialize the visualization
    this.init(options);
  }
  
  /**
   * Initializes the visualization
   * This is called by the constructor and can be overridden by subclasses
   * @param {Object} options - Initialization options
   */
  init(options) {
    // Initialize any particle systems
    if (this.config.useParticles) {
      this.createDefaultParticleSystems();
    }
  }
  
  /**
   * Creates the default particle systems
   * Subclasses can override this to create custom particle systems
   */
  createDefaultParticleSystems() {
    // Create a basic particle system
    this.particleSystems.main = new ParticleSystem({
      maxParticles: this.config.particleCount,
      emissionRate: 2,
      particleSize: { min: 1, max: 4 },
      particleLifespan: { min: 60, max: 120 },
      color: this.config.colorPalette.primary,
      friction: 0.98,
      gravity: { x: 0, y: 0.02 },
      audioBehavior: {
        emissionRate: { band: 'bass', min: 1, max: 10 },
        size: { band: 'mid', factor: 1.5 },
        beatBurst: { count: 10, speed: 3 }
      }
    });
  }
  
  /**
   * Sets up the visualization with a canvas context and dimensions
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions {width, height}
   */
  setup(ctx, dimensions) {
    this.ctx = ctx;
    this.dimensions = dimensions;
    
    // Set up particle system emission areas
    if (this.config.useParticles) {
      this.setupParticleEmissionAreas();
    }
    
    // Reset timing
    this.startTime = Date.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
  }
  
  /**
   * Sets up emission areas for particle systems based on current dimensions
   * Subclasses can override this for custom emission areas
   */
  setupParticleEmissionAreas() {
    const { width, height } = this.dimensions;
    
    // Configure main particle system to emit from center of screen
    if (this.particleSystems.main) {
      this.particleSystems.main.setEmissionArea({
        x: width * 0.4,
        y: height * 0.4,
        width: width * 0.2,
        height: height * 0.2
      });
    }
  }
  
  /**
   * Updates the visualization state
   * @param {Object} audioData - Audio data from analyzer
   * @param {Object} qualitySettings - Rendering quality settings
   * @returns {boolean} True if update was successful
   */
  update(audioData, qualitySettings = {}) {
    if (!this.ctx || !this.dimensions) return false;
    
    // Store audio data
    this.audioData = audioData;
    
    // Check if audio data is null or completely silent (all values are zero)
    const isSilent = !audioData || 
      (audioData.frequencyData && audioData.frequencyData.every(val => val === 0)) ||
      (audioData.bands && Object.values(audioData.bands).every(value => value === 0));

    // For completely silent audio, don't update anything - render a static view
    if (isSilent) {
      // Return immediately with no updates for silent data
      return false;
    }
    
    // Only calculate deltas and perform animations for real audio data
    // Store current time and calculate delta time
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 16.67; // Normalized to 60fps
    this.lastFrameTime = currentTime;
    
    // Track beats
    if (audioData && audioData.isBeat) {
      this.beatCount++;
      this.lastBeat = currentTime;
    }
    
    // Update particle systems with audio data
    if (this.config.useParticles) {
      for (const key in this.particleSystems) {
        if (this.particleSystems[key]) {
          this.particleSystems[key].updateFromAudio(audioData);
          this.particleSystems[key].update(deltaTime, this.dimensions);
        }
      }
    }
    
    // Update any custom elements (implemented by subclasses)
    this.updateElements(deltaTime, audioData, qualitySettings);
    
    // Increment frame counter
    this.frameCount++;
    
    return true;
  }
  
  /**
   * Updates custom visualization elements
   * This should be implemented by subclasses
   * @param {number} deltaTime - Time since last update
   * @param {Object} audioData - Audio data from analyzer
   * @param {Object} qualitySettings - Rendering quality settings
   */
  updateElements(deltaTime, audioData, qualitySettings) {
    // Implement in subclasses
  }
  
  /**
   * Renders the visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @param {Object} audioData - Audio data from analyzer
   * @param {Object} qualitySettings - Rendering quality settings
   */
  render(ctx, dimensions, audioData, qualitySettings = {}) {
    // Store context and dimensions
    this.ctx = ctx;
    this.dimensions = dimensions;
    
    // Check if data is completely silent
    const isSilent = !audioData || 
      (audioData && audioData.frequencyData && audioData.frequencyData.every(val => val === 0)) ||
      (audioData && audioData.bands && Object.values(audioData.bands).every(value => value === 0));
    
    if (isSilent) {
      // For silent data, render a minimal static display
      // Draw solid background
      this.drawBackground(ctx, dimensions, null, qualitySettings);
      
      // Draw very minimal static elements
      this.drawMinimalElements(ctx, dimensions, qualitySettings);
    } else {
      // For real audio data, do the full visualization
      // Update visualization state with audio data
      this.update(audioData, qualitySettings);
      
      // Draw background (implemented by subclasses)
      this.drawBackground(ctx, dimensions, audioData, qualitySettings);
      
      // Draw main elements (implemented by subclasses)
      this.drawElements(ctx, dimensions, audioData, qualitySettings);
      
      // Render particle systems
      if (this.config.useParticles) {
        for (const key in this.particleSystems) {
          if (this.particleSystems[key]) {
            this.particleSystems[key].render(ctx, qualitySettings);
          }
        }
      }
      
      // Draw foreground effects (implemented by subclasses)
      this.drawForeground(ctx, dimensions, audioData, qualitySettings);
    }
  }
  
  /**
   * Draws a minimal static visualization when no audio is present
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions
   * @param {Object} qualitySettings - Rendering quality settings
   */
  drawMinimalElements(ctx, dimensions, qualitySettings) {
    // By default, just draw some stars
    if (this.stars && this.stars.length > 0) {
      for (let i = 0; i < this.stars.length; i++) {
        const star = this.stars[i];
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.7})`;
        ctx.fill();
      }
    } else {
      // Create some stars if they don't exist yet
      this.stars = this.createStarField(100);
      this.drawMinimalElements(ctx, dimensions, qualitySettings);
    }
  }

  /**
   * Draws the visualization background
   * This should be implemented by subclasses
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @param {Object} audioData - Audio data from analyzer
   * @param {Object} qualitySettings - Rendering quality settings
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    // Default implementation fills with background color - no audio reactivity
    const bg = this.config.colorPalette.background;
    ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  }
  
  /**
   * Draws the main visualization elements
   * This should be implemented by subclasses
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @param {Object} audioData - Audio data from analyzer
   * @param {Object} qualitySettings - Rendering quality settings
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    // Implement in subclasses
  }
  
  /**
   * Draws foreground effects on top of the main visualization
   * This should be implemented by subclasses
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @param {Object} audioData - Audio data from analyzer
   * @param {Object} qualitySettings - Rendering quality settings
   */
  drawForeground(ctx, dimensions, audioData, qualitySettings) {
    // Implement in subclasses
  }
  
  /**
   * Creates a radial gradient with audio reactivity
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} innerRadius - Inner radius
   * @param {number} outerRadius - Outer radius
   * @param {Array} colorStops - Array of color stop objects {pos, color}
   * @param {Object} audioData - Audio data for reactivity
   * @returns {CanvasGradient} Gradient object
   */
  createAudioReactiveGradient(x, y, innerRadius, outerRadius, colorStops, audioData) {
    // Apply audio reactivity if available
    let radiusMultiplier = 1;
    if (audioData && audioData.bands) {
      radiusMultiplier = 1 + (audioData.bands.bass / 255) * 0.3;
    }
    
    // Create gradient
    const gradient = this.ctx.createRadialGradient(
      x, y, innerRadius,
      x, y, outerRadius * radiusMultiplier
    );
    
    // Add color stops
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.pos, `rgba(${stop.color.r}, ${stop.color.g}, ${stop.color.b}, ${stop.color.a})`);
    });
    
    return gradient;
  }
  
  /**
   * Draws frequency bars at the bottom if in high quality mode
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions
   * @param {Array} frequencyData - Frequency data array
   * @param {Object} options - Visualization options
   */
  drawFrequencyBars(ctx, dimensions, frequencyData, options = {}) {
    if (!frequencyData) return;
    
    // Check if all frequency data is zero (silent)
    const isSilent = frequencyData.every(val => val === 0);
    if (isSilent) return; // Don't draw bars if silent
    
    const {
      barWidth = dimensions.width / 64,
      barSpacing = 2,
      maxHeight = dimensions.height * 0.3,
      minHeight = 2,
      bottom = dimensions.height,
      colorStart = { h: 240, s: 100, l: 50 },
      colorEnd = { h: 0, s: 100, l: 50 },
      mirrorMode = false
    } = options;
    
    const drawWidth = barWidth - barSpacing;
    const totalWidth = dimensions.width;
    const barCount = Math.min(Math.floor(totalWidth / barWidth), frequencyData.length);
    
    for (let i = 0; i < barCount; i++) {
      // Get normalized amplitude (0-1)
      const amplitude = frequencyData[i] / 255;
      
      // Skip drawing if amplitude is very low
      if (amplitude < 0.01) continue;
      
      // Calculate bar height
      const height = Math.max(minHeight, amplitude * maxHeight);
      
      // Interpolate color based on index
      const hue = colorStart.h + (colorEnd.h - colorStart.h) * (i / barCount);
      const color = `hsla(${hue}, ${colorStart.s}%, ${colorStart.l}%, 0.7)`;
      
      ctx.fillStyle = color;
      
      // Draw the bar
      const x = i * barWidth + barSpacing / 2;
      const y = bottom - height;
      
      ctx.fillRect(x, y, drawWidth, height);
      
      // Draw mirrored bar if in mirror mode
      if (mirrorMode) {
        ctx.fillRect(x, dimensions.height - y, drawWidth, height);
      }
    }
  }
  
  /**
   * Creates a star field with twinkling effect
   * @param {number} count - Number of stars
   * @returns {Array} Star objects
   */
  createStarField(count = 100) {
    const { width, height } = this.dimensions;
    
    return Array(count).fill().map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.5,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.03,
      twinkleOffset: Math.random() * Math.PI * 2
    }));
  }
  
  /**
   * Draws a star field with audio reactivity
   * @param {Array} stars - Array of star objects
   * @param {Object} audioData - Audio data for reactivity
   */
  drawStarField(stars, audioData) {
    const ctx = this.ctx;
    const now = Date.now() / 1000;
    
    // Audio reactivity factors
    let sizeMultiplier = 1;
    let brightnessBoost = 0;
    
    if (audioData) {
      sizeMultiplier = 1 + (audioData.bands.high / 255) * 0.5;
      brightnessBoost = (audioData.bands.mid / 255) * 0.3;
    }
    
    // Draw each star
    stars.forEach(star => {
      const time = now * star.twinkleSpeed + star.twinkleOffset;
      const twinkle = (Math.sin(time) + 1) / 2; // 0 to 1
      const brightness = 0.5 + star.brightness * 0.5 + twinkle * 0.3 + brightnessBoost;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * sizeMultiplier, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fill();
      
      // Add glow for brighter stars
      if (star.brightness > 0.7 || (audioData && audioData.isBeat)) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3 * sizeMultiplier, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${(star.brightness - 0.7) * 0.3 + 0.05})`;
        ctx.fill();
      }
    });
  }
  
  /**
   * Cleanup resources when visualization is no longer needed
   */
  dispose() {
    // Clean up particle systems
    if (this.config.useParticles) {
      for (const key in this.particleSystems) {
        if (this.particleSystems[key]) {
          // Particle systems don't have a dispose method, but if they did, we'd call it here
          this.particleSystems[key] = null;
        }
      }
    }
    
    // Reset state
    this.ctx = null;
    this.audioData = null;
  }
}

export default BaseVisualization;
