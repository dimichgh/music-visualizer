/**
 * Fractal Visualization Scene Elements
 * Handles creation and management of scene elements like lights, walls, etc.
 */

import * as THREE from 'three';

/**
 * Setup main lighting for the scene
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} Object containing lights created
 */
export function setupLights(scene) {
  const lights = {
    pointLights: [],
    centerLight: null,
    directionalLight: null,
    sphereLight: null,
    flareLight: null, // New dedicated light for flares
    flares: [] // Array to hold flare meshes
  };
  
  // Add ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
  scene.add(ambientLight);
  
  // Add hemisphere light for more natural sky/ground lighting
  const hemiLight = new THREE.HemisphereLight(0x6688ff, 0x33aa77, 0.4);
  scene.add(hemiLight);
  
  // Add directional light with shadows (main light)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  
  // Improve shadow quality
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 20;
  directionalLight.shadow.camera.left = -5;
  directionalLight.shadow.camera.right = 5;
  directionalLight.shadow.camera.top = 5;
  directionalLight.shadow.camera.bottom = -5;
  directionalLight.shadow.bias = -0.001;
  
  scene.add(directionalLight);
  lights.directionalLight = directionalLight;
  
  // Add central light for the spherical light wall
  const sphereLight = new THREE.PointLight(0xffffff, 0.6, 30);
  sphereLight.position.set(0, 0, 0);
  scene.add(sphereLight);
  lights.sphereLight = sphereLight;
  
  // Add center point light (main reactive light)
  const centerLight = new THREE.PointLight(0xffffff, 2.0, 8);
  centerLight.position.set(0, 0, 0);
  centerLight.castShadow = true;
  centerLight.shadow.mapSize.width = 512;
  centerLight.shadow.mapSize.height = 512;
  centerLight.shadow.radius = 4;
  scene.add(centerLight);
  lights.centerLight = centerLight;
  lights.pointLights.push(centerLight);
  
  // Add dedicated flare light
  const flareLight = new THREE.PointLight(0xffffff, 0, 20); // Start with intensity 0
  flareLight.position.set(0, 0, 0);
  scene.add(flareLight);
  lights.flareLight = flareLight;
  
  // Add accent point lights
  const colors = [0xffffff, 0xffffff, 0xffffff]; // All white lights
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
    scene.add(light);
    lights.pointLights.push(light);
  }
  
  // Create the light flare assets
  createFlares(scene, lights);
  
  return lights;
}

/**
 * Create light flare objects that will be shown on beats
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} lights - The lights object
 */
function createFlares(scene, lights) {
  // Create flare material
  const flareMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  
  // Create thin ray-like flare geometry
  const flareCount = 8;
  const flareGeometry = new THREE.PlaneGeometry(0.5, 12, 1, 4);
  
  // Create flares in different directions
  for (let i = 0; i < flareCount; i++) {
    const flare = new THREE.Mesh(flareGeometry, flareMaterial.clone());
    const angle = (i / flareCount) * Math.PI * 2;
    
    // Set rotation to point outward
    flare.rotation.z = angle;
    
    // Set initial position
    flare.position.set(0, 0, 0);
    
    // Set properties for animation
    flare.userData = {
      initialScale: new THREE.Vector3(1, 1, 1),
      angle: angle,
      active: false,
      life: 0,
      maxLife: 1.0,
      baseColor: new THREE.Color(0xffffff)
    };
    
    // Hide initially
    flare.visible = false;
    
    // Add to scene and store reference
    scene.add(flare);
    lights.flares.push(flare);
  }
  
  // Create a few wider flare effects
  const wideFlareGeometry = new THREE.PlaneGeometry(3, 6, 1, 4);
  
  for (let i = 0; i < 4; i++) {
    const wideFlare = new THREE.Mesh(wideFlareGeometry, flareMaterial.clone());
    const angle = (i / 4) * Math.PI * 2;
    
    // Set rotation to point outward
    wideFlare.rotation.z = angle;
    
    // Set initial position
    wideFlare.position.set(0, 0, 0);
    
    // Set properties for animation
    wideFlare.userData = {
      initialScale: new THREE.Vector3(1, 1, 1),
      angle: angle,
      active: false,
      life: 0,
      maxLife: 1.0,
      isWide: true,
      baseColor: new THREE.Color(0xffffff)
    };
    
    // Hide initially
    wideFlare.visible = false;
    
    // Add to scene and store reference
    scene.add(wideFlare);
    lights.flares.push(wideFlare);
  }
  
  // Create a central flare burst
  const burstGeometry = new THREE.CircleGeometry(2, 32);
  const burstFlare = new THREE.Mesh(burstGeometry, flareMaterial.clone());
  
  // Set properties for animation
  burstFlare.userData = {
    initialScale: new THREE.Vector3(1, 1, 1),
    active: false,
    life: 0,
    maxLife: 0.8,
    isBurst: true,
    baseColor: new THREE.Color(0xffffff)
  };
  
  // Hide initially
  burstFlare.visible = false;
  
  // Add to scene and store reference
  scene.add(burstFlare);
  lights.flares.push(burstFlare);
}

