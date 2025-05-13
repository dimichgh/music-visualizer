/**
 * Particle System class
 * Manages a collection of particles with physics-based behavior
 */

class ParticleSystem {
  constructor(options = {}) {
    // Particle system settings
    this.maxParticles = options.maxParticles || 500;
    this.particleSize = options.particleSize || { min: 1, max: 4 };
    this.particleLifespan = options.particleLifespan || { min: 60, max: 120 };
    this.emissionRate = options.emissionRate || 5;
    this.emissionArea = options.emissionArea || { x: 0, y: 0, width: 0, height: 0 };
    
    // Physics settings
    this.gravity = options.gravity || { x: 0, y: 0.05 };
    this.friction = options.friction !== undefined ? options.friction : 0.98;
    this.turbulence = options.turbulence || 0;
    this.wind = options.wind || { x: 0, y: 0 };
    
    // Appearance settings
    this.color = options.color || { r: 255, g: 255, b: 255, a: 1 };
    this.colorMode = options.colorMode || 'static'; // 'static', 'gradient', 'random'
    this.colorGradient = options.colorGradient || [
      { pos: 0, color: { r: 255, g: 0, b: 128, a: 1 } },
      { pos: 1, color: { r: 0, g: 128, b: 255, a: 0 } }
    ];
    this.blendMode = options.blendMode || 'source-over';
    
    // Behavior
    this.behavior = options.behavior || 'standard'; // 'standard', 'trail', 'swarm', 'explosion'
    this.behaviorOptions = options.behaviorOptions || {};
    
    // Dynamic updates from audio
    this.audioBehavior = options.audioBehavior || {};
    
    // Active particles
    this.particles = [];
    
    // Performance optimization
    this.useObjectPool = true;
    this.particlePool = [];
    
    // Internal state
    this.active = true;
    this.time = 0;
  }
  
  /**
   * Creates a new particle
   * @param {Object} overrides - Properties to override default particle values
   * @returns {Object} A new particle object
   */
  createParticle(overrides = {}) {
    // Check if we can reuse a particle from the pool
    let particle;
    if (this.useObjectPool && this.particlePool.length > 0) {
      particle = this.particlePool.pop();
      this.resetParticle(particle);
    } else {
      particle = {};
    }
    
    // Set particle position (default is center of emission area)
    const area = this.emissionArea;
    const x = area.x + (Math.random() * area.width);
    const y = area.y + (Math.random() * area.height);
    
    // Set particle properties
    particle.x = overrides.x !== undefined ? overrides.x : x;
    particle.y = overrides.y !== undefined ? overrides.y : y;
    particle.vx = overrides.vx !== undefined ? overrides.vx : (Math.random() - 0.5) * 2;
    particle.vy = overrides.vy !== undefined ? overrides.vy : (Math.random() - 0.5) * 2;
    particle.size = overrides.size !== undefined ? overrides.size : 
      this.particleSize.min + Math.random() * (this.particleSize.max - this.particleSize.min);
    particle.life = overrides.life !== undefined ? overrides.life :
      this.particleLifespan.min + Math.random() * (this.particleLifespan.max - this.particleLifespan.min);
    particle.maxLife = particle.life;
    
    // Set color based on color mode
    if (this.colorMode === 'random') {
      particle.color = {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
        a: this.color.a
      };
    } else if (this.colorMode === 'gradient') {
      // Initial color (will be updated in lifecycle)
      particle.color = { ...this.colorGradient[0].color };
    } else {
      // Static color
      particle.color = { ...this.color };
    }
    
    // Additional properties for specific behaviors
    if (this.behavior === 'swarm') {
      particle.angle = Math.random() * Math.PI * 2;
      particle.speed = 0.5 + Math.random();
      particle.oscillationSpeed = 0.05 + Math.random() * 0.1;
    } else if (this.behavior === 'trail') {
      particle.points = [{ x: particle.x, y: particle.y }];
      particle.maxPoints = this.behaviorOptions.trailLength || 5;
    }
    
    // Apply any additional overrides
    Object.assign(particle, overrides);
    
    return particle;
  }
  
