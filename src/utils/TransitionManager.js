/**
 * TransitionManager
 * Manages smooth transitions between visualizations
 */

class TransitionManager {
  constructor(options = {}) {
    // Transition state
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.sourceVisualization = null;
    this.targetVisualization = null;
    
    // Transition settings
    this.duration = options.duration || 1500; // in milliseconds
    this.transitionType = options.transitionType || 'crossfade';
    this.easing = options.easing || 'easeInOutCubic';
    
    // Transition timing
    this.startTime = 0;
    this.endTime = 0;
    
    // Canvas for transition rendering
    this.sourceCanvas = document.createElement('canvas');
    this.targetCanvas = document.createElement('canvas');
    this.sourceContext = this.sourceCanvas.getContext('2d');
    this.targetContext = this.targetCanvas.getContext('2d');
    
    // Morphing shapes for advanced transitions
    this.morphShapes = [];
    
    // Audio reactivity
    this.audioReactivityFactor = options.audioReactivityFactor || 0.3;
    this.beatTriggered = false;
    
    // Transition effects
    this.effects = {
      particleCount: options.particleCount || 300,
      particles: []
    };
  }
  
  /**
   * Initialize the transition manager with proper canvas size
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  initialize(width, height) {
    this.resize(width, height);
  }
  
  /**
   * Resize transition canvases
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.sourceCanvas.width = width;
    this.sourceCanvas.height = height;
    this.targetCanvas.width = width;
    this.targetCanvas.height = height;
  }
  
  /**
   * Start a transition between visualizations
   * @param {Object} sourceVisualization - The current visualization
   * @param {Object} targetVisualization - The visualization to transition to
   * @param {Object} options - Transition options
   * @returns {boolean} - Success status
   */
  startTransition(sourceVisualization, targetVisualization, options = {}) {
    if (this.isTransitioning) {
      // Already in a transition, finish it first
      this.completeTransition();
    }
    
    // Set visualizations
    this.sourceVisualization = sourceVisualization;
    this.targetVisualization = targetVisualization;
    
    // Apply options
    this.duration = options.duration || this.duration;
    this.transitionType = options.transitionType || this.transitionType;
    this.easing = options.easing || this.easing;
    
    // Set timing
    this.startTime = Date.now();
    this.endTime = this.startTime + this.duration;
    this.transitionProgress = 0;
    
    // Reset state
    this.isTransitioning = true;
    this.beatTriggered = false;
    
    // Initialize transition-specific elements
    if (this.transitionType === 'particles') {
      this.initParticleTransition();
    } else if (this.transitionType === 'morphing') {
      this.initMorphingTransition();
    }
    
    return true;
  }
  
