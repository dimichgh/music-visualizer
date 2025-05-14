/**
 * Galaxy Visualization
 * A flowing and dynamic visualization of galaxies using Three.js
 * This file orchestrates the modular components to create the full visualization
 */

import * as THREE from 'three';
import BaseVisualization from '../BaseVisualization';
import CameraAnimation from './cameraAnimation';
import {
  createBackgroundStars,
  createGalaxyCore,
  createGalacticArms,
  createNebulaEffects,
  createDustClouds,
  setupLighting
} from './sceneElements';
import {
  initRenderer,
  initCamera,
  setupPostProcessing,
  updateDimensions,
  disposeRenderer
} from './renderer';

class GalaxyVisualization extends BaseVisualization {
  constructor(options = {}) {
    // Define default configurable parameters
    const configDefaults = {
      // Camera parameters
      cameraDistance: 60,       // How far the camera is from the scene
      cameraSpeed: 0.12,        // Speed of camera movement
      cameraDamping: 0.98,      // How quickly camera movement slows down
      
      // Visual parameters
      bloomStrength: 0.7,       // Base bloom effect strength
      bloomThreshold: 0.85,     // Bloom threshold
      centerHoleSize: 10,       // Size of the empty space in the center
      brightness: 1.0,          // Overall brightness multiplier
    };
    
    // Call parent constructor with merged options
    super({
      name: 'Galaxy',
      description: 'A flowing and dynamic visualization of galaxies using Three.js',
      author: 'Music Visualizer',
      useParticles: false, // We'll use Three.js particles instead
      colorPalette: {
        primary: { r: 170, g: 200, b: 255, a: 1 },
        secondary: { r: 230, g: 130, b: 200, a: 1 },
        accent: { r: 120, g: 230, b: 180, a: 1 },
        background: { r: 2, g: 4, b: 15, a: 1 }
      },
      ...options
    });
    
    // Set min/max ranges for controls - moved after super() call
    this.controlRanges = {
      cameraDistance: { min: 20, max: 150 },
      cameraSpeed: { min: 0.01, max: 0.5 },
      cameraDamping: { min: 0.8, max: 0.99 },
      bloomStrength: { min: 0.1, max: 2.0 },
      bloomThreshold: { min: 0.1, max: 1.0 },
      brightness: { min: 0.1, max: 3.0 }
    };
    
    // Store the default configuration values as a class property
    this.configDefaults = configDefaults;
    
    // Initialize configurable parameters with defaults and any provided values
    this.config = {
      ...configDefaults,
      ...(options.config || {})
    };
    
    // Three.js specific properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.clock = new THREE.Clock();
    
    // Galaxy elements
    this.galaxyParticles = [];
    this.nebulaGroups = [];
    this.backgroundStars = null;
    this.galaxyGroup = null;
    this.dustParticles = null;
    this.lights = [];
    
    // Audio reactive properties
    this.rotationSpeed = 0.001;
    this.pulseStrength = 0;
    this.colorShiftFactor = 0;
    this.emissionIntensity = 0;
    
    // Create camera animation controller
    this.cameraAnimation = new CameraAnimation(this.config);
  }
  
  /**
   * Initialize the Three.js scene
   * @override
   */
  init(options) {
    // Skip default particle system initialization
    // We'll handle our own Three.js particles
  }
  
  /**
   * Set up the visualization
   * @override
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} dimensions - Canvas dimensions {width, height}
   */
  setup(ctx, dimensions) {
    super.setup(ctx, dimensions);
    
    // Create Three.js scene
    if (!this.scene) {
      this.scene = new THREE.Scene();
      
      // Initialize camera
      this.camera = initCamera(dimensions);
      
      // Initialize renderer
      this.renderer = initRenderer(dimensions);
      
      // Initialize post-processing
      const postProcessing = setupPostProcessing(
        this.renderer, 
        this.scene, 
        this.camera, 
        dimensions, 
        this.config
      );
      
      this.composer = postProcessing.composer;
      this.bloomPass = postProcessing.bloomPass;
      this.chromaticPass = postProcessing.chromaticPass;
      
      // Create galaxy scene
      this.createGalaxyScene();
    } else {
      // Just update dimensions if scene already exists
      updateDimensions(this.renderer, this.camera, this.composer, dimensions);
    }
  }
  
