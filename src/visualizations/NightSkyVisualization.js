/**
 * Enhanced Night Sky Visualization
 * A serene night sky with stars, moon, northern lights, and celestial objects
 */

import BaseVisualization from './BaseVisualization';
import ParticleSystem from './ParticleSystem';

class NightSkyVisualization extends BaseVisualization {
  constructor(options = {}) {
    // Call parent constructor with merged options
    super({
      name: 'Night Sky',
      description: 'A serene night sky with stars, moon, and northern lights',
      author: 'Music Visualizer',
      useParticles: true,
      particleCount: 500,
      colorPalette: {
        primary: { r: 220, g: 240, b: 255, a: 1 },
        secondary: { r: 120, g: 140, b: 200, a: 1 },
        accent: { r: 100, g: 220, b: 180, a: 1 },
        background: { r: 5, g: 10, b: 25, a: 1 }
      },
      ...options
    });
    
    // Night sky-specific state
    this.stars = [];
    this.constellations = [];
    this.shootingStars = [];
    this.northernLightsTime = 0;
    this.moonPhase = 0.75; // 0-1 (0=new, 0.5=full, 1=new)
    this.animationTime = 0;
    this.lastBeatTime = 0;
    
    // Create custom particle systems
    this.createNightSkyParticleSystems();
  }
  
