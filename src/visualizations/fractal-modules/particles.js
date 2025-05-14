/**
 * Fractal Visualization Particles
 * Handles creation and management of 3D glass-like particles
 */

import * as THREE from 'three';

/**
 * Create particle system group with glass-like particles
 * @param {Object} geometries - Shared geometries for particles
 * @param {Object} materials - Materials for particles
 * @param {Object} params - Parameters for particle creation
 * @returns {Object} Object containing particle group and data
 */
export function createParticles(geometries, materials, params) {
  // Create a group to hold all particles
  const particleGroup = new THREE.Group();
  const particles = [];
  
  // Create new particles
  const count = params.count;
  const spread = params.spreadFactor;
  
  for (let i = 0; i < count; i++) {
    // Determine size - larger at the center, smaller at edges
    const distFromCenter = Math.random();
    const sizeRange = params.maxSize - params.minSize;
    const size = params.maxSize - (distFromCenter * sizeRange * 0.8);
    
    // Choose material based on size and randomness
    let material;
    if (i < count * 0.05) {
      // 5% are highlight particles (brightest)
      material = materials.highlight.clone();
    } else if (i < count * 0.25) {
      // 20% are secondary particles
      material = materials.secondary.clone();
    } else {
      // 75% are regular particles
      material = materials.regular.clone();
    }
    
    // Create the glass sphere mesh
    const mesh = new THREE.Mesh(geometries.sphereGeometry, material);
    
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
    
    // Create inner glowing particles for each glass sphere
    const innerParticles = createInnerParticles(mesh, size, materials.innerGlow, geometries.innerSphereGeometry);
    
    // Store original position and other properties for animation
    const particle = {
      mesh,
      originalPosition: mesh.position.clone(),
      originalScale: size,
      phase: Math.random() * Math.PI * 2, // Random starting phase
      speed: 0.5 + Math.random() * 0.5,   // Random speed
      material: mesh.material,
      originalColor: mesh.material.color.clone(),
      isHighlight: material === materials.highlight,
      targetPosition: new THREE.Vector3(),
      targetScale: size,
      pulseFrequency: 0.5 + Math.random() * 2,
      innerParticles: innerParticles // Store reference to inner particles
    };
    
    // Add to scene and particle collection
    particleGroup.add(mesh);
    particles.push(particle);
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
  particleGroup.add(centerSphere);
  
  return { particleGroup, particles };
}

/**
 * Create glowing inner particles inside a glass sphere
 * @param {THREE.Mesh} parentMesh - The parent glass sphere mesh
 * @param {number} parentSize - Size of the parent sphere
 * @param {THREE.Material} innerGlowMaterial - Material for inner particles
 * @param {THREE.Geometry} innerSphereGeometry - Geometry for inner particles
 * @returns {Array} Array of inner particle data
 */
function createInnerParticles(parentMesh, parentSize, innerGlowMaterial, innerSphereGeometry) {
  const innerGlowCount = Math.floor(2 + Math.random() * 5); // 2-6 inner particles
  const innerParticles = [];
  
  for (let j = 0; j < innerGlowCount; j++) {
    // Clone the inner glow material and customize it
    const innerMaterial = innerGlowMaterial.clone();
    
    // Randomize color slightly for variety
    if (j === 0) {
      // First particle is always bluish (core)
      innerMaterial.color.setRGB(0.4, 0.6, 1.0);
    } else {
      // Others have slight color variations
      const hue = 0.55 + (Math.random() * 0.15); // Blue to purple
      const sat = 0.7 + (Math.random() * 0.3);
      const light = 0.4 + (Math.random() * 0.4);
      innerMaterial.color.setHSL(hue, sat, light);
    }
    
    // Adjust opacity based on position - center particles more visible
    innerMaterial.opacity = 0.4 + Math.random() * 0.5;
    
    // Create the inner particle mesh
    const innerMesh = new THREE.Mesh(innerSphereGeometry, innerMaterial);
    
    // Inner particles are smaller than the glass sphere
    const innerSize = (0.25 + Math.random() * 0.35) * parentSize;
    innerMesh.scale.set(innerSize, innerSize, innerSize);
    
    // Position inner particles randomly within the glass sphere
    // Keep them closer to center for realistic look
    const innerRadius = parentSize * 0.5; // Half the radius of the glass sphere
    innerMesh.position.set(
      (Math.random() * 2 - 1) * innerRadius * 0.7,
      (Math.random() * 2 - 1) * innerRadius * 0.7,
      (Math.random() * 2 - 1) * innerRadius * 0.7
    );
    
    // Add inner particle to the glass sphere mesh
    parentMesh.add(innerMesh);
    innerParticles.push({
      mesh: innerMesh,
      material: innerMaterial,
      originalScale: innerSize,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.4
    });
  }
  
  return innerParticles;
}

/**
 * Update particles based on audio data
 * @param {Array} particles - Array of particle objects
 * @param {number} deltaTime - Time delta for animation
 * @param {number} time - Current animation time
 * @param {Object} audioData - Audio data for reactivity
 */
export function updateParticles(particles, deltaTime, time, audioData) {
  if (!audioData || !particles || particles.length === 0) return;
  
  // Extract audio data
  const bassLevel = audioData.bands.bass / 255;
  const midLevel = audioData.bands.mid / 255;
  const highLevel = audioData.bands.high / 255;
  const isBeat = audioData.isBeat;
  
  // Update each particle
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
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
      
      // Adjust glass material properties based on audio
      if (mesh.material.transmission !== undefined) {  // Check if it's a glass material (MeshPhysicalMaterial)
        // Make glass more transparent on beats
        if (isBeat) {
          mesh.material.transmission = Math.min(0.98, mesh.material.transmission + 0.03);
          // Increase clearcoat on beats for shinier appearance
          if (mesh.material.clearcoat !== undefined) {
            mesh.material.clearcoat = Math.min(1.0, mesh.material.clearcoat + 0.2);
          }
        } else {
          // Gradually return to normal transmission
          mesh.material.transmission = Math.max(
            isHighlight ? 0.97 : i % 4 === 0 ? 0.9 : 0.95, 
            mesh.material.transmission - 0.01
          );
          
          // Gradually return to normal clearcoat
          if (mesh.material.clearcoat !== undefined) {
            mesh.material.clearcoat = Math.max(
              isHighlight ? 1.0 : 0.8,
              mesh.material.clearcoat - 0.05
            );
          }
        }
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
    
    // Animate inner glowing particles
    updateInnerParticles(particle, time, bassLevel, midLevel, highLevel, isBeat);
  }
}

/**
 * Update inner particles of a glass sphere
 * @param {Object} particle - Parent particle data
 * @param {number} time - Current animation time
 * @param {number} bassLevel - Bass level (0-1)
 * @param {number} midLevel - Mid level (0-1)
 * @param {number} highLevel - High level (0-1)
 * @param {boolean} isBeat - Whether there is a beat
 */
function updateInnerParticles(particle, time, bassLevel, midLevel, highLevel, isBeat) {
  if (!particle.innerParticles || particle.innerParticles.length === 0) return;
  
  // For each inner particle
  particle.innerParticles.forEach((innerParticle, j) => {
    const { mesh: innerMesh, material: innerMaterial, originalScale, phase, speed } = innerParticle;
    
    // Animate position - make them float around inside the glass sphere
    const innerTime = time * speed + phase;
    
    // Calculate movement inside the glass ball with audio reactivity
    const movementRadius = originalScale * 1.8; // How far it can move from center
    const freqInfluence = j % 3 === 0 ? bassLevel : j % 3 === 1 ? midLevel : highLevel;
    
    // Make inner particles move in small circles or figure-eights
    innerMesh.position.x = Math.sin(innerTime) * movementRadius * (0.7 + freqInfluence * 0.5);
    innerMesh.position.y = Math.sin(innerTime * 0.7) * movementRadius * (0.7 + freqInfluence * 0.5);
    innerMesh.position.z = Math.cos(innerTime * 1.3) * movementRadius * (0.7 + freqInfluence * 0.5);
    
    // Scale inner particles based on audio
    let innerScaleFactor = 1.0;
    
    // Different particles react to different frequencies
    if (j % 3 === 0) {
      // React to bass
      innerScaleFactor = 1.0 + bassLevel * 0.7;
      
      // Pulse on beat
      if (isBeat && Math.random() < 0.7) {
        innerScaleFactor += 0.3;
      }
    } else if (j % 3 === 1) {
      // React to mids
      innerScaleFactor = 1.0 + midLevel * 0.5;
    } else {
      // React to highs
      innerScaleFactor = 1.0 + highLevel * 0.4;
    }
    
    // Calculate new scale with smooth transition
    const newScale = originalScale * innerScaleFactor;
    innerMesh.scale.lerp(new THREE.Vector3(newScale, newScale, newScale), 0.2);
    
    // Adjust opacity based on audio
    if (isBeat && j === 0) { // Center particle flashes on beat
      innerMaterial.opacity = Math.min(0.9, innerMaterial.opacity + bassLevel * 0.4);
    } else {
      // Make opacity respond to corresponding frequency
      const targetOpacity = 0.4 + freqInfluence * 0.6;
      innerMaterial.opacity += (targetOpacity - innerMaterial.opacity) * 0.1;
    }
    
    // Color shift based on audio intensity
    if (j === 0 && isBeat && bassLevel > 0.7) {
      // Core particle shifts to bright white/blue on strong beats
      innerMaterial.color.setRGB(0.8, 0.9, 1.0);
    } else if (j === 0) {
      // Core particle is normally blue
      innerMaterial.color.lerp(new THREE.Color(0.4, 0.6, 1.0), 0.05);
    } else if (isBeat && Math.random() < 0.3) {
      // Occasionally shift colors on beat
      const hue = 0.55 + Math.random() * 0.15; // Blue to purple
      const sat = 0.7 + Math.random() * 0.3;
      const light = 0.5 + Math.random() * 0.5;
      const color = new THREE.Color().setHSL(hue, sat, light);
      innerMaterial.color.lerp(color, 0.7);
    }
  });
}
