/**
 * Fractal Visualization Orbs
 * Handles creation and management of colored orbs that fly around with trails
 */

import * as THREE from 'three';

/**
 * Create colored orbs with trails
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} geometries - Shared geometries for orbs
 * @param {Object} orbParams - Parameters for orb creation
 * @returns {Array} Array of orb objects
 */
export function createOrbs(scene, geometries, orbParams) {
  const orbs = [];
  
  // Define vibrant colors for the orbs
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
  for (let i = 0; i < orbParams.count; i++) {
    // Calculate a random orbit
    const orbitRadius = 3 + Math.random() * 3; // Distance from center
    const orbitHeight = Math.random() * 2 - 1; // Y position variance
    const orbitSpeed = 0.2 + Math.random() * 0.4; // Rotation speed
    const orbitDirection = Math.random() > 0.5 ? 1 : -1; // Direction
    const orbitTilt = Math.random() * Math.PI; // Tilt of orbit
    const orbitPhase = Math.random() * Math.PI * 2; // Starting position
    
    // Pick a random size
    const sizeRange = orbParams.maxSize - orbParams.minSize;
    const size = orbParams.minSize + Math.random() * sizeRange;
    
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
    const mesh = new THREE.Mesh(geometries.orbGeometry, material);
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
    scene.add(trailGroup);
    
    // Create initial trail segments
    const trailSegments = [];
    for (let j = 0; j < orbParams.trailLength; j++) {
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6 * (1 - j / orbParams.trailLength)
      });
      
      // Use the same geometry validation as for the main mesh
    let trailGeometry = geometries.orbGeometry;
    if (!trailGeometry) {
      trailGeometry = new THREE.SphereGeometry(1, 16, 16);
    }
    const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
      const trailSize = size * (1 - j * 0.15 / orbParams.trailLength);
      trailMesh.scale.set(trailSize, trailSize, trailSize);
      trailMesh.position.copy(mesh.position);
      
      trailGroup.add(trailMesh);
      trailSegments.push({
        mesh: trailMesh,
        material: trailMaterial
      });
    }
    
    // Add the orb to the scene
    scene.add(mesh);
    
    // Store the orb data
    orbs.push({
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
  
  return orbs;
}

/**
 * Add point lights to some orbs
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Array} orbs - Array of orb objects
 * @returns {Array} Array of orb lights
 */
export function addOrbLights(scene, orbs) {
  const orbLights = [];
  
  // Add point lights to orbs
  for (let i = 0; i < Math.min(4, orbs.length); i++) {
    const orb = orbs[i];
    const light = new THREE.PointLight(orb.color, 0.8, 4);
    light.position.copy(orb.mesh.position);
    scene.add(light);
    orbLights.push(light);
    orb.light = light;
  }
  
  return orbLights;
}

/**
 * Create a new orb at a given position
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} geometries - Shared geometries for orbs
 * @param {Object} orbParams - Parameters for orb creation
 * @param {THREE.Vector3} position - Optional position for the new orb
 * @returns {Object} The created orb object
 */
export function createNewOrb(scene, geometries, orbParams, position) {
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
  const sizeRange = orbParams.maxSize - orbParams.minSize;
  const size = orbParams.minSize + Math.random() * sizeRange;
  
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
  
  // Create the mesh - ensure we have a valid geometry or create a new one
  let geometry = geometries.orbGeometry;
  if (!geometry) {
    console.warn('Creating fallback geometry in createNewOrb');
    geometry = new THREE.SphereGeometry(1, 16, 16);
  }
  const mesh = new THREE.Mesh(geometry, material);
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
  scene.add(trailGroup);
  
  // Create trail segments
  const trailSegments = [];
  for (let j = 0; j < orbParams.trailLength; j++) {
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6 * (1 - j / orbParams.trailLength)
    });
    
    // Use the same geometry validation as for the main mesh
    let trailGeometry = geometries.orbGeometry;
    if (!trailGeometry) {
      console.warn('Creating fallback geometry for trail segment');
      trailGeometry = new THREE.SphereGeometry(1, 16, 16);
    }
    const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
    const trailSize = size * (1 - j * 0.15 / orbParams.trailLength);
    trailMesh.scale.set(trailSize, trailSize, trailSize);
    trailMesh.position.copy(mesh.position);
    
    trailGroup.add(trailMesh);
    trailSegments.push({
      mesh: trailMesh,
      material: trailMaterial
    });
  }
  
  // Add to scene
  scene.add(mesh);
  
  // Calculate a random orbital path for the new orb
  const orbit = {
    radius: 3 + Math.random() * 3,
    height: Math.random() * 2 - 1,
    speed: 0.2 + Math.random() * 0.4,
    direction: Math.random() > 0.5 ? 1 : -1,
    tilt: Math.random() * Math.PI,
    phase: Math.random() * Math.PI * 2
  };
  
  // Create orb data
  const orb = {
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
  };
  
  return orb;
}

/**
 * Remove an orb and clean up its resources
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Array} orbs - Array of orb objects
 * @param {Array} orbLights - Array of orb lights
 * @param {number} index - Index of the orb to remove
 */