/**
 * Create the background walls with semi-transparent materials
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} backgroundParams - Parameters for background appearance
 * @returns {Object} Object containing wall elements
 */
export function createBackgroundWalls(scene, backgroundParams) {
  const result = {
    wallMesh: null,
    accentWalls: []
  };
  
  // Create a large box that will serve as our room/background
  const wallSize = 20;
  const wallGeometry = new THREE.BoxGeometry(wallSize, wallSize, wallSize);
  
  // Create material with side set to BackSide so we see the inside
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x000022,
    transparent: true,
    opacity: backgroundParams.wallOpacity,
    side: THREE.BackSide,
    metalness: 0.2,
    roughness: 0.8
  });
  
  // Create the wall mesh and add to scene
  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
  scene.add(wallMesh);
  result.wallMesh = wallMesh;
  
  // Create additional planes for more dynamic effects
  const planeSize = wallSize * 0.9;
  const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
  
  // Create four planes to serve as accent walls
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
      opacity: backgroundParams.wallOpacity * 0.7,
      side: THREE.FrontSide,
      metalness: 0.3,
      roughness: 0.7,
      emissive: new THREE.Color(colors[i]).multiplyScalar(0.2)
    });
    
    const plane = new THREE.Mesh(planeGeometry, material);
    plane.position.set(...positions[i]);
    plane.rotation.set(...rotations[i]);
    
    scene.add(plane);
    result.accentWalls.push({
      mesh: plane,
      baseColor: new THREE.Color(colors[i]),
      material
    });
  }
  
  return result;
}

/**
 * Create a seamless spherical light wall that changes color with music
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} params - Light wall parameters
 * @returns {Object} Object containing light wall elements
 */
