/**
 * Galaxy Visualization
 * A flowing and dynamic visualization of galaxies using Three.js
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import BaseVisualization from './BaseVisualization';

// Custom shader for chromatic aberration effect
const ChromaticAberrationShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'resolution': { value: new THREE.Vector2(1, 1) },
    'power': { value: 0.05 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float power;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 direction = normalize(uv - center);
      float distance = length(uv - center);
      
      vec2 distortion = direction * power * distance;
      
      vec4 r = texture2D(tDiffuse, uv - distortion);
      vec4 g = texture2D(tDiffuse, uv);
      vec4 b = texture2D(tDiffuse, uv + distortion);
      
      gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
    }
  `
};

class GalaxyVisualization extends BaseVisualization {
  constructor(options = {}) {
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
    
    // Audio reactive properties
    this.rotationSpeed = 0.001;
    this.pulseStrength = 0;
    this.colorShiftFactor = 0;
    this.emissionIntensity = 0;
    
    // Camera animation
    this.cameraAnimation = {
      targetPosition: new THREE.Vector3(0, 0, 25),
      currentSpeed: new THREE.Vector3(0, 0, 0),
      maxSpeed: 0.05,
      damping: 0.95,
      lastUpdate: 0
    };
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
      const aspectRatio = dimensions.width / dimensions.height;
      this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
      this.camera.position.z = 25;
      
      // Initialize renderer
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
      });
      this.renderer.setSize(dimensions.width, dimensions.height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      
      // Initialize post-processing
      this.setupPostProcessing(dimensions);
      
      // Create galaxy scene
      this.createGalaxyScene();
    } else {
      // Just update dimensions if scene already exists
      this.renderer.setSize(dimensions.width, dimensions.height);
      this.camera.aspect = dimensions.width / dimensions.height;
      this.camera.updateProjectionMatrix();
      
      // Update post-processing
      this.composer.setSize(dimensions.width, dimensions.height);
    }
  }
  
  /**
   * Set up post-processing effects
   * @param {Object} dimensions - Canvas dimensions {width, height}
   */
  setupPostProcessing(dimensions) {
    // Create composer
    this.composer = new EffectComposer(this.renderer);
    
    // Add base render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Add bloom pass for glow effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(dimensions.width, dimensions.height),
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.composer.addPass(bloomPass);
    
    // Add chromatic aberration
    const chromaticAberration = new ShaderPass(ChromaticAberrationShader);
    chromaticAberration.uniforms.resolution.value.set(dimensions.width, dimensions.height);
    this.composer.addPass(chromaticAberration);
    
    // Store references for animation updates
    this.bloomPass = bloomPass;
    this.chromaticPass = chromaticAberration;
  }
  
  /**
   * Create the galaxy scene with all elements
   */
  createGalaxyScene() {
    this.createBackgroundStars();
    this.createGalaxyCore();
    this.createGalacticArms();
    this.createNebulaEffects();
    this.createDustClouds();
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333355);
    this.scene.add(ambientLight);
    
    // Add point lights
    const galaxyLight = new THREE.PointLight(0x7080ff, 5, 50);
    galaxyLight.position.set(2, 1, 15);
    this.scene.add(galaxyLight);
    
    const accentLight = new THREE.PointLight(0xff8080, 3, 30);
    accentLight.position.set(-5, -3, 10);
    this.scene.add(accentLight);
  }
  
  /**
   * Create background star field
   */
  createBackgroundStars() {
    const starCount = 2000;
    const starField = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      // Position stars in a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const distance = 50 + Math.random() * 150;
      
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);
      
      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;
      
      // Random sizes
      starSizes[i] = 0.5 + Math.random();
      
      // Star colors - mostly white/blue but some warmer stars
      const colorType = Math.random();
      if (colorType > 0.9) {
        // Yellow/red stars
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
        starColors[i * 3 + 2] = 0.6 + Math.random() * 0.2;
      } else if (colorType > 0.7) {
        // Blue stars
        starColors[i * 3] = 0.6 + Math.random() * 0.2;
        starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
        starColors[i * 3 + 2] = 1.0;
      } else {
        // White/slightly blue stars
        starColors[i * 3] = 0.8 + Math.random() * 0.2;
        starColors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        starColors[i * 3 + 2] = 1.0;
      }
    }
    
    starField.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starField.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starField.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    // Star material with custom shader
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioIntensity: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        uniform float time;
        uniform float audioIntensity;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          // Calculate twinkle effect
          float twinkle = sin(time * 2.0 + position.x * 10.0) * 0.5 + 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float sizeModifier = size * (1.0 + twinkle * 0.5 + audioIntensity * 0.5);
          gl_PointSize = sizeModifier * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Create a circular point
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.2, dist);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });
    
    // Create the star field
    this.backgroundStars = new THREE.Points(starField, starMaterial);
    this.scene.add(this.backgroundStars);
  }
  
  /**
   * Create the central galaxy core
   */
  createGalaxyCore() {
    // Create the central bright core
    const coreGeometry = new THREE.SphereGeometry(3, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x8090ff,
      emissive: 0x5060af,
      specular: 0xffffff,
      shininess: 10,
      transparent: true,
      opacity: 0.7
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.scene.add(core);
    
    // Add core glow
    const coreGlowGeometry = new THREE.SphereGeometry(4, 32, 32);
    const coreGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        color: { value: new THREE.Color(0x4060ff) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 color;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Fresnel effect for edge glow
          vec3 viewDir = normalize(vPosition - cameraPosition);
          float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
          
          // Pulsating glow
          float pulse = (sin(time * 1.5) * 0.5 + 0.5) * 0.3 + 0.7;
          
          vec3 finalColor = color * fresnel * pulse * intensity;
          gl_FragColor = vec4(finalColor, fresnel * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    
    const coreGlow = new THREE.Mesh(coreGlowGeometry, coreGlowMaterial);
    this.scene.add(coreGlow);
    
    // Store references
    this.galaxyCore = core;
    this.galaxyCoreGlow = coreGlow;
  }
  
  /**
   * Create the spiral arms of the galaxy
   */
  createGalacticArms() {
    const armCount = 3;
    const particlesPerArm = 2000;
    
    // Create a group to hold all galaxy particles
    this.galaxyGroup = new THREE.Group();
    this.scene.add(this.galaxyGroup);
    
    for (let armIndex = 0; armIndex < armCount; armIndex++) {
      // Calculate arm properties
      const armAngleOffset = (armIndex * Math.PI * 2) / armCount;
      const armRotationFactor = 0.5 + Math.random() * 0.5; // Slight randomness in arm rotation
      
      const armGeometry = new THREE.BufferGeometry();
      const armPositions = new Float32Array(particlesPerArm * 3);
      const armColors = new Float32Array(particlesPerArm * 3);
      const armSizes = new Float32Array(particlesPerArm);
      const armData = new Float32Array(particlesPerArm * 2); // For custom data (radius, angle)
      
      for (let i = 0; i < particlesPerArm; i++) {
        // Calculate particle position in spiral pattern
        const radiusBase = 3 + Math.pow(Math.random(), 0.5) * 15; // More particles closer to center
        const armWidth = 0.6 + (radiusBase / 15) * 2.5;
        const radiusVariation = (Math.random() - 0.5) * armWidth;
        const radius = radiusBase + radiusVariation;
        
        // Spiral equation: r = a + bθ (logarithmic spiral)
        // Angle depends on distance from center
        const revolutions = 1.5; // How many times spiral revolves
        const angle = armAngleOffset + (radius * 0.2 * armRotationFactor * revolutions);
        
        // Convert polar to cartesian coordinates
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Add some particles above/below the galactic plane
        const zScaleFactor = 0.2; // How "thick" the galaxy is
        const zVariation = Math.random() * Math.random(); // Squared distribution for more central thickness
        const z = (Math.random() - 0.5) * armWidth * zScaleFactor * (1 - Math.pow(radius/20, 0.5));
        
        // Store position
        armPositions[i * 3] = x;
        armPositions[i * 3 + 1] = y;
        armPositions[i * 3 + 2] = z;
        
        // Store radius and angle for animation
        armData[i * 2] = radius;
        armData[i * 2 + 1] = angle;
        
        // Particle size - larger near center
        armSizes[i] = 0.3 + (1 - radius / 20) * 1.2 + Math.random() * 0.3;
        
        // Particle color - transitions from blue-white in center to reddish at edges
        // with some variation
        const colorPos = radius / 20; // 0 at center, 1 at edge
        const colorVariation = Math.random() * 0.2;
        
        if (colorPos < 0.3) {
          // Center - blue-white
          armColors[i * 3] = 0.8 + colorVariation * 0.2;
          armColors[i * 3 + 1] = 0.9 + colorVariation * 0.1;
          armColors[i * 3 + 2] = 1.0;
        } else if (colorPos < 0.7) {
          // Mid - light blue to yellow transition
          const t = (colorPos - 0.3) / 0.4; // 0 to 1 in this range
          armColors[i * 3] = 0.8 + t * 0.2 + colorVariation * 0.2;
          armColors[i * 3 + 1] = 0.9 - t * 0.2 + colorVariation * 0.1;
          armColors[i * 3 + 2] = 1.0 - t * 0.4;
        } else {
          // Outer - yellow to reddish
          const t = (colorPos - 0.7) / 0.3; // 0 to 1 in this range
          armColors[i * 3] = 1.0;
          armColors[i * 3 + 1] = 0.7 - t * 0.5 + colorVariation * 0.2;
          armColors[i * 3 + 2] = 0.6 - t * 0.4 + colorVariation * 0.1;
        }
      }
      
      armGeometry.setAttribute('position', new THREE.BufferAttribute(armPositions, 3));
      armGeometry.setAttribute('customData', new THREE.BufferAttribute(armData, 2));
      armGeometry.setAttribute('color', new THREE.BufferAttribute(armColors, 3));
      armGeometry.setAttribute('size', new THREE.BufferAttribute(armSizes, 1));
      
      // Custom shader material for galaxy particles
      const armMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseRotationSpeed: { value: 0.5 },
          pulseStrength: { value: 0 },
          colorShift: { value: 0 }
        },
        vertexShader: `
          attribute vec2 customData;
          attribute float size;
          attribute vec3 color;
          
          uniform float time;
          uniform float baseRotationSpeed;
          uniform float pulseStrength;
          uniform float colorShift;
          
          varying vec3 vColor;
          varying float vAlpha;
          
          void main() {
            // Extract radius and base angle
            float radius = customData.x;
            float baseAngle = customData.y;
            
            // Calculate rotation speed (inner particles rotate faster)
            float rotationSpeed = baseRotationSpeed * (1.0 - pow(radius/25.0, 0.5));
            
            // Calculate new angle with time-based rotation
            float angle = baseAngle + time * rotationSpeed;
            
            // Recalculate position with new angle (maintaining z-height)
            float x = cos(angle) * radius;
            float y = sin(angle) * radius;
            float z = position.z;
            
            // Position with slight pulsation
            float pulseFactor = sin(time * 2.0 + radius * 0.2) * pulseStrength;
            vec3 newPosition = vec3(
              x * (1.0 + pulseFactor * 0.05),
              y * (1.0 + pulseFactor * 0.05),
              z
            );
            
            // Pass to fragment shader
            vColor = color;
            
            // Color shift effect based on position and audio
            if (colorShift > 0.0) {
              float shift = colorShift * sin(radius * 0.2 + time);
              vColor.r = color.r + shift * 0.1;
              vColor.g = color.g + shift * 0.05;
              vColor.b = color.b - shift * 0.1;
            }
            
            // Alpha based on radius (fade out at very edge)
            vAlpha = 1.0 - smoothstep(15.0, 20.0, radius);
            
            // Calculate final position and size
            vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;
          
          void main() {
            // Create a circular point with soft edge
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
            
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false
      });
      
      // Create points and add to scene
      const armPoints = new THREE.Points(armGeometry, armMaterial);
      this.galaxyGroup.add(armPoints);
      
      // Store reference
      this.galaxyParticles.push({
        points: armPoints,
        material: armMaterial,
        armIndex
      });
    }
  }
  
  /**
   * Create nebula-like effects around the galaxy
   */
  createNebulaEffects() {
    const nebulaCount = 4;
    
    for (let i = 0; i < nebulaCount; i++) {
      // Create a group for this nebula
      const nebulaGroup = new THREE.Group();
      
      // Position the nebula randomly around the galaxy
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 10;
      nebulaGroup.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        (Math.random() - 0.5) * 8
      );
      
      // Random rotation
      nebulaGroup.rotation.x = Math.random() * Math.PI;
      nebulaGroup.rotation.y = Math.random() * Math.PI;
      nebulaGroup.rotation.z = Math.random() * Math.PI;
      
      // Random scale
      const scale = 2 + Math.random() * 3;
      nebulaGroup.scale.set(scale, scale, scale * 0.5);
      
      // Choose a random color for this nebula
      const colorOptions = [
        new THREE.Color(0x3050ff), // Blue
        new THREE.Color(0xff5050), // Red
        new THREE.Color(0x50ff80), // Green
        new THREE.Color(0xd050ff)  // Purple
      ];
      const nebulaColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      
      // Create nebula material with custom shader
      const nebulaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: nebulaColor },
          intensity: { value: 0.5 + Math.random() * 0.5 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          uniform float intensity;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          
          // Simplex noise function
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
          
          float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
            // First corner
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            
            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            
            // Permutations
            i = mod289(i);
            vec4 p = permute(permute(permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    
            // Gradients
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            
            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
          }
          
          void main() {
            // Calculate position-based noise
            vec3 noisePos = vPosition * 0.5;
            noisePos.x += time * 0.1;
            noisePos.y += time * 0.08;
            
            float noise1 = snoise(noisePos);
            float noise2 = snoise(noisePos * 2.0 + vec3(100.0));
            
            // Combine noise patterns
            float combinedNoise = noise1 * 0.6 + noise2 * 0.4;
            
            // Soften the edges
            float edgeFade = length(vUv - 0.5) * 2.0;
            edgeFade = smoothstep(0.0, 1.0, 1.0 - edgeFade);
            
            // Create cloud-like density variations
            float alpha = smoothstep(0.0, 0.7, combinedNoise) * edgeFade * intensity;
            
            // More intense in the center
            float centerIntensity = 1.0 - length(vUv - 0.5) * 1.5;
            centerIntensity = max(0.0, centerIntensity);
            
            // Pulsing effect
            float pulse = sin(time * 0.5) * 0.1 + 0.9;
            
            gl_FragColor = vec4(color * (0.4 + centerIntensity), alpha * pulse);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      // Create a plane for the nebula
      const nebulaGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
      const nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      nebulaGroup.add(nebulaMesh);
      
      // Add a few more planes with random orientations for volumetric effect
      for (let j = 0; j < 3; j++) {
        const planeMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        planeMesh.rotation.x = Math.random() * Math.PI;
        planeMesh.rotation.y = Math.random() * Math.PI;
        planeMesh.rotation.z = Math.random() * Math.PI;
        nebulaGroup.add(planeMesh);
      }
      
      // Add to scene
      this.scene.add(nebulaGroup);
      
      // Store reference
      this.nebulaGroups.push({
        group: nebulaGroup,
        material: nebulaMaterial,
        baseIntensity: nebulaMaterial.uniforms.intensity.value,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.0005,
          y: (Math.random() - 0.5) * 0.0005,
          z: (Math.random() - 0.5) * 0.0005
        }
      });
    }
  }
  
  /**
   * Create dust clouds that flow through the scene
   */
  createDustClouds() {
    const dustCount = 1000;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);
    const dustData = new Float32Array(dustCount * 4); // x, y, z velocity + variant
    
    // Create dust particles with random positions and velocities
    for (let i = 0; i < dustCount; i++) {
      // Random position in a spherical volume
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 5 + Math.random() * 20;
      
      dustPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      dustPositions[i * 3 + 2] = radius * Math.cos(phi) * 0.3; // Flattened in z
      
      // Random velocities (flowing around the galaxy center)
      const distanceFromCenter = Math.sqrt(
        dustPositions[i * 3] * dustPositions[i * 3] +
        dustPositions[i * 3 + 1] * dustPositions[i * 3 + 1]
      );
      
      // Velocity tangent to the galaxy center
      const vx = -dustPositions[i * 3 + 1] / distanceFromCenter * (0.01 + Math.random() * 0.01);
      const vy = dustPositions[i * 3] / distanceFromCenter * (0.01 + Math.random() * 0.01);
      const vz = (Math.random() - 0.5) * 0.002;
      
      dustData[i * 4] = vx;
      dustData[i * 4 + 1] = vy;
      dustData[i * 4 + 2] = vz;
      dustData[i * 4 + 3] = Math.random(); // Variant for individual animation
      
      // Random sizes
      dustSizes[i] = 0.2 + Math.random() * 0.8;
    }
    
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
    dustGeometry.setAttribute('particleData', new THREE.BufferAttribute(dustData, 4));
    
    // Create dust material
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        deltaTime: { value: 0 },
        audioIntensity: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec4 particleData;
        
        uniform float time;
        uniform float deltaTime;
        uniform float audioIntensity;
        
        varying float vAlpha;
        
        void main() {
          // Extract velocity and variant
          vec3 velocity = vec3(particleData.xyz);
          float variant = particleData.w;
          
          // Update position based on velocity
          vec3 newPosition = position + velocity * 60.0 * deltaTime;
          
          // Add some swirling motion
          float swirl = sin(time * 0.5 + variant * 10.0) * 0.2;
          newPosition.x += swirl * velocity.y;
          newPosition.y -= swirl * velocity.x;
          
          // Add audio reactivity
          newPosition += velocity * audioIntensity * 2.0;
          
          // Alpha based on position - fade in distance
          float dist = length(newPosition);
          vAlpha = 1.0 - smoothstep(15.0, 25.0, dist);
          vAlpha *= 0.4 + audioIntensity * 0.2;
          
          // Calculate final position and size
          vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
          gl_PointSize = size * (100.0 / -mvPosition.z) * (1.0 + audioIntensity * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          // Soft dust particle
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
          
          gl_FragColor = vec4(0.9, 0.95, 1.0, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    this.scene.add(this.dustParticles);
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
      
      // On beat, add camera impulse
      if (isBeat && bassLevel > 0.7) {
        const cameraImpulse = 0.2 + bassLevel * 0.3;
        this.cameraAnimation.currentSpeed.z = -cameraImpulse;
      }
    }
    
    // Update animation time
    const time = this.clock.getElapsedTime();
    const frameDelta = this.clock.getDelta();
    
    // Update background stars
    if (this.backgroundStars && this.backgroundStars.material.uniforms) {
      this.backgroundStars.material.uniforms.time.value = time;
      this.backgroundStars.material.uniforms.audioIntensity.value = highLevel;
      this.backgroundStars.rotation.y += 0.0001;
      this.backgroundStars.rotation.x += 0.00005;
    }
    
    // Update galaxy core
    if (this.galaxyCoreGlow && this.galaxyCoreGlow.material.uniforms) {
      this.galaxyCoreGlow.material.uniforms.time.value = time;
      this.galaxyCoreGlow.material.uniforms.intensity.value = 1 + bassLevel * 1.5;
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
    
    // Update post-processing effects
    if (this.bloomPass) {
      this.bloomPass.strength = 1.5 + bassLevel * 1.5;
    }
    
    if (this.chromaticPass) {
      this.chromaticPass.uniforms.power.value = 0.03 + midLevel * 0.1;
    }
    
    // Update camera movement
    this.updateCamera(deltaTime);
  }
  
  /**
   * Update camera position with smooth animation
   */
  updateCamera(deltaTime) {
    // Apply damping to current speed
    this.cameraAnimation.currentSpeed.multiplyScalar(this.cameraAnimation.damping);
    
    // Calculate new target position with subtle movement
    const time = this.clock.getElapsedTime();
    
    // Gently move target in a figure-8 pattern
    const xMovement = Math.sin(time * 0.1) * 5;
    const yMovement = Math.sin(time * 0.15) * Math.cos(time * 0.1) * 3;
    
    this.cameraAnimation.targetPosition.set(
      xMovement,
      yMovement, 
      25 + Math.sin(time * 0.05) * 3
    );
    
    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(this.cameraAnimation.targetPosition, this.camera.position);
    direction.multiplyScalar(0.02); // Move 2% of the distance each frame
    
    // Add direction to current speed, clamped to max speed
    this.cameraAnimation.currentSpeed.add(direction);
    
    if (this.cameraAnimation.currentSpeed.length() > this.cameraAnimation.maxSpeed) {
      this.cameraAnimation.currentSpeed.normalize().multiplyScalar(this.cameraAnimation.maxSpeed);
    }
    
    // Apply current speed to camera position
    this.camera.position.add(this.cameraAnimation.currentSpeed);
    
    // Always look at origin
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * Draw the background - in this case, rendered by Three.js
   * @override
   */
  drawBackground(ctx, dimensions, audioData, qualitySettings) {
    // Clear the canvas with a very dark background
    // (Three.js will render on top of this)
    const bg = this.config.colorPalette.background;
    ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`;
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
   * Clean up resources when visualization is no longer needed
   * @override
   */
  dispose() {
    super.dispose();
    
    // Clean up Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    // Clean up materials and geometries
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            for (const material of object.material) {
              disposeMaterial(material);
            }
          } else {
            disposeMaterial(object.material);
          }
        }
      });
      
      this.scene = null;
    }
    
    // Clean up post-processing
    if (this.composer) {
      this.composer = null;
    }
    
    // Helper function to dispose material resources
    function disposeMaterial(material) {
      material.dispose();
      
      // Dispose textures
      for (const key in material) {
        const value = material[key];
        if (value && typeof value === 'object' && 'minFilter' in value) {
          value.dispose();
        }
      }
    }
  }
}

export default GalaxyVisualization;