export function removeOrb(scene, orbs, orbLights, index) {
  const orb = orbs[index];
  
  // Remove mesh
  if (orb.mesh) {
    scene.remove(orb.mesh);
    orb.mesh.geometry = null;
    orb.mesh.material.dispose();
  }
  
  // Remove trail
  if (orb.trailGroup) {
    orb.trailSegments.forEach(segment => {
      segment.material.dispose();
      segment.mesh.geometry = null;
    });
    scene.remove(orb.trailGroup);
  }
  
  // Remove light if present
  if (orb.light) {
    scene.remove(orb.light);
    
    // Also remove from orbLights array
    const lightIndex = orbLights.indexOf(orb.light);
    if (lightIndex !== -1) {
      orbLights.splice(lightIndex, 1);
    }
  }
  
  // Remove from orbs array
  orbs.splice(index, 1);
}

/**
 * Detect music pattern changes
 * @param {Object} audioData - Current audio data
 * @param {Object} previousAudioData - Previous audio data
 * @returns {boolean} Whether a pattern change was detected
 */
export function detectPatternChange(audioData, previousAudioData) {
  if (!audioData || !previousAudioData) return false;
  
  // Check for significant changes in the frequency distribution
  const bassChange = Math.abs(audioData.bands.bass - previousAudioData.bands.bass) / 255;
  const midChange = Math.abs(audioData.bands.mid - previousAudioData.bands.mid) / 255;
  const highChange = Math.abs(audioData.bands.high - previousAudioData.bands.high) / 255;
  
  // Calculate the dominant frequency band
  const currentDominant = getDominantFrequency(audioData);
  const previousDominant = getDominantFrequency(previousAudioData);
  
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
 * @param {Object} audioData - Audio data
 * @returns {string} Dominant frequency band
 */
function getDominantFrequency(audioData) {
  const { bass, mid, high } = audioData.bands;
  if (bass > mid && bass > high) return 'bass';
  if (mid > bass && mid > high) return 'mid';
  return 'high';
}

/**
 * Update orbs based on audio data
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Array} orbs - Array of orb objects
 * @param {Array} orbLights - Array of orb lights
 * @param {Object} orbParams - Parameters for orb behavior
 * @param {number} deltaTime - Time delta for animation
 * @param {number} time - Current animation time
 * @param {Object} audioData - Audio data for reactivity
 * @param {Object} lastAudioData - Previous audio data for pattern detection
 */
export function updateOrbs(scene, orbs, orbLights, orbParams, deltaTime, time, audioData, lastAudioData) {
  if (!audioData || !orbs || orbs.length === 0) return;
  
  // Extract audio data
  const bassLevel = audioData.bands.bass / 255;
  const midLevel = audioData.bands.mid / 255;
  const highLevel = audioData.bands.high / 255;
  const isBeat = audioData.isBeat;
  
  // Normalized time factors
  const normalizedDeltaTime = deltaTime * 0.01;
  
  // Update each orb
  for (let i = 0; i < orbs.length; i++) {
    const orb = orbs[i];
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
        Math.abs(orb.mesh.position.x) > orbParams.offscreenDistance ||
        Math.abs(orb.mesh.position.y) > orbParams.offscreenDistance ||
        Math.abs(orb.mesh.position.z) > orbParams.offscreenDistance
      ) {
      // Replace this orb with a new one in a different position
      removeOrb(scene, orbs, orbLights, i);
      // Use existing shared geometries rather than potentially null geometry
      if (orbs.length > 0 && orbs[0].mesh && orbs[0].mesh.geometry) {
        // Use geometry from first orb if available
        const newOrb = createNewOrb(scene, { orbGeometry: orbs[0].mesh.geometry }, orbParams);
        orbs.push(newOrb);
      } else if (geometries && geometries.orbGeometry) {
        // Fallback to passed geometries
        const newOrb = createNewOrb(scene, geometries, orbParams);
        orbs.push(newOrb);
      } else {
        // Last resort - create a new geometry
        const newGeometry = new THREE.SphereGeometry(1, 16, 16);
        const newOrb = createNewOrb(scene, { orbGeometry: newGeometry }, orbParams);
        orbs.push(newOrb);
      }
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
    if (lastAudioData && orb.patternChangeReaction) {
      const isPatternChange = detectPatternChange(audioData, lastAudioData);
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
    if (isBeat && bassLevel > 0.7 && Math.random() < 0.3 && orbs.length < 30) {
      // Ensure we use a valid geometry
      let orbGeometry;
      
      if (orb.mesh && orb.mesh.geometry) {
        // Use this orb's geometry if it exists
        orbGeometry = orb.mesh.geometry;
      } else if (orbs.length > 0 && orbs[0].mesh && orbs[0].mesh.geometry) {
        // Fallback to first orb's geometry
        orbGeometry = orbs[0].mesh.geometry;
      } else {
        // Last resort - create a new geometry
        orbGeometry = new THREE.SphereGeometry(1, 16, 16);
      }
      
      const newOrb = createNewOrb(
        scene, 
        { orbGeometry }, 
        orbParams, 
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
      );
      orbs.push(newOrb);
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