export function createLightWall(scene, params) {
  if (!params.enabled) return { lightWall: null, lightTiles: [] };
  
  // Store all wall tiles in a group
  const lightWall = new THREE.Group();
  scene.add(lightWall);
  
  const { tileRows, tilesPerRow, sphereRadius, tileSpacing, colorSet, tileSize, sphereOpening, beatExpansion } = params;
  
  // Create better quality tile geometry with slightly rounded edges and deeper for stronger 3D effect
  const tileGeometry = new THREE.BoxGeometry(tileSize, tileSize, 0.2, 3, 3, 1);
  
  // Create tiles
  const lightTiles = [];
  
  // Calculate phi increments (latitude)
  const phiStart = sphereOpening * Math.PI/2; // Opening at top
  const phiEnd = Math.PI - (sphereOpening * Math.PI/2); // Opening at bottom
  const phiRange = phiEnd - phiStart;
  const phiIncrement = phiRange / (tileRows - 1);
  
  // Use shared basic material properties
  const baseMaterialProps = {
    roughness: 0.2,          // More reflective
    metalness: 0.8,          // More metallic
    transparent: true,
    opacity: 0.9,            // More solid
    side: THREE.FrontSide    // Only render front faces for performance
  };
  
  // Create a seamless sphere of tiles
  for (let row = 0; row < tileRows; row++) {
    // Calculate phi angle (latitude)
    const phi = phiStart + (row * phiIncrement);
    
    // Calculate tiles needed for this row (more at equator, fewer at poles)
    const rowRadius = Math.sin(phi) * sphereRadius;
    const circumference = 2 * Math.PI * rowRadius;
    // Scale tiles by sine curve for consistent density
    const adjustedTilesInRow = Math.max(8, Math.floor(tilesPerRow * Math.sin(phi)));
    
    // Calculate theta increment (longitude)
    const thetaIncrement = (2 * Math.PI) / adjustedTilesInRow;
    
    for (let col = 0; col < adjustedTilesInRow; col++) {
      // Calculate theta angle (longitude)
      const theta = col * thetaIncrement;
      
      // Pick a random base color from the color set
      const colorIndex = Math.floor(Math.random() * colorSet.length);
      const baseColor = new THREE.Color(colorSet[colorIndex]);
      
      // Create material with enhanced emissive properties for stronger glow effect
      const material = new THREE.MeshPhysicalMaterial({
        ...baseMaterialProps,
        color: baseColor.clone().multiplyScalar(0.6),  // Brighter base color
        emissive: baseColor,
        emissiveIntensity: params.baseBrightness,
        clearcoat: 1.0,          // Add clearcoat for extra shine
        clearcoatRoughness: 0.3,  // Slight roughness to diffuse light
      });
      
      // Calculate optimal tile size for this latitude to minimize gaps
      // Use slightly scaled tile size for consistent coverage
      const adjustedSize = tileSize * (1 + 0.15 * (1 - Math.abs(Math.cos(phi))));
      
      // Create mesh
      const mesh = new THREE.Mesh(tileGeometry, material);
      mesh.scale.set(adjustedSize, adjustedSize, 1);
      
      // Calculate position on sphere
      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.cos(phi);
      const z = sphereRadius * Math.sin(phi) * Math.sin(theta);
      
      mesh.position.set(x, y, z);
      
      // Orient tile to face outward from sphere center
      mesh.lookAt(0, 0, 0);
      // Add small random rotation for less uniform look
      const jitter = 0.01;
      mesh.rotation.z += (Math.random() * jitter * 2) - jitter;
      
      // Add to scene
      lightWall.add(mesh);
      
      // Generate frequency mapping - tiles will respond to different frequencies
      // based on their position
      let freqMin, freqMax;
      if (row < tileRows * 0.33) {
        // Top section responds to high frequencies
        freqMin = Math.floor(0.7 * 128);
        freqMax = Math.floor(0.95 * 128);
      } else if (row < tileRows * 0.66) {
        // Middle responds to mid frequencies
        freqMin = Math.floor(0.3 * 128);
        freqMax = Math.floor(0.7 * 128);
      } else {
        // Bottom responds to bass frequencies
        freqMin = 0;
        freqMax = Math.floor(0.3 * 128);
      }
      
      // Store tile data with enhanced properties
      lightTiles.push({
        mesh,
        material,
        baseColor,
        row,
        col,
        phi,
        theta,
        originalPosition: new THREE.Vector3(x, y, z),
        pulsePhase: Math.random() * Math.PI * 2,  // Random starting phase
        pulseSpeed: params.pulseSpeed * (0.8 + Math.random() * 0.4), // Slightly varied speeds
        active: false,
        glowAmount: 0,
        targetGlow: 0,
        lastBeatTime: 0,
        freqResponseRange: {min: freqMin, max: freqMax},
        latitude: phi * (180/Math.PI), // Store latitude in degrees (0=north pole, 180=south pole)
        longitude: theta * (180/Math.PI), // Store longitude in degrees (0-360)
        adjacentTiles: [] // Will store references to adjacent tiles for coordinated effects
      });
    }
  }
  
  return { lightWall, lightTiles };
}

/**
 * Find adjacent tiles for each tile to create coordinated effects
 * @param {Array} lightTiles - Array of light tile objects
 * @param {Object} params - Light wall parameters
 */