  /**
   * Initialize particles for a particle-based transition
   */
  initParticleTransition() {
    const width = this.sourceCanvas.width;
    const height = this.sourceCanvas.height;
    
    this.effects.particles = [];
    
    // Create particles in a grid pattern
    const gridSize = Math.ceil(Math.sqrt(this.effects.particleCount));
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (this.effects.particles.length >= this.effects.particleCount) break;
        
        const particle = {
          // Starting position (from source visualization)
          srcX: (i + 0.5) * cellWidth, 
          srcY: (j + 0.5) * cellHeight,
          
          // Target position (for target visualization)
          tgtX: (i + 0.5) * cellWidth,
          tgtY: (j + 0.5) * cellHeight,
          
          // Current position
          x: (i + 0.5) * cellWidth,
          y: (j + 0.5) * cellHeight,
          
          // Random offsets for animation
          offsetX: (Math.random() - 0.5) * width * 0.5,
          offsetY: (Math.random() - 0.5) * height * 0.5,
          
          // Random delay for staggered animation
          delay: Math.random() * 0.3,
          
          // Size and color
          size: 2 + Math.random() * 3,
          color: { r: 255, g: 255, b: 255, a: 0.8 }
        };
        
        this.effects.particles.push(particle);
      }
    }
  }
  
  /**
   * Initialize morphing shapes for a morphing transition
   */
  initMorphingTransition() {
    // Create basic shapes for morphing
    this.morphShapes = [];
    
    // Add circles that will morph
    const width = this.sourceCanvas.width;
    const height = this.sourceCanvas.height;
    
    const shapeCount = 5;
    for (let i = 0; i < shapeCount; i++) {
      const shape = {
        // Source shape properties
        srcCenterX: width * (0.3 + Math.random() * 0.4),
        srcCenterY: height * (0.3 + Math.random() * 0.4),
        srcRadius: 20 + Math.random() * 80,
        srcRotation: Math.random() * Math.PI * 2,
        
        // Target shape properties (will be randomized during transition)
        tgtCenterX: width * (0.3 + Math.random() * 0.4),
        tgtCenterY: height * (0.3 + Math.random() * 0.4),
        tgtRadius: 20 + Math.random() * 80,
        tgtRotation: Math.random() * Math.PI * 2,
        
        // Current properties
        centerX: 0,
        centerY: 0,
        radius: 0,
        rotation: 0,
        
        // Color and style
        color: { 
          r: 120 + Math.floor(Math.random() * 135), 
          g: 120 + Math.floor(Math.random() * 135), 
          b: 180 + Math.floor(Math.random() * 75), 
          a: 0.3 + Math.random() * 0.3
        },
        
        // Shape type (0: circle, 1: square, 2: triangle)
        type: Math.floor(Math.random() * 3),
        
        // Animation timing
        delay: Math.random() * 0.4,
        duration: 0.6 + Math.random() * 0.4
      };
      
      this.morphShapes.push(shape);
    }
  }
  
  /**
   * Update the transition progress
   * @param {Object} audioData - Audio data for audio-reactive transitions
   * @returns {number} - Current progress (0-1)
   */
  update(audioData) {
    if (!this.isTransitioning) return 1;
    
    const now = Date.now();
    let normalProgress = Math.min(1, (now - this.startTime) / this.duration);
    
    // Apply easing function
    const easedProgress = this.applyEasing(normalProgress);
    this.transitionProgress = easedProgress;
    
    // Apply audio reactivity if audio data is available
    if (audioData && audioData.bands) {
      // Check for beat to trigger special transition effects
      if (audioData.isBeat && !this.beatTriggered) {
        this.beatTriggered = true;
        this.handleBeatTransition(audioData);
      }
      
      // Modify transition speed based on audio intensity
      const bassIntensity = audioData.bands.bass / 255;
      const midIntensity = audioData.bands.mid / 255;
      
      // Adjust progress based on audio
      const audioFactor = (bassIntensity * 0.6 + midIntensity * 0.4) * this.audioReactivityFactor;
      
      // Speed up or add variation to the transition based on audio
      if (this.transitionType === 'particles') {
        this.updateParticleTransition(easedProgress, audioData);
      } else if (this.transitionType === 'morphing') {
        this.updateMorphingTransition(easedProgress, audioData);
      }
    }
    
    // Check if transition is complete
    if (now >= this.endTime) {
      this.completeTransition();
      return 1;
    }
    
    return easedProgress;
  }
  
  /**
   * Update particle positions for particle transition
   * @param {number} progress - Transition progress (0-1)
   * @param {Object} audioData - Audio data for reactivity
   */
  updateParticleTransition(progress, audioData) {
    // Get audio intensity for particles
    const bassIntensity = audioData ? audioData.bands.bass / 255 : 0;
    const highIntensity = audioData ? audioData.bands.high / 255 : 0;
    
    // Update each particle
    this.effects.particles.forEach(particle => {
      // Calculate particle-specific progress with delay
      const particleProgress = Math.max(0, Math.min(1, (progress - particle.delay) / (1 - particle.delay)));
      
      if (particleProgress <= 0) {
        // Not started yet
        particle.x = particle.srcX;
        particle.y = particle.srcY;
        return;
      }
      
      if (particleProgress >= 1) {
        // Completed
        particle.x = particle.tgtX;
        particle.y = particle.tgtY;
        return;
      }
      
      // Mid-transition animation with audioReactivity
      // Create a curved path with offset at the midpoint
      const midProgress = particleProgress < 0.5 
        ? particleProgress * 2 
        : (1 - particleProgress) * 2;
      
      // Add audio reactivity to the offset
      const reactiveOffset = midProgress * (1 + bassIntensity * 2);
      
      // Calculate current position
      particle.x = particle.srcX + (particle.tgtX - particle.srcX) * particleProgress +
                  particle.offsetX * reactiveOffset;
      
      particle.y = particle.srcY + (particle.tgtY - particle.srcY) * particleProgress +
                  particle.offsetY * reactiveOffset;
      
      // Update size and opacity with audio reactivity
      particle.size = (2 + Math.random() * 3) * (1 + highIntensity);
      particle.color.a = 0.8 * (1 - (1 - midProgress) * 0.5);
    });
  }
  
  /**
   * Update morphing shapes for morphing transition
   * @param {number} progress - Transition progress (0-1)
   * @param {Object} audioData - Audio data for reactivity
   */
  updateMorphingTransition(progress, audioData) {
    // Get audio intensity for morphing
    const bassIntensity = audioData ? audioData.bands.bass / 255 : 0;
    const midIntensity = audioData ? audioData.bands.mid / 255 : 0;
    
    // Update each shape
    this.morphShapes.forEach(shape => {
      // Calculate shape-specific progress with delay
      const shapeProgress = Math.max(0, Math.min(1, (progress - shape.delay) / shape.duration));
      
      // Interpolate between source and target properties
      shape.centerX = shape.srcCenterX + (shape.tgtCenterX - shape.srcCenterX) * shapeProgress;
      shape.centerY = shape.srcCenterY + (shape.tgtCenterY - shape.srcCenterY) * shapeProgress;
      shape.radius = shape.srcRadius + (shape.tgtRadius - shape.srcRadius) * shapeProgress;
      shape.rotation = shape.srcRotation + (shape.tgtRotation - shape.srcRotation) * shapeProgress;
      
      // Add audio reactivity to the shape
      shape.radius *= (1 + bassIntensity * 0.3);
      shape.color.a = (0.3 + Math.random() * 0.3) * (1 + midIntensity * 0.2);
    });
  }
  
  /**
   * Handle beat events in transitions
   * @param {Object} audioData - Audio data for reactivity
   */
  handleBeatTransition(audioData) {
    if (this.transitionType === 'particles') {
      // Create a burst effect
      const intensity = audioData.bands.bass / 255;
      
      this.effects.particles.forEach(particle => {
        // Add more random movement on beat
        particle.offsetX += (Math.random() - 0.5) * 100 * intensity;
        particle.offsetY += (Math.random() - 0.5) * 100 * intensity;
      });
    } else if (this.transitionType === 'morphing') {
      // Randomize target positions for some shapes
      this.morphShapes.forEach(shape => {
        if (Math.random() > 0.7) {
          const width = this.sourceCanvas.width;
          const height = this.sourceCanvas.height;
          
          shape.tgtCenterX = width * (0.3 + Math.random() * 0.4);
          shape.tgtCenterY = height * (0.3 + Math.random() * 0.4);
          shape.tgtRotation = Math.random() * Math.PI * 2;
        }
      });
    }
  }
  
  /**
   * Apply easing function to transition progress
   * @param {number} progress - Linear progress (0-1)
   * @returns {number} - Eased progress (0-1)
   */
  applyEasing(progress) {
    switch (this.easing) {
      case 'linear':
        return progress;
        
      case 'easeInQuad':
        return progress * progress;
        
      case 'easeOutQuad':
        return progress * (2 - progress);
        
      case 'easeInOutQuad':
        return progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress;
        
      case 'easeInCubic':
        return progress * progress * progress;
        
      case 'easeOutCubic':
        const p = progress - 1;
        return p * p * p + 1;
        
      case 'easeInOutCubic':
        return progress < 0.5
          ? 4 * progress * progress * progress
          : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
          
      default:
        return progress;
    }
  }
  
  /**
   * Complete the current transition
   */
  completeTransition() {
    this.isTransitioning = false;
    this.transitionProgress = 1;
    this.sourceVisualization = null;
    
    // Clean up resources
    this.effects.particles = [];
    this.morphShapes = [];
  }
  
  /**
   * Render the transition to the provided context
   * @param {CanvasRenderingContext2D} ctx - Canvas context to render to
   * @param {Object} dimensions - Canvas dimensions
   * @param {Object} audioData - Audio data for reactivity
   */
  render(ctx, dimensions, audioData) {
    if (!this.isTransitioning || !this.sourceVisualization || !this.targetVisualization) {
      return false;
    }
    
    const { width, height } = dimensions;
    
    // Ensure canvases are the right size
    if (this.sourceCanvas.width !== width || this.sourceCanvas.height !== height) {
      this.resize(width, height);
    }
    
    // Clear source and target canvases
    this.sourceContext.clearRect(0, 0, width, height);
    this.targetContext.clearRect(0, 0, width, height);
    
    // Render source and target visualizations to separate canvases
    this.sourceVisualization.render(this.sourceContext, dimensions, audioData);
    this.targetVisualization.render(this.targetContext, dimensions, audioData);
    
    // Render the transition based on type
    switch (this.transitionType) {
      case 'crossfade':
        this.renderCrossfade(ctx, dimensions);
        break;
        
      case 'wipe':
        this.renderWipe(ctx, dimensions);
        break;
        
      case 'zoom':
        this.renderZoom(ctx, dimensions);
        break;
        
      case 'particles':
        this.renderParticleTransition(ctx, dimensions, audioData);
        break;
        
      case 'morphing':
        this.renderMorphingTransition(ctx, dimensions, audioData);
        break;
        
      default:
        this.renderCrossfade(ctx, dimensions);
    }
    
    return true;
  }
  
  /**
   * Render a simple crossfade transition
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} dimensions - Canvas dimensions
   */
  renderCrossfade(ctx, dimensions) {
    const { width, height } = dimensions;
    
    // Draw source visualization with fading opacity
    ctx.globalAlpha = 1 - this.transitionProgress;
    ctx.drawImage(this.sourceCanvas, 0, 0, width, height);
    
    // Draw target visualization with increasing opacity
    ctx.globalAlpha = this.transitionProgress;
    ctx.drawImage(this.targetCanvas, 0, 0, width, height);
    
    // Reset opacity
    ctx.globalAlpha = 1;
  }
  
  /**
   * Render a wipe transition
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} dimensions - Canvas dimensions
   */
  renderWipe(ctx, dimensions) {
    const { width, height } = dimensions;
    
    // Calculate wipe position
    const wipePosition = width * this.transitionProgress;
    
    // Draw source visualization
    ctx.drawImage(
      this.sourceCanvas,
      0, 0, width - wipePosition, height,
      0, 0, width - wipePosition, height
    );
    
    // Draw target visualization
    ctx.drawImage(
      this.targetCanvas,
      width - wipePosition, 0, wipePosition, height,
      width - wipePosition, 0, wipePosition, height
    );
  }
  
  /**
   * Render a zoom transition
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} dimensions - Canvas dimensions
   */
  renderZoom(ctx, dimensions) {
    const { width, height } = dimensions;
    
    // Draw source visualization scaling down
    if (this.transitionProgress < 1) {
      const scale = 1 + this.transitionProgress * 0.5;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = (scaledWidth - width) / 2;
      const offsetY = (scaledHeight - height) / 2;
      
      ctx.globalAlpha = 1 - this.transitionProgress;
      ctx.drawImage(
        this.sourceCanvas,
        -offsetX, -offsetY, scaledWidth, scaledHeight
      );
    }
    
    // Draw target visualization scaling up
    if (this.transitionProgress > 0) {
      const scale = 0.5 + this.transitionProgress * 0.5;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = (scaledWidth - width) / 2;
      const offsetY = (scaledHeight - height) / 2;
      
      ctx.globalAlpha = this.transitionProgress;
      ctx.drawImage(
        this.targetCanvas,
        -offsetX, -offsetY, scaledWidth, scaledHeight
      );
    }
    
    // Reset opacity
    ctx.globalAlpha = 1;
  }
  
  /**
   * Render a particle-based transition
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} dimensions - Canvas dimensions
   * @param {Object} audioData - Audio data for reactivity
   */
  renderParticleTransition(ctx, dimensions, audioData) {
    const { width, height } = dimensions;
    const imageSize = 10; // Size of image chunks
    
    // Update particle positions
    this.update(audioData);
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw particles from both source and target
    this.effects.particles.forEach(particle => {
      // Source image particles (fading out)
      if (this.transitionProgress < 0.7) {
        const sourceOpacity = Math.max(0, 1 - this.transitionProgress / 0.7);
        ctx.globalAlpha = sourceOpacity * particle.color.a;
        
        ctx.drawImage(
          this.sourceCanvas,
          Math.floor(particle.srcX - imageSize/2), Math.floor(particle.srcY - imageSize/2),
          imageSize, imageSize,
          Math.floor(particle.x - imageSize/2), Math.floor(particle.y - imageSize/2),
          imageSize, imageSize
        );
      }
      
      // Target image particles (fading in)
      if (this.transitionProgress > 0.3) {
        const targetOpacity = Math.min(1, (this.transitionProgress - 0.3) / 0.7);
        ctx.globalAlpha = targetOpacity * particle.color.a;
        
        ctx.drawImage(
          this.targetCanvas,
          Math.floor(particle.tgtX - imageSize/2), Math.floor(particle.tgtY - imageSize/2),
          imageSize, imageSize,
          Math.floor(particle.x - imageSize/2), Math.floor(particle.y - imageSize/2),
          imageSize, imageSize
        );
      }
    });
    
    // Reset opacity
    ctx.globalAlpha = 1;
  }
  
  /**
   * Render a morphing shapes transition
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} dimensions - Canvas dimensions
   * @param {Object} audioData - Audio data for reactivity
   */
  renderMorphingTransition(ctx, dimensions, audioData) {
    const { width, height } = dimensions;
    
    // Update morphing shapes
    this.update(audioData);
    
    // Base transition with crossfade
    this.renderCrossfade(ctx, dimensions);
    
    // Draw morphing shapes on top for additional effect
    ctx.save();
    
    // Use screen or overlay blend mode for additive effects
    ctx.globalCompositeOperation = 'screen';
    
    // Draw each shape
    this.morphShapes.forEach(shape => {
      ctx.save();
      ctx.translate(shape.centerX, shape.centerY);
      ctx.rotate(shape.rotation);
      
      const { r, g, b, a } = shape.color;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      
      switch (shape.type) {
        case 0: // Circle
          ctx.beginPath();
          ctx.arc(0, 0, shape.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 1: // Square
          ctx.fillRect(-shape.radius, -shape.radius, shape.radius * 2, shape.radius * 2);
          break;
          
        case 2: // Triangle
          ctx.beginPath();
          ctx.moveTo(0, -shape.radius);
          ctx.lineTo(shape.radius, shape.radius);
          ctx.lineTo(-shape.radius, shape.radius);
          ctx.closePath();
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
    
    ctx.restore();
  }
  
  /**
   * Check if a transition is currently in progress
   * @returns {boolean} - Whether a transition is active
   */
  isActive() {
    return this.isTransitioning;
  }
  
  /**
   * Get the current transition progress
   * @returns {number} - Transition progress (0-1)
   */
  getProgress() {
    return this.transitionProgress;
  }
  
  /**
   * Set the transition type
   * @param {string} type - Transition type
   * @returns {TransitionManager} - This instance for chaining
   */
  setTransitionType(type) {
    this.transitionType = type;
    return this;
  }
  
  /**
   * Set transition duration
   * @param {number} duration - Duration in milliseconds
   * @returns {TransitionManager} - This instance for chaining
   */
  setDuration(duration) {
    this.duration = duration;
    return this;
  }
  
  /**
   * Set the easing function
   * @param {string} easing - Easing function name
   * @returns {TransitionManager} - This instance for chaining
   */
  setEasing(easing) {
    this.easing = easing;
    return this;
  }
  
  /**
   * Set audio reactivity factor
   * @param {number} factor - Audio reactivity factor (0-1)
   * @returns {TransitionManager} - This instance for chaining
   */
  setAudioReactivity(factor) {
    this.audioReactivityFactor = Math.max(0, Math.min(1, factor));
    return this;
  }
}

export default TransitionManager;
