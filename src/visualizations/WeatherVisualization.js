/**
 * Enhanced Weather Visualization
 * A weather-themed visualization with dynamic clouds, rain, lightning and atmospheric effects
 */

import BaseVisualization from './BaseVisualization';
import ParticleSystem from './ParticleSystem';

class WeatherVisualization extends BaseVisualization {
  constructor(options = {}) {
    // Call parent constructor with merged options
    super({
      name: 'Weather',
      description: 'A weather-themed visualization with clouds, rain, and lightning',
      author: 'Music Visualizer',
      useParticles: true,
      particleCount: 600,
      colorPalette: {
        primary: { r: 200, g: 220, b: 255, a: 1 },
        secondary: { r: 120, g: 140, b: 190, a: 1 },
        accent: { r: 240, g: 240, b: 255, a: 1 },
        background: { r: 30, g: 40, b: 70, a: 1 }
      },
      ...options
    });
    
    // Weather-specific state
    this.clouds = [];
    this.lightningPoints = [];
    this.lightningTimer = 0;
    this.lastLightningTime = 0;
    this.weatherIntensity = 0.5; // 0 to 1
    this.cloudOpacity = 0.7;
    this.skyBrightness = 0.5; // 0 to 1
    this.animationTime = 0;
    
    // Create custom particle systems
    this.createWeatherParticleSystems();
  }
  