export function findAdjacentTiles(lightTiles, params) {
  // For each tile, find its 4-8 adjacent tiles
  for (let i = 0; i < lightTiles.length; i++) {
    const tile = lightTiles[i];
    const adjacentTiles = [];
    
    // Find tiles that are close in spherical coordinates
    for (let j = 0; j < lightTiles.length; j++) {
      if (i === j) continue; // Skip self
      
      const otherTile = lightTiles[j];
      
      // Check if adjacent in latitude (same row or adjacent row)
      const latDiff = Math.abs(tile.row - otherTile.row);
      if (latDiff > 1) continue;
      
      // Check if adjacent in longitude (same column or adjacent column)
      // Handle wrapping around at longitude edges
      const sameLongitude = 
        Math.abs(tile.col - otherTile.col) <= 1 || 
        (tile.col === 0 && otherTile.col === params.tilesPerRow - 1) ||
        (tile.col === params.tilesPerRow - 1 && otherTile.col === 0);
      
      if (sameLongitude) {
        adjacentTiles.push(j);
        
        // Limit to closest 8 neighbors
        if (adjacentTiles.length >= 8) break;
      }
    }
    
    tile.adjacentTiles = adjacentTiles;
  }
}

/**
 * Create a traveling light pattern across the sphere
 * @param {Array} lightTiles - Array of light tile objects
 * @param {Object} params - Light wall parameters
 * @param {number} animationTime - Current animation time
 * @param {number} patternType - Pattern type (0-3)
 */
export function createTravelingLightPattern(lightTiles, params, animationTime, patternType = -1) {
  if (!lightTiles || lightTiles.length === 0) return;
  
  // Choose a random pattern type if not specified
  if (patternType === -1) {
    patternType = Math.floor(Math.random() * 4);
  }
  
  switch (patternType) {
    case 0: // Latitude circle (horizontal ring)
      createLatitudeRing(lightTiles, params, animationTime);
      break;
    case 1: // Longitude circle (vertical ring)
      createLongitudeRing(lightTiles, params, animationTime);
      break;
    case 2: // Expanding circle
      const startTile = lightTiles[Math.floor(Math.random() * lightTiles.length)];
      createExpandingCircle(lightTiles, params, animationTime, startTile.phi, startTile.theta);
      break;
    case 3: // Multiple rings
      createMultipleRings(lightTiles, params, animationTime);
      break;
  }
}

/**
 * Create horizontal ring effect
 * @param {Array} lightTiles - Array of light tile objects
 * @param {Object} params - Light wall parameters
 * @param {number} animationTime - Current animation time
 */
function createLatitudeRing(lightTiles, params, animationTime) {
  // Pick a random latitude
  const targetLatitude = 30 + Math.random() * 120; // Between 30° and 150°
  
  // Find all tiles near this latitude
  const latitudeTiles = lightTiles.filter(tile => 
    Math.abs(tile.latitude - targetLatitude) < 5
  ).sort((a, b) => a.longitude - b.longitude);
  
  // Pick a color for this ring
  const colorIndex = Math.floor(Math.random() * params.colorSet.length);
  const ringColor = new THREE.Color(params.colorSet[colorIndex]);
  
  // Light up tiles in sequence
  latitudeTiles.forEach((tile, i) => {
    setTimeout(() => {
      tile.active = true;
      tile.lastBeatTime = animationTime;
      tile.glowAmount = params.maxBrightness;
      tile.material.emissiveIntensity = params.maxBrightness;
      tile.material.emissive = ringColor;
      tile.baseColor = ringColor;
    }, i * 15);
  });
}

/**
 * Create vertical ring effect
 * @param {Array} lightTiles - Array of light tile objects
 * @param {Object} params - Light wall parameters
 * @param {number} animationTime - Current animation time
 */