  /**
   * Create particle systems specific to night sky visualization
   */
  createNightSkyParticleSystems() {
    // Clear existing particle systems
    this.particleSystems = {};
    
    // Star twinkle particles
    this.particleSystems.starGlow = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.3),
      emissionRate: 2,
      particleSize: { min: 2, max: 6 },
      particleLifespan: { min: 30, max: 60 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 255, g: 255, b: 255, a: 0.4 } },
        { pos: 0.4, color: { r: 220, g: 240, b: 255, a: 0.2 } },
        { pos: 1, color: { r: 200, g: 220, b: 255, a: 0 } }
      ],
      gravity: { x: 0, y: 0 },
      friction: 0.99,
      blendMode: 'screen',
      audioBehavior: {
        size: { band: 'high', factor: 1.2 }
      }
    });
    
    // Shooting star particles
    this.particleSystems.shootingStars = new ParticleSystem({
      maxParticles: 50,
      emissionRate: 0, // Only emit on certain triggers
      particleSize: { min: 2, max: 4 },
      particleLifespan: { min: 40, max: 80 },
      color: { r: 255, g: 255, b: 255, a: 0.8 },
      behavior: 'trail',
      behaviorOptions: {
        trailLength: 10
      },
      gravity: { x: 0, y: 0.02 },
      friction: 0.99,
      blendMode: 'screen'
    });
    
    // Moon glow particles
    this.particleSystems.moonGlow = new ParticleSystem({
      maxParticles: 20,
      emissionRate: 0.5,
      particleSize: { min: 20, max: 60 },
      particleLifespan: { min: 60, max: 120 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 255, g: 255, b: 230, a: 0.1 } },
        { pos: 1, color: { r: 255, g: 255, b: 230, a: 0 } }
      ],
      gravity: { x: 0, y: -0.01 },
      friction: 0.98,
      blendMode: 'screen',
      audioBehavior: {
        emissionRate: { band: 'mid', min: 0.1, max: 1 }
      }
    });
    
    // Star field particles (background)
    this.particleSystems.starField = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.5),
      emissionRate: 1,
      particleSize: { min: 0.5, max: 1.5 },
      particleLifespan: { min: 200, max: 400 },
      color: { r: 255, g: 255, b: 255, a: 0.7 },
      gravity: { x: 0, y: 0 },
      friction: 1,
      blendMode: 'screen',
      audioBehavior: {
        size: { band: 'high', factor: 0.5 }
      }
    });
  }
  
  /**
   * Set up the visualization when dimensions change
   */
  setupParticleEmissionAreas() {
    const { width, height } = this.dimensions;
    
    // Configure star glow to emit around the canvas
    if (this.particleSystems.starGlow) {
      this.particleSystems.starGlow.setEmissionArea({
        x: 0,
        y: 0,
        width: width,
        height: height * 0.7 // Top 70% of screen (sky area)
      });
    }
    
    // Configure shooting stars to emit from top of screen
    if (this.particleSystems.shootingStars) {
      this.particleSystems.shootingStars.setEmissionArea({
        x: 0,
        y: 0,
        width: width,
        height: 10
      });
    }
    
    // Configure moon glow to emit from moon position
    if (this.particleSystems.moonGlow) {
      const moonX = width * 0.8;
      const moonY = height * 0.2;
      
      this.particleSystems.moonGlow.setEmissionArea({
        x: moonX - 20,
        y: moonY - 20,
        width: 40,
        height: 40
      });
    }
    
    // Configure star field to cover the whole sky
    if (this.particleSystems.starField) {
      this.particleSystems.starField.setEmissionArea({
        x: 0,
        y: 0,
        width: width,
        height: height * 0.7
      });
    }
    
    // Create stars and constellations
    this.createStarsAndConstellations();
    
    // Create the moon
    this.createMoon();
  }
  
  /**
   * Create stars and constellation entities
   */
  createStarsAndConstellations() {
    const { width, height } = this.dimensions;
    
    // Generate stars with different brightness levels
    this.stars = Array(300).fill().map(() => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.7, // Keep stars in the sky area
      radius: Math.random() * 2 + 0.5,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.03,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: this.getStarColor(Math.random())
    }));
    
    // Create constellation definitions
    // Each constellation has points and connections between points
    this.constellations = [
      // Ursa Major-like
      {
        name: "Great Bear",
        points: [
          { x: 0.2, y: 0.2, brightness: 0.9 },
          { x: 0.25, y: 0.18, brightness: 0.8 },
          { x: 0.28, y: 0.15, brightness: 0.85 },
          { x: 0.32, y: 0.13, brightness: 0.7 },
          { x: 0.35, y: 0.15, brightness: 0.9 },
          { x: 0.33, y: 0.18, brightness: 0.75 },
          { x: 0.3, y: 0.2, brightness: 0.8 }
        ],
        connections: [
          [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]
        ]
      },
      
      // Orion-like
      {
        name: "Hunter",
        points: [
          { x: 0.7, y: 0.3, brightness: 0.9 },  // Betelgeuse
          { x: 0.73, y: 0.25, brightness: 0.7 },
          { x: 0.75, y: 0.22, brightness: 0.6 },
          { x: 0.77, y: 0.19, brightness: 0.85 }, // Bellatrix
          { x: 0.73, y: 0.35, brightness: 0.9 },  // Rigel
          { x: 0.75, y: 0.32, brightness: 0.85 },
          { x: 0.77, y: 0.28, brightness: 0.9 }   // Mintaka
        ],
        connections: [
          [0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [1, 5], [0, 4]
        ]
      },
      
      // Cassiopeia-like
      {
        name: "Queen",
        points: [
          { x: 0.45, y: 0.1, brightness: 0.8 },
          { x: 0.5, y: 0.08, brightness: 0.9 },
          { x: 0.55, y: 0.1, brightness: 0.85 },
          { x: 0.58, y: 0.13, brightness: 0.75 },
          { x: 0.62, y: 0.11, brightness: 0.8 }
        ],
        connections: [
          [0, 1], [1, 2], [2, 3], [3, 4]
        ]
      }
    ];
  }
  
  /**
   * Create the moon entity
   */
  createMoon() {
    const { width, height } = this.dimensions;
    
    // Create moon object
    this.moon = {
      x: width * 0.8,
      y: height * 0.2,
      radius: 60,
      phase: this.moonPhase,
      craters: []
    };
    
    // Generate moon craters
    const craterCount = 12;
    for (let i = 0; i < craterCount; i++) {
      // Distribution based on phase (only visible on lit portion)
      const angle = Math.random() * Math.PI - Math.PI/2; // -90 to 90 degrees
      const distance = Math.random() * 0.7;
      
      this.moon.craters.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        radius: 2 + Math.random() * 8,
        depth: 0.1 + Math.random() * 0.3 // Darkness factor
      });
    }
  }
  
  /**
   * Generate star color based on temperature (random value)
   * Approximates stellar classification from blue to red
   */
  getStarColor(temperature) {
    // Map temperature from 0-1 to star color
    // 0 = cooler (red/orange), 1 = hotter (blue/white)
    if (temperature > 0.9) {
      // O-type: Blue
      return { r: 200, g: 220, b: 255 };
    } else if (temperature > 0.7) {
      // B-type: Blue-white
      return { r: 220, g: 230, b: 255 };
    } else if (temperature > 0.5) {
      // A-type: White
      return { r: 255, g: 255, b: 255 };
    } else if (temperature > 0.4) {
      // F-type: Yellow-white
      return { r: 255, g: 255, b: 220 };
    } else if (temperature > 0.3) {
      // G-type: Yellow (like our Sun)
      return { r: 255, g: 245, b: 200 };
    } else if (temperature > 0.2) {
      // K-type: Orange
      return { r: 255, g: 220, b: 180 };
    } else {
      // M-type: Red
      return { r: 255, g: 200, b: 170 };
    }
  }
  
  /**
   * Update visualization state
   */
  updateElements(deltaTime, audioData, qualitySettings) {
    // Update animation time
    this.animationTime += deltaTime * 0.01;
    this.northernLightsTime += deltaTime * 0.005;
    
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
      
      // Process beats to create shooting stars
      this.handleBeats(audioData, deltaTime);
    }
    
    // Update shooting stars
    this.updateShootingStars(deltaTime);
    
    // If we're using high quality settings, occasionally create random shooting stars
    if (qualitySettings && qualitySettings.effects === 'enhanced') {
      if (Math.random() < 0.001 * deltaTime) {
        this.createShootingStar();
      }
    }
  }
  
  /**
   * Handle audio beats for visualization effects
   */
  handleBeats(audioData, deltaTime) {
    const now = Date.now();
    
    // Create shooting stars on strong mid/high beats
    if (audioData.isBeat) {
      if (audioData.bands.high > 180 && now - this.lastBeatTime > 500) {
        this.createShootingStar();
        this.lastBeatTime = now;
      }
    }
    
    // Update emission rates based on audio intensity
    if (this.particleSystems.starGlow) {
      this.particleSystems.starGlow.emissionRate = 1 + audioData.bands.high / 255 * 5;
    }
  }
  
  /**
   * Create a shooting star
   */
  createShootingStar() {
    if (!this.particleSystems.shootingStars) return;
    
    const { width, height } = this.dimensions;
    
    // Random starting position at the top portion of the screen
    const startX = Math.random() * width;
    const startY = Math.random() * height * 0.2;
    
    // Random angle for the shooting star (mostly downward)
    const angle = Math.PI / 4 + Math.random() * Math.PI / 2; // 45-135 degrees
    const speed = 3 + Math.random() * 4;
    
    // Create the shooting star particle
    this.particleSystems.shootingStars.addParticle({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color: { r: 255, g: 255, b: 255, a: 0.9 },
      life: 40 + Math.random() * 40
    });
    
    // Add the shooting star to our tracking array
    this.shootingStars.push({
      startX,
      startY,
      angle,
      speed,
      time: 0,
      maxTime: 40 + Math.random() * 40
    });
  }
  
  /**
   * Update shooting stars
   */
  updateShootingStars(deltaTime) {
    // Remove expired shooting stars
    this.shootingStars = this.shootingStars.filter(star => star.time < star.maxTime);
    
    // Update remaining shooting stars
    this.shootingStars.forEach(star => {
      star.time += deltaTime;
    });
  }
  
  /**
   * Draw the background with a night sky gradient
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Create night sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#000819');
    skyGradient.addColorStop(0.7, '#0D1F2D');
    skyGradient.addColorStop(1, '#172A3A');
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw northern lights if high-quality mode
    if (qualitySettings && qualitySettings.effects !== 'minimal') {
      this.drawNorthernLights(ctx, dimensions, audioData);
    }
    
    // Draw horizon silhouette
    this.drawHorizon(ctx, dimensions, audioData);
  }
  
  /**
   * Draw northern lights effect
   */
  drawNorthernLights(ctx, dimensions, audioData) {
    const { width, height } = dimensions;
    
    // Extract audio reactivity
    let bassLevel = 0;
    let midLevel = 0;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
    }
    
    // Use additive blending for lights
    ctx.globalCompositeOperation = 'lighter';
    
    // Create 3-4 aurora waves
    const waveCount = 4;
    for (let i = 0; i < waveCount; i++) {
      // Different height, frequency and color for each wave
      const waveHeight = 0.4 + i * 0.05;
      const frequency = 0.002 + i * 0.001;
      const speed = 0.0005 + i * 0.0002;
      const hue = 120 + i * 15 + bassLevel * 30; // Green to blue
      
      ctx.beginPath();
      
      for (let x = 0; x < width; x += 5) {
        const normalizedX = x / width;
        
        // Create wave pattern with multiple frequencies
        const waveY = Math.sin(normalizedX * frequency * width + this.northernLightsTime * speed) * 50;
        const detailY = Math.sin(normalizedX * frequency * width * 3 + this.northernLightsTime * speed * 2) * 20;
        const combinedWave = waveY + detailY;
        
        // Apply audio reactivity
        const reactiveHeight = combinedWave * (1 + midLevel * 2);
        const y = height * waveHeight + reactiveHeight;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      // Close the path by drawing to the bottom of the canvas
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      // Create gradient for each wave
      const waveGradient = ctx.createLinearGradient(0, height * waveHeight - 50, 0, height);
      waveGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${0.15 + bassLevel * 0.1})`);
      waveGradient.addColorStop(1, 'rgba(0, 20, 40, 0)');
      
      ctx.fillStyle = waveGradient;
      ctx.fill();
    }
    
    // Reset blend mode
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Draw horizon silhouette
   */
  drawHorizon(ctx, dimensions, audioData) {
    const { width, height } = dimensions;
    
    // Mountains/terrain silhouette at the bottom
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    const yBase = height * 0.75;
    const amplitude = height * 0.1;
    
    // Create jagged mountain effect
    for (let x = 0; x < width; x += width/100) {
      // Use perlin-like noise for mountains
      const y = yBase - 
        Math.abs(Math.sin(x * 0.01)) * amplitude -
        Math.abs(Math.sin(x * 0.02 + 13)) * amplitude * 0.5 -
        Math.abs(Math.sin(x * 0.04 + 27)) * amplitude * 0.25;
      
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(5, 10, 15, 0.95)';
    ctx.fill();
  }
  
  /**
   * Draw the main visualization elements
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    // Draw stars and constellations
    this.drawStarsAndConstellations(ctx, dimensions, audioData);
    
    // Draw moon
    this.drawMoon(ctx, dimensions, audioData);
    
    // Draw frequency visualization if in high quality mode
    if (qualitySettings && qualitySettings.effects !== 'minimal' && audioData && audioData.frequencyData) {
      this.drawFrequencyMountains(ctx, dimensions, audioData.frequencyData);
    }
  }
  
  /**
   * Draw stars and constellations
   */
  drawStarsAndConstellations(ctx, dimensions, audioData) {
    const { width, height } = dimensions;
    
    // Extract audio reactivity
    let highLevel = 0;
    let isBeat = false;
    
    if (audioData) {
      highLevel = audioData.bands.high / 255;
      isBeat = audioData.isBeat;
    }
    
    // Draw regular stars
    this.stars.forEach(star => {
      const time = Date.now() * star.twinkleSpeed + star.twinkleOffset;
      const twinkle = (Math.sin(time) + 1) / 2; // 0 to 1
      const brightness = 0.5 + star.brightness * 0.5 + twinkle * 0.3 + highLevel * 0.2;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * (1 + highLevel * 0.5), 0, Math.PI * 2);
      
      // Use star's color for more realistic star field
      const c = star.color;
      ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${brightness})`;
      ctx.fill();
      
      // Add glow for brighter stars
      if (star.brightness > 0.7 || isBeat) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3 * (1 + highLevel), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${(star.brightness - 0.7) * 0.3 + 0.05 + (isBeat ? 0.1 : 0)})`;
        ctx.fill();
      }
    });
    
    // Draw constellations
    this.constellations.forEach(constellation => {
      // Calculate absolute positions
      const points = constellation.points.map(p => ({
        x: p.x * width,
        y: p.y * height,
        brightness: p.brightness
      }));
      
      // Draw connecting lines
      ctx.beginPath();
      constellation.connections.forEach(([fromIdx, toIdx]) => {
        ctx.moveTo(points[fromIdx].x, points[fromIdx].y);
        ctx.lineTo(points[toIdx].x, points[toIdx].y);
      });
      ctx.strokeStyle = `rgba(180, 210, 255, ${0.2 + (audioData?.bands?.mid / 255) * 0.3})`;
      ctx.lineWidth = 1 + (audioData?.bands?.mid / 255) * 2;
      ctx.stroke();
      
      // Draw constellation stars (slightly brighter than regular stars)
      points.forEach(point => {
        const brightness = point.brightness + (audioData?.bands?.high / 255) * 0.3;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2 + brightness * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fill();
        
        // Add glow
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 + brightness * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${brightness * 0.4})`;
        ctx.fill();
      });
    });
  }
  
  /**
   * Draw the moon
   */
  drawMoon(ctx, dimensions, audioData) {
    const { width, height } = dimensions;
    
    // Extract audio reactivity
    let bassLevel = 0;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
    }
    
    // Draw moon
    ctx.save();
    
    // Draw main moon circle
    ctx.beginPath();
    ctx.arc(this.moon.x, this.moon.y, this.moon.radius * (1 + bassLevel * 0.1), 0, Math.PI * 2);
    
    // Create moon gradient for realistic look
    const moonGradient = ctx.createRadialGradient(
      this.moon.x - this.moon.radius * 0.2, 
      this.moon.y - this.moon.radius * 0.2, 
      0,
      this.moon.x, 
      this.moon.y, 
      this.moon.radius
    );
    moonGradient.addColorStop(0, 'rgba(255, 255, 240, 1)');
    moonGradient.addColorStop(1, 'rgba(220, 220, 210, 0.9)');
    
    ctx.fillStyle = moonGradient;
    ctx.fill();
    
    // Add moon phase (shadow) if not full moon
    if (this.moonPhase !== 0.5) {
      ctx.beginPath();
      
      const phaseAngle = (this.moonPhase - 0.5) * Math.PI * 2;
      const phaseCenterX = this.moon.x + Math.cos(phaseAngle) * this.moon.radius * 0.5;
      
      // Draw shadow ellipse based on phase
      ctx.ellipse(
        phaseCenterX,
        this.moon.y,
        this.moon.radius * 0.5,
        this.moon.radius,
        0,
        0,
        Math.PI * 2
      );
      
      ctx.fillStyle = 'rgba(0, 10, 20, 0.9)';
      ctx.fill();
    }
    
    // Draw moon craters
    this.moon.craters.forEach(crater => {
      // Only draw craters on the visible part of the moon
      const craterX = this.moon.x + crater.x * this.moon.radius;
      const craterY = this.moon.y + crater.y * this.moon.radius;
      
      ctx.beginPath();
      ctx.arc(craterX, craterY, crater.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 180, 180, ${crater.depth})`;
      ctx.fill();
    });
    
    // Add moon glow
    ctx.beginPath();
    ctx.arc(
      this.moon.x, 
      this.moon.y, 
      this.moon.radius * 1.5 * (1 + bassLevel * 0.2), 
      0, 
      Math.PI * 2
    );
    const glowGradient = ctx.createRadialGradient(
      this.moon.x, 
      this.moon.y, 
      this.moon.radius,
      this.moon.x, 
      this.moon.y, 
      this.moon.radius * 1.5
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 230, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 230, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Draw frequency visualization as mountain silhouette
   */
  drawFrequencyMountains(ctx, dimensions, frequencyData) {
    const { width, height } = dimensions;
    
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    const pointCount = 100;
    for (let i = 0; i < pointCount; i++) {
      const x = (i / pointCount) * width;
      const frequencyIndex = Math.floor(i / pointCount * 64);
      const value = frequencyData[frequencyIndex] / 255;
      const y = height - value * height * 0.3;
      
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(10, 20, 30, 0.7)';
    ctx.fill();
  }
  
  /**
   * Draw foreground elements
   */
  drawForeground(ctx, dimensions, audioData, qualitySettings) {
    // Add subtle vignette effect
    this.drawVignette(ctx, dimensions);
    
    // Add lens flare from the moon if high quality
    if (qualitySettings && qualitySettings.effects !== 'minimal') {
      this.drawMoonLensFlare(ctx, dimensions, audioData);
    }
  }
  
  /**
   * Draw vignette effect
   */
  drawVignette(ctx, dimensions) {
    const { width, height } = dimensions;
    
    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  /**
   * Draw lens flare from the moon
   */
  drawMoonLensFlare(ctx, dimensions, audioData) {
    if (!this.moon) return;
    
    // Only draw lens flare if moon is bright enough (greater than half)
    if (this.moonPhase < 0.3 || this.moonPhase > 0.7) return;
    
    const { width, height } = dimensions;
    
    // Extract audio reactivity
    let highLevel = 0;
    
    if (audioData) {
      highLevel = audioData.bands.high / 255;
    }
    
    // Calculate flare intensity based on moon phase
    // Brightest at full moon (0.5)
    const phaseDistance = Math.abs(this.moonPhase - 0.5);
    const flareIntensity = 0.2 - phaseDistance * 0.5 + highLevel * 0.1;
    
    if (flareIntensity <= 0) return;
    
    ctx.save();
    
    // Use screen blend mode for flare
    ctx.globalCompositeOperation = 'screen';
    
    // Draw main glow
    ctx.beginPath();
    ctx.arc(this.moon.x, this.moon.y, this.moon.radius * 2, 0, Math.PI * 2);
    const glowGradient = ctx.createRadialGradient(
      this.moon.x, this.moon.y, 0,
      this.moon.x, this.moon.y, this.moon.radius * 2
    );
    glowGradient.addColorStop(0, `rgba(255, 255, 230, ${flareIntensity})`);
    glowGradient.addColorStop(0.5, `rgba(255, 255, 230, ${flareIntensity * 0.5})`);
    glowGradient.addColorStop(1, 'rgba(255, 255, 230, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Draw lens flare circles
    // Main axis is from moon to opposite corner
    const centerX = width / 2;
    const centerY = height / 2;
    const moonVectorX = this.moon.x - centerX;
    const moonVectorY = this.moon.y - centerY;
    
    // Draw flare elements along this axis
    const flarePoints = [0.4, 0.7, 0.9, 1.5];
    
    flarePoints.forEach(point => {
      const flareX = centerX - moonVectorX * point;
      const flareY = centerY - moonVectorY * point;
      
      // Only draw if on screen
      if (flareX > 0 && flareX < width && flareY > 0 && flareY < height) {
        const flareSize = this.moon.radius * (0.3 + Math.random() * 0.2) * (2 - point);
        
        ctx.beginPath();
        ctx.arc(flareX, flareY, flareSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 230, ${flareIntensity * 0.3 * (1 - point/2)})`;
        ctx.fill();
      }
    });
    
    ctx.restore();
  }
}

export default NightSkyVisualization;