  /**
   * Create the galaxy scene with all elements
   */
  createGalaxyScene() {
    // Add background stars
    this.backgroundStars = createBackgroundStars();
    this.scene.add(this.backgroundStars);
    
    // Create empty galaxy core (currently disabled)
    const { galaxyCore, galaxyCoreGlow } = createGalaxyCore();
    this.galaxyCore = galaxyCore;
    this.galaxyCoreGlow = galaxyCoreGlow;
    
    // Create galaxy arms
    const galaxyArms = createGalacticArms(this.config);
    this.galaxyGroup = galaxyArms.galaxyGroup;
    this.galaxyParticles = galaxyArms.galaxyParticles;
    this.scene.add(this.galaxyGroup);
    
    // Create nebulas
    this.nebulaGroups = createNebulaEffects();
    for (const nebula of this.nebulaGroups) {
      this.scene.add(nebula.group);
    }
    
    // Create dust clouds
    this.dustParticles = createDustClouds();
    this.scene.add(this.dustParticles);
    
    // Set up lighting
    this.lights = setupLighting(this.scene, this.config.brightness);
  }
  
  /**
   * Update visualization state based on audio data
   * @override
   */
  updateElements(deltaTime, audioData, qualitySettings) {
    // Skip if no Three.js renderer
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }
    
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
      
