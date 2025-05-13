/**
 * 3D Particle Visualization
 * A visualization using Three.js to render audio-reactive 3D particles with realistic lighting
 */

import BaseVisualization from './BaseVisualization';
import ParticleSystem from './ParticleSystem';
import * as THREE from 'three';

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
    this.threeRenderer = null;
    this.scene = null;
    this.camera = null;
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
      speed: 0.5,
      trailLength: 8, // Longer trails
      maxLifetime: 10000, // Max lifetime in ms before flying off
      offscreenDistance: 20 // How far off screen they go before respawning
    };
    
    // Background parameters
    this.backgroundParams = {
      transitionSpeed: 0.01,
      currentColor: new THREE.Color(0x000000),
      targetColor: new THREE.Color(0x000022),
      wallOpacity: 0.15
    };
    
    // 3D particles collection
    this.particles = [];
    this.orbs = [];
    this.orbTrails = [];
    
    // Animation and rendering state
    this.animationFrame = 0;
    
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
   * Initialize Three.js scene, camera, and renderer
   */
  setupThreeJs() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      70, // Field of view
      this.dimensions.width / this.dimensions.height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.camera.position.z = 5;
    
    // Create WebGL renderer with shadows enabled
    this.threeRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.threeRenderer.setSize(this.dimensions.width, this.dimensions.height);
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    this.threeRenderer.shadowMap.enabled = true;
    this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Modern Three.js setup
    this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.threeRenderer.toneMappingExposure = 1.0;
    
    // Setup 3D particles
    this.setup3DParticles();
    
    // Add lights
    this.setupLights();
  }
  
  /**
   * Set up the 3D particles system
   */
  setup3DParticles() {
    // Create shared geometries for efficiency
    this.sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    this.orbGeometry = new THREE.SphereGeometry(1, 16, 16);
    
    // Create walls (box) for the background
    this.createBackgroundWalls();
    
    // Create colored orbiting spheres
    this.createOrbs();
    
    // Create materials with different properties for the gray/white look in the image
    this.materials = {
      regular: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xdddddd),
        roughness: 0.05,
        metalness: 0.9,
        envMapIntensity: 1.0,
        transparent: true,
        opacity: 0.9
      }),
      
      highlight: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.2,
        roughness: 0.0,
        metalness: 1.0,
        envMapIntensity: 1.5,
        transparent: true,
        opacity: 0.95
      }),
      
      secondary: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xbbbbbb),
        roughness: 0.1,
        metalness: 0.8,
        envMapIntensity: 0.8,
        transparent: true,
        opacity: 0.85
      })
    };
    
    // Add environment cube map for reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    this.cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    this.scene.add(this.cubeCamera);
    
    // Add point lights to orbs
    this.orbLights = [];
    for (let i = 0; i < Math.min(4, this.orbs.length); i++) {
      const orb = this.orbs[i];
      const light = new THREE.PointLight(orb.color, 0.8, 4);
      light.position.copy(orb.mesh.position);
      this.scene.add(light);
      this.orbLights.push(light);
      orb.light = light;
    }
    
    // Apply environment map to all materials
    for (const material of Object.values(this.materials)) {
      material.envMap = cubeRenderTarget.texture;
    }
    
    // Create a group to hold all particles
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
    
    // Create particles
    this.createParticles();
  }
  
  /**
   * Create 3D particles
   */
  createParticles() {
    // Clear existing particles
    while (this.particleGroup.children.length > 0) {
      this.particleGroup.remove(this.particleGroup.children[0]);
    }
    this.particles = [];
    
    // Create new particles
    const count = this.particleParams.count;
    const spread = this.particleParams.spreadFactor;
    
    for (let i = 0; i < count; i++) {
      // Determine size - larger at the center, smaller at edges
      const distFromCenter = Math.random();
      const sizeRange = this.particleParams.maxSize - this.particleParams.minSize;
      const size = this.particleParams.maxSize - (distFromCenter * sizeRange * 0.8);
      
      // Choose material based on size and randomness
      let material;
      if (i < count * 0.05) {
        // 5% are highlight particles (brightest)
        material = this.materials.highlight.clone();
      } else if (i < count * 0.25) {
        // 20% are secondary particles
        material = this.materials.secondary.clone();
      } else {
        // 75% are regular particles
        material = this.materials.regular.clone();
      }
      
      // Create the sphere mesh
      const mesh = new THREE.Mesh(this.sphereGeometry, material);
      
      // Set random position in a spherical distribution
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const r = Math.random() * spread * (1 - Math.pow(Math.random(), 3)); // More concentrated in center
      
      mesh.position.x = r * Math.sin(theta) * Math.cos(phi);
      mesh.position.y = r * Math.sin(theta) * Math.sin(phi);
      mesh.position.z = r * Math.cos(theta);
      
      // Random scale based on position (smaller as they get further from center)
      mesh.scale.set(size, size, size);
      
      // Enable shadows
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Store original position and other properties for animation
      const particle = {
        mesh,
        originalPosition: mesh.position.clone(),
        originalScale: size,
        phase: Math.random() * Math.PI * 2, // Random starting phase
        speed: 0.5 + Math.random() * 0.5,   // Random speed
        material: mesh.material,
        originalColor: mesh.material.color.clone(),
        isHighlight: material === this.materials.highlight,
        targetPosition: new THREE.Vector3(),
        targetScale: size,
        pulseFrequency: 0.5 + Math.random() * 2
      };
      
      // Add to scene and particle collection
      this.particleGroup.add(mesh);
      this.particles.push(particle);
    }
    
    // Add an invisible center sphere for lighting reference
    const centerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0,
        depthWrite: false 
      })
    );
    this.particleGroup.add(centerSphere);
  }
  
  /**
   * Setup lights for the scene
   */
  setupLights() {
    // Enhanced lighting setup with shadows
    
    // Add ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    this.scene.add(ambientLight);
    
    // Add hemisphere light for more natural sky/ground lighting
    const hemiLight = new THREE.HemisphereLight(0x6688ff, 0x33aa77, 0.4);
    this.scene.add(hemiLight);
    
    // Add directional light with shadows (main light)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(5, 5, 5);
    this.directionalLight.castShadow = true;
    
    // Improve shadow quality
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 20;
    this.directionalLight.shadow.camera.left = -5;
    this.directionalLight.shadow.camera.right = 5;
    this.directionalLight.shadow.camera.top = 5;
    this.directionalLight.shadow.camera.bottom = -5;
    this.directionalLight.shadow.bias = -0.001;
    
    this.scene.add(this.directionalLight);
    
    // Add multiple point lights that react to music
    this.pointLights = [];
    
    // Center point light (main reactive light)
    this.centerLight = new THREE.PointLight(0xffffff, 2.0, 8);
    this.centerLight.position.set(0, 0, 0);
    this.centerLight.castShadow = true;
    this.centerLight.shadow.mapSize.width = 512;
    this.centerLight.shadow.mapSize.height = 512;
    this.centerLight.shadow.radius = 4;
    this.scene.add(this.centerLight);
    this.pointLights.push(this.centerLight);
    
    // Add accent point lights
    const colors = [0xffffff, 0xffffff, 0xffffff]; // All white lights to match the image
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(colors[i], 0.8, 10);
      // Position lights in different directions
      const angle = (i / 3) * Math.PI * 2;
      light.position.set(
        Math.cos(angle) * 3,
        Math.sin(angle) * 3,
        1 + Math.sin(angle * 2) * 2
      );
      light.castShadow = true;
      light.shadow.mapSize.width = 256;
      light.shadow.mapSize.height = 256;
      light.shadow.radius = 4;
      this.scene.add(light);
      this.pointLights.push(light);
    }
  }
  
  /**
   * Create the background walls with semi-transparent materials
   */
  createBackgroundWalls() {
    // Create a large box that will serve as our room/background
    const wallSize = 20;
    const wallGeometry = new THREE.BoxGeometry(wallSize, wallSize, wallSize);
    
    // Create material with side set to BackSide so we see the inside
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x000022,
      transparent: true,
      opacity: this.backgroundParams.wallOpacity,
      side: THREE.BackSide,
      metalness: 0.2,
      roughness: 0.8
    });
    
    // Create the wall mesh and add to scene
    this.wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    this.scene.add(this.wallMesh);
    
    // Create additional planes for more dynamic effects
    const planeSize = wallSize * 0.9;
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    
    // Create four planes to serve as accent walls
    this.accentWalls = [];
    const positions = [
      [0, 0, -wallSize/2 + 0.1], // Back wall
      [wallSize/2 - 0.1, 0, 0], // Right wall
      [-wallSize/2 + 0.1, 0, 0], // Left wall
      [0, -wallSize/2 + 0.1, 0] // Floor
    ];
    
    const rotations = [
      [0, 0, 0], // Back wall
      [0, Math.PI/2, 0], // Right wall
      [0, -Math.PI/2, 0], // Left wall
      [Math.PI/2, 0, 0] // Floor
    ];
    
    const colors = [
      0x000440, // Back - blue
      0x002200, // Right - green
      0x440022, // Left - purple
      0x002244  // Floor - cyan
    ];
    
    for (let i = 0; i < positions.length; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: colors[i],
        transparent: true,
        opacity: this.backgroundParams.wallOpacity * 0.7,
        side: THREE.FrontSide,
        metalness: 0.3,
        roughness: 0.7,
        emissive: new THREE.Color(colors[i]).multiplyScalar(0.2)
      });
      
      const plane = new THREE.Mesh(planeGeometry, material);
      plane.position.set(...positions[i]);
      plane.rotation.set(...rotations[i]);
      
      this.scene.add(plane);
      this.accentWalls.push({
        mesh: plane,
        baseColor: new THREE.Color(colors[i]),
        material
      });
    }
  }
  
  /**
   * Create colored orbs that will fly around according to music patterns
   */
  createOrbs() {
    // Clear existing orbs
    if (this.orbs) {
      this.orbs.forEach(orb => {
        if (orb.mesh) {
          this.scene.remove(orb.mesh);
        }
        if (orb.trailGroup) {
          this.scene.remove(orb.trailGroup);
        }
      });
    }
    
    this.orbs = [];
    
    // Define some vibrant colors for the orbs
    const orbColors = [
      0xff3366, // Pink
      0x33aaff, // Blue
      0x33ff66, // Green
      0xffaa33, // Orange
      0xaa33ff, // Purple
      0xffff33, // Yellow
      0xff3333, // Red
      0x33ffff  // Cyan
    ];
    
    // Create orbiting spheres with trails
    for (let i = 0; i < this.orbParams.count; i++) {
      // Calculate a random orbit
      const orbitRadius = 3 + Math.random() * 3; // Distance from center
      const orbitHeight = Math.random() * 2 - 1; // Y position variance
      const orbitSpeed = 0.2 + Math.random() * 0.4; // Rotation speed
      const orbitDirection = Math.random() > 0.5 ? 1 : -1; // Direction
      const orbitTilt = Math.random() * Math.PI; // Tilt of orbit
      const orbitPhase = Math.random() * Math.PI * 2; // Starting position
      
      // Pick a random size
      const sizeRange = this.orbParams.maxSize - this.orbParams.minSize;
      const size = this.orbParams.minSize + Math.random() * sizeRange;
      
      // Select a random color
      const colorIndex = Math.floor(Math.random() * orbColors.length);
      const color = new THREE.Color(orbColors[colorIndex]);
      
      // Create material for the orb - much more glowing
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color.clone(), // Full emissive color for more glow
        emissiveIntensity: 1.5, // Stronger glow
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8
      });
      
      // Create the orb mesh
      const mesh = new THREE.Mesh(this.orbGeometry, material);
      mesh.scale.set(size, size, size);
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      
      // Initial position on the orbit
      const angle = orbitPhase;
      mesh.position.x = Math.cos(angle) * orbitRadius;
      mesh.position.y = orbitHeight;
      mesh.position.z = Math.sin(angle) * orbitRadius;
      
      // Create a group for trail segments
      const trailGroup = new THREE.Group();
      this.scene.add(trailGroup);
      
      // Create initial trail segments
      const trailSegments = [];
      for (let j = 0; j < this.orbParams.trailLength; j++) {
        const trailMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.6 * (1 - j / this.orbParams.trailLength)
        });
        
        const trailMesh = new THREE.Mesh(this.orbGeometry, trailMaterial);
        const trailSize = size * (1 - j * 0.15 / this.orbParams.trailLength);
        trailMesh.scale.set(trailSize, trailSize, trailSize);
        trailMesh.position.copy(mesh.position);
        
        trailGroup.add(trailMesh);
        trailSegments.push({
          mesh: trailMesh,
          material: trailMaterial
        });
      }
      
      // Add the orb to the scene
      this.scene.add(mesh);
      
      // Store the orb data
      this.orbs.push({
        mesh,
        color,
        material,
        orbit: {
          radius: orbitRadius,
          height: orbitHeight,
          speed: orbitSpeed,
          direction: orbitDirection,
          tilt: orbitTilt,
          phase: orbitPhase
        },
        light: null, // Will be assigned later for some orbs
        size,
        trailGroup,
        trailSegments,
        isActive: true,
        beatMultiplier: 1.0,
        lastPos: mesh.position.clone(),
        flyingOffScreen: false,
        flyingDirection: new THREE.Vector3(),
        createdAt: Date.now(),
        lifetime: 5000 + Math.random() * 5000, // Random lifetime between 5-10 seconds
        patternChangeReaction: Math.random() > 0.5 // Some orbs react to pattern changes
      });
    }
  }
  
  /**
   * Update the orbs position and appearance based on audio
   */
  /**
   * Create a new orb at a given position
   */
  createNewOrb(position) {
    // Select a random color
    const orbColors = [
      0xff3366, // Pink
      0x33aaff, // Blue
      0x33ff66, // Green
      0xffaa33, // Orange
      0xaa33ff, // Purple
      0xffff33, // Yellow
      0xff3333, // Red
      0x33ffff  // Cyan
    ];
    const colorIndex = Math.floor(Math.random() * orbColors.length);
    const color = new THREE.Color(orbColors[colorIndex]);
    
    // Random size
    const sizeRange = this.orbParams.maxSize - this.orbParams.minSize;
    const size = this.orbParams.minSize + Math.random() * sizeRange;
    
    // Create glowing material
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color.clone(),
      emissiveIntensity: 1.5,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    // Create the mesh
    const mesh = new THREE.Mesh(this.orbGeometry, material);
    mesh.scale.set(size, size, size);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    
    // Set position
    mesh.position.copy(position || new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ));
    
    // Create trail group
    const trailGroup = new THREE.Group();
    this.scene.add(trailGroup);
    
    // Create trail segments
    const trailSegments = [];
    for (let j = 0; j < this.orbParams.trailLength; j++) {
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6 * (1 - j / this.orbParams.trailLength)
      });
      
      const trailMesh = new THREE.Mesh(this.orbGeometry, trailMaterial);
      const trailSize = size * (1 - j * 0.15 / this.orbParams.trailLength);
      trailMesh.scale.set(trailSize, trailSize, trailSize);
      trailMesh.position.copy(mesh.position);
      
      trailGroup.add(trailMesh);
      trailSegments.push({
        mesh: trailMesh,
        material: trailMaterial
      });
    }
    
    // Add to scene
    this.scene.add(mesh);
    
    // Calculate a random orbital path for the new orb
    const orbit = {
      radius: 3 + Math.random() * 3,
      height: Math.random() * 2 - 1,
      speed: 0.2 + Math.random() * 0.4,
      direction: Math.random() > 0.5 ? 1 : -1,
      tilt: Math.random() * Math.PI,
      phase: Math.random() * Math.PI * 2
    };
    
    // Add orb to collection
    this.orbs.push({
      mesh,
      color,
      material,
      orbit,
      light: null,
      size,
      trailGroup,
      trailSegments,
      isActive: true,
      beatMultiplier: 1.0,
      lastPos: mesh.position.clone(),
      flyingOffScreen: false,
      flyingDirection: new THREE.Vector3(),
      createdAt: Date.now(),
      lifetime: 5000 + Math.random() * 5000,
      patternChangeReaction: Math.random() > 0.5
    });
    
    return this.orbs[this.orbs.length - 1];
  }
  
  /**
   * Detect music pattern changes
   */
  detectPatternChange(audioData, previousAudioData) {
    if (!audioData || !previousAudioData) return false;
    
    // Check for significant changes in the frequency distribution
    const bassChange = Math.abs(audioData.bands.bass - previousAudioData.bands.bass) / 255;
    const midChange = Math.abs(audioData.bands.mid - previousAudioData.bands.mid) / 255;
    const highChange = Math.abs(audioData.bands.high - previousAudioData.bands.high) / 255;
    
    // Calculate the dominant frequency band
    const currentDominant = this.getDominantFrequency(audioData);
    const previousDominant = this.getDominantFrequency(previousAudioData);
    
    // Pattern change detected if:
    // 1. Dominant frequency band changes OR
    // 2. Large change in any frequency band
    return (
      currentDominant !== previousDominant ||
      bassChange > 0.3 ||
      midChange > 0.3 ||
      highChange > 0.3
    );
  }
  
  /**
   * Get the dominant frequency band
   */
  getDominantFrequency(audioData) {
    const { bass, mid, high } = audioData.bands;
    if (bass > mid && bass > high) return 'bass';
    if (mid > bass && mid > high) return 'mid';
    return 'high';
  }
  
  /**
   * Update the orbs position and appearance based on audio
   */
  updateOrbs(deltaTime, audioData) {
    if (!audioData || !this.orbs || this.orbs.length === 0) return;
    
    // Extract audio data
    const bassLevel = audioData.bands.bass / 255;
    const midLevel = audioData.bands.mid / 255;
    const highLevel = audioData.bands.high / 255;
    const isBeat = audioData.isBeat;
    
    // Normalized time factors
    const normalizedDeltaTime = deltaTime * 0.01;
    const time = this.animationFrame * 0.01;
    
    // Update each orb
    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];
      if (!orb.isActive) continue;
      
      // Store the last position for trail
      orb.lastPos.copy(orb.mesh.position);
      
      // Update orbit based on music
      const orbit = orb.orbit;
      
      // If orb is flying off screen, handle differently
      if (orb.flyingOffScreen) {
        // Continue flying in its direction
        const movementSpeed = 0.05 * deltaTime;
        orb.mesh.position.add(orb.flyingDirection.clone().multiplyScalar(movementSpeed));
        
        // Update trail
        for (let j = orb.trailSegments.length - 1; j > 0; j--) {
          orb.trailSegments[j].mesh.position.copy(orb.trailSegments[j-1].mesh.position);
        }
        if (orb.trailSegments.length > 0) {
          orb.trailSegments[0].mesh.position.copy(orb.lastPos);
        }
        orb.lastPos.copy(orb.mesh.position);
        
        // Check if it's far enough to remove
        if (
          Math.abs(orb.mesh.position.x) > this.orbParams.offscreenDistance ||
          Math.abs(orb.mesh.position.y) > this.orbParams.offscreenDistance ||
          Math.abs(orb.mesh.position.z) > this.orbParams.offscreenDistance
        ) {
          // Replace this orb with a new one in a different position
          this.removeOrb(i);
          this.createNewOrb();
          continue; // Skip to next orb
        }
        
        // Skip normal orbit calculation
        continue;
      }
      
      // Check if orb should expire based on lifetime
      const orbAge = Date.now() - orb.createdAt;
      if (orbAge > orb.lifetime) {
        // Make it fly off screen in a random direction
        orb.flyingOffScreen = true;
        orb.flyingDirection = new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize();
        continue; // Skip to next iteration
      }
      
      // Check for pattern changes that would make some orbs fly off
      if (this.lastAudioData && orb.patternChangeReaction) {
        const isPatternChange = this.detectPatternChange(audioData, this.lastAudioData);
        if (isPatternChange && Math.random() < 0.3) { // 30% chance to react
          // Make this orb fly off in the direction it was heading
          orb.flyingOffScreen = true;
          const direction = new THREE.Vector3();
          direction.subVectors(orb.mesh.position, new THREE.Vector3(0, 0, 0)).normalize();
          orb.flyingDirection = direction;
          continue;
        }
      }
      
      // Regular orbit behavior for active orbs
      // Calculate audio-reactive speed
      let speed = orbit.speed;
      if (i % 3 === 0) { // Some orbs react to bass
        speed *= (1 + bassLevel * 2.0); // Increased reactivity
      } else if (i % 3 === 1) { // Some to mids
        speed *= (1 + midLevel * 1.5); // Increased reactivity
      } else { // Some to highs
        speed *= (1 + highLevel * 1.2); // Increased reactivity
      }
      
      // Apply beat multiplier with more dramatic effect
      speed *= orb.beatMultiplier;
      
      // Create new orbs on strong beats
      if (isBeat && bassLevel > 0.7 && Math.random() < 0.3 && this.orbs.length < 30) {
        const newOrb = this.createNewOrb(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          )
        );
      }
      
      // Calculate new position on orbit
      const angle = orbit.phase + time * speed * orbit.direction;
      const x = Math.cos(angle) * orbit.radius;
      const z = Math.sin(angle) * orbit.radius;
      
      // Apply orbit tilt and height
      const tiltX = Math.cos(orbit.tilt) * x - Math.sin(orbit.tilt) * z;
      const tiltZ = Math.sin(orbit.tilt) * x + Math.cos(orbit.tilt) * z;
      
      // Add subtle audio-reactive motion
      let audioReactiveHeight = orbit.height;
      if (i % 2 === 0) {
        audioReactiveHeight += Math.sin(time * 2) * 0.2 * midLevel;
      } else {
        audioReactiveHeight += Math.cos(time * 3) * 0.15 * highLevel;
      }
      
      // Update position
      orb.mesh.position.set(tiltX, audioReactiveHeight, tiltZ);
      
      // Scaling on beats - more dramatic pulse
      if (isBeat && Math.random() < 0.7) { // Increased chance to pulse
        // Scale up orb on beat
        const scaleFactor = 1.0 + bassLevel * 1.0; // Stronger pulse
        orb.mesh.scale.set(
          orb.size * scaleFactor,
          orb.size * scaleFactor,
          orb.size * scaleFactor
        );
        
        // Temporarily speed up and change direction
        orb.beatMultiplier = 2.0 + bassLevel; // More speed boost
        
        // Occasionally change direction on beat
        if (Math.random() < 0.2) {
          orbit.direction *= -1;
        }
        
        // Increase emissive intensity on beat
        orb.material.emissiveIntensity = 2.0 + bassLevel;
        
        // Reset after a short delay
        setTimeout(() => {
          orb.beatMultiplier = 1.0;
          orb.material.emissiveIntensity = 1.5;
        }, 200 + Math.random() * 300);
      } else {
        // Gradually return to normal size
        orb.mesh.scale.lerp(new THREE.Vector3(orb.size, orb.size, orb.size), 0.1);
      }
      
      // Update the orb's light if it has one
      if (orb.light) {
        orb.light.position.copy(orb.mesh.position);
        
        // Make the light pulse with music
        if (i % 3 === 0) {
          orb.light.intensity = 0.8 + bassLevel * 1.2;
        } else if (i % 3 === 1) {
          orb.light.intensity = 0.8 + midLevel * 1.0;
        } else {
          orb.light.intensity = 0.8 + highLevel * 0.8;
        }
      }
      
      // Update trail segments
      for (let j = orb.trailSegments.length - 1; j > 0; j--) {
        orb.trailSegments[j].mesh.position.copy(orb.trailSegments[j-1].mesh.position);
      }
      
      // Update first trail segment
      if (orb.trailSegments.length > 0) {
        orb.trailSegments[0].mesh.position.copy(orb.lastPos);
      }
      
      // Occasionally change colors based on audio response
      if (isBeat && Math.random() < 0.2) {
        // Create a new color - shift hue based on music
        let hue = 0;
        if (bassLevel > midLevel && bassLevel > highLevel) {
          hue = 0; // Red for bass
        } else if (midLevel > bassLevel && midLevel > highLevel) {
          hue = 0.33; // Green for mids
        } else {
          hue = 0.66; // Blue for highs
        }
        
        // Add some randomness to the hue
        hue = (hue + Math.random() * 0.2) % 1.0;
        
        // Create new color
        const newColor = new THREE.Color().setHSL(hue, 0.9, 0.6);
        
        // Update material colors
        orb.material.color.copy(newColor);
        orb.material.emissive.copy(newColor).multiplyScalar(0.5);
        
        // Update trail colors
        for (let j = 0; j < orb.trailSegments.length; j++) {
          orb.trailSegments[j].material.color.copy(newColor);
        }
        
        // Update light color if present
        if (orb.light) {
          orb.light.color.copy(newColor);
        }
      }
    }
  }
  
  /**
   * Update the background walls based on audio
   */
  updateBackground(deltaTime, audioData) {
    if (!audioData) return;
    
    // Extract audio data
    const bassLevel = audioData.bands.bass / 255;
    const midLevel = audioData.bands.mid / 255;
    const highLevel = audioData.bands.high / 255;
    const isBeat = audioData.isBeat;
    
    // Update main wall color based on audio
    if (this.wallMesh && this.wallMesh.material) {
      // Determine target color based on dominant frequency
      const maxBand = Math.max(bassLevel, midLevel, highLevel);
      let targetColor;
      
      if (bassLevel === maxBand) {
        // Deep blue to purple for bass
        targetColor = new THREE.Color(0x1a0033);
      } else if (midLevel === maxBand) {
        // Teal/green for mids
        targetColor = new THREE.Color(0x003322);
      } else {
        // Dark blue for highs
        targetColor = new THREE.Color(0x001133);
      }
      
      // Smoothly transition the current color to the target
      this.backgroundParams.currentColor.lerp(
        targetColor, 
        this.backgroundParams.transitionSpeed * deltaTime
      );
      
      // Update the wall material color
      this.wallMesh.material.color.copy(this.backgroundParams.currentColor);
    }
    
    // Update accent walls
    if (this.accentWalls) {
      this.accentWalls.forEach((wall, i) => {
        // Make each wall respond to a different frequency band
        let intensity = 0;
        
        switch (i % 4) {
          case 0: // Back wall - bass
            intensity = bassLevel;
            if (isBeat) {
              // Pulse on beat
              wall.material.opacity = Math.min(0.3 + bassLevel * 0.5, 0.8);
              wall.material.emissiveIntensity = 0.3 + bassLevel * 0.7;
            } else {
              // Normal state
              wall.material.opacity = this.backgroundParams.wallOpacity * 0.7;
              wall.material.emissiveIntensity = 0.1 + bassLevel * 0.3;
            }
            break;
            
          case 1: // Right wall - mids
            intensity = midLevel;
            // Constant subtle pulsing
            wall.material.opacity = this.backgroundParams.wallOpacity * 0.7 * 
              (1 + midLevel * 0.5 * Math.sin(this.animationFrame * 0.01));
            wall.material.emissiveIntensity = 0.1 + midLevel * 0.4;
            break;
            
          case 2: // Left wall - highs
            intensity = highLevel;
            // Quick pulsing based on highs
            wall.material.opacity = this.backgroundParams.wallOpacity * 0.7 * 
              (1 + highLevel * 0.3 * Math.sin(this.animationFrame * 0.02));
            wall.material.emissiveIntensity = 0.1 + highLevel * 0.5;
            break;
            
          case 3: // Floor - all frequencies
            intensity = (bassLevel + midLevel + highLevel) / 3;
            // Floor reacts to overall level
            wall.material.opacity = this.backgroundParams.wallOpacity * 0.8 * 
              (1 + intensity * 0.6);
            wall.material.emissiveIntensity = 0.1 + intensity * 0.3;
            break;
        }
        
        // Create an enhanced color based on the original but brighter with intensity
        const enhancedColor = wall.baseColor.clone().multiplyScalar(1 + intensity * 1.5);
        wall.material.emissive.copy(enhancedColor).multiplyScalar(0.4);
        
        // Strong flash on beat for random walls
        if (isBeat && Math.random() < 0.3) {
          wall.material.emissiveIntensity = 0.8;
          setTimeout(() => {
            wall.material.emissiveIntensity = 0.1 + (i % 3 === 0 ? bassLevel : i % 3 === 1 ? midLevel : highLevel) * 0.4;
          }, 100 + Math.random() * 150);
        }
      });
    }
  }
  
  /**
   * Update particles and lights based on audio data
   */
  /**
   * Remove an orb and clean up its resources
   */
  removeOrb(index) {
    const orb = this.orbs[index];
    
    // Remove mesh
    if (orb.mesh) {
      this.scene.remove(orb.mesh);
      orb.mesh.geometry = null;
      orb.mesh.material.dispose();
    }
    
    // Remove trail
    if (orb.trailGroup) {
      orb.trailSegments.forEach(segment => {
        segment.material.dispose();
        segment.mesh.geometry = null;
      });
      this.scene.remove(orb.trailGroup);
    }
    
    // Remove light if present
    if (orb.light) {
      this.scene.remove(orb.light);
      
      // Also remove from orbLights array
      const lightIndex = this.orbLights.indexOf(orb.light);
      if (lightIndex !== -1) {
        this.orbLights.splice(lightIndex, 1);
      }
    }
    
    // Remove from orbs array
    this.orbs.splice(index, 1);
  }
  
  /**
   * Update particles and lights based on audio data
   */
  updateParticlesAndLights(deltaTime, audioData) {
    if (!audioData) return;
    
    // Extract audio data
    const bassLevel = audioData.bands.bass / 255;
    const midLevel = audioData.bands.mid / 255;
    const highLevel = audioData.bands.high / 255;
    const isBeat = audioData.isBeat;
    
    // Track the global timeline
    const normalizedDeltaTime = deltaTime * 0.01;
    const time = this.animationFrame * 0.01;
    
    // Store audio data for pattern change detection
    this.lastAudioData = {...audioData};
    
    // Update colored orbs
    this.updateOrbs(deltaTime, audioData);
    
    // Update background walls
    this.updateBackground(deltaTime, audioData);
    
    // Group rotation based on mid frequencies
    if (this.particleGroup) {
      this.particleGroup.rotation.y += normalizedDeltaTime * 0.05 * (1 + midLevel);
      this.particleGroup.rotation.x += normalizedDeltaTime * 0.03 * (1 + highLevel * 0.5);
    }
    
    // Update center light intensity and color based on audio
    if (this.centerLight) {
      // Base intensity on bass with pulsing effect
      const pulseEffect = isBeat ? 3.0 : 1.0;
      this.centerLight.intensity = (1.5 + bassLevel * 4.0) * pulseEffect;
      
      // Keep light white to match the image's monochrome aesthetic
      this.centerLight.color.setRGB(1.0, 1.0, 1.0);
    }
    
    // Animate accent lights
    for (let i = 1; i < this.pointLights.length; i++) {
      const light = this.pointLights[i];
      
      // Adjust light's position in a circular path
      const speed = 0.2 + (i * 0.1) + (midLevel * 0.3);
      const angle = time * speed + (i * Math.PI * 2 / 3);
      const radius = 3 + Math.sin(time * 0.3) * 0.5 + (bassLevel * 2.0);
      
      light.position.x = Math.cos(angle) * radius;
      light.position.y = Math.sin(angle) * radius;
      light.position.z = 2 + Math.sin(time * 0.5 + i) * (1 + highLevel);
      
      // Adjust intensity based on audio
      light.intensity = 0.8 + Math.sin(time * 2 + i) * 0.2 + (audioData.bands.midLow / 255) * 1.5;
      
      // Flickering lights on beats
      if (isBeat && Math.random() < 0.3) {
        light.intensity *= 2;
      }
    }
    
    // Directional light animation
    if (this.directionalLight) {
      const angle = time * 0.1;
      this.directionalLight.position.x = Math.cos(angle) * 5;
      this.directionalLight.position.z = Math.sin(angle) * 5;
      this.directionalLight.intensity = 0.8 + midLevel * 0.7;
    }
    
    // Update each particle
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const { mesh, originalPosition, originalScale, phase, speed, isHighlight } = particle;
      
      // Calculate beat-responsive pulse factor
      let pulseFactor = 1.0;
      if (isBeat) {
        // Stronger pulse on beat
        pulseFactor = isHighlight ? 1.4 : 1.2;
      }
      
      // Audio-reactive scaling
      let scaleFactor = 1.0;
      if (isHighlight) {
        // Highlight particles react strongly to bass
        scaleFactor = 1.0 + bassLevel * 1.5 * pulseFactor;
      } else if (i % 5 === 0) {
        // Some particles react to mids
        scaleFactor = 1.0 + midLevel * 0.8 * pulseFactor;
      } else if (i % 7 === 0) {
        // Some particles react to highs
        scaleFactor = 1.0 + highLevel * 0.6 * pulseFactor;
      } else {
        // Default subtle animation
        scaleFactor = 1.0 + Math.sin(time * speed + phase) * 0.1;
      }
      
      // Apply scale
      const targetScale = originalScale * scaleFactor;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      // Position variation based on audio
      const posNoise = new THREE.Vector3(
        Math.sin(time * speed + phase) * 0.05,
        Math.cos(time * speed + phase * 1.3) * 0.05,
        Math.sin(time * speed + phase * 0.7) * 0.05
      );
      
      // Apply audio-reactive direction to movement
      if (bassLevel > 0.7) {
        // Push particles outward on strong bass
        const dir = originalPosition.clone().normalize();
        posNoise.add(dir.multiplyScalar(bassLevel * 0.2));
      }
      
      if (midLevel > 0.7 && i % 3 === 0) {
        // Circular movement for some particles on mid frequencies
        const angle = time * 2 + i;
        posNoise.x += Math.cos(angle) * midLevel * 0.1;
        posNoise.y += Math.sin(angle) * midLevel * 0.1;
      }
      
      // Calculate target position
      const targetPos = originalPosition.clone().add(posNoise);
      
      // Move toward target with smoothing
      mesh.position.lerp(targetPos, 0.1);
      
      // Update material properties
      if (mesh.material) {
        // Increase emissive on beat for highlight particles
        if (isHighlight && isBeat) {
          mesh.material.emissive.setRGB(0.8, 0.8, 0.8);
          mesh.material.emissiveIntensity = 0.5 + bassLevel * 0.5;
        } else if (isHighlight) {
          // Normal emissive glow for highlight particles
          mesh.material.emissive.setRGB(0.5, 0.5, 0.5);
          mesh.material.emissiveIntensity = 0.2 + bassLevel * 0.3;
        }
        
        // Adjust metalness and roughness based on audio
        if (i % 4 === 0) {
          mesh.material.metalness = 0.8 + highLevel * 0.2;
          mesh.material.roughness = 0.1 - highLevel * 0.1;
        }
        
        // Turn on/off particles based on beats and audio energy
        if (Math.random() < 0.01 * (bassLevel + midLevel)) {
          if (bassLevel > 0.8 && Math.random() < 0.3) {
            // Some particles flash brighter on high bass
            mesh.material.opacity = 1.0;
            mesh.material.emissiveIntensity = 0.8;
            
            // Return to normal gradually
            setTimeout(() => {
              mesh.material.opacity = 0.9;
              if (!isHighlight) {
                mesh.material.emissiveIntensity = 0;
              } else {
                mesh.material.emissiveIntensity = 0.2;
              }
            }, 50 + Math.random() * 150);
          }
        }
      }
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
   * Set up the visualization when dimensions change
   */
  setup(ctx, dimensions) {
    super.setup(ctx, dimensions);
    
    // Initialize or update Three.js rendering
    if (!this.threeRenderer) {
      this.setupThreeJs();
    } else {
      // Update size if renderer already exists
      this.threeRenderer.setSize(dimensions.width, dimensions.height);
      
      // Update camera aspect ratio
      this.camera.aspect = dimensions.width / dimensions.height;
      this.camera.updateProjectionMatrix();
    }
  }
  
  /**
   * Update visualization state
   */
  updateElements(deltaTime, audioData, qualitySettings) {
    // Update 3D particles and lighting based on audio
    this.updateParticlesAndLights(deltaTime, audioData);
    
    // Update animation time
    this.animationFrame += deltaTime;
  }
  
  /**
   * Draw the background
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    const { width, height } = dimensions;
    
    // Pure black background for the 3D scene
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
  }
  
  /**
   * Draw the main visualization elements (render Three.js scene)
   */
  drawElements(ctx, dimensions, audioData, qualitySettings) {
    if (!this.threeRenderer || !this.scene || !this.camera) return;
    
    // Apply quality settings
    if (qualitySettings) {
      // Adjust shadow quality based on settings
      if (qualitySettings.effects === 'enhanced') {
        this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        for (const light of this.pointLights) {
          light.shadow.mapSize.width = 1024;
          light.shadow.mapSize.height = 1024;
        }
      } else if (qualitySettings.effects === 'minimal') {
        this.threeRenderer.shadowMap.type = THREE.BasicShadowMap;
        for (const light of this.pointLights) {
          light.shadow.mapSize.width = 256;
          light.shadow.mapSize.height = 256;
        }
      }
    }
    
    // Update cube camera for environment reflections (once every few frames)
    if (this.animationFrame % 10 === 0 && this.cubeCamera) {
      // Hide the particle group temporarily to capture environment
      this.particleGroup.visible = false;
      this.cubeCamera.update(this.threeRenderer, this.scene);
      this.particleGroup.visible = true;
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
   */
  dispose() {
    super.dispose();
    
    // Dispose Three.js resources
    if (this.particleGroup) {
      // Dispose all particle meshes
      this.particleGroup.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      this.scene.remove(this.particleGroup);
    }
    
    // Clean up orbs and their trails
    if (this.orbs) {
      this.orbs.forEach(orb => {
        if (orb.mesh) {
          this.scene.remove(orb.mesh);
          orb.mesh.geometry.dispose();
          orb.mesh.material.dispose();
        }
        if (orb.trailGroup) {
          orb.trailSegments.forEach(segment => {
            segment.mesh.geometry.dispose();
            segment.material.dispose();
          });
          this.scene.remove(orb.trailGroup);
        }
        if (orb.light) {
          this.scene.remove(orb.light);
        }
      });
    }
    
    // Clean up walls
    if (this.wallMesh) {
      this.scene.remove(this.wallMesh);
      this.wallMesh.geometry.dispose();
      this.wallMesh.material.dispose();
    }
    
    if (this.accentWalls) {
      this.accentWalls.forEach(wall => {
        this.scene.remove(wall.mesh);
        wall.mesh.geometry.dispose();
        wall.material.dispose();
      });
    }
    
    // Clean up lights
    if (this.pointLights) {
      this.pointLights.forEach(light => {
        this.scene.remove(light);
      });
    }
    
    if (this.cubeCamera) {
      this.cubeCamera.renderTarget.dispose();
    }
    
    if (this.sphereGeometry) {
      this.sphereGeometry.dispose();
    }
    
    if (this.orbGeometry) {
      this.orbGeometry.dispose();
    }
    
    // Dispose materials
    if (this.materials) {
      Object.values(this.materials).forEach(material => {
        material.dispose();
      });
    }
    
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
    }
    
    // Clear references
    this.threeRenderer = null;
    this.scene = null;
    this.camera = null;
    this.particles = [];
    this.particleGroup = null;
    this.pointLights = [];
    this.orbs = [];
    this.orbLights = [];
    this.accentWalls = [];
    this.wallMesh = null;
  }
}

export default FractalVisualization;