function createLongitudeRing(lightTiles, params, animationTime) {
  // Pick a random longitude
  const targetLongitude = Math.random() * 360;
  
  // Find all tiles near this longitude
  const longitudeTiles = lightTiles.filter(tile => 
    Math.abs(((tile.longitude - targetLongitude + 180) % 360) - 180) < 5
  ).sort((a, b) => a.latitude - b.latitude);
  
  // Pick a color for this ring
  const colorIndex = Math.floor(Math.random() * params.colorSet.length);
  const ringColor = new THREE.Color(params.colorSet[colorIndex]);
  
  // Light up tiles in sequence
  longitudeTiles.forEach((tile, i) => {
    setTimeout(() => {
      tile.active = true;
      tile.lastBeatTime = animationTime;
      tile.glowAmount = params.maxBrightness;
      tile.material.emissiveIntensity = params.maxBrightness;
      tile.material.emissive = ringColor;
      tile.baseColor = ringColor;
    }, i * 15);
  });
}

/**
 * Create expanding circle effect from a center point
 * @param {Array} lightTiles - Array of light tile objects
 * @param {Object} params - Light wall parameters
 * @param {number} animationTime - Current animation time
 * @param {number} centerPhi - Center phi angle
 * @param {number} centerTheta - Center theta angle
 */
function createExpandingCircle(lightTiles, params, animationTime, centerPhi, centerTheta) {
  // Pick a color for this effect
  const colorIndex = Math.floor(Math.random() * params.colorSet.length);
  const baseColor = new THREE.Color(params.colorSet[colorIndex]);
  
  // Calculate distance for each tile and sort by distance
  const tilesWithDistance = lightTiles.map(tile => {
    // Calculate great circle distance (angular distance on sphere)
    const cosDistance = Math.sin(centerPhi) * Math.sin(tile.phi) + 
                       Math.cos(centerPhi) * Math.cos(tile.phi) * 
                       Math.cos(Math.abs(centerTheta - tile.theta));
    const distance = Math.acos(Math.min(1, Math.max(-1, cosDistance)));
    
    return { tile, distance };
  }).sort((a, b) => a.distance - b.distance);
  
  // Light up tiles in expanding circles
  tilesWithDistance.forEach(({ tile, distance }) => {
    // Convert distance to timing
    const delay = distance * 1000; // ms per radian
    
    // Calculate color variation based on distance
    const hueShift = distance * 0.5; // Color varies with distance
    const color = new THREE.Color().setHSL(
      (baseColor.getHSL({ h: 0 }).h + hueShift) % 1,
      0.9,
      0.5
    );
    
    setTimeout(() => {
      tile.active = true;
      tile.lastBeatTime = animationTime;
      tile.glowAmount = params.maxBrightness;
      tile.material.emissiveIntensity = params.maxBrightness;
      tile.material.emissive = color;
      tile.baseColor = color;
    }, delay);
  });
}

/**
 * Create multiple rings effect
 * @param {Array} lightTiles - Array of light tile objects
 * @param {Object} params - Light wall parameters
 * @param {number} animationTime - Current animation time
 */
function createMultipleRings(lightTiles, params, animationTime) {
  // Create 3-5 rings with different delays
  const ringCount = 3 + Math.floor(Math.random() * 3);
  const maxDelay = 1000; // ms
  
  for (let i = 0; i < ringCount; i++) {
    const isLatitude = Math.random() < 0.5;
    const delay = i * (maxDelay / ringCount);
    
    setTimeout(() => {
      if (isLatitude) {
        createLatitudeRing(lightTiles, params, animationTime);
      } else {
        createLongitudeRing(lightTiles, params, animationTime);
      }
    }, delay);
  }
}

/**
 * Activate light flares with the beat
 * @param {Object} lights - Object containing lights and flares
 * @param {number} time - Current animation time
 * @param {Object} audioData - Audio data for reactivity
 */
