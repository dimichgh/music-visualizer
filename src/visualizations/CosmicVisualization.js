/**
 * Enhanced Cosmic Visualization
 * A cosmic-themed visualization with advanced particle physics and audio reactivity
 * Featuring nebula systems, black holes, asteroids, supernovas, and wormholes
 */

import BaseVisualization from './BaseVisualization';
import ParticleSystem from './ParticleSystem';

class CosmicVisualization extends BaseVisualization {
  constructor(options = {}) {
    // Call parent constructor with merged options
    super({
      name: 'Cosmic',
      description: 'A cosmic-themed visualization with galaxies, nebulae, and stars',
      author: 'Music Visualizer',
      useParticles: true,
      particleCount: 400,
      colorPalette: {
        primary: { r: 255, g: 255, b: 255, a: 1 },
        secondary: { r: 120, g: 0, b: 255, a: 1 },
        accent: { r: 0, g: 100, b: 255, a: 1 },
        background: { r: 0, g: 5, b: 20, a: 1 }
      },
      ...options
    });
    
    // Visualization-specific state
    this.stars = [];
    this.cosmicEntities = [];
    this.ringRotation = 0;
    this.lastBeatTime = 0;
    this.blackHoles = [];
    this.asteroids = [];
    this.supernovaProgress = 0;
    this.wormholes = [];
    this.nebulaTime = 0;
    this.fluidSimPoints = [];
    
    // Override default particle systems with cosmic-specific ones
    this.createCosmicParticleSystems();
    
    // Initialize fluid simulation for nebula
    this.initFluidSimulation();
  }
  