  /**
   * Resets a particle for reuse
   * @param {Object} particle - Particle to reset
   */
  resetParticle(particle) {
    // Reset basic properties
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.size = 0;
    particle.life = 0;
    particle.maxLife = 0;
    particle.color = null;
    
    // Reset behavior-specific properties
    if (particle.points) {
      particle.points.length = 0;
    }
    particle.angle = 0;
    particle.speed = 0;
    particle.oscillationSpeed = 0;
  }
  
  /**
   * Updates the particle system settings based on audio data
   * @param {Object} audioData - Audio data from the analyzer
   */
  updateFromAudio(audioData) {
    if (!audioData || !this.audioBehavior) return;
    
    // Update emission rate based on audio
    if (this.audioBehavior.emissionRate) {
      const band = this.audioBehavior.emissionRate.band || 'bass';
      const min = this.audioBehavior.emissionRate.min || 1;
      const max = this.audioBehavior.emissionRate.max || 15;
      
      const intensity = audioData.bands[band] / 255;
      this.emissionRate = min + intensity * (max - min);
    }
    
    // Update size based on audio
    if (this.audioBehavior.size) {
      const band = this.audioBehavior.size.band || 'mid';
      const factor = this.audioBehavior.size.factor || 1.5;
      
      const intensity = audioData.bands[band] / 255;
      const sizeMultiplier = 1 + intensity * factor;
      
      // Update size for existing particles
      this.particles.forEach(p => {
        p.audioSizeFactor = sizeMultiplier;
      });
    }
    
    // Update gravity based on audio
    if (this.audioBehavior.gravity) {
      const band = this.audioBehavior.gravity.band || 'highMid';
      const min = this.audioBehavior.gravity.min || -0.1;
      const max = this.audioBehavior.gravity.max || 0.2;
      
      const intensity = audioData.bands[band] / 255;
      this.gravity.y = min + intensity * (max - min);
    }
    
    // Update wind based on audio
    if (this.audioBehavior.wind) {
      const band = this.audioBehavior.wind.band || 'mid';
      const min = this.audioBehavior.wind.min || -0.5;
      const max = this.audioBehavior.wind.max || 0.5;
      
      const intensity = audioData.bands[band] / 255;
      this.wind.x = min + intensity * (max - min);
    }
    
    // Add burst of particles on beat
    if (this.audioBehavior.beatBurst && audioData.isBeat) {
      const count = this.audioBehavior.beatBurst.count || 20;
      const speed = this.audioBehavior.beatBurst.speed || 5;
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.addParticle({
          vx: Math.cos(angle) * speed * Math.random(),
          vy: Math.sin(angle) * speed * Math.random(),
          life: this.particleLifespan.max * 0.5 + Math.random() * this.particleLifespan.max * 0.5
        });
      }
    }
  }
  
  /**
   * Adds a new particle to the system
   * @param {Object} options - Particle initialization options
   */
  addParticle(options = {}) {
    if (this.particles.length >= this.maxParticles) {
      // Recycle oldest particle if at capacity
      const oldestParticle = this.particles.shift();
      this.resetParticle(oldestParticle);
      const newParticle = this.createParticle(options);
      Object.assign(oldestParticle, newParticle);
      this.particles.push(oldestParticle);
    } else {
      // Create new particle
      this.particles.push(this.createParticle(options));
    }
  }
  
  /**
   * Updates all particles in the system
   * @param {number} deltaTime - Time since last update in milliseconds
   * @param {Object} canvasDimensions - Dimensions of the canvas
   */
  update(deltaTime, canvasDimensions) {
    this.time += deltaTime;
    
    // Emit new particles based on emission rate
    const particlesToEmit = Math.floor(this.emissionRate);
    const emitProbability = this.emissionRate - particlesToEmit;
    
    // Emit whole number of particles
    for (let i = 0; i < particlesToEmit; i++) {
      this.addParticle();
    }
    
    // Emit fractional particle probabilistically
    if (Math.random() < emitProbability) {
      this.addParticle();
    }
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update particle life
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        // Recycle particle
        const deadParticle = this.particles.splice(i, 1)[0];
        if (this.useObjectPool) {
          this.particlePool.push(deadParticle);
        }
        continue;
      }
      
      // Calculate particle progress (0 to 1)
      const progress = 1 - (particle.life / particle.maxLife);
      
      // Update color for gradient mode
      if (this.colorMode === 'gradient' && this.colorGradient.length > 1) {
        this.updateParticleGradientColor(particle, progress);
      }
      
      // Update based on behavior
      switch (this.behavior) {
        case 'standard':
          this.updateStandardParticle(particle, deltaTime, progress);
          break;
        case 'swarm':
          this.updateSwarmParticle(particle, deltaTime, progress);
          break;
        case 'trail':
          this.updateTrailParticle(particle, deltaTime, progress);
          break;
        case 'explosion':
          this.updateExplosionParticle(particle, deltaTime, progress);
          break;
      }
      
      // Apply global forces
      particle.vx += this.wind.x * deltaTime;
      particle.vy += this.gravity.y * deltaTime;
      
      // Apply friction
      particle.vx *= this.friction;
      particle.vy *= this.friction;
      
      // Apply random turbulence
      if (this.turbulence > 0) {
        particle.vx += (Math.random() - 0.5) * this.turbulence * deltaTime;
        particle.vy += (Math.random() - 0.5) * this.turbulence * deltaTime;
      }
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Handle boundaries
      if (canvasDimensions) {
        // Bounce or wrap based on settings
        const boundaryBehavior = this.behaviorOptions.boundaryBehavior || 'wrap';
        
        if (boundaryBehavior === 'bounce') {
          // Bounce off edges
          if (particle.x < 0) {
            particle.x = 0;
            particle.vx *= -0.7;
          } else if (particle.x > canvasDimensions.width) {
            particle.x = canvasDimensions.width;
            particle.vx *= -0.7;
          }
          
          if (particle.y < 0) {
            particle.y = 0;
            particle.vy *= -0.7;
          } else if (particle.y > canvasDimensions.height) {
            particle.y = canvasDimensions.height;
            particle.vy *= -0.7;
          }
        } else if (boundaryBehavior === 'wrap') {
          // Wrap around edges
          if (particle.x < 0) {
            particle.x += canvasDimensions.width;
          } else if (particle.x > canvasDimensions.width) {
            particle.x -= canvasDimensions.width;
          }
          
          if (particle.y < 0) {
            particle.y += canvasDimensions.height;
          } else if (particle.y > canvasDimensions.height) {
            particle.y -= canvasDimensions.height;
          }
        }
      }
    }
  }
  
  /**
   * Updates a particle using standard behavior
   * @param {Object} particle - Particle to update
   * @param {number} deltaTime - Time since last update
   * @param {number} progress - Particle life progress (0-1)
   */
  updateStandardParticle(particle, deltaTime, progress) {
    // Fade out based on life progress
    particle.color.a = 1 - Math.pow(progress, 2);
  }
  
  /**
   * Updates a particle using swarm behavior
   * @param {Object} particle - Particle to update
   * @param {number} deltaTime - Time since last update
   * @param {number} progress - Particle life progress (0-1)
   */
  updateSwarmParticle(particle, deltaTime, progress) {
    // Update angle based on oscillation speed
    particle.angle += particle.oscillationSpeed * deltaTime;
    
    // Calculate new velocity based on angle and speed
    particle.vx = Math.cos(particle.angle) * particle.speed;
    particle.vy = Math.sin(particle.angle) * particle.speed;
    
    // Fade out gradually in the last 20% of life
    if (progress > 0.8) {
      particle.color.a = (1 - progress) * 5; // 1.0 at 80%, 0 at 100%
    }
  }
  
  /**
   * Updates a particle with trail behavior
   * @param {Object} particle - Particle to update
   * @param {number} deltaTime - Time since last update
   * @param {number} progress - Particle life progress (0-1)
   */
  updateTrailParticle(particle, deltaTime, progress) {
    // Add current position to trail points
    particle.points.push({ x: particle.x, y: particle.y });
    
    // Limit the number of trail points
    if (particle.points.length > particle.maxPoints) {
      particle.points.shift();
    }
    
    // Scale trail alpha
    particle.color.a = Math.min(1, 2 * (1 - progress));
  }
  
  /**
   * Updates a particle with explosion behavior
   * @param {Object} particle - Particle to update
   * @param {number} deltaTime - Time since last update
   * @param {number} progress - Particle life progress (0-1)
   */
  updateExplosionParticle(particle, deltaTime, progress) {
    // Reduce velocity over time
    const slowdown = 1 - Math.min(1, progress * 2);
    particle.vx *= slowdown;
    particle.vy *= slowdown;
    
    // Fade out
    particle.color.a = 1 - progress;
    
    // Shrink size
    particle.sizeMultiplier = 1 - Math.pow(progress, 2);
  }
  
  /**
   * Updates a particle's color based on gradient and life progress
   * @param {Object} particle - Particle to update
   * @param {number} progress - Particle life progress (0-1)
   */
  updateParticleGradientColor(particle, progress) {
    const gradient = this.colorGradient;
    
    // Find gradient stops for interpolation
    let startIndex = 0;
    for (let i = 0; i < gradient.length - 1; i++) {
      if (progress >= gradient[i].pos && progress <= gradient[i + 1].pos) {
        startIndex = i;
        break;
      }
    }
    
    const start = gradient[startIndex];
    const end = gradient[startIndex + 1];
    
    // Normalize progress between the two stops
    const segmentProgress = (progress - start.pos) / (end.pos - start.pos);
    
    // Interpolate color components
    particle.color.r = Math.round(start.color.r + (end.color.r - start.color.r) * segmentProgress);
    particle.color.g = Math.round(start.color.g + (end.color.g - start.color.g) * segmentProgress);
    particle.color.b = Math.round(start.color.b + (end.color.b - start.color.b) * segmentProgress);
    particle.color.a = start.color.a + (end.color.a - start.color.a) * segmentProgress;
  }
  
  /**
   * Renders all particles to the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} qualitySettings - Rendering quality settings
   */
  render(ctx, qualitySettings = {}) {
    // Apply global blend mode
    ctx.globalCompositeOperation = this.blendMode;
    
    // Draw each particle based on its behavior
    for (const particle of this.particles) {
      const color = particle.color;
      
      // Apply audio-based size factor if applicable
      const sizeMultiplier = particle.audioSizeFactor !== undefined ? particle.audioSizeFactor : 1;
      const size = particle.size * (particle.sizeMultiplier !== undefined ? particle.sizeMultiplier : 1) * sizeMultiplier;
      
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
      
      if (this.behavior === 'trail' && particle.points.length > 1) {
        // Draw trail as a path
        ctx.beginPath();
        ctx.moveTo(particle.points[0].x, particle.points[0].y);
        
        for (let i = 1; i < particle.points.length; i++) {
          ctx.lineTo(particle.points[i].x, particle.points[i].y);
        }
        
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      } else {
        // Draw standard particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Creates an explosion effect at a specific position
   * @param {number} x - X coordinate of explosion center
   * @param {number} y - Y coordinate of explosion center
   * @param {Object} options - Explosion options
   */
  createExplosion(x, y, options = {}) {
    const count = options.count || 30;
    const speed = options.speed || 4;
    const size = options.size || { min: 2, max: 5 };
    const lifespan = options.lifespan || { min: 30, max: 60 };
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * speed;
      
      this.addParticle({
        x: x,
        y: y,
        vx: Math.cos(angle) * distance,
        vy: Math.sin(angle) * distance,
        size: size.min + Math.random() * (size.max - size.min),
        life: lifespan.min + Math.random() * (lifespan.max - lifespan.min),
        color: options.color || this.color
      });
    }
  }
  
  /**
   * Sets the emission area for new particles
   * @param {Object} area - Area definition {x, y, width, height}
   */
  setEmissionArea(area) {
    this.emissionArea = area;
  }
  
  /**
   * Sets the current behavior mode
   * @param {string} behavior - Behavior type
   * @param {Object} options - Behavior-specific options
   */
  setBehavior(behavior, options = {}) {
    this.behavior = behavior;
    this.behaviorOptions = options;
  }
}

export default ParticleSystem;
