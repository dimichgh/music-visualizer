/**
 * Fractal Visualization Light Wall Updater
 * Handles updates to the light wall and background based on audio
 */

import * as THREE from 'three';
import { createTravelingLightPattern, scheduleBeatPropagation } from './sceneElements';

/**
 * Update the light wall based on audio input
 * @param {Array} lightTiles - Array of light tile objects
 * @param {THREE.Group} lightWall - The light wall group
 * @param {Object} params - Light wall parameters
 * @param {number} deltaTime - Time delta for animation
 * @param {number} time - Current animation time
 * @param {Object} audioData - Audio data for reactivity
 */
export function updateLightWall(lightTiles, lightWall, params, deltaTime, time, audioData) {
  if (!params.enabled || !lightTiles || !audioData) return;
  
  // Extract audio data
  const { bass, mid, high } = audioData.bands;
  const bassLevel = bass / 255;
  const midLevel = mid / 255;
  const highLevel = high / 255;
  const combinedLevel = (bassLevel + midLevel + highLevel) / 3;
  const isBeat = audioData.isBeat;
  
  // Get frequency spectrum for detailed visualization
  const freqData = audioData.frequencyData || [];
  
  // Add a slow rotation to the entire light wall
  if (lightWall) {
    lightWall.rotation.y += 0.001 * deltaTime * (1 + bassLevel * 0.3);
    lightWall.rotation.x += 0.0002 * deltaTime * (1 + midLevel * 0.2);
  }
  
  // Create wave effects that flow across the sphere
  const wavePhase1 = time * 0.5; // Slow wave
  const wavePhase2 = time * 1.2; // Faster wave
  
  // Create smooth brightness waves that travel across the sphere
  // Generate wave patterns
  const latitudeWave = [];
  const longitudeWave = [];
  
  for (let i = 0; i < 180; i++) {
    // Latitude waves (horizontal rings)
    latitudeWave[i] = Math.sin(i * (Math.PI/180) * 3 + wavePhase1) * 0.5 + 0.5;
    
    // Longitude waves (vertical rings)
    longitudeWave[i] = Math.sin(i * (Math.PI/180) * 4 + wavePhase2) * 0.5 + 0.5;
  }
  
  // Track active tiles for each beat type
  const hitTiles = new Set();
  
  // Process beat reaction
  if (isBeat) {
    // Stronger beat effect - more origins and brighter flares
    const beatOrigins = [];
    // Increase number of origins for more dramatic effect
    const beatCount = 2 + Math.floor(bassLevel * 4); // 2-6 origins based on bass strength
    
    // Create a synchronized flash effect across random tiles
    const flashCount = Math.floor(lightTiles.length * (0.05 + bassLevel * 0.15)); // 5-20% of tiles flash
    const flashTiles = new Set();
    
    // Select random tiles to flash
    while (flashTiles.size < flashCount) {
      flashTiles.add(Math.floor(Math.random() * lightTiles.length));
    }
    
    // Apply quick intense flash to selected tiles
    flashTiles.forEach(tileIndex => {
      const tile = lightTiles[tileIndex];
      const flashIntensity = params.maxBrightness * 2.0 * (0.7 + bassLevel * 0.3);
      
      // Create a bright flash that fades quickly
      tile.active = true;
      tile.lastBeatTime = time;
      tile.targetGlow = flashIntensity;
      tile.glowAmount = flashIntensity; // Immediate bright flash
      tile.material.emissiveIntensity = flashIntensity;
      
      // Choose vibrant flash color
      const colorIndex = Math.floor(Math.random() * params.colorSet.length);
      const flashColor = new THREE.Color(params.colorSet[colorIndex]).multiplyScalar(1.5);
      tile.material.emissive = flashColor;
      
      hitTiles.add(tileIndex);
    });
    
    // Select main propagation origins
    for (let i = 0; i < beatCount; i++) {
      const originIndex = Math.floor(Math.random() * lightTiles.length);
      beatOrigins.push(originIndex);
      
      // Immediately activate the origin tile with enhanced brightness
      const originTile = lightTiles[originIndex];
      originTile.active = true;
      originTile.lastBeatTime = time;
      originTile.targetGlow = params.maxBrightness * 1.5 * bassLevel;
      originTile.glowAmount = originTile.targetGlow; // Immediate response
      
      // Choose random beat color with higher intensity
      const colorIndex = Math.floor(Math.random() * params.colorSet.length);
      const beatColor = new THREE.Color(params.colorSet[colorIndex]).multiplyScalar(1.3);
      originTile.material.emissive = beatColor;
      originTile.baseColor = beatColor;
      
      hitTiles.add(originIndex);
    }
    
    // More aggressive propagation on beats
    if (bassLevel > 0.4) { // Lower threshold to create more frequent propagations
      scheduleBeatPropagation(lightTiles, beatOrigins, time, Math.min(1.0, bassLevel * 1.3), params);
    }
    
    // More frequent traveling light patterns on beats
    if (bassLevel > 0.5 && Math.random() < 0.6) { // Increased probability
      createTravelingLightPattern(lightTiles, params, time);
    }
    
    // Create multiple traveling patterns for strong beats
    if (bassLevel > 0.8 && Math.random() < 0.7) {
      // Add a second pattern with a slight delay
      setTimeout(() => {
        createTravelingLightPattern(lightTiles, params, time + 0.1, 
          Math.floor(Math.random() * 4)); // Random pattern type
      }, 100);
    }
  }
  
    // Update each tile
    lightTiles.forEach((tile, index) => {
      // Skip if already processed as part of beat propagation
      if (hitTiles.has(index)) return;
      
      // Get the tile's color as a hex value for color-based behavior
      const colorHex = tile.baseColor.getHexString();
      
      // Determine behavior based on color - we'll check the most dominant color component
      // Convert hex to RGB components for simple comparison
      const r = parseInt(colorHex.substr(0, 2), 16);
      const g = parseInt(colorHex.substr(2, 2), 16);
      const b = parseInt(colorHex.substr(4, 2), 16);
      
      let colorBehavior = "default"; // Default behavior
      
      // Red/pink tiles (ff3366, ff3333) - react strongly to beats
      if (r > g && r > b && r > 200) {
        colorBehavior = "beats";
      }
      // Green tiles (33ff66) - react to energy (high + mid frequencies)
      else if (g > r && g > b && g > 200) {
        colorBehavior = "energy";
      }
      // Blue tiles (33aaff, 33ffff) - react to calmness and twinkle like stars
      else if (b > r && b > 150 && b > g * 0.8) {
        colorBehavior = "calm";
      }
      // Yellow/orange tiles (ffaa33, ffff33) - react to mid frequencies
      else if (r > 200 && g > 150 && b < 100) {
        colorBehavior = "mids";
      }
      // Purple tiles (aa33ff) - react to bass frequencies
      else if (r > 100 && b > 200 && g < 100) {
        colorBehavior = "bass";
      }
      
      // Store original scale for reference
    if (!tile.originalScale) {
      tile.originalScale = tile.mesh.scale.clone();
    }
    
    // Get specific frequency data for this tile based on its position
    let freqValue = 0;
    if (freqData.length > 0) {
      // Get average of frequency range this tile responds to
      const { min, max } = tile.freqResponseRange;
      let sum = 0;
      let count = 0;
      for (let i = min; i <= max && i < freqData.length; i++) {
        sum += freqData[i];
        count++;
      }
      freqValue = count > 0 ? (sum / count) / 255 : 0;
    }
    
    // Default low ambient pulsing based on position
    let basePulse = Math.sin(time * tile.pulseSpeed + tile.pulsePhase) * 0.1;
    
    // Add wave patterns with audio reactivity
    const latValue = latitudeWave[Math.floor(tile.latitude)] || 0;
    const longValue = longitudeWave[Math.floor(tile.longitude % 180)] || 0;
    const waveFactor = (latValue * 0.6 + longValue * 0.4) * midLevel;
    
    // Determine frequency band influence by position
    let bandInfluence;
    if (tile.latitude < 60) {
      // Top section reacts to highs
      bandInfluence = highLevel;
    } else if (tile.latitude < 120) {
      // Middle section reacts to mids 
      bandInfluence = midLevel;
    } else {
      // Bottom section reacts to bass
      bandInfluence = bassLevel;
    }
    
    // Calculate target glow amount based on color behavior
    let targetGlow = params.baseBrightness + basePulse;
    
    // Apply different behaviors based on color type
    switch (colorBehavior) {
      case "beats":
        // Red/pink tiles - strong reaction to beats
        if (isBeat) {
          // Increase glow dramatically on beats
          targetGlow += 2.0 * bassLevel + 1.0 * midLevel;
          // Give a random chance to become extra bright on beats
          if (Math.random() < 0.7) {
            targetGlow *= 1.5;
          }
        } else {
          // Add subtle reaction to overall energy at other times
          targetGlow += combinedLevel * 0.4;
        }
        break;
        
      case "energy":
        // Green tiles - react to energy (high + mid frequencies)
        // Energy is represented by combination of high and mid frequencies
        const energyLevel = (highLevel * 0.6 + midLevel * 0.4);
        targetGlow += energyLevel * params.reactiveFactor * 1.2;
        
        // Add extra brightness during high energy moments
        if (energyLevel > 0.6) {
          targetGlow += (energyLevel - 0.6) * 2.0;
        }
        
        // Add some variation with time
        targetGlow += 0.3 * Math.sin(time * 1.5 + tile.pulsePhase);
        break;
        
      case "calm":
        // Blue tiles - calm twinkling like stars
        // These are less reactive to beats but twinkle randomly
        
        // Add subtle background pulsing
        targetGlow += highLevel * 0.3 + 0.1;
        
        // Random twinkling effect - each tile twinkles independently
        const twinkleFactor = 0.3 * Math.sin(time * (1.0 + Math.sin(tile.pulsePhase * 5) * 0.5) + tile.pulsePhase * 10);
        targetGlow += twinkleFactor;
        
        // Occasionally make a tile extra bright like a twinkling star
        if (Math.random() < 0.001) {
          tile.active = true;
          tile.lastBeatTime = time;
          targetGlow += 1.0;
        }
        break;
        
      case "mids":
        // Yellow/orange tiles - react to mid frequencies
        targetGlow += midLevel * params.reactiveFactor * 1.2;
        
        // Add some extra flash on certain frequency patterns
        if (midLevel > 0.5 && Math.random() < midLevel * 0.3) {
          targetGlow += midLevel * 0.7;
        }
        
        // Add subtle rhythmic pulsing
        targetGlow += 0.2 * Math.sin(time * 3.0 + tile.pulsePhase);
        break;
        
      case "bass":
        // Purple tiles - react to bass frequencies
        targetGlow += bassLevel * params.reactiveFactor * 1.5;
        
        // Add a strong reaction to beats
        if (isBeat) {
          targetGlow += bassLevel * 1.3;
        }
        
        // Add slow pulsing effect
        targetGlow += 0.2 * Math.sin(time * 0.7 + tile.pulsePhase);
        break;
        
      default:
        // Default behavior - similar to original code
        // Add wave patterns
        targetGlow += waveFactor * 0.3;
        
        // Add frequency response
        targetGlow += freqValue * params.reactiveFactor * bandInfluence;
        
        // Strong reaction to the band this tile is attuned to
        targetGlow += bandInfluence * params.reactiveFactor * 0.4;
        break;
    }
    
    // Enhanced beat reaction fadeout with stronger initial flash
    if (tile.active) {
      const timeSinceBeat = time - tile.lastBeatTime;
      if (timeSinceBeat < 0.7) { // Longer flash duration
        // More dramatic flash effect with slower initial decay
        let fadeEffect;
        if (timeSinceBeat < 0.15) {
          // Very bright initial flash that holds longer
          fadeEffect = 1.0;
        } else {
          // Cubic easing for a more dramatic pulse shape
          const normalizedTime = (timeSinceBeat - 0.15) / 0.55;
          fadeEffect = 1 - (normalizedTime * normalizedTime * normalizedTime);
        }
        
        // Stronger flash intensity that varies with the beat strength
        const beatStrength = bandInfluence * 2.0;
        targetGlow += fadeEffect * (2.5 + beatStrength) * bassLevel;
        
        // Add subtle color shift during flash
        if (timeSinceBeat < 0.2 && Math.random() < 0.08) {
          const hue = (time * 0.1 + tile.pulsePhase) % 1;
          const flashColor = new THREE.Color().setHSL(hue, 0.9, 0.6);
          tile.material.emissive.lerp(flashColor, 0.3);
        }
      } else {
        // Beat has finished but leave a subtle afterglow
        tile.active = false;
        // Add a subtle lingering glow
        targetGlow += 0.2 * bassLevel;
      }
    }
    
    // Ensure glow is within reasonable limits
    targetGlow = Math.max(
      params.baseBrightness * 0.5, 
      Math.min(params.maxBrightness, targetGlow)
    );
    
    // Smooth transition to target glow value
    tile.glowAmount = tile.glowAmount + (targetGlow - tile.glowAmount) * 0.2;
    
    // Apply glow amount to the material
    tile.material.emissiveIntensity = tile.glowAmount * params.glowIntensity;
    
    // Update tile color based on frequency and current energy
    if (Math.random() < 0.01 && freqValue > 0.7) {
      // Occasionally shift colors for high-energy frequencies
      const hue = (bassLevel * 0.8 + midLevel * 0.2) % 1;
      const saturation = 0.8 + highLevel * 0.2;
      const brightness = 0.5 + midLevel * 0.3;
      
      const newColor = new THREE.Color().setHSL(hue, saturation, brightness);
      tile.material.emissive = newColor;
      tile.baseColor = newColor;
    } else if (!tile.active) {
      // Gradually return to base color
      tile.material.emissive.lerp(tile.baseColor, 0.05);
    }
    
    // Update the base color
    tile.material.color.copy(tile.baseColor.clone().multiplyScalar(0.4));
    
    // Enhance clearcoat on bright tiles
    if (tile.material.clearcoat !== undefined) {
      tile.material.clearcoat = 0.5 + Math.min(0.5, tile.glowAmount * 0.3);
    }
    
    // Apply enhanced beat-based expansion to tile size
    if (isBeat && params.beatExpansion) {
      // Calculate expansion factor based on frequency response and beat intensity with stronger effect
      let expansionFactor = 1.0;
      
      if (tile.latitude < 60) {
        // Top section expands with highs - stronger effect
        expansionFactor += highLevel * params.beatExpansion * 3.0;
      } else if (tile.latitude < 120) {
        // Middle section expands with mids - stronger effect
        expansionFactor += midLevel * params.beatExpansion * 2.5;
      } else {
        // Bottom section expands with bass - stronger effect
        expansionFactor += bassLevel * params.beatExpansion * 2.2;
      }
      
      // Enhanced reactivity to individual frequency
      expansionFactor += freqValue * params.beatExpansion * 1.0;
      
      // Add stronger reaction to beats
      if (audioData.isBeat && combinedLevel > 0.6) {
        expansionFactor += combinedLevel * 0.5;
      }
      
      // Apply expansion with immediate effect for more impact
      tile.mesh.scale.copy(tile.originalScale.clone().multiplyScalar(expansionFactor));
      
      // Store the expansion time to track when to start contracting
      tile.lastExpansionTime = time;
      tile.expansionFactor = expansionFactor;
      tile.isExpanded = true;
    } else if (!isBeat) {
      // Handle contraction after expansion
      if (tile.isExpanded) {
        const timeSinceExpansion = time - tile.lastExpansionTime;
        if (timeSinceExpansion > 0.1) { // Shorter delay before contraction starts for quicker response
          // Calculate contraction progress
          const contractionDuration = 0.5; // Slightly longer contraction for more bounce
          const contractionProgress = Math.min(1.0, (timeSinceExpansion - 0.1) / contractionDuration);
          
          if (contractionProgress >= 1.0) {
            // Contraction complete
            tile.isExpanded = false;
          } else {
            // Apply enhanced elastic easing for a more dramatic bouncy effect
            const t = contractionProgress;
            // Improved elastic easing function with more pronounced bounce
            const elasticFactor = Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 6 * Math.PI) + 1;
            const currentFactor = 1.0 + (tile.expansionFactor - 1.0) * (1.0 - elasticFactor);
            
            // Apply the current scale factor
            tile.mesh.scale.copy(tile.originalScale.clone().multiplyScalar(currentFactor));
          }
        }
      } else {
        // Enhanced gradual pulsing based on audio intensity during non-beat times
        const pulseStrength = bandInfluence * 0.3; // Increased pulse strength
        const pulseFactor = 1.0 + (pulseStrength * Math.sin(time * (2 + pulseStrength) + tile.pulsePhase));
        
        // Smoothly interpolate towards the target scale
        if (tile.mesh && tile.originalScale) {
          tile.mesh.scale.lerp(
            tile.originalScale.clone().multiplyScalar(pulseFactor), 
            0.05 + (bandInfluence * 0.1) // Faster interpolation with higher audio energy
          );
        }
      }
    }
  });
}

