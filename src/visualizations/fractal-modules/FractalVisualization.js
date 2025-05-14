/**
 * Fractal Visualization
 * A visualization using Three.js to render audio-reactive 3D particles with realistic lighting
 * This file orchestrates the modular components to create the full visualization
 */

import * as THREE from 'three';
import BaseVisualization from '../BaseVisualization';
import ParticleSystem from '../ParticleSystem';

// Import modular components
import {
  initRenderer,
  initCamera,
  initScene,
  updateDimensions,
  createSharedGeometries,
  createMaterials,
  createEnvironmentMap,
  updateEnvironmentMap,
  disposeRenderer
} from './renderer';

import {
  setupLights,
  createBackgroundWalls,
  createLightWall,
  findAdjacentTiles,
  activateFlares
} from './sceneElements';

import {
  createParticles,
  updateParticles
} from './particles';

import {
  createOrbs,
  addOrbLights,
  createNewOrb,
  removeOrb,
  updateOrbs,
  detectPatternChange
} from './orbs';

import {
  updateLightWall,
  updateBackground
} from './lightWallUpdater';

class FractalVisualization extends BaseVisualization {
  constructor(options = {}) {
    // Call parent constructor with merged options
    super({
      name: 'Fractal',
      description: 'An immersive 3D particle system with realistic lighting and shadows',
      author: 'Music Visualizer',
      useParticles: true,
      particleCount: 300,
      colorPalette: {
        primary: { r: 240, g: 240, b: 240, a: 1 },
        secondary: { r: 200, g: 200, b: 220, a: 1 },
        accent: { r: 255, g: 255, b: 255, a: 1 },
        background: { r: 0, g: 0, b: 0, a: 1 }
      },
      ...options
    });
    
    // Three.js specific properties
    this.scene = null;
    this.camera = null;
    this.threeRenderer = null;
    this.clock = new THREE.Clock();
    
    // 3D particles state
    this.particleParams = {
      count: 200,
      minSize: 0.05,
      maxSize: 0.5,
      spreadFactor: 2.5,
      rotationSpeed: 0.1,
      shininess: 100.0,
      reflectivity: 0.9,
      responsiveness: 0.8
    };
    
    // Colored orbs parameters
    this.orbParams = {
      count: 20, // Number of colored orbs that fly around
      minSize: 0.1, // Smaller size
      maxSize: 0.3, // Smaller max size
      fixedSpeed: 0.35, // Fixed movement speed for all orbs
      pulseAmount: 0.7, // How much they expand with beats
      trailLength: 8, // Longer trails
      maxLifetime: 10000, // Max lifetime in ms before flying off
      offscreenDistance: 20 // How far off screen they go before respawning
    };
    
    // Light wall parameters
    this.lightWallParams = {
      enabled: true,
      tileRows: 12,       // Fewer rows since tiles are larger
      tilesPerRow: 16,    // Fewer tiles per row for larger tiles
      sphereRadius: 14,   // Radius of the sphere
      tileSpacing: 0.05,  // Increased spacing for larger tiles
      colorSet: [
        0xff3366, // Pink
        0x33aaff, // Blue
        0x33ff66, // Green
        0xffaa33, // Orange
        0xaa33ff, // Purple
        0xffff33, // Yellow
        0xff3333, // Red
        0x33ffff  // Cyan
      ],
      baseBrightness: 0.25,  // Slightly brighter base state
      pulseSpeed: 0.7,
      reactiveFactor: 2.0,  // Higher reactivity to music
      tileSize: 1,      // 3x larger tiles
      glowIntensity: 1.8,   // Increased glow intensity
      maxBrightness: 3.5,   // Higher maximum brightness (increased from 3.0)
      sphereOpening: 0.15,   // Slightly larger opening for the sphere
      beatExpansion: 0.8    // Increased beat expansion for more dramatic effect (increased from 0.5)
    };
    
    // Background parameters
    this.backgroundParams = {
      transitionSpeed: 0.01,
      currentColor: new THREE.Color(0x000000),
      targetColor: new THREE.Color(0x000022),
      wallOpacity: 0.15
    };
    
    // Module data objects
    this.particles = [];
    this.particleGroup = null;
    this.geometries = null;
    this.materials = null;
    this.lights = null;
    this.backgroundElements = null;
    this.orbs = [];
    this.orbLights = [];
    this.lightWallElements = {
      lightWall: null,
      lightTiles: []
    };
    this.environmentMap = null;
    
    // Animation and rendering state
    this.animationFrame = 0;
    this.lastAudioData = null;
    
    // Create particle systems for additional effects (2D particles)
    this.createParticleSystems();
  }
  
