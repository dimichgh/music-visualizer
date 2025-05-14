/**
 * Galaxy Visualization Scene Elements
 * Functions to create the various visual elements of the galaxy scene
 */

import * as THREE from 'three';
import { 
  createStarFieldMaterial, 
  createGalaxyParticleMaterial, 
  createNebulaMaterial,
  createDustMaterial 
} from './shaders';

/**
 * Create background star field
 * @returns {THREE.Points} The starfield object
 */
export function createBackgroundStars() {
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
  
  // Create the star field
  const backgroundStars = new THREE.Points(starField, createStarFieldMaterial());
  
  return backgroundStars;
}

/**
 * Create the central galaxy core
 * Currently returns empty objects as core is disabled
 * @returns {Object} Object containing galaxyCore and galaxyCoreGlow
 */
export function createGalaxyCore() {
  // Core is currently disabled to test visualization without the central orb
  // Create empty objects to maintain code compatibility
  const galaxyCore = new THREE.Object3D();
  const galaxyCoreGlow = new THREE.Object3D();
  
  return {
    galaxyCore,
    galaxyCoreGlow
  };
}

/**
 * Create the spiral arms of the galaxy
 * @param {Object} config - Configuration parameters
 * @returns {Object} Object containing the galaxy group and particles array
 */
export function createGalacticArms(config) {
  const armCount = 3;
  const particlesPerArm = 2000;
  const centerHoleSize = config?.centerHoleSize || 10;
  
  // Create a group to hold all galaxy particles
  const galaxyGroup = new THREE.Group();
  const galaxyParticles = [];
  
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
      // Calculate particle position in spiral pattern with a hole in the center
      // Create a ring distribution with minimal particles in center
      const minRadius = centerHoleSize; // Create a large empty space in the center
      let radiusBase;
      
      // Most particles should be in the outer regions
      if (Math.random() < 0.9) {
        // 90% of particles in mid to outer regions
        radiusBase = minRadius + Math.random() * 15;
      } else {
        // Only 10% of particles in inner regions, and still avoiding center
        radiusBase = 5 + Math.random() * 5; 
      }
      
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
    
    // Create points and add to scene
    const armPoints = new THREE.Points(armGeometry, createGalaxyParticleMaterial());
    galaxyGroup.add(armPoints);
    
    // Store reference
    galaxyParticles.push({
      points: armPoints,
      material: armPoints.material,
      armIndex
    });
  }
  
  return {
    galaxyGroup,
    galaxyParticles
  };
}

/**
 * Create nebula-like effects around the galaxy
 * @returns {Array} Array of nebula objects
 */
export function createNebulaEffects() {
  const nebulaCount = 4;
  const nebulaGroups = [];
  
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
    
    // Create nebula material
    const intensity = 0.5 + Math.random() * 0.5;
    const nebulaMaterial = createNebulaMaterial(nebulaColor, intensity);
    
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
    
    // Store reference
    nebulaGroups.push({
      group: nebulaGroup,
      material: nebulaMaterial,
      baseIntensity: intensity,
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.0005,
        y: (Math.random() - 0.5) * 0.0005,
        z: (Math.random() - 0.5) * 0.0005
      }
    });
  }
  
  return nebulaGroups;
}

/**
 * Create dust clouds that flow through the scene
 * @returns {THREE.Points} The dust cloud particle system
 */
export function createDustClouds() {
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
  
  // Create dust particles
  const dustParticles = new THREE.Points(dustGeometry, createDustMaterial());
  
  return dustParticles;
}

/**
 * Set up lighting for the galaxy scene
 * @param {THREE.Scene} scene - The scene to add lights to
 * @param {number} brightness - Brightness multiplier
 * @returns {Array} Array of lights added to the scene
 */
export function setupLighting(scene, brightness = 1.0) {
  const lights = [];
  
  // Add ambient light - reduced intensity
  const ambientLight = new THREE.AmbientLight(0x222233);
  scene.add(ambientLight);
  lights.push(ambientLight);
  
  // Add point lights - moved away from center
  const galaxyLight = new THREE.PointLight(0x7080ff, 3 * brightness, 70);
  galaxyLight.position.set(15, 8, 20);  // Moved away from center
  scene.add(galaxyLight);
  lights.push(galaxyLight);
  
  const accentLight = new THREE.PointLight(0xff8080, 2 * brightness, 50);
  accentLight.position.set(-18, -12, 15);  // Moved away from center
  scene.add(accentLight);
  lights.push(accentLight);
  
  return lights;
}
