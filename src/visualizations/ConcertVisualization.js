/**
 * Enhanced Concert Visualization
 * A concert-themed visualization with stage lighting, crowd, and band silhouettes
 */

import BaseVisualization from './BaseVisualization';
import ParticleSystem from './ParticleSystem';

class ConcertVisualization extends BaseVisualization {
  constructor(options = {}) {
    // Call parent constructor with merged options
    super({
      name: 'Concert',
      description: 'A concert-themed visualization with stage lighting, crowd, and band members',
      author: 'Music Visualizer',
      useParticles: true,
      particleCount: 500,
      colorPalette: {
        primary: { r: 255, g: 100, b: 100, a: 1 },    // Red
        secondary: { r: 100, g: 200, b: 255, a: 1 },  // Blue
        accent: { r: 255, g: 220, b: 100, a: 1 },     // Yellow
        background: { r: 10, g: 10, b: 15, a: 1 }     // Dark blue-black
      },
      ...options
    });
    
    // Concert-specific state
    this.lightBeams = [];
    this.crowdFigures = [];
    this.bandMembers = [];
    this.lastBeatTime = 0;
    this.animationTime = 0;
    this.stageHeight = 0;
    this.floorY = 0;
    this.smokeIntensity = 0;
    this.lightIntensity = 0.5;
    
    // Create custom particle systems
    this.createConcertParticleSystems();
  }
  