  /**
   * Create 2D particle systems for additional effects
   */
  createParticleSystems() {
    // Clear existing particle systems
    this.particleSystems = {};
    
    // Ambient particles for cosmic dust effect
    this.particleSystems.ambient = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.5),
      emissionRate: 2,
      particleSize: { min: 1, max: 2 },
      particleLifespan: { min: 60, max: 120 },
      color: { r: 200, g: 200, b: 255, a: 0.3 },
      gravity: { x: 0, y: 0.01 },
      turbulence: 0.05,
      friction: 0.98,
      blendMode: 'screen',
      audioBehavior: {
        emissionRate: { band: 'high', min: 1, max: 5 },
        size: { band: 'mid', factor: 0.5 }
      }
    });
    
    // Energy burst particles for beat reactions
    this.particleSystems.energyBurst = new ParticleSystem({
      maxParticles: Math.floor(this.config.particleCount * 0.3),
      emissionRate: 0, // Only emit on beats
      particleSize: { min: 2, max: 5 },
      particleLifespan: { min: 20, max: 40 },
      colorMode: 'gradient',
      colorGradient: [
        { pos: 0, color: { r: 255, g: 255, b: 255, a: 0.6 } },
        { pos: 0.3, color: { r: 220, g: 220, b: 255, a: 0.4 } },
        { pos: 0.7, color: { r: 200, g: 200, b: 255, a: 0.2 } },
        { pos: 1, color: { r: 180, g: 180, b: 220, a: 0 } }
      ],
      gravity: { x: 0, y: -0.02 },
      turbulence: 0.1,
      friction: 0.96,
      blendMode: 'screen',
      audioBehavior: {
        beatBurst: { count: 15, speed: 4 }
      }
    });
  }
  
  /**
   * Setup the visualization when dimensions change
   * @override
   */
  setup(ctx, dimensions) {
    super.setup(ctx, dimensions);
    
    // Initialize Three.js if not already set up
    if (!this.scene) {
      // Initialize scene, camera, and renderer
      this.scene = initScene();
      this.camera = initCamera(dimensions);
      this.threeRenderer = initRenderer(dimensions);
      
      // Create shared geometries for reuse
      this.geometries = createSharedGeometries();
      
      // Set up environment map for reflections
      this.environmentMap = createEnvironmentMap(this.scene);
      
      // Create materials using environment map
      this.materials = createMaterials(this.environmentMap.cubeRenderTarget.texture);
      
      // Set up the scene elements
      this.createSceneElements();
    } else {
      // Just update dimensions if already set up
      updateDimensions(this.threeRenderer, this.camera, dimensions);
    }
    
    // Set up emission areas for 2D particle systems
    this.setupParticleEmissionAreas();
  }
  
  /**
   * Create all scene elements
   */
  createSceneElements() {
    // Setup lighting
    this.lights = setupLights(this.scene);
    
    // Create background walls
    this.backgroundElements = createBackgroundWalls(this.scene, this.backgroundParams);
    
    // Create particles
    const particleResult = createParticles(this.geometries, this.materials, this.particleParams);
    this.particleGroup = particleResult.particleGroup;
    this.particles = particleResult.particles;
    this.scene.add(this.particleGroup);
    
    // Create orbs with trails
    this.orbs = createOrbs(this.scene, this.geometries, this.orbParams);
    
    // Add lights to some orbs
    this.orbLights = addOrbLights(this.scene, this.orbs);
    
    // Create light wall
    const lightWallResult = createLightWall(this.scene, this.lightWallParams);
    this.lightWallElements.lightWall = lightWallResult.lightWall;
    this.lightWallElements.lightTiles = lightWallResult.lightTiles;
    
    // Find adjacent tiles for coordinated effects
    if (this.lightWallElements.lightTiles.length > 0) {
      findAdjacentTiles(this.lightWallElements.lightTiles, this.lightWallParams);
    }
  }
  
  /**
   * Set up emission areas for particle systems
   */
  setupParticleEmissionAreas() {
    // Check if dimensions are defined before proceeding
    if (!this.dimensions || !this.dimensions.width || !this.dimensions.height) {
      console.warn('Cannot setup particle emission areas: dimensions not defined');
      return;
    }
    
    const { width, height } = this.dimensions;
    
    // Configure ambient particles to emit from around scene
    if (this.particleSystems.ambient) {
      this.particleSystems.ambient.setEmissionArea({
        x: width * 0.3,
        y: height * 0.3,
        width: width * 0.4,
        height: height * 0.4
      });
    }
    
    // Configure energy burst particles to emit from center
    if (this.particleSystems.energyBurst) {
      this.particleSystems.energyBurst.setEmissionArea({
        x: width * 0.4,
        y: height * 0.4,
        width: width * 0.2,
        height: height * 0.2
      });
    }
  }
  
  /**
   * Update visualization state
   * @override
   */
  updateElements(deltaTime, audioData, qualitySettings) {
    const time = this.animationFrame * 0.01;
    
    // Update particles and inner glowing particles
    updateParticles(this.particles, deltaTime, time, audioData);
    
    // Update orbs and trails
    updateOrbs(
      this.scene, 
      this.orbs, 
      this.orbLights, 
      this.orbParams, 
      deltaTime, 
      time, 
      audioData, 
      this.lastAudioData
    );
    
    // Update light wall
    updateLightWall(
      this.lightWallElements.lightTiles,
      this.lightWallElements.lightWall,
      this.lightWallParams,
      deltaTime,
      time,
      audioData
    );
    
    // Update background and walls
    updateBackground(
      this.backgroundElements,
      this.backgroundParams,
      deltaTime,
      this.animationFrame,
      audioData
    );
    
    // Update center light color based on dominant audio band
    if (this.lights && this.lights.sphereLight && audioData) {
      const { bass, mid, high } = audioData.bands;
      const dominantBand = Math.max(bass, mid, high);
      
      if (bass === dominantBand) {
        // Bass dominant - red/pink
        this.lights.sphereLight.color.setHSL(0.95, 0.9, 0.6);
        this.lights.sphereLight.intensity = 0.6 + (bass/255) * 1.2;
      } else if (mid === dominantBand) {
        // Mid dominant - green/yellow
        this.lights.sphereLight.color.setHSL(0.3, 0.9, 0.6);
        this.lights.sphereLight.intensity = 0.6 + (mid/255) * 1.0;
      } else {
        // High dominant - blue/purple
        this.lights.sphereLight.color.setHSL(0.7, 0.9, 0.6);
        this.lights.sphereLight.intensity = 0.6 + (high/255) * 0.9;
      }
      
      // Strong pulse on beat
      if (audioData.isBeat) {
        this.lights.sphereLight.intensity *= 2.0;
      }
    }
    
    // Update particle group rotation
    if (this.particleGroup && audioData) {
      const { bass, mid, high } = audioData.bands;
      const bassLevel = bass / 255;
      const midLevel = mid / 255;
      const highLevel = high / 255;
      
      this.particleGroup.rotation.y += deltaTime * 0.0005 * (1 + midLevel);
      this.particleGroup.rotation.x += deltaTime * 0.0003 * (1 + highLevel * 0.5);
    }
    
    // Update directional light animation
    if (this.lights && this.lights.directionalLight) {
      const angle = time * 0.1;
      this.lights.directionalLight.position.x = Math.cos(angle) * 5;
      this.lights.directionalLight.position.z = Math.sin(angle) * 5;
      
      if (audioData) {
        this.lights.directionalLight.intensity = 0.8 + (audioData.bands.mid / 255) * 0.7;
      }
    }
    
    // Activate and update light flares
    if (this.lights) {
      activateFlares(this.lights, time, audioData);
    }
    
    // Update environment map for reflections (once every few frames)
    if (this.animationFrame % 10 === 0 && this.environmentMap) {
      updateEnvironmentMap(
        this.threeRenderer, 
        this.scene, 
        this.particleGroup, 
        this.environmentMap.cubeCamera
      );
    }
    
    // Store audio data for pattern detection
    this.lastAudioData = audioData ? {...audioData} : null;
    
    // Update animation time
    this.animationFrame += deltaTime;
  }
  
  /**
   * Draw the background
   * @override
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    // Pure black background for the 3D scene
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  }
  
  /**
   * Draw the main visualization elements (render Three.js scene)
   * @override
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    if (!this.threeRenderer || !this.scene || !this.camera) return;
    
    // Apply quality settings
    if (qualitySettings) {
      // Adjust shadow quality based on settings
      if (qualitySettings.effects === 'enhanced') {
        this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        for (const light of this.lights.pointLights) {
          light.shadow.mapSize.width = 1024;
          light.shadow.mapSize.height = 1024;
        }
      } else if (qualitySettings.effects === 'minimal') {
        this.threeRenderer.shadowMap.type = THREE.BasicShadowMap;
        for (const light of this.lights.pointLights) {
          light.shadow.mapSize.width = 256;
          light.shadow.mapSize.height = 256;
        }
      }
    }
    
    // Render the scene
    this.threeRenderer.render(this.scene, this.camera);
    
    // Get the canvas from Three.js renderer
    const threeCanvas = this.threeRenderer.domElement;
    
    // Draw the Three.js canvas onto our 2D canvas
    ctx.drawImage(threeCanvas, 0, 0, dimensions.width, dimensions.height);
  }
  
  /**
   * Draw foreground effects on top of the main visualization
   * @override
   */
  drawForeground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Only add subtle glow effects in enhanced mode
    if (qualitySettings && qualitySettings.effects !== 'minimal' && audioData) {
      // Add very subtle vignette
      const vignetteGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.7
      );
      
      const bassLevel = audioData.bands.bass / 255;
      
      // Subtle vignette that darkens edges
      vignetteGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
      vignetteGradient.addColorStop(0.8, `rgba(0, 0, 0, ${0.2 + bassLevel * 0.1})`);
      vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${0.5 + bassLevel * 0.2})`);
      
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add subtle bloom on beats
      if (audioData.isBeat) {
        const bloomGradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, width * 0.3
        );
        
        // Subtle white bloom
        bloomGradient.addColorStop(0, `rgba(255, 255, 255, ${0.1 + bassLevel * 0.1})`);
        bloomGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = bloomGradient;
        ctx.fillRect(0, 0, width, height);
      }
    }
    
    // Add frequency bars at the bottom in high quality
    if (qualitySettings && qualitySettings.effects !== 'minimal' && audioData && audioData.frequencyData) {
      this.drawFrequencyBars(ctx, dimensions, audioData.frequencyData, {
        maxHeight: dimensions.height * 0.1,
        bottom: dimensions.height,
        colorStart: { h: 220, s: 10, l: 70 },
        colorEnd: { h: 220, s: 10, l: 60 }
      });
    }
  }
  
  /**
   * Cleanup resources when visualization is no longer needed
   * @override
   */
  dispose() {
    super.dispose();
    
    // Dispose Three.js resources
    disposeRenderer(this.threeRenderer, this.scene);
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.threeRenderer = null;
    this.particles = [];
    this.particleGroup = null;
    this.orbs = [];
    this.orbLights = [];
    this.lightWallElements = {
      lightWall: null,
      lightTiles: []
    };
    this.backgroundElements = null;
    this.geometries = null;
    this.materials = null;
    this.lights = null;
    this.environmentMap = null;
  }
}

export default FractalVisualization;