export function activateFlares(lights, time, audioData) {
  if (!lights || !lights.flares || !audioData) return;
  
  const { bass, mid, high } = audioData.bands;
  const bassLevel = bass / 255;
  const midLevel = mid / 255;
  const highLevel = high / 255;
  const isBeat = audioData.isBeat;
  
  // Only activate flares on beats with sufficient bass
  if (isBeat && bassLevel > 0.5) {
    // Determine color based on audio frequencies
    let flareColor;
    
    // Choose flare color based on dominant frequency
    if (bassLevel > midLevel && bassLevel > highLevel) {
      // Bass dominant - red/purple
      flareColor = new THREE.Color().setHSL(0.95, 0.9, 0.6);
    } else if (midLevel > highLevel) {
      // Mid dominant - green/yellow
      flareColor = new THREE.Color().setHSL(0.3, 0.9, 0.6); 
    } else {
      // High dominant - blue/cyan
      flareColor = new THREE.Color().setHSL(0.6, 0.9, 0.6);
    }
    
    // Determine flare intensity based on bass level
    const intensity = Math.min(3.0, 1.0 + bassLevel * 3.0);
    
    // Activate the flare light
    if (lights.flareLight) {
      lights.flareLight.color.copy(flareColor);
      lights.flareLight.intensity = intensity;
    }
    
    // Determine how many flares to activate based on beat strength
    let flareCount = Math.floor(4 + bassLevel * 8); // 4-12 flares
    flareCount = Math.min(flareCount, lights.flares.length);
    
    // Shuffle the flares array to randomize which ones activate
    const shuffledIndices = [...Array(lights.flares.length).keys()]
      .sort(() => Math.random() - 0.5);
    
    // Activate selected flares
    for (let i = 0; i < flareCount; i++) {
      const flareIndex = shuffledIndices[i];
      const flare = lights.flares[flareIndex];
      
      // Skip the burst effect for regular activation
      if (flare.userData.isBurst && Math.random() > 0.7) continue;
      
      // Activate the flare
      flare.visible = true;
      flare.userData.active = true;
      flare.userData.life = 0;
      
      // Set color
      flare.material.color.copy(flareColor);
      flare.userData.baseColor = flareColor.clone();
      
      // Set opacity based on beat strength
      flare.material.opacity = Math.min(1.0, 0.6 + bassLevel * 0.4);
      
      // Scale based on beat strength
      let scaleMultiplier;
      
      if (flare.userData.isBurst) {
        // Central burst effect
        scaleMultiplier = Math.min(3.0, 1.0 + bassLevel * 2.0);
        flare.scale.set(scaleMultiplier, scaleMultiplier, 1);
        flare.userData.maxLife = 0.4 + bassLevel * 0.4; // Shorter life for bursts
      } else if (flare.userData.isWide) {
        // Wide flares
        scaleMultiplier = Math.min(2.5, 1.0 + bassLevel * 1.5);
        flare.scale.set(scaleMultiplier, scaleMultiplier * (1.0 + bassLevel), 1);
        flare.userData.maxLife = 0.5 + bassLevel * 0.5; // Longer life for large flares
      } else {
        // Regular ray flares
        scaleMultiplier = Math.min(2.0, 1.0 + bassLevel * 1.0);
        flare.scale.set(scaleMultiplier * 0.5, scaleMultiplier * (1.5 + bassLevel * 1.5), 1);
        flare.userData.maxLife = 0.6 + bassLevel * 0.6; // Standard life
      }
    }
  }
  
  // Update all flares
  updateFlares(lights.flares, time, audioData);
  
  // Fade out flare light
  if (lights.flareLight && lights.flareLight.intensity > 0) {
    lights.flareLight.intensity *= 0.95; // Fade out quickly
  }
}

/**
 * Update light flares animation
 * @param {Array} flares - Array of flare meshes
 * @param {number} time - Current animation time
 * @param {Object} audioData - Audio data for reactivity
 */