/**
 * Update the background walls based on audio
 * @param {Object} backgroundElements - Object containing wall elements
 * @param {Object} backgroundParams - Parameters for background appearance
 * @param {number} deltaTime - Time delta for animation
 * @param {number} animationFrame - Current animation frame
 * @param {Object} audioData - Audio data for reactivity
 */
export function updateBackground(backgroundElements, backgroundParams, deltaTime, animationFrame, audioData) {
  if (!audioData) return;
  
  // Extract audio data
  const bassLevel = audioData.bands.bass / 255;
  const midLevel = audioData.bands.mid / 255;
  const highLevel = audioData.bands.high / 255;
  const isBeat = audioData.isBeat;
  
  // Update main wall color based on audio
  if (backgroundElements.wallMesh && backgroundElements.wallMesh.material) {
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
    backgroundParams.currentColor.lerp(
      targetColor, 
      backgroundParams.transitionSpeed * deltaTime
    );
    
    // Update the wall material color
    backgroundElements.wallMesh.material.color.copy(backgroundParams.currentColor);
  }
  
  // Update accent walls
  if (backgroundElements.accentWalls) {
    backgroundElements.accentWalls.forEach((wall, i) => {
      // Make each wall respond to a different frequency band
      let intensity = 0;
      
      switch (i % 4) {
        case 0: // Back wall - bass
          intensity = bassLevel;
          if (isBeat) {
            // Pulse on beat - stronger effect
            wall.material.opacity = Math.min(0.3 + bassLevel * 0.6, 0.9); // Increased max opacity
            wall.material.emissiveIntensity = 0.4 + bassLevel * 0.8; // Increased intensity
          } else {
            // Normal state
            wall.material.opacity = backgroundParams.wallOpacity * 0.7;
            wall.material.emissiveIntensity = 0.1 + bassLevel * 0.3;
          }
          break;
          
        case 1: // Right wall - mids
          intensity = midLevel;
          // Constant subtle pulsing
          wall.material.opacity = backgroundParams.wallOpacity * 0.7 * 
            (1 + midLevel * 0.5 * Math.sin(animationFrame * 0.01));
          wall.material.emissiveIntensity = 0.1 + midLevel * 0.4;
          break;
          
        case 2: // Left wall - highs
          intensity = highLevel;
          // Quick pulsing based on highs
          wall.material.opacity = backgroundParams.wallOpacity * 0.7 * 
            (1 + highLevel * 0.3 * Math.sin(animationFrame * 0.02));
          wall.material.emissiveIntensity = 0.1 + highLevel * 0.5;
          break;
          
        case 3: // Floor - all frequencies
          intensity = (bassLevel + midLevel + highLevel) / 3;
          // Floor reacts to overall level
          wall.material.opacity = backgroundParams.wallOpacity * 0.8 * 
            (1 + intensity * 0.6);
          wall.material.emissiveIntensity = 0.1 + intensity * 0.3;
          break;
      }
      
      // Create an enhanced color based on the original but brighter with intensity
      const enhancedColor = wall.baseColor.clone().multiplyScalar(1 + intensity * 1.5);
      wall.material.emissive.copy(enhancedColor).multiplyScalar(0.4);
      
      // Strong flash on beat for random walls - more frequent and brighter
      if (isBeat && Math.random() < 0.4) { // Increased probability
        wall.material.emissiveIntensity = 0.9; // Brighter flash
        setTimeout(() => {
          wall.material.emissiveIntensity = 0.1 + 
            (i % 3 === 0 ? bassLevel : i % 3 === 1 ? midLevel : highLevel) * 0.4;
        }, 100 + Math.random() * 150);
      }
    });
  }
}