  /**
   * Initialize fluid simulation for nebula effects
   */
  initFluidSimulation() {
    // Create fluid simulation points
    this.fluidSimPoints = [];
    const gridSize = 15;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        this.fluidSimPoints.push({
          x: i / (gridSize - 1),
          y: j / (gridSize - 1),
          vx: 0,
          vy: 0,
          ax: 0,
          ay: 0,
          density: 0,
          pressure: 0,
          color: { r: 0, g: 50, b: 120, a: 0.8 }
        });
      }
    }
  }
  
  /**
   * Create particle systems specific to cosmic visualization
   */
  createCosmicParticleSystems() {
    // Clear existing particle systems
    this.particleSystems = {};
    
    // Main star dust particles
    this.particleSystems.starDust = new ParticleSystem({
      maxParticles: this.config.particleCount,
      emissionRate: 3,
      particleSize: { min: 1, max: 3 },
      particleLifespan: { min: 100, max: 200 },
      color: { r: 180, g: 180, b: 255, a: 0.7 },
      gravity: { x: 0, y: 0 },
      friction: 0.99,
      turbulence: 0.05,
      audioBehavior: {
        emissionRate: { band: 'mid', min: 1, max: 8 },
        size: { band: 'high', factor: 1.2 },
        wind: { band: 'midLow', min: -0.3, max: 0.3 }
      }
    });
    
    // Cosmic energy particles around the center
    this.particleSystems.cosmicEnergy = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.6),
      emissionRate: 2,
      particleSize: { min: 2, max: 5 },
      particleLifespan: { min: 60, max: 120 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 120, g: 0, b: 255, a: 0.8 } },
        { pos: 0.5, color: { r: 80, g: 20, b: 180, a: 0.5 } },
        { pos: 1, color: { r: 0, g: 0, b: 100, a: 0 } }
      ],
      gravity: { x: 0, y: 0 },
      friction: 0.97,
      blendMode: 'screen',
      behavior: 'swarm',
      behaviorOptions: {
        boundaryBehavior: 'wrap'
      },
      audioBehavior: {
        emissionRate: { band: 'bass', min: 1, max: 10 },
        size: { band: 'mid', factor: 2 },
        beatBurst: { count: 15, speed: 3 }
      }
    });
    
    // Beat-reactive explosion particles
    this.particleSystems.beatExplosion = new ParticleSystem({
      maxParticles: 200,
      emissionRate: 0, // Only emit on beats
      particleSize: { min: 2, max: 6 },
      particleLifespan: { min: 30, max: 60 },
      colorMode: 'random',
      gravity: { x: 0, y: 0 },
      friction: 0.96,
      blendMode: 'screen',
      behavior: 'explosion',
      audioBehavior: {
        beatBurst: { count: 30, speed: 8 }
      }
    });
    
    // Black hole accretion disk particles
    this.particleSystems.accretionDisk = new ParticleSystem({
      maxParticles: 300,
      emissionRate: 5,
      particleSize: { min: 1, max: 3 },
      particleLifespan: { min: 100, max: 200 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 255, g: 100, b: 0, a: 0.9 } },
        { pos: 0.5, color: { r: 255, g: 50, b: 50, a: 0.7 } },
        { pos: 1, color: { r: 100, g: 0, b: 0, a: 0 } }
      ],
      gravity: { x: 0, y: 0 },
      friction: 0.98,
      blendMode: 'screen',
      behavior: 'swarm',
      behaviorOptions: {
        boundaryBehavior: 'wrap'
      },
      audioBehavior: {
        emissionRate: { band: 'bass', min: 3, max: 15 },
        size: { band: 'lowMid', factor: 1.5 }
      }
    });
    
    // Asteroid field particles
    this.particleSystems.asteroids = new ParticleSystem({
      maxParticles: 70,
      emissionRate: 0.2,
      particleSize: { min: 2, max: 6 },
      particleLifespan: { min: 400, max: 800 },
      color: { r: 150, g: 150, b: 150, a: 0.8 },
      gravity: { x: 0, y: 0 },
      friction: 0.99,
      turbulence: 0.01,
      behavior: 'swarm',
      behaviorOptions: {
        boundaryBehavior: 'wrap'
      }
    });
    
    // Supernova explosion particles
    this.particleSystems.supernova = new ParticleSystem({
      maxParticles: 500,
      emissionRate: 0, // Only emit during supernova event
      particleSize: { min: 2, max: 8 },
      particleLifespan: { min: 80, max: 150 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 255, g: 255, b: 200, a: 0.9 } },
        { pos: 0.4, color: { r: 255, g: 200, b: 0, a: 0.7 } },
        { pos: 0.7, color: { r: 255, g: 100, b: 0, a: 0.5 } },
        { pos: 1, color: { r: 100, g: 0, b: 0, a: 0 } }
      ],
      gravity: { x: 0, y: 0 },
      friction: 0.98,
      blendMode: 'screen',
      behavior: 'explosion'
    });
    
    // Wormhole distortion particles
    this.particleSystems.wormhole = new ParticleSystem({
      maxParticles: 250,
      emissionRate: 4,
      particleSize: { min: 1, max: 4 },
      particleLifespan: { min: 60, max: 120 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 0, g: 200, b: 255, a: 0.8 } },
        { pos: 0.5, color: { r: 70, g: 0, b: 200, a: 0.6 } },
        { pos: 1, color: { r: 100, g: 0, b: 150, a: 0 } }
      ],
      gravity: { x: 0, y: 0 },
      friction: 0.97,
      blendMode: 'screen',
      behavior: 'swarm',
      audioBehavior: {
        emissionRate: { band: 'mid', min: 2, max: 12 },
        size: { band: 'high', factor: 2 }
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
      return false;
    }
    
    try {
      const { width, height } = this.dimensions;
    
      // Configure star dust to emit from full screen
      if (this.particleSystems.starDust) {
        this.particleSystems.starDust.setEmissionArea({
          x: 0,
          y: 0,
          width: width,
          height: height
        });
      }
      
      // Configure cosmic energy to emit from center
      if (this.particleSystems.cosmicEnergy) {
        this.particleSystems.cosmicEnergy.setEmissionArea({
          x: width * 0.4,
          y: height * 0.4,
          width: width * 0.2,
          height: height * 0.2
        });
      }
      
      // Configure beat explosion to emit from center
      if (this.particleSystems.beatExplosion) {
        this.particleSystems.beatExplosion.setEmissionArea({
          x: width / 2 - 10,
          y: height / 2 - 10,
          width: 20,
          height: 20
        });
      }
      
      // Configure black hole accretion disk
      if (this.particleSystems.accretionDisk) {
        this.particleSystems.accretionDisk.setEmissionArea({
          x: width * 0.15,
          y: height * 0.15,
          width: width * 0.1,
          height: height * 0.1
        });
      }
      
      // Configure asteroid field to emit from edges
      if (this.particleSystems.asteroids) {
        this.particleSystems.asteroids.setEmissionArea({
          x: 0,
          y: 0,
          width: width,
          height: height
        });
      }
      
      // Configure supernova (will be positioned on demand)
      if (this.particleSystems.supernova) {
        this.particleSystems.supernova.setEmissionArea({
          x: width / 2 - 20,
          y: height / 2 - 20,
          width: 40,
          height: 40
        });
      }
      
      // Configure wormhole
      if (this.particleSystems.wormhole) {
        this.particleSystems.wormhole.setEmissionArea({
          x: width * 0.7,
          y: height * 0.7,
          width: width * 0.1,
          height: height * 0.1
        });
      }
      
      // Create stars
      this.stars = this.createStarField(200);
      
      // Create cosmic entities
      this.createCosmicEntities();
      
      // Initialize black holes
      this.createBlackHoles();
      
      // Initialize asteroids
      this.createAsteroids();
      
      // Initialize wormholes
      this.createWormholes();
      return true;
    } catch (error) {
      console.error('Error in setupParticleEmissionAreas:', error);
      return false;
    }
  }
  
  /**
   * Create cosmic entities like planets, comets, or galaxies
   */
  createCosmicEntities() {
    const { width, height } = this.dimensions;
    
    this.cosmicEntities = [
      // Main central galaxy
      {
        type: 'galaxy',
        x: width / 2,
        y: height / 2,
        radius: 100,
        rings: 3,
        rotation: 0,
        rotationSpeed: 0.0005,
        color: this.config.colorPalette.secondary
      },
      
      // Distant smaller galaxy
      {
        type: 'galaxy',
        x: width * 0.2,
        y: height * 0.7,
        radius: 40,
        rings: 2,
        rotation: 0.5,
        rotationSpeed: 0.001,
        color: this.config.colorPalette.accent
      },
      
      // Advanced nebula with fluid dynamics
      {
        type: 'advanced_nebula',
        x: width * 0.75,
        y: height * 0.25,
        width: 180,
        height: 120,
        color: { r: 0, g: 80, b: 150, a: 0.4 },
        fluidPoints: this.fluidSimPoints
      }
    ];
  }
  
  /**
   * Create black holes with gravitational lensing effects
   */
  createBlackHoles() {
    const { width, height } = this.dimensions;
    
    this.blackHoles = [
      {
        x: width * 0.2,
        y: height * 0.2,
        radius: 20,
        eventHorizonRadius: 10,
        accretionDiskRadius: 30,
        rotation: 0,
        rotationSpeed: 0.001,
        gravitationalStrength: 0.8,
        lensDistortion: 20
      }
    ];
  }
  
  /**
   * Create asteroid field with physics-based movement
   */
  createAsteroids() {
    const { width, height } = this.dimensions;
    this.asteroids = [];
    
    // Create a bunch of asteroids with various properties
    const count = 15;
    for (let i = 0; i < count; i++) {
      const size = 3 + Math.random() * 8;
      const asteroid = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        shape: this.generateAsteroidShape(size),
        lastCollision: 0
      };
      this.asteroids.push(asteroid);
    }
  }
  
  /**
   * Generate a random asteroid shape
   */
  generateAsteroidShape(radius) {
    const points = [];
    const vertexCount = 6 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const distance = radius * (0.8 + Math.random() * 0.4);
      
      points.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    }
    
    return points;
  }
  
  /**
   * Create wormhole/portal effects
   */
  createWormholes() {
    const { width, height } = this.dimensions;
    
    this.wormholes = [
      {
        x: width * 0.75,
        y: height * 0.75,
        radius: 40,
        innerRadius: 15,
        rotation: 0,
        rotationSpeed: 0.0003,
        secondaryRotation: 0,
        secondaryRotationSpeed: -0.0005,
        distortionStrength: 0.3,
        active: true,
        ringCount: 4,
        color: { r: 0, g: 180, b: 255, a: 0.7 }
      }
    ];
  }
  
  /**
   * Update visualization state
   */
  updateElements(deltaTime, audioData, qualitySettings) {
    // Update fluid simulation for nebula effects
    this.updateFluidSimulation(deltaTime, audioData);
    
    // Update time for fluid effects
    this.nebulaTime += deltaTime * 0.001;
    
    // Update cosmic entities
    this.cosmicEntities.forEach(entity => {
      if (entity.type === 'galaxy') {
        // Rotate galaxies
        entity.rotation += entity.rotationSpeed * deltaTime;
        
        // Make rotation speed audio reactive
        if (audioData) {
          const speedMultiplier = 1 + (audioData.bands.mid / 255) * 2;
          entity.rotationSpeed = entity.rotationSpeed * 0.95 + entity.rotationSpeed * speedMultiplier * 0.05;
        }
      }
    });
    
    // Update overall ring rotation
    this.ringRotation += 0.001 * deltaTime;
    
    // Update black holes
    this.updateBlackHoles(deltaTime, audioData);
    
    // Update asteroids
    this.updateAsteroids(deltaTime, audioData);
    
    // Update wormholes
    this.updateWormholes(deltaTime, audioData);
    
    // Check for supernova trigger based on intense audio
    if (audioData && audioData.bands) {
      // Calculate overall intensity
      const intensity = (audioData.bands.bass + audioData.bands.lowMid) / (255 * 2);
      
      // Trigger supernova if extremely high intensity and not recently triggered
      if (intensity > 0.85 && this.supernovaProgress === 0 && Date.now() - this.lastSupernovaTime > 15000) {
        this.triggerSupernova();
      }
      
      // Update supernova if in progress
      if (this.supernovaProgress > 0) {
        this.updateSupernova(deltaTime);
      }
    }
    
    // Create explosions on beats
    if (audioData && audioData.isBeat) {
      const now = Date.now();
      
      // Only create a new explosion if enough time has passed since the last one
      if (now - this.lastBeatTime > 300) {
        this.lastBeatTime = now;
        
        const { width, height } = this.dimensions;
        
        // Create explosion based on the dominant frequency
        const dominantFreq = audioData.dominantFrequencies && audioData.dominantFrequencies[0];
        let explosionColor = this.config.colorPalette.accent;
        
        if (dominantFreq) {
          // Map frequency to color (higher frequency = cooler colors)
          const frequencyRatio = Math.min(1, dominantFreq.frequency / 10000);
          explosionColor = {
            r: Math.round(120 + frequencyRatio * 135),
            g: Math.round(20 + frequencyRatio * 50),
            b: Math.round(255 - frequencyRatio * 200),
            a: 0.7
          };
        }
        
        // Create explosion at primary cosmic entity
        const mainGalaxy = this.cosmicEntities.find(e => e.type === 'galaxy' && e.radius > 50);
        if (mainGalaxy && this.particleSystems.beatExplosion) {
          this.particleSystems.beatExplosion.createExplosion(
            mainGalaxy.x, 
            mainGalaxy.y, 
            {
              count: 20 + Math.floor((audioData.bands.bass / 255) * 30),
              speed: 2 + (audioData.bands.bass / 255) * 8,
              color: explosionColor,
              lifespan: { min: 30, max: 60 }
            }
          );
        }
      }
    }
  }
  
  /**
   * Update fluid simulation points for nebula effects
   */
  updateFluidSimulation(deltaTime, audioData) {
    const dt = Math.min(20, deltaTime) * 0.01;
    
    // Apply audio-reactivity to fluid simulation
    let fluidForce = 0.002;
    let audioPush = { x: 0, y: 0 };
    
    if (audioData && audioData.bands) {
      fluidForce += (audioData.bands.mid / 255) * 0.01;
      
      // Use bass to add directional force
      audioPush.x = ((audioData.bands.bass / 255) - 0.5) * 0.01;
      audioPush.y = ((audioData.bands.lowMid / 255) - 0.5) * 0.01;
    }
    
    // Update each point in the fluid simulation
    for (let i = 0; i < this.fluidSimPoints.length; i++) {
      const point = this.fluidSimPoints[i];
      
      // Apply perlin noise-like forces using sine waves with different frequencies
      const timeScale = this.nebulaTime;
      const xForce = Math.sin(point.x * 5 + timeScale) * Math.cos(point.y * 3 + timeScale * 0.7) * fluidForce;
      const yForce = Math.sin(point.y * 5 + timeScale * 0.8) * Math.cos(point.x * 3 + timeScale * 1.2) * fluidForce;
      
      // Update velocity with forces + audio push
      point.vx += xForce + audioPush.x;
      point.vy += yForce + audioPush.y;
      
      // Apply mild dampening
      point.vx *= 0.98;
      point.vy *= 0.98;
      
      // Update position within normalized space (0-1)
      point.x += point.vx * dt;
      point.y += point.vy * dt;
      
      // Wrap around boundaries
      if (point.x < 0) point.x += 1;
      if (point.x > 1) point.x -= 1;
      if (point.y < 0) point.y += 1;
      if (point.y > 1) point.y -= 1;
      
      // Color shift based on velocity
      const speed = Math.sqrt(point.vx * point.vx + point.vy * point.vy) * 100;
      point.color.r = Math.min(255, Math.max(0, Math.round(speed * 20)));
      point.color.g = Math.min(255, Math.max(20, Math.round(50 + speed * 30)));
      point.color.b = Math.min(255, Math.max(100, Math.round(150 + speed * 10)));
    }
  }
  
  /**
   * Update black hole physics and effects
   */
  updateBlackHoles(deltaTime, audioData) {
    const dt = deltaTime * 0.01;
    
    this.blackHoles.forEach(blackHole => {
      // Rotate black hole
      blackHole.rotation += blackHole.rotationSpeed * deltaTime;
      
      // Make black hole audio-reactive
      if (audioData && audioData.bands) {
        // Pulse the event horizon with bass
        const bassIntensity = audioData.bands.bass / 255;
        blackHole.eventHorizonRadius = 10 * (1 + bassIntensity * 0.3);
        
        // Increase accretion disk with low-mid frequencies
        const midIntensity = audioData.bands.lowMid / 255;
        blackHole.accretionDiskRadius = 30 * (1 + midIntensity * 0.5);
        
        // Adjust gravitational effect with high frequencies
        const highIntensity = audioData.bands.high / 255;
        blackHole.gravitationalStrength = 0.8 + highIntensity * 0.4;
      }
    });
  }
  
  /**
   * Update asteroid physics including collisions
   */
  updateAsteroids(deltaTime, audioData) {
    const dt = deltaTime * 0.01;
    const { width, height } = this.dimensions;
    
    // Apply audio-reactivity to asteroid field
    let audioForce = { x: 0, y: 0 };
    if (audioData && audioData.bands) {
      audioForce.x = ((audioData.bands.mid / 255) - 0.5) * 0.02;
      audioForce.y = ((audioData.bands.highMid / 255) - 0.5) * 0.02;
    }
    
    // Update each asteroid
    for (let i = 0; i < this.asteroids.length; i++) {
      const asteroid = this.asteroids[i];
      
      // Apply rotation
      asteroid.rotation += asteroid.rotationSpeed * deltaTime;
      
      // Apply audio force
      asteroid.vx += audioForce.x;
      asteroid.vy += audioForce.y;
      
      // Update position
      asteroid.x += asteroid.vx * deltaTime;
      asteroid.y += asteroid.vy * deltaTime;
      
      // Wrap around edges
      if (asteroid.x < -asteroid.radius) asteroid.x += width + asteroid.radius * 2;
      if (asteroid.x > width + asteroid.radius) asteroid.x -= width + asteroid.radius * 2;
      if (asteroid.y < -asteroid.radius) asteroid.y += height + asteroid.radius * 2;
      if (asteroid.y > height + asteroid.radius) asteroid.y -= height + asteroid.radius * 2;
      
      // Check for collisions with other asteroids
      for (let j = i + 1; j < this.asteroids.length; j++) {
        const other = this.asteroids[j];
        
        // Calculate distance between asteroids
        const dx = other.x - asteroid.x;
        const dy = other.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if colliding
        if (distance < asteroid.radius + other.radius) {
          // Only process collision if enough time has passed since last collision
          const now = Date.now();
          if (now - asteroid.lastCollision > 500 && now - other.lastCollision > 500) {
            asteroid.lastCollision = now;
            other.lastCollision = now;
            
            // Calculate collision normal
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Calculate relative velocity
            const relVelocityX = other.vx - asteroid.vx;
            const relVelocityY = other.vy - asteroid.vy;
            
            // Calculate impulse
            const impulse = 2 * (relVelocityX * nx + relVelocityY * ny) / 
                          (1/asteroid.radius + 1/other.radius);
            
            // Apply impulse to velocities
            asteroid.vx -= impulse * nx / asteroid.radius * 0.5;
            asteroid.vy -= impulse * ny / asteroid.radius * 0.5;
            other.vx += impulse * nx / other.radius * 0.5;
            other.vy += impulse * ny / other.radius * 0.5;
            
            // Create collision particles if beat explosion particle system exists
            if (this.particleSystems.beatExplosion) {
              const collisionX = asteroid.x + dx * 0.5;
              const collisionY = asteroid.y + dy * 0.5;
              
              this.particleSystems.beatExplosion.createExplosion(
                collisionX,
                collisionY,
                {
                  count: 5 + Math.floor(Math.random() * 5),
                  speed: 1 + Math.random() * 2,
                  color: { r: 200, g: 200, b: 200, a: 0.7 },
                  lifespan: { min: 10, max: 30 }
                }
              );
            }
          }
        }
      }
    }
  }
  
  /**
   * Update wormhole/portal effects
   */
  updateWormholes(deltaTime, audioData) {
    this.wormholes.forEach(wormhole => {
      // Update rotations
      wormhole.rotation += wormhole.rotationSpeed * deltaTime;
      wormhole.secondaryRotation += wormhole.secondaryRotationSpeed * deltaTime;
      
      // Apply audio-reactivity
      if (audioData && audioData.bands) {
        // Make distortion strength reactive to mid frequencies
        const midIntensity = audioData.bands.mid / 255;
        wormhole.distortionStrength = 0.3 + midIntensity * 0.5;
        
        // Make inner radius pulse with high frequencies
        const highIntensity = audioData.bands.high / 255;
        wormhole.innerRadius = 15 * (1 + highIntensity * 0.4);
        
        // Make rotation speed reactive to bass
        const bassIntensity = audioData.bands.bass / 255;
        wormhole.rotationSpeed = 0.0003 + bassIntensity * 0.001;
      }
      
      // Make wormhole more active on beats
      if (audioData && audioData.isBeat) {
        wormhole.active = true;
        wormhole.distortionStrength += 0.2;
        
        // Emit particles from wormhole center
        if (this.particleSystems.wormhole) {
          this.particleSystems.wormhole.createExplosion(
            wormhole.x,
            wormhole.y,
            {
              count: 10 + Math.floor(Math.random() * 10),
              speed: 1 + Math.random() * 3,
              lifespan: { min: 30, max: 60 }
            }
          );
        }
      }
    });
  }
  
  /**
   * Trigger a supernova explosion
   */
  triggerSupernova() {
    if (this.supernovaProgress === 0) {
      // Start the supernova effect
      this.supernovaProgress = 0.01;
      this.lastSupernovaTime = Date.now();
      
      // Select a random galaxy or cosmic entity as the supernova source
      const { width, height } = this.dimensions;
      const galaxies = this.cosmicEntities.filter(e => e.type === 'galaxy');
      
      this.supernovaSource = galaxies.length > 0 
        ? galaxies[Math.floor(Math.random() * galaxies.length)]
        : { x: width * 0.3, y: height * 0.3 };
      
      // Prepare the supernova particle system
      if (this.particleSystems.supernova) {
        // Position the emission area at the supernova source
        this.particleSystems.supernova.setEmissionArea({
          x: this.supernovaSource.x - 10,
          y: this.supernovaSource.y - 10,
          width: 20,
          height: 20
        });
      }
    }
  }
  
  /**
   * Update the supernova effect
   */
  updateSupernova(deltaTime) {
    // Advance the supernova progress
    this.supernovaProgress += deltaTime * 0.0005; // Control speed of supernova
    
    // Complete the supernova after it reaches full expansion
    if (this.supernovaProgress >= 1) {
      this.supernovaProgress = 0;
      return;
    }
    
    // Extract the different phases of the supernova
    const initialPhase = Math.min(1, this.supernovaProgress * 5); // 0-0.2 progress
    const expansionPhase = Math.max(0, Math.min(1, (this.supernovaProgress - 0.2) * 1.67)); // 0.2-0.8 progress
    const fadePhase = Math.max(0, (this.supernovaProgress - 0.8) * 5); // 0.8-1.0 progress
    
    // Generate particles during initial and expansion phase
    if (this.supernovaProgress < 0.8 && this.particleSystems.supernova) {
      // Calculate emission rate based on phase
      let emissionRate = 0;
      
      if (this.supernovaProgress < 0.2) {
        // Ramp up emission during initial phase
        emissionRate = initialPhase * 50;
      } else if (this.supernovaProgress < 0.4) {
        // Peak emission
        emissionRate = 50;
      } else {
        // Decline emission during later expansion
        emissionRate = 50 * (1 - (this.supernovaProgress - 0.4) * 2.5);
      }
      
      // Update particle system
      this.particleSystems.supernova.emissionRate = emissionRate;
      
      // Create expanding shockwave burst every few frames during early phase
      if (this.supernovaProgress < 0.4 && Math.random() < 0.2) {
        const progress = this.supernovaProgress / 0.4; // 0-1 during early phase
        const burstSpeed = 4 + progress * 4; // Faster as it expands
        const count = 20 + Math.floor(progress * 30);
        
        this.particleSystems.supernova.createExplosion(
          this.supernovaSource.x,
          this.supernovaSource.y,
          {
            count: count,
            speed: burstSpeed,
            color: {
              r: 255,
              g: Math.round(200 - progress * 150),
              b: Math.round(100 - progress * 100),
              a: 0.8 - progress * 0.3
            },
            lifespan: { min: 30, max: 60 }
          }
        );
      }
    } else {
      // Stop emission during fade out phase
      if (this.particleSystems.supernova) {
        this.particleSystems.supernova.emissionRate = 0;
      }
    }
  }
  
  /**
   * Draw the background with a space gradient
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Create space background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#000531');
    gradient.addColorStop(1, '#1A0254');
    
    // Make gradient slightly reactive to bass
    if (audioData && audioData.bands) {
      const bassLevel = audioData.bands.bass / 255;
      ctx.globalAlpha = 1;
      
      // Draw main gradient background
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add subtle glow overlay on beat
      if (bassLevel > 0.7 || audioData.isBeat) {
        const pulseIntensity = audioData.isBeat ? 0.15 : (bassLevel - 0.7) * 0.5;
        ctx.fillStyle = `rgba(40, 0, 80, ${pulseIntensity})`;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // Non-reactive fallback
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Draw stars
    this.drawStarField(this.stars, audioData);
  }
  
  /**
   * Draw the main visualization elements
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Extract audio reactive values
    let bassLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    
    if (audioData && audioData.bands) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
      highLevel = audioData.bands.high / 255;
    }
    
    // Draw cosmic entities
    this.cosmicEntities.forEach(entity => {
      if (entity.type === 'galaxy') {
        this.drawGalaxy(
          ctx, 
          entity.x, 
          entity.y, 
          entity.radius * (1 + bassLevel * 0.3), 
          entity.rings, 
          entity.rotation, 
          entity.color,
          audioData
        );
      } else if (entity.type === 'nebula') {
        this.drawNebula(
          ctx,
          entity.x,
          entity.y, 
          entity.width * (1 + midLevel * 0.2), 
          entity.height * (1 + midLevel * 0.2), 
          entity.color,
          audioData
        );
      } else if (entity.type === 'advanced_nebula') {
        this.drawAdvancedNebula(
          ctx,
          entity.x,
          entity.y, 
          entity.width * (1 + midLevel * 0.2), 
          entity.height * (1 + midLevel * 0.2), 
          entity.color,
          entity.fluidPoints,
          audioData
        );
      }
    });
    
    // Draw black holes
    this.blackHoles.forEach(blackHole => {
      this.drawBlackHole(ctx, blackHole, audioData);
    });
    
    // Draw asteroids
    this.asteroids.forEach(asteroid => {
      this.drawAsteroid(ctx, asteroid, audioData);
    });
    
    // Draw wormholes
    this.wormholes.forEach(wormhole => {
      this.drawWormhole(ctx, wormhole, audioData);
    });
    
    // Draw supernova
    if (this.supernovaProgress > 0) {
      this.drawSupernova(ctx, this.supernovaSource, this.supernovaProgress, audioData);
    }
    
    // Draw frequency rings around the main galaxy
    if (audioData && audioData.frequencyData) {
      const mainGalaxy = this.cosmicEntities.find(e => e.type === 'galaxy' && e.radius > 50);
      if (mainGalaxy) {
        this.drawFrequencyRings(
          ctx, 
          mainGalaxy.x, 
          mainGalaxy.y, 
          mainGalaxy.radius * 1.2, 
          audioData.frequencyData
        );
      }
    }
  }
  
  /**
   * Draw an advanced nebula with fluid dynamics
   */
  /**
   * Draw a spiral galaxy with rings
   */
  drawGalaxy(ctx, x, y, radius, rings, rotation, color, audioData) {
    if (!ctx) return;
    
    // Safety checks for valid parameters
    if (!isFinite(x) || !isFinite(y) || !isFinite(radius) || radius <= 0 || !isFinite(rings) || rings <= 0) {
      return;
    }
    
    // Ensure color has valid values
    const safeColor = {
      r: color && isFinite(color.r) ? color.r : 255,
      g: color && isFinite(color.g) ? color.g : 255,
      b: color && isFinite(color.b) ? color.b : 255,
      a: color && isFinite(color.a) ? color.a : 1
    };
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    try {
      // Draw the galactic core
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.3);
      coreGradient.addColorStop(0, `rgba(255, 255, 240, ${safeColor.a})`);
      coreGradient.addColorStop(0.4, `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, ${safeColor.a * 0.9})`);
      coreGradient.addColorStop(1, `rgba(${safeColor.r * 0.7}, ${safeColor.g * 0.7}, ${safeColor.b * 0.7}, 0)`);
      
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
      
      // Draw spiral arms
      const spiralCount = 2; // Number of spiral arms
      const spiralTurns = 2; // How many turns each spiral makes
      
      for (let s = 0; s < spiralCount; s++) {
        const spiralPhase = (s / spiralCount) * Math.PI * 2;
        
        ctx.beginPath();
        
        // Start from inner radius
        const innerRadius = radius * 0.3;
        const startX = innerRadius * Math.cos(spiralPhase);
        const startY = innerRadius * Math.sin(spiralPhase);
        ctx.moveTo(startX, startY);
        
        // Draw spiral path
        const steps = 100;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const spiralRadius = innerRadius + (radius - innerRadius) * t;
          const angle = spiralPhase + t * spiralTurns * Math.PI * 2;
          
          const x = spiralRadius * Math.cos(angle);
          const y = spiralRadius * Math.sin(angle);
          
          ctx.lineTo(x, y);
        }
        
        // Add width to the spiral arm
        const armWidth = radius * 0.1;
        for (let i = steps; i >= 0; i--) {
          const t = i / steps;
          const spiralRadius = innerRadius + (radius - innerRadius) * t + armWidth;
          const angle = spiralPhase + t * spiralTurns * Math.PI * 2;
          
          const x = spiralRadius * Math.cos(angle);
          const y = spiralRadius * Math.sin(angle);
          
          ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        
        // Create gradient for spiral arm
        const armGradient = ctx.createLinearGradient(
          0, 0,
          radius * Math.cos(spiralPhase + Math.PI),
          radius * Math.sin(spiralPhase + Math.PI)
        );
        
        armGradient.addColorStop(0, `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, ${safeColor.a * 0.7})`);
        armGradient.addColorStop(0.5, `rgba(${safeColor.r * 0.8}, ${safeColor.g * 0.8}, ${safeColor.b * 0.8}, ${safeColor.a * 0.5})`);
        armGradient.addColorStop(1, `rgba(${safeColor.r * 0.6}, ${safeColor.g * 0.6}, ${safeColor.b * 0.6}, 0)`);
        
        ctx.fillStyle = armGradient;
        ctx.fill();
      }
      
      // Draw concentric rings
      for (let r = 0; r < rings; r++) {
        const ringRadius = radius * 0.4 + (radius * 0.6) * (r / rings);
        const ringWidth = radius * 0.03;
        
        // Vary ring opacity based on ring index
        const ringOpacity = 0.3 - (r / rings) * 0.2;
        
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, ${ringOpacity})`;
        ctx.lineWidth = ringWidth;
        ctx.stroke();
      }
      
      // Add stars in the galaxy
      const starCount = 50;
      for (let i = 0; i < starCount; i++) {
        const distance = Math.random() * radius * 0.8;
        const angle = Math.random() * Math.PI * 2;
        
        const starX = distance * Math.cos(angle);
        const starY = distance * Math.sin(angle);
        const starSize = 1 + Math.random() * 2;
        
        // Brighter stars near the arms
        const brightness = Math.random() * 155 + 100;
        
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.8)`;
        ctx.fill();
      }
      
      // Audio-reactive effects
      if (audioData && audioData.bands) {
        const bassLevel = audioData.bands.bass / 255;
        
        // Add pulsating outer glow on beat
        if (bassLevel > 0.6 || (audioData.isBeat && bassLevel > 0.4)) {
          const glowRadius = radius * 1.2;
          const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, glowRadius);
          
          glowGradient.addColorStop(0, `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, ${bassLevel * 0.3})`);
          glowGradient.addColorStop(1, `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, 0)`);
          
          ctx.beginPath();
          ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }
      }
    } catch (error) {
      console.warn('Error drawing galaxy:', error);
      
      // Simple fallback rendering if the complex drawing fails
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, ${safeColor.a})`;
      ctx.fill();
      
      // Simple spiral arms as a fallback
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, 0.3)`;
      ctx.lineWidth = radius * 0.1;
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw an advanced nebula with fluid dynamics
   */
  drawAdvancedNebula(ctx, centerX, centerY, width, height, color, fluidPoints, audioData) {
    // Basic validation
    if (!fluidPoints || fluidPoints.length === 0 || !ctx) return;
    
    // Safety check for valid values - provide fallbacks if needed
    centerX = isFinite(centerX) ? centerX : this.dimensions.width / 2;
    centerY = isFinite(centerY) ? centerY : this.dimensions.height / 2;
    width = isFinite(width) && width > 0 ? width : 100;
    height = isFinite(height) && height > 0 ? height : 100;
    
    // Calculate visualization area based on center point and dimensions
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    
    // Create blur effect for background glow
    ctx.save();
    
    // Ensure we have valid color values
    const safeColor = {
      r: color && isFinite(color.r) ? color.r : 0,
      g: color && isFinite(color.g) ? color.g : 80,
      b: color && isFinite(color.b) ? color.b : 150,
      a: color && isFinite(color.a) ? color.a : 0.4
    };
    
    // Draw base glow - ensure all gradient values are finite
    const gradientRadius = Math.max(1, width / 2); // Ensure positive value
    try {
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, gradientRadius
      );
      gradient.addColorStop(0, `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, ${safeColor.a * 0.7})`);
      gradient.addColorStop(1, `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, width, height);
    } catch (error) {
      // Fall back to solid color if gradient fails
      console.warn('Gradient creation failed:', error);
      ctx.fillStyle = `rgba(${safeColor.r}, ${safeColor.g}, ${safeColor.b}, ${safeColor.a * 0.5})`;
      ctx.fillRect(left, top, width, height);
    }
    
    // Draw fluid simulation points
    const gridRows = Math.sqrt(fluidPoints.length);
    const gridSize = fluidPoints.length;
    
    // Draw connection lines between adjacent points
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < gridSize; i++) {
      const point = fluidPoints[i];
      const x = left + point.x * width;
      const y = top + point.y * height;
      
      // Connect to right neighbor
      if ((i + 1) % gridRows !== 0 && i + 1 < gridSize) {
        const rightPoint = fluidPoints[i + 1];
        const rx = left + rightPoint.x * width;
        const ry = top + rightPoint.y * height;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(rx, ry);
        ctx.strokeStyle = `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, 0.3)`;
        ctx.stroke();
      }
      
      // Connect to bottom neighbor
      if (i + gridRows < gridSize) {
        const bottomPoint = fluidPoints[i + gridRows];
        const bx = left + bottomPoint.x * width;
        const by = top + bottomPoint.y * height;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, 0.3)`;
        ctx.stroke();
      }
    }
    
    // Draw fluid points
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < fluidPoints.length; i++) {
      const point = fluidPoints[i];
      const pointSize = 2 + Math.sqrt(point.vx * point.vx + point.vy * point.vy) * 100;
      
      const x = left + point.x * width;
      const y = top + point.y * height;
      
      // Draw point glow - with safety checks for valid gradient values
      try {
        // Ensure pointSize is valid
        const safePointSize = isFinite(pointSize) && pointSize > 0 ? pointSize : 1;
        
        // Ensure x and y are valid
        const safeX = isFinite(x) ? x : 0;
        const safeY = isFinite(y) ? y : 0;
        
        const glow = ctx.createRadialGradient(
          safeX, safeY, 0,
          safeX, safeY, safePointSize * 2
        );
        glow.addColorStop(0, `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, 0.4)`);
        glow.addColorStop(1, `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, 0)`);
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(safeX, safeY, safePointSize * 2, 0, Math.PI * 2);
        ctx.fill();
      } catch (error) {
        // Fallback to solid color if gradient fails
        console.warn('Fluid point gradient creation failed:', error);
        ctx.fillStyle = `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, 0.3)`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw point center
      ctx.fillStyle = `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, 0.8)`;
      ctx.beginPath();
      ctx.arc(x, y, pointSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some stars inside nebula
    const starCount = 15;
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2;
      const distance = Math.random() * width * 0.4;
      const starX = centerX + Math.cos(angle) * distance;
      const starY = centerY + Math.sin(angle) * distance;
      const starSize = 1 + Math.random() * 2;
      
      ctx.beginPath();
      ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      
      // Add glow
      ctx.beginPath();
      ctx.arc(starX, starY, starSize * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r + 100}, ${color.g + 50}, ${color.b + 50}, 0.3)`;
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw a standard nebula as a cloud-like formation
   */
  drawNebula(ctx, x, y, width, height, color, audioData) {
    const points = 8;
    const nebulaPath = this.getNebulaPath(x, y, width, height, points);
    
    // Create blur effect using multiple layers
    for (let i = 3; i >= 0; i--) {
      ctx.save();
      
      // Scale each layer slightly different
      const scale = 1 - i * 0.05;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);
      
      // Draw nebula with gradient
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, width / 2
      );
      
      const alpha = (color.a || 0.5) * (1 - i * 0.2);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fill(nebulaPath);
      
      ctx.restore();
    }
    
    // Add stars inside nebula
    const starCount = 12;
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2;
      const distance = Math.random() * width * 0.4;
      const starX = x + Math.cos(angle) * distance;
      const starY = y + Math.sin(angle) * distance;
      const starSize = 1 + Math.random() * 2;
      
      ctx.beginPath();
      ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      
      // Add glow
      ctx.beginPath();
      ctx.arc(starX, starY, starSize * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
      ctx.fill();
    }
  }
  
  /**
   * Draw a black hole with gravitational lensing effects
   */
  drawBlackHole(ctx, blackHole, audioData) {
    if (!blackHole || !ctx) return;
    
    // Ensure all values are valid
    const x = isFinite(blackHole.x) ? blackHole.x : 0;
    const y = isFinite(blackHole.y) ? blackHole.y : 0;
    const radius = isFinite(blackHole.radius) && blackHole.radius > 0 ? blackHole.radius : 20;
    const eventHorizonRadius = isFinite(blackHole.eventHorizonRadius) && blackHole.eventHorizonRadius > 0 
      ? blackHole.eventHorizonRadius : 10;
    const accretionDiskRadius = isFinite(blackHole.accretionDiskRadius) && blackHole.accretionDiskRadius > 0 
      ? blackHole.accretionDiskRadius : 30;
    const rotation = isFinite(blackHole.rotation) ? blackHole.rotation : 0;
    const gravitationalStrength = isFinite(blackHole.gravitationalStrength) ? blackHole.gravitationalStrength : 0.8;
    
    ctx.save();
    
    // Draw gravitational lensing effect
    this.drawGravitationalLensing(ctx, x, y, radius * 3, 
      isFinite(blackHole.lensDistortion) ? blackHole.lensDistortion : 20, 
      gravitationalStrength);
    
    // Draw accretion disk behind the event horizon
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    try {
      // Create accretion disk gradient with safety checks
      const innerRadius = Math.max(0.1, eventHorizonRadius * 1.2);
      const outerRadius = Math.max(innerRadius + 1, accretionDiskRadius);
      
      const diskGradient = ctx.createRadialGradient(
        0, 0, innerRadius,
        0, 0, outerRadius
      );
      
      diskGradient.addColorStop(0, 'rgba(255, 120, 0, 0.8)');
      diskGradient.addColorStop(0.4, 'rgba(255, 40, 0, 0.6)');
      diskGradient.addColorStop(0.7, 'rgba(150, 0, 0, 0.4)');
      diskGradient.addColorStop(1, 'rgba(50, 0, 0, 0)');
      
      // Draw disk with elliptical shape for perspective
      ctx.beginPath();
      ctx.ellipse(0, 0, accretionDiskRadius, accretionDiskRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = diskGradient;
      ctx.fill();
      
      // Add disk detail
      const diskDetailCount = 5;
      for (let i = 0; i < diskDetailCount; i++) {
        const ringRadius = eventHorizonRadius * 1.3 + (accretionDiskRadius - eventHorizonRadius * 1.3) * (i / diskDetailCount);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, ringRadius, ringRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, ${50 + i * 30}, 0, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 2 - i * 0.3;
        ctx.stroke();
      }
      
      // Draw the event horizon (the black hole itself)
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.fill();
      
      // Draw light bending around the edge of the event horizon
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius * 1.05, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } catch (error) {
      // Fallback if gradient or drawing fails
      console.warn('Error drawing black hole:', error);
      
      // Simple fallback rendering
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw gravitational lensing effect
   */
  drawGravitationalLensing(ctx, x, y, radius, strength, intensity) {
    const { width, height } = this.dimensions;
    
    // Get a section of the canvas around the black hole
    const lensRadius = radius * 2;
    const sourceX = Math.max(0, x - lensRadius);
    const sourceY = Math.max(0, y - lensRadius);
    const sourceWidth = Math.min(width - sourceX, lensRadius * 2);
    const sourceHeight = Math.min(height - sourceY, lensRadius * 2);
    
    try {
      // Draw distortion around the black hole
      ctx.save();
      
      // Create radial gradient for distortion opacity
      const distortionGradient = ctx.createRadialGradient(
        x, y, radius * 0.3,
        x, y, radius
      );
      
      distortionGradient.addColorStop(0, `rgba(0, 0, 10, ${intensity * 0.5})`);
      distortionGradient.addColorStop(0.7, `rgba(0, 0, 30, ${intensity * 0.3})`);
      distortionGradient.addColorStop(1, 'rgba(0, 0, 50, 0)');
      
      // Draw distortion effect
      ctx.fillStyle = distortionGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add lens streaks
      const streakCount = 8;
      for (let i = 0; i < streakCount; i++) {
        const angle = (i / streakCount) * Math.PI * 2;
        const streakLength = radius * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * radius * 0.5, y + Math.sin(angle) * radius * 0.5);
        ctx.lineTo(x + Math.cos(angle) * (radius * 0.5 + streakLength), 
                   y + Math.sin(angle) * (radius * 0.5 + streakLength));
        ctx.strokeStyle = `rgba(0, 30, 60, ${intensity * 0.2})`;
        ctx.lineWidth = 5;
        ctx.stroke();
      }
      
      ctx.restore();
    } catch (e) {
      // Fallback in case of errors with image data
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 30, 0.2)';
      ctx.fill();
    }
  }
  
  /**
   * Draw an asteroid
   */
  drawAsteroid(ctx, asteroid, audioData) {
    const { x, y, radius, rotation, shape } = asteroid;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Draw asteroid shape
    ctx.beginPath();
    
    if (shape && shape.length > 0) {
      // Draw custom shape
      ctx.moveTo(shape[0].x, shape[0].y);
      
      for (let i = 1; i < shape.length; i++) {
        ctx.lineTo(shape[i].x, shape[i].y);
      }
      
      ctx.closePath();
    } else {
      // Fallback to circle
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
    }
    
    const gradient = ctx.createRadialGradient(
      -radius * 0.3, -radius * 0.3, 0,
      0, 0, radius * 1.2
    );
    
    gradient.addColorStop(0, 'rgba(170, 170, 170, 1)');
    gradient.addColorStop(0.8, 'rgba(100, 100, 100, 1)');
    gradient.addColorStop(1, 'rgba(50, 50, 50, 1)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw crater details
    const craterCount = Math.floor(radius);
    for (let i = 0; i < craterCount; i++) {
      const craterRadius = radius * (0.1 + Math.random() * 0.15);
      const distance = Math.random() * radius * 0.7;
      const angle = Math.random() * Math.PI * 2;
      
      const craterX = Math.cos(angle) * distance;
      const craterY = Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(70, 70, 70, 0.8)';
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw a wormhole/portal effect
   */
  drawWormhole(ctx, wormhole, audioData) {
    const { x, y, radius, innerRadius, rotation, secondaryRotation, ringCount, color, distortionStrength } = wormhole;
    
    ctx.save();
    
    // Draw outer glow
    const glowGradient = ctx.createRadialGradient(
      x, y, innerRadius,
      x, y, radius
    );
    
    glowGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
    glowGradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * 0.3})`);
    glowGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw portal rings
    ctx.translate(x, y);
    
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = innerRadius + (radius - innerRadius) * (i / ringCount);
      const ringRotation = rotation + i * 0.2;
      
      ctx.save();
      ctx.rotate(ringRotation);
      
      // Draw warped ring
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadius, ringRadius * (0.8 - i * 0.1), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b + i * 20}, ${color.a - i * 0.1})`;
      ctx.lineWidth = 3 - i * 0.5;
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Draw center portal
    ctx.save();
    ctx.rotate(secondaryRotation);
    
    // Draw spiral effect
    const spiralCount = 5;
    const spiralDensity = 3;
    
    for (let i = 0; i < spiralCount; i++) {
      const spiralPhase = i / spiralCount * Math.PI * 2;
      
      ctx.beginPath();
      for (let t = 0; t < spiralDensity * Math.PI * 2; t += 0.05) {
        const spiralRadius = (innerRadius * 0.8) * (t / (spiralDensity * Math.PI * 2));
        const x = spiralRadius * Math.cos(t + spiralPhase);
        const y = spiralRadius * Math.sin(t + spiralPhase);
        
        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.strokeStyle = `rgba(${color.r}, ${color.g + 50}, ${color.b}, ${0.7 - i * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw central event horizon
    const horizonGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, innerRadius * 0.7
    );
    
    horizonGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    horizonGradient.addColorStop(0.3, `rgba(${color.r + 50}, ${color.g + 50}, ${color.b + 50}, 0.7)`);
    horizonGradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`);
    horizonGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = horizonGradient;
    ctx.fill();
    
    ctx.restore();
    ctx.restore();
    
    // Apply distortion effect around the wormhole
    this.drawWormholeDistortion(ctx, x, y, radius * 1.5, distortionStrength);
  }
  
  /**
   * Draw space distortion around a wormhole
   */
  drawWormholeDistortion(ctx, x, y, radius, strength) {
    ctx.save();
    
    // Draw distortion rays
    const rayCount = 12;
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = radius * (0.7 + Math.random() * 0.3);
      
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * radius * 0.5, y + Math.sin(angle) * radius * 0.5);
      ctx.lineTo(x + Math.cos(angle) * (radius * 0.5 + rayLength), 
                 y + Math.sin(angle) * (radius * 0.5 + rayLength));
      
      const alpha = (0.1 + Math.random() * 0.1) * strength;
      ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.globalCompositeOperation = 'screen';
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw a supernova explosion
   */
  drawSupernova(ctx, source, progress, audioData) {
    if (!source) return;
    
    const { x, y } = source;
    const { width, height } = this.dimensions;
    
    // Different phases of the supernova
    const initialPhase = Math.min(1, progress * 5); // 0-0.2 progress
    const expansionPhase = Math.max(0, Math.min(1, (progress - 0.2) * 1.67)); // 0.2-0.8 progress
    const fadePhase = Math.max(0, (progress - 0.8) * 5); // 0.8-1.0 progress
    
    ctx.save();
    
    // Initial bright flash
    if (progress < 0.3) {
      const flashOpacity = 0.8 * initialPhase * (1 - progress / 0.3);
      
      // Full screen flash
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, width, height);
      
      // Central super bright flash
      const flashRadius = 50 + initialPhase * 100;
      const flashGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, flashRadius
      );
      
      flashGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * (1 - progress / 0.3)})`);
      flashGradient.addColorStop(0.5, `rgba(255, 240, 180, ${0.7 * (1 - progress / 0.3)})`);
      flashGradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
      
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(x, y, flashRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main explosion shell
    if (progress >= 0.1) {
      const shellProgress = Math.min(1, (progress - 0.1) / 0.8);
      const shellRadius = 50 + shellProgress * 300;
      const shellWidth = 30 * (1 - shellProgress * 0.7);
      
      // Outer explosion shell
      const shellGradient = ctx.createRadialGradient(
        x, y, shellRadius - shellWidth,
        x, y, shellRadius
      );
      
      let outerOpacity = 0.8;
      if (progress > 0.7) {
        outerOpacity = 0.8 * (1 - (progress - 0.7) / 0.3);
      }
      
      // Color transition from bright white/yellow to orange/red as it expands
      const shellColorFactor = shellProgress;
      const innerColor = `rgba(255, ${240 - shellColorFactor * 150}, ${180 - shellColorFactor * 180}, ${outerOpacity})`;
      const outerColor = `rgba(255, ${100 - shellColorFactor * 100}, ${0}, 0)`;
      
      shellGradient.addColorStop(0, innerColor);
      shellGradient.addColorStop(1, outerColor);
      
      ctx.fillStyle = shellGradient;
      ctx.beginPath();
      ctx.arc(x, y, shellRadius, 0, Math.PI * 2);
      ctx.arc(x, y, shellRadius - shellWidth, 0, Math.PI * 2, true);
      ctx.fill();
      
      // Add details to the explosion shell
      if (progress < 0.7) {
        const detailCount = 20;
        const detailAngleOffset = progress * 2; // Rotation effect
        
        for (let i = 0; i < detailCount; i++) {
          const angle = (i / detailCount) * Math.PI * 2 + detailAngleOffset;
          const detailRadius = shellRadius - shellWidth / 2;
          const detailSize = shellWidth * 0.7 * (0.5 + Math.random() * 0.5);
          
          const dx = x + Math.cos(angle) * detailRadius;
          const dy = y + Math.sin(angle) * detailRadius;
          
          ctx.beginPath();
          ctx.arc(dx, dy, detailSize, 0, Math.PI * 2);
          ctx.fillStyle = innerColor;
          ctx.fill();
        }
      }
    }
    
    // Central glow and remnant (after initial flash)
    if (progress >= 0.3) {
      const remnantProgress = (progress - 0.3) / 0.7;
      const remnantRadius = 30 * (1 + remnantProgress);
      
      const remnantGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, remnantRadius
      );
      
      remnantGradient.addColorStop(0, `rgba(255, 180, 100, ${0.9 - fadePhase * 0.8})`);
      remnantGradient.addColorStop(0.5, `rgba(200, 80, 0, ${0.7 - fadePhase * 0.7})`);
      remnantGradient.addColorStop(1, `rgba(100, 20, 0, 0)`);
      
      ctx.fillStyle = remnantGradient;
      ctx.beginPath();
      ctx.arc(x, y, remnantRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Generate a nebula path with bezier curves
   */
  getNebulaPath(x, y, width, height, points) {
    const path = new Path2D();
    const now = Date.now() / 3000;
    
    // Generate points around an ellipse
    const angleStep = (Math.PI * 2) / points;
    
    // Start path
    const firstX = x + Math.cos(0) * width / 2;
    const firstY = y + Math.sin(0) * height / 2;
    path.moveTo(firstX, firstY);
    
    // Add bezier curves between points
    for (let i = 0; i < points; i++) {
      const angle1 = i * angleStep;
      const angle2 = ((i + 1) % points) * angleStep;
      
      // Current point
      const x1 = x + Math.cos(angle1) * width / 2;
      const y1 = y + Math.sin(angle1) * height / 2;
      
      // Next point
      const x2 = x + Math.cos(angle2) * width / 2;
      const y2 = y + Math.sin(angle2) * height / 2;
      
      // Control points with some randomness
      const noise1 = Math.sin(angle1 * 3 + now) * 0.3 + 0.7;
      const noise2 = Math.sin(angle2 * 3 + now) * 0.3 + 0.7;
      
      const cx1 = x1 + Math.cos(angle1 + Math.PI/4) * width * 0.4 * noise1;
      const cy1 = y1 + Math.sin(angle1 + Math.PI/4) * height * 0.4 * noise1;
      
      const cx2 = x2 + Math.cos(angle2 - Math.PI/4) * width * 0.4 * noise2;
      const cy2 = y2 + Math.sin(angle2 - Math.PI/4) * height * 0.4 * noise2;
      
      // Add bezier curve to path
      path.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
    }
    
    path.closePath();
    return path;
  }
  
  /**
   * Draw frequency rings around a center point
   */
  drawFrequencyRings(ctx, x, y, baseRadius, frequencyData) {
    const frequencyBands = Math.min(64, frequencyData.length);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.ringRotation * 2);
    
    // Draw frequency lines
    for (let i = 0; i < frequencyBands; i++) {
      const angle = (i / frequencyBands) * Math.PI * 2;
      const value = frequencyData[i] / 255;
      
      if (value > 0.05) {
        // Calculate line
        const innerRadius = baseRadius;
        const outerRadius = innerRadius + value * 80;
        
        const x1 = innerRadius * Math.cos(angle);
        const y1 = innerRadius * Math.sin(angle);
        const x2 = outerRadius * Math.cos(angle);
        const y2 = outerRadius * Math.sin(angle);
        
        // Draw line
        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsla(${280 - i * 4}, 100%, 60%, ${value * 0.8 + 0.2})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
  
  /**
   * Draw foreground effects like lens flares or beat flashes
   */
  drawForeground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Add lens flare effect on main galaxy
    const mainGalaxy = this.cosmicEntities.find(e => e.type === 'galaxy' && e.radius > 50);
    if (mainGalaxy) {
      this.drawLensFlare(ctx, mainGalaxy.x, mainGalaxy.y, audioData);
    }
    
    // Add beat flash effect
    if (audioData && audioData.isBeat) {
      const beatIntensity = audioData.bands.bass / 255;
      ctx.fillStyle = `rgba(255, 255, 255, ${beatIntensity * 0.15})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Add spatial distortion effects for wormholes in foreground
    this.wormholes.forEach(wormhole => {
      if (wormhole.active) {
        // Draw light rays emanating from wormhole
        const rayCount = 8;
        const maxLength = width * 0.3;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + wormhole.rotation;
          const rayLength = maxLength * (0.5 + Math.random() * 0.5);
          
          // Create gradient for ray
          const gradient = ctx.createLinearGradient(
            wormhole.x, wormhole.y,
            wormhole.x + Math.cos(angle) * rayLength,
            wormhole.y + Math.sin(angle) * rayLength
          );
          
          gradient.addColorStop(0, `rgba(${wormhole.color.r}, ${wormhole.color.g}, ${wormhole.color.b}, 0.3)`);
          gradient.addColorStop(1, `rgba(${wormhole.color.r}, ${wormhole.color.g}, ${wormhole.color.b}, 0)`);
          
          // Draw ray
          ctx.beginPath();
          ctx.moveTo(wormhole.x, wormhole.y);
          ctx.lineTo(
            wormhole.x + Math.cos(angle) * rayLength,
            wormhole.y + Math.sin(angle) * rayLength
          );
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3 + Math.random() * 5;
          ctx.stroke();
        }
        
        ctx.restore();
      }
    });
    
    // Draw supernova foreground effects if active
    if (this.supernovaProgress > 0 && this.supernovaProgress < 0.4) {
      // Add lens flare rays during peak brightness
      const intensity = 1 - (this.supernovaProgress / 0.4);
      const rayCount = 12;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const rayLength = width * 0.5 * intensity;
        
        ctx.beginPath();
        ctx.moveTo(this.supernovaSource.x, this.supernovaSource.y);
        ctx.lineTo(
          this.supernovaSource.x + Math.cos(angle) * rayLength,
          this.supernovaSource.y + Math.sin(angle) * rayLength
        );
        
        const gradient = ctx.createLinearGradient(
          this.supernovaSource.x, this.supernovaSource.y,
          this.supernovaSource.x + Math.cos(angle) * rayLength,
          this.supernovaSource.y + Math.sin(angle) * rayLength
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.7 * intensity})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 100, ${0.4 * intensity})`);
        gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 5 * intensity;
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw frequency bars at the bottom if in high quality mode
    if (qualitySettings.effects !== 'minimal' && audioData && audioData.frequencyData) {
      this.drawFrequencyBars(ctx, dimensions, audioData.frequencyData, {
        maxHeight: height * 0.15,
        bottom: height,
        colorStart: { h: 260, s: 100, l: 50 },
        colorEnd: { h: 320, s: 100, l: 50 }
      });
    }
  }
  
  /**
   * Draw a lens flare effect
   */
  drawLensFlare(ctx, x, y, audioData) {
    // Only draw lens flare at reasonable opacity
    let flareIntensity = 0.3;
    
    if (audioData && audioData.bands) {
      flareIntensity = 0.2 + (audioData.bands.high / 255) * 0.3;
    }
    
    // Draw lens flare
    ctx.save();
    
    // Main glow
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, 80
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${flareIntensity})`);
    gradient.addColorStop(0.2, `rgba(200, 220, 255, ${flareIntensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(0, 30, 80, 0)');
    
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 100, y - 100, 200, 200);
    
    // Flare streaks
    const streakCount = 6;
    const streakLength = 40;
    
    for (let i = 0; i < streakCount; i++) {
      const angle = (i / streakCount) * Math.PI * 2;
      const dx = Math.cos(angle) * streakLength;
      const dy = Math.sin(angle) * streakLength;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.strokeStyle = `rgba(200, 220, 255, ${flareIntensity * 0.7})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // Small lens reflections
    const reflectionPositions = [
      { x: -0.7, y: 0.3, size: 0.3 },
      { x: 0.5, y: -0.5, size: 0.2 },
      { x: 0.2, y: 0.6, size: 0.15 },
    ];
    
    const { width, height } = this.dimensions;
    
    reflectionPositions.forEach(pos => {
      const rx = x + pos.x * (width / 3);
      const ry = y + pos.y * (height / 3);
      const size = pos.size * 20;
      
      ctx.beginPath();
      ctx.arc(rx, ry, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${flareIntensity * 0.4})`;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(rx, ry, size * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150, 180, 255, ${flareIntensity * 0.2})`;
      ctx.fill();
    });
    
    ctx.restore();
  }
}

export default CosmicVisualization;