      // Update audio-reactive properties
      this.rotationSpeed = 0.001 + bassLevel * 0.003;
      this.pulseStrength = bassLevel * 0.5;
      this.colorShiftFactor = midLevel * 0.5;
      this.emissionIntensity = 0.7 + highLevel * 0.3;
    }
    
    // Update animation time
    const time = this.clock.getElapsedTime();
    const frameDelta = this.clock.getDelta();
    
    // Update camera position
    this.cameraAnimation.updateCamera(this.camera, deltaTime, audioData);
    
    // Update background stars
    if (this.backgroundStars && this.backgroundStars.material.uniforms) {
      this.backgroundStars.material.uniforms.time.value = time;
      this.backgroundStars.material.uniforms.audioIntensity.value = highLevel;
      this.backgroundStars.rotation.y += 0.0001;
      this.backgroundStars.rotation.x += 0.00005;
    }
    
    // Update galaxy particle systems
    for (const galaxy of this.galaxyParticles) {
      const material = galaxy.material;
      if (material.uniforms) {
        material.uniforms.time.value = time;
        material.uniforms.baseRotationSpeed.value = this.rotationSpeed;
        material.uniforms.pulseStrength.value = this.pulseStrength;
        material.uniforms.colorShift.value = this.colorShiftFactor;
      }
    }
    
    // Update galaxy group rotation
    if (this.galaxyGroup) {
      this.galaxyGroup.rotation.z += this.rotationSpeed * 0.05;
    }
    
    // Update nebula effects
    for (const nebula of this.nebulaGroups) {
      // Rotate nebula
      nebula.group.rotation.x += nebula.rotationSpeed.x * deltaTime;
      nebula.group.rotation.y += nebula.rotationSpeed.y * deltaTime;
      nebula.group.rotation.z += nebula.rotationSpeed.z * deltaTime;
      
      // Update material uniforms
      if (nebula.material.uniforms) {
        nebula.material.uniforms.time.value = time;
        nebula.material.uniforms.intensity.value = nebula.baseIntensity * (1 + midLevel);
      }
    }
    
    // Update dust particles
    if (this.dustParticles && this.dustParticles.material.uniforms) {
      this.dustParticles.material.uniforms.time.value = time;
      this.dustParticles.material.uniforms.deltaTime.value = frameDelta;
      this.dustParticles.material.uniforms.audioIntensity.value = (bassLevel + midLevel) * 0.5;
    }
    
    // Update post-processing effects with values from config
    if (this.bloomPass) {
      // Apply the config values with audio reactivity
      this.bloomPass.strength = this.config.bloomStrength + bassLevel * 0.8;
      this.bloomPass.threshold = this.config.bloomThreshold + bassLevel * 0.1;
    }
    
    if (this.chromaticPass) {
      this.chromaticPass.uniforms.power.value = 0.03 + midLevel * 0.1;
    }
  }
  
  /**
   * Draw the background - in this case, rendered by Three.js
   * @override
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    // Clear the canvas with a very dark background
    // (Three.js will render on top of this)
    
    // Use a hardcoded dark color to avoid any potential undefined issues
    ctx.fillStyle = 'rgba(2, 4, 15, 1)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  }
  
  /**
   * Render the visualization using Three.js
   * @override
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    // Skip if Three.js renderer isn't set up
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }
    
    // Render the Three.js scene
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
    // Copy the rendered output to the canvas
    ctx.drawImage(this.renderer.domElement, 0, 0);
  }
  
  /**
   * Draw foreground effects (if any)
   * @override
   */
  drawForeground(ctx, dimensions, audioData, qualitySettings) {
    // Add any 2D overlay effects here if needed
  }
  
  /**
   * Update configuration based on control panel settings
   * @param {string} parameter - Parameter name to update
   * @param {any} value - New value for the parameter
   */
  updateConfig(parameter, value) {
    if (parameter in this.config) {
      // Clamp value to min/max range if available
      if (this.controlRanges && this.controlRanges[parameter]) {
        const range = this.controlRanges[parameter];
        value = Math.max(range.min, Math.min(range.max, value));
      }
      
      // Update the configuration value
      this.config[parameter] = value;
      
      // Apply changes based on parameter
      switch (parameter) {
        case 'cameraDistance':
        case 'cameraSpeed':
        case 'cameraDamping':
          // Update camera animation parameters
          this.cameraAnimation.updateConfig(this.config);
          break;
          
        case 'bloomStrength':
          // Update bloom effect strength
          if (this.bloomPass) {
            this.bloomPass.strength = value;
          }
          break;
          
        case 'bloomThreshold':
          // Update bloom effect threshold
          if (this.bloomPass) {
            this.bloomPass.threshold = value;
          }
          break;
          
        case 'brightness':
          // Update overall brightness (affects lights, materials, and post-processing)
          if (this.scene) {
            // Update light intensities
            this.scene.traverse((object) => {
              if (object.isLight) {
                // Store original intensity if not already stored
                if (object.userData.originalIntensity === undefined) {
                  object.userData.originalIntensity = object.intensity;
                }
                // Apply brightness multiplier to original intensity
                object.intensity = object.userData.originalIntensity * value;
              }
            });
            
            // Update nebula brightness
            for (const nebula of this.nebulaGroups) {
              if (nebula.material && nebula.material.uniforms && nebula.material.uniforms.intensity) {
                if (nebula.userData === undefined) nebula.userData = {};
                if (nebula.userData.originalIntensity === undefined) {
                  nebula.userData.originalIntensity = nebula.baseIntensity;
                }
                nebula.baseIntensity = nebula.userData.originalIntensity * value;
              }
            }
            
            // Update bloom strength based on brightness too
            if (this.bloomPass) {
              this.bloomPass.strength = this.config.bloomStrength * (0.8 + value * 0.2);
            }
          }
          break;
          
        case 'centerHoleSize':
          // This would require regenerating particles, which is complex to do at runtime
          // We'll update this parameter for next time the visualization is created
          console.log('Center hole size will be applied next time the visualization is created.');
          break;
      }
    }
  }
  
  /**
   * Get the current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return this.config;
  }
  
  /**
   * Clean up resources when visualization is no longer needed
   * @override
   */
  dispose() {
    super.dispose();
    
    // Clean up Three.js resources
    disposeRenderer(this.renderer, this.scene);
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.galaxyParticles = [];
    this.nebulaGroups = [];
    this.backgroundStars = null;
    this.galaxyGroup = null;
    this.dustParticles = null;
    this.lights = [];
  }
}

export default GalaxyVisualization;