function updateFlares(flares, time, audioData) {
  if (!flares || !audioData) return;
  
  const { bass, mid, high } = audioData.bands;
  const bassLevel = bass / 255;
  const midLevel = mid / 255;
  const highLevel = high / 255;
  
  flares.forEach(flare => {
    if (!flare.userData.active) return;
    
    // Update life counter
    flare.userData.life += 0.016; // Approximately 60fps
    
    // Calculate life progress
    const lifeProgress = flare.userData.life / flare.userData.maxLife;
    
    if (lifeProgress >= 1.0) {
      // Deactivate when life is over
      flare.visible = false;
      flare.userData.active = false;
      return;
    }
    
    // Update opacity with fade-out
    let fadeOutProgress;
    
    if (lifeProgress < 0.2) {
      // Quick fade in
      fadeOutProgress = lifeProgress / 0.2;
      flare.material.opacity = fadeOutProgress;
    } else {
      // Fade out
      fadeOutProgress = 1.0 - ((lifeProgress - 0.2) / 0.8);
      fadeOutProgress = fadeOutProgress * fadeOutProgress; // Quadratic falloff
      flare.material.opacity = fadeOutProgress;
    }
    
    // Update scale
    if (flare.userData.isBurst) {
      // Central burst grows rapidly, then fades
      const scale = 1.0 + lifeProgress * 2.0;
      flare.scale.set(scale, scale, 1);
    } else if (flare.userData.isWide) {
      // Wide flares maintain width but grow in length
      const length = 1.0 + (1.0 - fadeOutProgress) * 1.5;
      flare.scale.y = flare.userData.initialScale.y * length;
    } else {
      // Ray flares grow longer based on life
      const length = 1.0 + (1.0 - fadeOutProgress) * 2.0;
      flare.scale.y = flare.userData.initialScale.y * length;
      
      // Add some movement to ray flares
      const angle = flare.userData.angle;
      const wobble = Math.sin(time * 10 + angle * 5) * 0.05;
      flare.rotation.z = angle + wobble;
    }
    
    // Update color
    if (!flare.userData.isBurst && Math.random() < 0.05) {
      // Occasionally shift color for animated effect
      const hue = (flare.userData.baseColor.getHSL({ h: 0 }).h + Math.random() * 0.1 - 0.05) % 1;
      const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
      flare.material.color.lerp(color, 0.3);
    }
  });
}

/**
 * Schedule beat propagation through nearby tiles
 * @param {Array} lightTiles - Array of light tile objects
 * @param {Array} originIndices - Indices of origin tiles
 * @param {number} time - Current animation time
 * @param {number} intensity - Beat intensity
 * @param {Object} params - Light wall parameters
 */
export function scheduleBeatPropagation(lightTiles, originIndices, time, intensity, params) {
  const propagationSteps = 4 + Math.floor(intensity * 6); // More steps for stronger beats
  const propagationDelay = 50; // ms between steps
  const propagatedTiles = new Set(originIndices);
  
  // Create color to use for this propagation
  const colorIndex = Math.floor(Math.random() * params.colorSet.length);
  const propagationColor = new THREE.Color(params.colorSet[colorIndex]);
  
  // Propagate through multiple steps
  for (let step = 1; step <= propagationSteps; step++) {
    setTimeout(() => {
      // Find next tiles to propagate to
      const newTiles = new Set();
      
      // For each active tile
      propagatedTiles.forEach(tileIndex => {
        const tile = lightTiles[tileIndex];
        
        // Propagate to adjacent tiles
        tile.adjacentTiles.forEach(adjIndex => {
          if (!propagatedTiles.has(adjIndex)) {
            newTiles.add(adjIndex);
          }
        });
      });
      
      // Calculate intensity for this step
      const stepIntensity = intensity * (1 - (step / propagationSteps));
      
      // Activate the new tiles
      newTiles.forEach(tileIndex => {
        propagatedTiles.add(tileIndex);
        
        const tile = lightTiles[tileIndex];
        tile.active = true;
        tile.lastBeatTime = time;
        
        // Diminishing brightness as wave spreads
        tile.targetGlow = params.maxBrightness * stepIntensity;
        tile.glowAmount = tile.targetGlow;
        tile.material.emissiveIntensity = tile.glowAmount;
        
        // Use the propagation color with variation
        const hueShift = (Math.random() * 0.1) - 0.05; // ±0.05 hue shift
        const hsl = {};
        propagationColor.getHSL(hsl);
        hsl.h = (hsl.h + hueShift) % 1;
        
        const colorVariation = new THREE.Color().setHSL(
          hsl.h, 
          hsl.s,
          hsl.l * (0.9 + Math.random() * 0.2)
        );
        
        tile.material.emissive = colorVariation;
        tile.baseColor = colorVariation;
      });
      
    }, step * propagationDelay);
  }
}