  /**
   * Create particle systems specific to weather visualization
   */
  createWeatherParticleSystems() {
    // Clear existing particle systems
    this.particleSystems = {};
    
    // Rain particles
    this.particleSystems.rain = new ParticleSystem({
      maxParticles: this.config.particleCount,
      emissionRate: 20,
      particleSize: { min: 1, max: 3 },
      particleLifespan: { min: 40, max: 80 },
      color: { r: 200, g: 220, b: 255, a: 0.6 },
      gravity: { x: 0, y: 0.5 },
      wind: { x: -0.2, y: 0 },
      friction: 0.98,
      blendMode: 'screen',
      audioBehavior: {
        emissionRate: { band: 'mid', min: 10, max: 40 },
        wind: { band: 'midLow', min: -0.5, max: 0 }
      }
    });
    
    // Cloud puff particles
    this.particleSystems.cloudPuffs = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.3),
      emissionRate: 1,
      particleSize: { min: 20, max: 50 },
      particleLifespan: { min: 100, max: 200 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 255, g: 255, b: 255, a: 0.02 } },
        { pos: 0.3, color: { r: 240, g: 240, b: 245, a: 0.1 } },
        { pos: 0.7, color: { r: 220, g: 225, b: 235, a: 0.1 } },
        { pos: 1, color: { r: 200, g: 210, b: 230, a: 0 } }
      ],
      gravity: { x: 0, y: -0.01 },
      turbulence: 0.02,
      friction: 0.99,
      blendMode: 'screen',
      audioBehavior: {
        size: { band: 'bass', factor: 0.5 }
      }
    });
    
    // Lightning flash particles
    this.particleSystems.lightningFlash = new ParticleSystem({
      maxParticles: 20,
      emissionRate: 0, // Only emit during lightning
      particleSize: { min: 100, max: 300 },
      particleLifespan: { min: 5, max: 15 },
      color: { r: 240, g: 240, b: 255, a: 0.2 },
      friction: 1,
      gravity: { x: 0, y: 0 },
      blendMode: 'screen'
    });
    
    // Mist particles
    this.particleSystems.mist = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.2),
      emissionRate: 2,
      particleSize: { min: 100, max: 200 },
      particleLifespan: { min: 150, max: 300 },
      color: { r: 200, g: 210, b: 230, a: 0.05 },
      friction: 0.995,
      turbulence: 0.01,
      gravity: { x: 0, y: 0 },
      blendMode: 'screen',
      audioBehavior: {
        wind: { band: 'midLow', min: -0.2, max: 0.2 }
      }
    });
  }
  
  /**
   * Set up the visualization when dimensions change
   */
  setupParticleEmissionAreas() {
    // Check if dimensions are defined before proceeding
    if (!this.dimensions || !this.dimensions.width || !this.dimensions.height) {
      console.warn('Cannot setup particle emission areas: dimensions not defined');
      return;
    }
    
    const { width, height } = this.dimensions;
    
    // Configure rain to emit from top of screen
    if (this.particleSystems.rain) {
      this.particleSystems.rain.setEmissionArea({
        x: 0,
        y: -50, // Start above screen
        width: width * 1.2, // Wider than screen for edge coverage
        height: 10
      });
    }
    
    // Configure cloud puffs to emit from cloud areas
    if (this.particleSystems.cloudPuffs) {
      this.particleSystems.cloudPuffs.setEmissionArea({
        x: 0,
        y: 0,
        width: width,
        height: height * 0.3 // Top 30% of screen
      });
    }
    
    // Configure lightning flash to emit from center
    if (this.particleSystems.lightningFlash) {
      this.particleSystems.lightningFlash.setEmissionArea({
        x: width * 0.3,
        y: height * 0.1,
        width: width * 0.4,
        height: height * 0.1
      });
    }
    
    // Configure mist to emit from bottom
    if (this.particleSystems.mist) {
      this.particleSystems.mist.setEmissionArea({
        x: 0,
        y: height * 0.6,
        width: width,
        height: height * 0.4
      });
    }
    
    // Create clouds
    this.createClouds();
  }
  
  /**
   * Create cloud entities
   */
  createClouds() {
    const { width, height } = this.dimensions;
    
    // Create different types of clouds
    this.clouds = [
      // Large clouds in foreground
      {
        x: width * 0.2,
        y: height * 0.2,
        size: 60,
        speed: 0.2,
        puffs: [
          { x: 0, y: 0, size: 1.0 },
          { x: 0.5, y: -0.3, size: 0.7 },
          { x: -0.5, y: -0.2, size: 0.8 },
          { x: 0.8, y: 0.1, size: 0.6 },
          { x: -0.7, y: 0.2, size: 0.7 }
        ]
      },
      {
        x: width * 0.7,
        y: height * 0.15,
        size: 70,
        speed: 0.15,
        puffs: [
          { x: 0, y: 0, size: 1.0 },
          { x: 0.6, y: -0.2, size: 0.8 },
          { x: -0.6, y: -0.1, size: 0.7 },
          { x: 0.3, y: 0.2, size: 0.9 },
          { x: -0.4, y: 0.3, size: 0.8 },
          { x: 0.1, y: -0.4, size: 0.6 }
        ]
      },
      
      // Medium clouds mid-level
      {
        x: width * 0.4,
        y: height * 0.25,
        size: 50,
        speed: 0.3,
        puffs: [
          { x: 0, y: 0, size: 1.0 },
          { x: 0.4, y: -0.2, size: 0.7 },
          { x: -0.4, y: -0.1, size: 0.65 },
          { x: 0.6, y: 0.1, size: 0.5 }
        ]
      },
      {
        x: width * 0.8,
        y: height * 0.28,
        size: 45,
        speed: 0.25,
        puffs: [
          { x: 0, y: 0, size: 1.0 },
          { x: 0.5, y: -0.1, size: 0.6 },
          { x: -0.4, y: -0.2, size: 0.7 },
          { x: 0.2, y: 0.2, size: 0.8 }
        ]
      },
      
      // Smaller background clouds
      {
        x: width * 0.3,
        y: height * 0.1,
        size: 30,
        speed: 0.4,
        puffs: [
          { x: 0, y: 0, size: 1.0 },
          { x: 0.4, y: -0.2, size: 0.6 },
          { x: -0.3, y: -0.1, size: 0.7 }
        ]
      },
      {
        x: width * 0.6,
        y: height * 0.08,
        size: 25,
        speed: 0.35,
        puffs: [
          { x: 0, y: 0, size: 1.0 },
          { x: 0.3, y: -0.2, size: 0.8 },
          { x: -0.3, y: 0.1, size: 0.7 }
        ]
      }
    ];
  }
  
  /**
   * Update visualization state
   */
  updateElements(deltaTime, audioData, qualitySettings) {
    // Update animation time
    this.animationTime += deltaTime * 0.01;
    
    // Extract audio data
    let bassLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    let isBeat = false;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
      highLevel = audioData.bands.high / 255;
      isBeat = audioData.isBeat;
      
      // Adjust weather intensity based on overall energy
      const energy = (bassLevel + midLevel + highLevel) / 3;
      this.weatherIntensity = 0.3 + energy * 0.7;
      
      // Adjust cloud opacity based on high frequencies
      this.cloudOpacity = 0.5 + highLevel * 0.5;
      
      // Adjust sky brightness (darker during intense parts)
      this.skyBrightness = 0.7 - bassLevel * 0.3;
    }
    
    // Update cloud positions
    this.clouds.forEach(cloud => {
      // Move clouds based on their speed and weather intensity
      cloud.x -= cloud.speed * this.weatherIntensity * deltaTime * 0.1;
      
      // Wrap clouds around when they go off-screen
      if (cloud.x < -cloud.size * 2) {
        cloud.x = this.dimensions.width + cloud.size;
        cloud.y = this.dimensions.height * Math.random() * 0.3;
      }
    });
    
    // Handle lightning effect creation
    this.updateLightning(deltaTime, audioData);
    
    // Update particle emission rates based on intensity
    if (this.particleSystems.rain) {
      // Only adjust base rate, audio reactivity is handled by the particle system
      let baseRate = 20 * this.weatherIntensity;
      
      // Use ultra settings for higher emission rate if available
      if (qualitySettings && qualitySettings.effects === 'enhanced') {
        baseRate *= 1.5;
      } else if (qualitySettings && qualitySettings.effects === 'minimal') {
        baseRate *= 0.5;
      }
      
      this.particleSystems.rain.emissionRate = baseRate;
    }
  }
  
  /**
   * Update lightning effects
   */
  updateLightning(deltaTime, audioData) {
    // Update existing lightning
    if (this.lightningTimer > 0) {
      this.lightningTimer -= deltaTime;
      
      if (this.lightningTimer <= 0) {
        // Clear lightning when timer expires
        this.lightningPoints = [];
      }
    }
    
    // Create new lightning on strong beats or randomly during intense weather
    const now = Date.now();
    const timeSinceLastLightning = now - this.lastLightningTime;
    const minLightningInterval = 2000; // At least 2 seconds between lightning
    
    if (timeSinceLastLightning > minLightningInterval) {
      let shouldCreateLightning = false;
      
      if (audioData && audioData.isBeat && audioData.bands.bass > 200) {
        // Create lightning on strong bass beats
        shouldCreateLightning = true;
      } else if (this.weatherIntensity > 0.7 && Math.random() < 0.002 * this.weatherIntensity * deltaTime) {
        // Random lightning during intense weather
        shouldCreateLightning = true;
      }
      
      if (shouldCreateLightning) {
        this.createLightning();
        this.lastLightningTime = now;
        
        // Create lightning flash
        if (this.particleSystems.lightningFlash) {
          const { width, height } = this.dimensions;
          
          // Add a few flash particles at random positions in the sky
          for (let i = 0; i < 3; i++) {
            this.particleSystems.lightningFlash.addParticle({
              x: Math.random() * width,
              y: Math.random() * height * 0.3,
              vx: 0,
              vy: 0,
              size: 100 + Math.random() * 200,
              color: { r: 255, g: 255, b: 255, a: 0.2 + Math.random() * 0.2 }
            });
          }
        }
      }
    }
  }
  
  /**
   * Create a lightning bolt
   */
  createLightning() {
    const { width, height } = this.dimensions;
    
    // Clear previous lightning
    this.lightningPoints = [];
    
    // Random starting position at the top
    const startX = width * (0.3 + Math.random() * 0.4);
    const startY = height * 0.05;
    
    // Generate lightning
    this.generateLightningBranch(
      startX, 
      startY, 
      Math.PI / 2, // Downward direction
      height * 0.3, // Length
      0.3, // Branch probability
      3, // Width
      1 // Recursion level
    );
    
    // Set timer
    this.lightningTimer = 10;
  }
  
  /**
   * Recursively generate a lightning branch
   */
  generateLightningBranch(startX, startY, angle, length, branchProbability, width, level) {
    if (length < 5 || level > 4) return;
    
    // Add randomness to angle
    angle += (Math.random() - 0.5) * 0.2;
    
    // Calculate end point
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    
    // Add segment
    this.lightningPoints.push({
      startX,
      startY,
      endX,
      endY,
      width,
      alpha: 1
    });
    
    // Chance to create a branch
    if (level < 3 && Math.random() < branchProbability) {
      const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * Math.PI / 4;
      this.generateLightningBranch(
        startX, 
        startY, 
        branchAngle, 
        length * 0.7, 
        branchProbability * 0.7, 
        width * 0.7,
        level + 1
      );
    }
    
    // Continue the main lightning bolt
    this.generateLightningBranch(
      endX, 
      endY, 
      angle + (Math.random() - 0.5) * 0.2, 
      length * 0.8, 
      branchProbability, 
      width, 
      level
    );
  }
  
  /**
   * Draw the background with a sky gradient
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Create sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    
    // Adjust sky colors based on brightness
    const brightness = this.skyBrightness;
    skyGradient.addColorStop(0, `rgba(${30 + brightness * 40}, ${40 + brightness * 50}, ${70 + brightness * 60}, 1)`);
    skyGradient.addColorStop(1, `rgba(${50 + brightness * 30}, ${60 + brightness * 40}, ${90 + brightness * 30}, 1)`);
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw distant mountains if in high quality mode
    if (qualitySettings && qualitySettings.effects !== 'minimal') {
      this.drawDistantMountains(ctx, dimensions, brightness);
    }
    
    // Draw mist as a gradient from bottom
    const mistGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    mistGradient.addColorStop(0, 'rgba(180, 195, 210, 0)');
    mistGradient.addColorStop(1, `rgba(180, 195, 210, ${0.2 + this.weatherIntensity * 0.2})`);
    
    ctx.fillStyle = mistGradient;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);
  }
  
  /**
   * Draw distant mountains in the background
   */
  drawDistantMountains(ctx, dimensions, brightness) {
    const { width, height } = dimensions;
    
    ctx.fillStyle = `rgba(${40 + brightness * 30}, ${50 + brightness * 30}, ${70 + brightness * 30}, 0.8)`;
    
    // Draw several mountain ranges
    for (let range = 0; range < 2; range++) {
      const baseHeight = height * (0.6 - range * 0.08);
      const amplitude = height * (0.1 - range * 0.03);
      const frequency = 0.003 + range * 0.002;
      
      ctx.beginPath();
      ctx.moveTo(0, baseHeight);
      
      // Create jagged mountain effect with perlin-like noise
      for (let x = 0; x < width; x += 5) {
        // Use multiple sine waves for more natural look
        const y = baseHeight - 
          Math.abs(Math.sin(x * frequency + range)) * amplitude -
          Math.abs(Math.sin(x * frequency * 2.5 + range * 7)) * amplitude * 0.4 -
          Math.abs(Math.sin(x * frequency * 5 + range * 13)) * amplitude * 0.2;
        
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(width, baseHeight);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  /**
   * Draw the main visualization elements
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    // Draw lightning if active
    if (this.lightningTimer > 0 && this.lightningPoints.length > 0) {
      this.drawLightning(ctx);
    }
    
    // Draw clouds
    this.drawClouds(ctx, dimensions, audioData);
    
    // Overlay frequency visualization at the bottom if in high quality
    if (qualitySettings && qualitySettings.effects !== 'minimal' && audioData && audioData.frequencyData) {
      this.drawFrequencyBars(ctx, dimensions, audioData.frequencyData, {
        maxHeight: dimensions.height * 0.2,
        bottom: dimensions.height,
        colorStart: { h: 210, s: 80, l: 70 },
        colorEnd: { h: 240, s: 80, l: 60 }
      });
    }
  }
  
  /**
   * Draw lightning effect
   */
  drawLightning(ctx) {
    // Draw each lightning segment
    this.lightningPoints.forEach(segment => {
      // Fade alpha as lightning timer decreases
      const fadeRatio = Math.max(0, this.lightningTimer / 10);
      const alpha = segment.alpha * fadeRatio;
      
      // Main bolt
      ctx.beginPath();
      ctx.moveTo(segment.startX, segment.startY);
      ctx.lineTo(segment.endX, segment.endY);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = segment.width;
      ctx.stroke();
      
      // Add glow
      ctx.beginPath();
      ctx.moveTo(segment.startX, segment.startY);
      ctx.lineTo(segment.endX, segment.endY);
      ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.7})`;
      ctx.lineWidth = segment.width * 4;
      ctx.stroke();
    });
    
    // Add lightning flash overlay
    if (this.lightningTimer > 8) {
      const flashIntensity = (this.lightningTimer - 8) / 2 * 0.2;
      ctx.fillStyle = `rgba(200, 220, 255, ${flashIntensity})`;
      ctx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);
    }
  }
  
  /**
   * Draw cloud formations
   */
  drawClouds(ctx, dimensions, audioData) {
    const { width, height } = dimensions;
    
    // Extract audio reactivity values
    let bassLevel = 0;
    let midLevel = 0;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
    }
    
    // Draw each cloud
    this.clouds.forEach(cloud => {
      // Calculate audio-reactive size
      const sizeMultiplier = 1 + bassLevel * 0.3;
      
      // Draw each puff in the cloud
      cloud.puffs.forEach(puff => {
        const puffX = cloud.x + puff.x * cloud.size;
        const puffY = cloud.y + puff.y * cloud.size;
        const puffSize = cloud.size * puff.size * sizeMultiplier;
        
        // Create subtle movement effect
        const time = this.animationTime;
        const xOffset = Math.sin(time + puff.x * 10) * 2;
        const yOffset = Math.cos(time + puff.y * 10) * 1;
        
        // Draw puff
        ctx.beginPath();
        ctx.arc(puffX + xOffset, puffY + yOffset, puffSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.cloudOpacity * 0.5})`;
        ctx.fill();
        
        // Draw highlight on top side
        ctx.beginPath();
        ctx.arc(puffX + xOffset, puffY + yOffset - puffSize * 0.2, puffSize * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.cloudOpacity * 0.3})`;
        ctx.fill();
        
        // Draw shadow on bottom side
        ctx.beginPath();
        ctx.arc(puffX + xOffset, puffY + yOffset + puffSize * 0.2, puffSize * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 190, 210, ${this.cloudOpacity * 0.3})`;
        ctx.fill();
      });
    });
  }
  
  /**
   * Draw foreground effects (rain splash, etc)
   */
  drawForeground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Draw rain splash effect at bottom
    if (this.weatherIntensity > 0.3 && qualitySettings && qualitySettings.effects !== 'minimal') {
      this.drawRainSplashes(ctx, dimensions);
    }
    
    // Add rain overlay effect (subtle streaks)
    if (this.weatherIntensity > 0.5) {
      this.drawRainOverlay(ctx, dimensions);
    }
  }
  
  /**
   * Draw rain splash effects
   */
  drawRainSplashes(ctx, dimensions) {
    const { width, height } = dimensions;
    const groundY = height * 0.95;
    
    // Create splash effect based on rain particles
    if (this.particleSystems.rain && this.particleSystems.rain.particles) {
      // Only show a subset of splashes for performance
      const maxSplashes = 10;
      let splashCount = 0;
      
      // Get rain particles near the ground
      for (const particle of this.particleSystems.rain.particles) {
        if (particle.y > groundY - 10 && splashCount < maxSplashes) {
          // Create a splash effect
          const splashSize = particle.size * 3;
          const splashOpacity = Math.min(0.7, particle.color.a * 2);
          
          // Draw splash ripple
          ctx.beginPath();
          ctx.arc(particle.x, groundY, splashSize, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${splashOpacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw splash droplets
          const dropletCount = 3;
          for (let i = 0; i < dropletCount; i++) {
            const angle = Math.PI * 1.5 + (Math.random() - 0.5);
            const distance = Math.random() * splashSize * 0.7;
            const dropletX = particle.x + Math.cos(angle) * distance;
            const dropletY = groundY + Math.sin(angle) * distance;
            
            ctx.beginPath();
            ctx.arc(dropletX, dropletY, Math.random() * splashSize * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${splashOpacity * 0.5})`;
            ctx.fill();
          }
          
          splashCount++;
        }
      }
    }
  }
  
  /**
   * Draw rain overlay effect
   */
  drawRainOverlay(ctx, dimensions) {
    const { width, height } = dimensions;
    
    // Draw semi-transparent rain streaks
    ctx.save();
    ctx.strokeStyle = `rgba(200, 220, 255, ${0.1 * this.weatherIntensity})`;
    ctx.lineWidth = 1;
    
    const streakCount = Math.floor(30 * this.weatherIntensity);
    
    for (let i = 0; i < streakCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = 10 + Math.random() * 25;
      const angle = Math.PI / 3; // About 60 degrees
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length * Math.cos(angle), y + length * Math.sin(angle));
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

export default WeatherVisualization;