  /**
   * Create particle systems specific to concert visualization
   */
  createConcertParticleSystems() {
    // Clear existing particle systems
    this.particleSystems = {};
    
    // Stage light particles
    this.particleSystems.stageLights = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.3),
      emissionRate: 5,
      particleSize: { min: 5, max: 15 },
      particleLifespan: { min: 20, max: 40 },
      colorMode: 'random',
      colorOptions: [
        { r: 255, g: 50, b: 50, a: 0.3 },    // Red
        { r: 50, g: 255, b: 50, a: 0.3 },    // Green
        { r: 50, g: 50, b: 255, a: 0.3 },    // Blue
        { r: 255, g: 255, b: 50, a: 0.3 },   // Yellow
        { r: 255, g: 50, b: 255, a: 0.3 },   // Purple
        { r: 50, g: 255, b: 255, a: 0.3 }    // Cyan
      ],
      gravity: { x: 0, y: -0.05 },
      friction: 0.98,
      blendMode: 'screen',
      audioBehavior: {
        emissionRate: { band: 'high', min: 3, max: 15 },
        size: { band: 'high', factor: 1.5 }
      }
    });
    
    // Smoke particles
    this.particleSystems.smoke = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.2),
      emissionRate: 2,
      particleSize: { min: 30, max: 70 },
      particleLifespan: { min: 80, max: 150 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 200, g: 200, b: 200, a: 0 } },
        { pos: 0.1, color: { r: 200, g: 200, b: 200, a: 0.2 } },
        { pos: 0.8, color: { r: 150, g: 150, b: 150, a: 0.1 } },
        { pos: 1, color: { r: 100, g: 100, b: 100, a: 0 } }
      ],
      gravity: { x: 0, y: -0.01 },
      turbulence: 0.1,
      friction: 0.995,
      blendMode: 'screen',
      audioBehavior: {
        emissionRate: { band: 'bass', min: 1, max: 5 }
      }
    });
    
    // Spotlight beam particles
    this.particleSystems.spotlights = new ParticleSystem({
      maxParticles: 100,
      emissionRate: 0, // Only emitted on beats
      particleSize: { min: 5, max: 15 },
      particleLifespan: { min: 20, max: 40 },
      colorMode: 'random',
      colorOptions: [
        { r: 255, g: 255, b: 255, a: 0.5 },  // White
        { r: 255, g: 220, b: 180, a: 0.5 }   // Warm white
      ],
      gravity: { x: 0, y: 0 },
      friction: 0.99,
      blendMode: 'screen'
    });
    
    // Pyro/flash particles
    this.particleSystems.pyro = new ParticleSystem({
      maxParticles: 50,
      emissionRate: 0, // Only emitted on specific events
      particleSize: { min: 10, max: 30 },
      particleLifespan: { min: 15, max: 30 },
      colorMode: 'random',
      colorOptions: [
        { r: 255, g: 200, b: 100, a: 0.8 },  // Orange-yellow
        { r: 255, g: 150, b: 50, a: 0.8 }    // Orange
      ],
      gravity: { x: 0, y: -0.1 },
      friction: 0.98,
      turbulence: 0.2,
      blendMode: 'screen'
    });
  }
  
  /**
   * Set up the visualization when dimensions change
   */
  setupParticleEmissionAreas() {
    const { width, height } = this.dimensions;
    
    // Calculate key layout points
    this.stageHeight = height * 0.5;   // Top 50% is stage area
    this.floorY = height * 0.95;       // Bottom 5% is floor
    
    // Configure stage lights to emit from above stage
    if (this.particleSystems.stageLights) {
      this.particleSystems.stageLights.setEmissionArea({
        x: width * 0.3,
        y: height * 0.1,
        width: width * 0.4,
        height: 10
      });
    }
    
    // Configure smoke to emit from stage floor
    if (this.particleSystems.smoke) {
      this.particleSystems.smoke.setEmissionArea({
        x: width * 0.2,
        y: this.stageHeight - 10,
        width: width * 0.6,
        height: 10
      });
    }
    
    // Configure spotlights to emit from top corners
    if (this.particleSystems.spotlights) {
      // This will be handled manually in createLightBeam()
    }
    
    // Configure pyro to emit from stage
    if (this.particleSystems.pyro) {
      this.particleSystems.pyro.setEmissionArea({
        x: width * 0.2,
        y: this.stageHeight - 30,
        width: width * 0.6,
        height: 10
      });
    }
    
    // Create stage elements
    this.createStageElements();
  }
  
  /**
   * Create stage elements (light beams, crowd, band members)
   */
  createStageElements() {
    const { width, height } = this.dimensions;
    
    // Create crowd figures in the audience area
    this.createCrowdFigures();
    
    // Create band member silhouettes on stage
    this.createBandMembers();
    
    // Create light beams
    this.createLightBeams();
  }
  
  /**
   * Create crowd figures
   */
  createCrowdFigures() {
    const { width, height } = this.dimensions;
    const crowdCount = 40;
    
    // Audience area is between stage height and floor
    const audienceAreaTop = this.stageHeight;
    const audienceAreaBottom = this.floorY;
    const audienceAreaHeight = audienceAreaBottom - audienceAreaTop;
    
    this.crowdFigures = [];
    
    // Create rows of crowd figures
    const rowCount = 3;
    for (let row = 0; row < rowCount; row++) {
      // Each row has different y position and scaling
      const rowY = audienceAreaTop + audienceAreaHeight * (0.2 + row * 0.25);
      const scale = 1 - (row * 0.2); // Front row is largest
      
      // Calculate how many figures fit in this row
      const figuresInRow = Math.ceil(crowdCount / rowCount);
      
      for (let i = 0; i < figuresInRow; i++) {
        // Calculate x position (distribute evenly with slight randomness)
        const normalizedPos = i / (figuresInRow - 1);
        const xPos = width * 0.1 + normalizedPos * width * 0.8 + (Math.random() - 0.5) * width * 0.05;
        
        // Create a figure
        this.crowdFigures.push({
          x: xPos,
          y: rowY,
          scale: scale,
          width: 15 + Math.random() * 10,
          height: 30 + Math.random() * 15,
          armRaisedHeight: Math.random() > 0.3 ? 0.7 + Math.random() * 0.3 : 0, // Some have raised arms
          jumpHeight: 0,
          armPhase: Math.random() * Math.PI * 2,
          armSpeed: 0.02 + Math.random() * 0.03,
          color: `rgba(${Math.floor(20 + Math.random() * 20)}, ${Math.floor(20 + Math.random() * 20)}, ${Math.floor(30 + Math.random() * 20)}, 0.8)`
        });
      }
    }
  }
  
  /**
   * Create band member silhouettes
   */
  createBandMembers() {
    const { width, height } = this.dimensions;
    
    // Create different band members based on instruments
    this.bandMembers = [
      {
        type: 'guitar',
        x: width * 0.25,
        y: this.stageHeight - 50,
        scale: 1.2,
        freqBand: 'midLow', // Guitar is mid-low frequency
        alpha: 0,
        movement: 0
      },
      {
        type: 'drums',
        x: width * 0.5,
        y: this.stageHeight - 40,
        scale: 1.0,
        freqBand: 'bass', // Drums are bass frequency
        alpha: 0,
        movement: 0
      },
      {
        type: 'vocalist',
        x: width * 0.4,
        y: this.stageHeight - 60,
        scale: 1.3,
        freqBand: 'high', // Vocals are high frequency
        alpha: 0,
        movement: 0
      },
      {
        type: 'keyboard',
        x: width * 0.7,
        y: this.stageHeight - 45,
        scale: 1.0,
        freqBand: 'mid', // Keyboard is mid frequency
        alpha: 0,
        movement: 0
      }
    ];
  }
  
  /**
   * Create light beams
   */
  createLightBeams() {
    const { width, height } = this.dimensions;
    
    // Create different light beams
    this.lightBeams = [];
    
    // Number of beams
    const beamCount = 8;
    
    for (let i = 0; i < beamCount; i++) {
      // Randomize properties
      const isLeftSide = i < beamCount / 2;
      const startX = isLeftSide ? width * 0.1 : width * 0.9;
      const startY = height * 0.05;
      
      // Random angle for beam (pointing toward stage center if from sides)
      let angle;
      if (isLeftSide) {
        angle = Math.PI / 6 + Math.random() * Math.PI / 6; // 30-60 degrees
      } else {
        angle = Math.PI - Math.PI / 6 - Math.random() * Math.PI / 6; // 120-150 degrees
      }
      
      // Random color for beam (stage light colors)
      const colors = [
        { h: 0, s: 100, l: 50 },      // Red
        { h: 240, s: 100, l: 50 },    // Blue
        { h: 60, s: 100, l: 50 },     // Yellow
        { h: 300, s: 100, l: 50 },    // Purple
        { h: 180, s: 100, l: 50 }     // Cyan
      ];
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Create beam
      this.lightBeams.push({
        x: startX,
        y: startY,
        length: height * 1.2,
        angle: angle,
        width: 0.05 + Math.random() * 0.1,
        color: color,
        baseSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.005 + Math.random() * 0.01),
        speed: 0,
        active: false,
        targetAlpha: 0,
        currentAlpha: 0
      });
    }
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
      
      // Process beats for effects
      this.handleBeats(audioData, deltaTime);
      
      // Update band members based on frequency bands
      this.updateBandMembers(audioData, deltaTime);
    }
    
    // Update crowd movements
    this.updateCrowd(deltaTime, bassLevel, isBeat);
    
    // Update light beams
    this.updateLightBeams(deltaTime, audioData);
    
    // Update smoke intensity based on bass
    this.smokeIntensity = 0.3 + bassLevel * 0.7;
    
    // Update emission rates for smoke based on intensity
    if (this.particleSystems.smoke) {
      const quality = qualitySettings?.effects || 'standard';
      const intensityMultiplier = quality === 'enhanced' ? 1.5 : (quality === 'minimal' ? 0.5 : 1);
      
      this.particleSystems.smoke.emissionRate = 2 * this.smokeIntensity * intensityMultiplier;
    }
    
    // Update light intensity based on mid/high frequencies
    this.lightIntensity = 0.5 + (midLevel + highLevel) * 0.25;
  }
  
  /**
   * Handle audio beats for visualization effects
   */
  handleBeats(audioData, deltaTime) {
    const now = Date.now();
    const timeSinceLastBeat = now - this.lastBeatTime;
    
    // Activate effects on strong beats
    if (audioData.isBeat) {
      // Only trigger on stronger beats and with some time interval
      if (audioData.bands.bass > 200 && timeSinceLastBeat > 500) {
        // Activate a random light beam
        this.activateRandomLightBeam();
        
        // Make crowd jump
        this.crowdJump(audioData.bands.bass / 255);
        
        // Trigger pyro on really strong beats
        if (audioData.bands.bass > 230 && timeSinceLastBeat > 2000) {
          this.triggerPyro();
        }
        
        this.lastBeatTime = now;
      }
      
      // Flash stage lights on any beat
      this.flashStageLights();
    }
  }
  
  /**
   * Update band member silhouettes based on audio
   */
  updateBandMembers(audioData, deltaTime) {
    this.bandMembers.forEach(member => {
      // Get appropriate frequency band level for this instrument
      let intensity = 0;
      
      switch (member.freqBand) {
        case 'bass':
          intensity = audioData.bands.bass / 255;
          break;
        case 'midLow':
          intensity = audioData.bands.midLow / 255;
          break;
        case 'mid':
          intensity = audioData.bands.mid / 255;
          break;
        case 'high':
          intensity = audioData.bands.high / 255;
          break;
      }
      
      // Update alpha based on intensity
      // Only show silhouette when its frequency band is active
      const targetAlpha = intensity > 0.4 ? 0.5 + intensity * 0.5 : 0;
      member.alpha = member.alpha * 0.9 + targetAlpha * 0.1;
      
      // Update movement animation based on intensity
      member.movement = intensity;
    });
  }
  
  /**
   * Update crowd movements
   */
  updateCrowd(deltaTime, bassLevel, isBeat) {
    this.crowdFigures.forEach(figure => {
      // Update arm waving
      figure.armPhase += figure.armSpeed * deltaTime * (1 + bassLevel);
      
      // Update jumping (if applicable)
      if (figure.jumpHeight > 0) {
        figure.jumpHeight = Math.max(0, figure.jumpHeight - 0.1 * deltaTime);
      }
    });
  }
  
  /**
   * Update light beams
   */
  updateLightBeams(deltaTime, audioData) {
    // Extract audio reactivity
    let midLevel = 0;
    let highLevel = 0;
    
    if (audioData) {
      midLevel = audioData.bands.mid / 255;
      highLevel = audioData.bands.high / 255;
    }
    
    this.lightBeams.forEach(beam => {
      // Update light beam movement
      beam.speed = beam.baseSpeed * (1 + midLevel * 2);
      beam.angle += beam.speed * deltaTime;
      
      // Update alpha based on target
      beam.currentAlpha = beam.currentAlpha * 0.9 + beam.targetAlpha * 0.1;
      
      // Deactivate beams over time
      if (beam.active) {
        beam.targetAlpha = Math.max(0, beam.targetAlpha - 0.01 * deltaTime);
        
        if (beam.targetAlpha <= 0) {
          beam.active = false;
        }
      }
    });
  }
  
  /**
   * Activate a random light beam
   */
  activateRandomLightBeam() {
    // Select a random beam
    const index = Math.floor(Math.random() * this.lightBeams.length);
    const beam = this.lightBeams[index];
    
    // Activate it
    beam.active = true;
    beam.targetAlpha = 0.7 + Math.random() * 0.3; // Random intensity
  }
  
  /**
   * Make crowd jump on beat
   */
  crowdJump(intensity) {
    // Select random crowd members to jump
    const jumpCount = Math.floor(this.crowdFigures.length * 0.3 * intensity);
    
    for (let i = 0; i < jumpCount; i++) {
      const index = Math.floor(Math.random() * this.crowdFigures.length);
      this.crowdFigures[index].jumpHeight = 10 * intensity;
    }
  }
  
  /**
   * Flash stage lights
   */
  flashStageLights() {
    // Add some spotlight particles
    if (this.particleSystems.spotlights) {
      const { width, height } = this.dimensions;
      
      // Add particles from top of stage
      for (let i = 0; i < 10; i++) {
        this.particleSystems.spotlights.addParticle({
          x: width * (0.3 + Math.random() * 0.4),
          y: height * 0.1,
          vx: (Math.random() - 0.5) * 2,
          vy: 1 + Math.random() * 2,
          size: 10 + Math.random() * 10,
          color: { r: 255, g: 255, b: 255, a: 0.3 + Math.random() * 0.3 }
        });
      }
    }
  }
  
  /**
   * Trigger pyrotechnic effects
   */
  triggerPyro() {
    if (!this.particleSystems.pyro) return;
    
    const { width } = this.dimensions;
    
    // Add pyro particles at random positions on stage
    const burstCenter = width * (0.3 + Math.random() * 0.4);
    
    // Create a burst of particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      
      this.particleSystems.pyro.addParticle({
        x: burstCenter,
        y: this.stageHeight - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Initial upward velocity
        size: 5 + Math.random() * 15,
        life: 10 + Math.random() * 15
      });
    }
  }
  
  /**
   * Draw the background with a dark gradient
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = this.dimensions;
    
    // Create dark background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#000000');
    bgGradient.addColorStop(1, '#101020');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw stage platform
    this.drawStage(ctx);
    
    // Draw atmospheric haze if in high quality mode
    if (qualitySettings && qualitySettings.effects !== 'minimal') {
      this.drawAtmosphericHaze(ctx, dimensions, audioData);
    }
  }
  
  /**
   * Draw main stage platform
   */
  drawStage(ctx) {
    const { width, height } = this.dimensions;
    
    // Draw stage platform
    ctx.fillStyle = '#333333';
    
    // Stage front face
    ctx.beginPath();
    ctx.rect(0, this.stageHeight, width, 15);
    ctx.fill();
    
    // Stage top
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.rect(0, this.stageHeight - 10, width, 10);
    ctx.fill();
    
    // Floor
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath();
    ctx.rect(0, this.floorY, width, height - this.floorY);
    ctx.fill();
  }
  
  /**
   * Draw atmospheric haze effect
   */
  drawAtmosphericHaze(ctx, dimensions, audioData) {
    const { width, height } = this.dimensions;
    
    // Draw subtle haze gradient from bottom
    const hazeGradient = ctx.createLinearGradient(0, height * 0.3, 0, height);
    hazeGradient.addColorStop(0, 'rgba(20, 20, 40, 0)');
    hazeGradient.addColorStop(1, `rgba(20, 20, 40, ${0.2 + this.smokeIntensity * 0.3})`);
    
    ctx.fillStyle = hazeGradient;
    ctx.fillRect(0, height * 0.3, width, height * 0.7);
  }
  
  /**
   * Draw the main visualization elements
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    // Draw light beams
    this.drawLightBeams(ctx, dimensions, audioData);
    
    // Draw band member silhouettes
    this.drawBandMembers(ctx, dimensions, audioData);
    
    // Draw crowd
    this.drawCrowd(ctx, dimensions, audioData);
    
    // Draw frequency visualization as equalizer
    if (audioData && audioData.frequencyData) {
      this.drawEqualizer(ctx, dimensions, audioData.frequencyData);
    }
  }
  
  /**
   * Draw light beams
   */
  drawLightBeams(ctx, dimensions, audioData) {
    const { width, height } = this.dimensions;
    
    // Use additive blending for lights
    ctx.globalCompositeOperation = 'lighter';
    
    // Draw each active light beam
    this.lightBeams.forEach(beam => {
      if (beam.currentAlpha <= 0.01) return;
      
      const centerX = beam.x;
      const startY = beam.y;
      
      // Calculate beam end point
      const beamLength = beam.length;
      const beamWidth = Math.PI * beam.width;
      const beamIntensity = beam.currentAlpha * this.lightIntensity;
      
      // Use specific color for this beam
      const hue = beam.color.h;
      const saturation = beam.color.s;
      const lightness = beam.color.l;
      
      // Create conical gradient
      ctx.save();
      ctx.translate(centerX, startY);
      ctx.rotate(beam.angle);
      
      // Draw beam as a cone shape
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const coneWidth = beamLength * Math.tan(beamWidth / 2);
      ctx.lineTo(coneWidth, beamLength);
      ctx.lineTo(-coneWidth, beamLength);
      ctx.closePath();
      
      // Create gradient for beam
      const beamGradient = ctx.createLinearGradient(0, 0, 0, beamLength);
      beamGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${beamIntensity})`);
      beamGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
      
      ctx.fillStyle = beamGradient;
      ctx.fill();
      
      // Add center glow
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, ${beamIntensity})`;
      ctx.fill();
      
      ctx.restore();
    });
    
    // Reset blend mode
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Draw band member silhouettes
   */
  drawBandMembers(ctx, dimensions, audioData) {
    // Draw each band member silhouette
    this.bandMembers.forEach(member => {
      if (member.alpha < 0.05) return;
      
      ctx.save();
      ctx.translate(member.x, member.y);
      ctx.scale(member.scale, member.scale);
      
      // Instrument-specific silhouette
      switch (member.type) {
        case 'guitar':
          this.drawGuitaristSilhouette(ctx, member);
          break;
        case 'drums':
          this.drawDrummerSilhouette(ctx, member);
          break;
        case 'vocalist':
          this.drawVocalistSilhouette(ctx, member);
          break;
        case 'keyboard':
          this.drawKeyboardistSilhouette(ctx, member);
          break;
      }
      
      ctx.restore();
    });
  }
  
  /**
   * Draw guitarist silhouette
   */
  drawGuitaristSilhouette(ctx, member) {
    // Calculate animation values
    const movement = Math.sin(this.animationTime * 3) * member.movement * 0.2;
    
    // Body color with instrument-specific hue
    ctx.fillStyle = `hsla(330, 80%, 50%, ${member.alpha})`;
    
    // Head
    ctx.beginPath();
    ctx.arc(0, -30, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(-5, -20);
    ctx.lineTo(-10, 20);
    ctx.lineTo(10, 20);
    ctx.lineTo(5, -20);
    ctx.closePath();
    ctx.fill();
    
    // Guitar
    ctx.beginPath();
    ctx.rotate(movement);
    ctx.moveTo(5, 0);
    ctx.lineTo(25, 15 + movement * 5);
    ctx.lineTo(20, 25 + movement * 5);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    
    // Arm
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.lineTo(20, 0 + movement * 10);
    ctx.lineTo(18, 5 + movement * 10);
    ctx.lineTo(3, -10);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Draw drummer silhouette
   */
  drawDrummerSilhouette(ctx, member) {
    // Calculate animation values
    const movement = member.movement;
    const armRaise = Math.sin(this.animationTime * 10) * movement * 10;
    
    // Body color with instrument-specific hue
    ctx.fillStyle = `hsla(200, 80%, 50%, ${member.alpha})`;
    
    // Head
    ctx.beginPath();
    ctx.arc(0, -30, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(-10, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(10, -20);
    ctx.closePath();
    ctx.fill();
    
    // Arms (drumming motion)
    ctx.beginPath();
    ctx.moveTo(-5, -15);
    ctx.lineTo(-20, -10 - armRaise);
    ctx.lineTo(-20, -5 - armRaise);
    ctx.lineTo(-5, -10);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.lineTo(20, -10 + armRaise);
    ctx.lineTo(20, -5 + armRaise);
    ctx.lineTo(5, -10);
    ctx.closePath();
    ctx.fill();
    
    // Draw drum kit (simplified)
    ctx.beginPath();
    ctx.arc(-15, 5, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(15, 5, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Draw vocalist silhouette
   */
  drawVocalistSilhouette(ctx, member) {
    // Calculate animation values
    const movement = Math.sin(this.animationTime * 5) * member.movement * 0.3;
    
    // Body color with instrument-specific hue
    ctx.fillStyle = `hsla(60, 80%, 50%, ${member.alpha})`;
    
    // Head
    ctx.beginPath();
    ctx.arc(movement * 5, -35, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(-8 + movement * 3, -22);
    ctx.lineTo(-12 + movement * 2, 20);
    ctx.lineTo(12 + movement * 2, 20);
    ctx.lineTo(8 + movement * 3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Arm holding mic
    ctx.beginPath();
    ctx.moveTo(8, -15);
    ctx.lineTo(20, -10 + movement * 10);
    ctx.lineTo(22, -5 + movement * 10);
    ctx.lineTo(10, -10);
    ctx.closePath();
    ctx.fill();
    
    // Microphone
    ctx.beginPath();
    ctx.arc(25 + movement * 5, -5 + movement * 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Draw keyboardist silhouette
   */
  drawKeyboardistSilhouette(ctx, member) {
    // Calculate animation values
    const movement = member.movement;
    const fingerMovement = Math.sin(this.animationTime * 8) * movement * 5;
    
    // Body color with instrument-specific hue
    ctx.fillStyle = `hsla(120, 80%, 50%, ${member.alpha})`;
    
    // Head
    ctx.beginPath();
    ctx.arc(0, -30, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(-8, -20);
    ctx.lineTo(-10, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(8, -20);
    ctx.closePath();
    ctx.fill();
    
    // Keyboard
    ctx.fillStyle = `rgba(50, 50, 50, ${member.alpha})`;
    ctx.fillRect(-25, 0, 50, 10);
    
    // White keys
    ctx.fillStyle = `rgba(220, 220, 220, ${member.alpha})`;
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(-24 + i * 7, 0, 6, 9);
    }
    
    // Arms & hands
    ctx.fillStyle = `hsla(120, 80%, 50%, ${member.alpha})`;
    
    // Left arm
    ctx.beginPath();
    ctx.moveTo(-5, -15);
    ctx.lineTo(-15, -5);
    ctx.lineTo(-15, 0 + fingerMovement);
    ctx.lineTo(-5, -10);
    ctx.closePath();
    ctx.fill();
    
    // Right arm
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.lineTo(15, -5);
    ctx.lineTo(15, 0 - fingerMovement);
    ctx.lineTo(5, -10);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Draw crowd
   */
  drawCrowd(ctx, dimensions, audioData) {
    // Extract audio reactivity
    let bassLevel = 0;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
    }
    
    // Draw each crowd figure
    this.crowdFigures.forEach(figure => {
      ctx.fillStyle = figure.color;
      
      // Apply jump displacement if any
      const jumpDisplacement = figure.jumpHeight;
      
      // Body
      ctx.beginPath();
      ctx.rect(
        figure.x - figure.width / 2, 
        figure.y - figure.height + jumpDisplacement, 
        figure.width, 
        figure.height
      );
      ctx.fill();
      
      // Head
      ctx.beginPath();
      ctx.arc(
        figure.x, 
        figure.y - figure.height - figure.width / 3 + jumpDisplacement,
        figure.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Arms
      if (figure.armRaisedHeight > 0) {
        const armAngle = Math.sin(figure.armPhase) * 0.2;
        const armLength = figure.height * figure.armRaisedHeight;
        
        // Left arm
        ctx.beginPath();
        ctx.moveTo(figure.x, figure.y - figure.height * 0.8 + jumpDisplacement);
        ctx.lineTo(
          figure.x - figure.width - Math.cos(armAngle) * armLength,
          figure.y - figure.height * 0.8 - Math.sin(armAngle) * armLength - figure.height * 0.2 + jumpDisplacement
        );
        ctx.lineWidth = figure.width * 0.3;
        ctx.strokeStyle = figure.color;
        ctx.stroke();
        
        // Right arm
        ctx.beginPath();
        ctx.moveTo(figure.x, figure.y - figure.height * 0.8 + jumpDisplacement);
        ctx.lineTo(
          figure.x + figure.width + Math.cos(armAngle) * armLength,
          figure.y - figure.height * 0.8 - Math.sin(armAngle) * armLength - figure.height * 0.2 + jumpDisplacement
        );
        ctx.lineWidth = figure.width * 0.3;
        ctx.strokeStyle = figure.color;
        ctx.stroke();
      }
    });
  }
  
  /**
   * Draw equalizer visualization at the bottom
   */
  drawEqualizer(ctx, dimensions, frequencyData) {
    const { width, height } = this.dimensions;
    
    const barCount = 64;
    const barWidth = width / barCount;
    const barSpacing = 1;
    const maxBarHeight = height * 0.15;
    
    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i] / 255;
      
      // Color based on frequency (rainbow gradient)
      const hue = i / barCount * 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.7)`;
      
      const barHeight = value * maxBarHeight;
      ctx.fillRect(
        i * barWidth + barSpacing / 2,
        height - barHeight,
        barWidth - barSpacing,
        barHeight
      );
    }
  }
  
  /**
   * Draw foreground effects
   */
  drawForeground(ctx, dimensions, audioData, qualitySettings) {
    // Add flash effect on beats
    if (audioData && audioData.isBeat && audioData.bands.bass > 200) {
      ctx.fillStyle = `rgba(255, 255, 255, ${audioData.bands.bass / 255 * 0.1})`;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }
    
    // Add vignette effect
    this.drawVignette(ctx, dimensions);
  }
  
  /**
   * Draw vignette effect
   */
  drawVignette(ctx, dimensions) {
    const { width, height } = this.dimensions;
    
    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.8
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

export default ConcertVisualization;
