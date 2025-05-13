/**
 * Visualization module that provides different visualization themes
 * Each visualization function returns an object with a render method
 */

// Common utility functions for visualizations
const randRange = (min, max) => Math.random() * (max - min) + min;
const mapRange = (value, inMin, inMax, outMin, outMax) => 
  ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

/**
 * Creates a cosmic-themed visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createCosmicVisualization = (ctx, dimensions) => {
  // Generate stars for background
  const stars = Array(100).fill().map(() => ({
    x: Math.random() * dimensions.width,
    y: Math.random() * dimensions.height,
    radius: Math.random() * 2,
    opacity: Math.random(),
    twinkleSpeed: Math.random() * 0.05
  }));

  // Particle system for cosmic dust
  const particles = Array(200).fill().map(() => ({
    x: Math.random() * dimensions.width,
    y: Math.random() * dimensions.height,
    size: randRange(1, 4),
    speedX: randRange(-0.5, 0.5),
    speedY: randRange(-0.5, 0.5),
    color: `hsl(${randRange(220, 280)}, 80%, 70%)`,
    opacity: randRange(0.1, 0.7)
  }));

  // Visualization state
  let rotation = 0;
  
  // Render function that updates the visualization
  const render = (audioData) => {
    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);
    
    // Draw space background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#000531');
    gradient.addColorStop(1, '#1A0254');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw stars
    stars.forEach(star => {
      star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.05;
      star.opacity = Math.max(0.1, Math.min(1, star.opacity));
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
    });
    
    // Audio reactivity
    let bassLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    let isBeat = false;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
      highLevel = audioData.bands.high / 255;
      isBeat = audioData.isBeat;
    }
    
    // Update rotation based on mid frequencies
    rotation += 0.002 + (midLevel * 0.01);
    
    // Draw central cosmic entity
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 100 + (bassLevel * 50);
    
    // Draw glow
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.2,
      centerX, centerY, radius * 2
    );
    glowGradient.addColorStop(0, `rgba(120, 0, 255, ${0.4 + bassLevel * 0.3})`);
    glowGradient.addColorStop(1, 'rgba(120, 0, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw cosmic rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = radius * (1 + i * 0.4);
      const thickness = 2 + highLevel * 5;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${280 + i * 20}, 100%, 70%, ${0.3 + midLevel * 0.5})`;
      ctx.lineWidth = thickness;
      ctx.stroke();
    }
    
    // Draw reactive cosmic disc
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    
    // Draw frequency visualization around the disc
    if (audioData && audioData.frequencyData) {
      const barCount = Math.min(100, audioData.frequencyData.length / 8);
      
      for (let i = 0; i < barCount; i++) {
        const value = audioData.frequencyData[i * 8] / 255;
        const angle = (i / barCount) * Math.PI * 2;
        
        const innerRadius = radius;
        const outerRadius = innerRadius + value * 80;
        
        const x1 = innerRadius * Math.cos(angle);
        const y1 = innerRadius * Math.sin(angle);
        const x2 = outerRadius * Math.cos(angle);
        const y2 = outerRadius * Math.sin(angle);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsla(${280 - i}, 100%, 60%, ${value * 0.8 + 0.2})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
    
    // Update and draw particles
    particles.forEach(particle => {
      particle.x += particle.speedX * (1 + midLevel * 2);
      particle.y += particle.speedY * (1 + midLevel * 2);
      
      // Wrap around edges
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
      
      // Draw particle
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1 + highLevel), 0, Math.PI * 2);
      ctx.fill();
    });
    
    // If beat detected, add flash effect
    if (isBeat) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }
    
    ctx.globalAlpha = 1;
  };
  
  return { render };
};

/**
 * Creates a weather-themed visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createWeatherVisualization = (ctx, dimensions) => {
  // Raindrops
  const raindrops = Array(100).fill().map(() => ({
    x: Math.random() * dimensions.width,
    y: Math.random() * dimensions.height,
    length: randRange(10, 30),
    speed: randRange(10, 20),
    thickness: randRange(1, 3)
  }));
  
  // Lightning bolts
  const lightningPoints = [];
  const createLightning = (startX, startY, angle, length, branchProbability = 0.3, width = 3) => {
    if (length < 5) return;
    
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    
    lightningPoints.push({
      startX,
      startY,
      endX,
      endY,
      width,
      alpha: 1
    });
    
    // Chance to create a branch
    if (Math.random() < branchProbability) {
      const branchAngle = angle + randRange(-Math.PI / 4, Math.PI / 4);
      createLightning(startX, startY, branchAngle, length * 0.7, branchProbability * 0.7, width * 0.7);
    }
    
    // Continue the main lightning bolt
    createLightning(endX, endY, angle + randRange(-0.2, 0.2), length * 0.8, branchProbability, width);
  };
  
  let lightningTimer = 0;
  let cloudOpacity = 0.7;
  
  const render = (audioData) => {
    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);
    
    // Sky gradient background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#1A214D');
    skyGradient.addColorStop(1, '#394A6D');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Audio reactivity
    let bassLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    let isBeat = false;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
      highLevel = audioData.bands.high / 255;
      isBeat = audioData.isBeat;
    }
    
    // Draw clouds
    const drawCloud = (x, y, size) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.arc(x + size * 0.5, y - size * 0.4, size * 0.7, 0, Math.PI * 2);
      ctx.arc(x - size * 0.5, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
      ctx.arc(x + size, y + size * 0.2, size * 0.6, 0, Math.PI * 2);
      ctx.arc(x - size, y + size * 0.2, size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 200, 220, ${cloudOpacity})`;
      ctx.fill();
    };
    
    // Adjust cloud opacity based on high frequencies
    cloudOpacity = 0.5 + highLevel * 0.3;
    
    // Draw several clouds
    drawCloud(width * 0.2, height * 0.2, 40 + bassLevel * 20);
    drawCloud(width * 0.5, height * 0.15, 50 + midLevel * 25);
    drawCloud(width * 0.8, height * 0.25, 45 + highLevel * 22);
    drawCloud(width * 0.3, height * 0.3, 35 + bassLevel * 15);
    
    // Update and draw raindrops
    const rainIntensity = 1 + midLevel * 3;
    raindrops.forEach(drop => {
      drop.y += drop.speed * rainIntensity;
      if (drop.y > height) {
        drop.y = 0;
        drop.x = Math.random() * width;
        drop.length = randRange(10, 30) * (1 + bassLevel);
      }
      
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.1, drop.y + drop.length);
      ctx.strokeStyle = `rgba(200, 230, 255, ${0.5 + highLevel * 0.5})`;
      ctx.lineWidth = drop.thickness;
      ctx.stroke();
    });
    
    // Lightning effect on beats
    if (isBeat && Math.random() < 0.3) {
      lightningPoints.length = 0; // Clear previous lightning
      const startX = Math.random() * width;
      createLightning(startX, 0, Math.PI / 2, 100 + bassLevel * 100);
      lightningTimer = 5;
      
      // Flash effect
      ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + bassLevel * 0.3})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Draw lightning if it exists
    if (lightningTimer > 0) {
      lightningPoints.forEach(segment => {
        ctx.beginPath();
        ctx.moveTo(segment.startX, segment.startY);
        ctx.lineTo(segment.endX, segment.endY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${segment.alpha})`;
        ctx.lineWidth = segment.width;
        ctx.stroke();
        
        // Add glow
        ctx.beginPath();
        ctx.moveTo(segment.startX, segment.startY);
        ctx.lineTo(segment.endX, segment.endY);
        ctx.strokeStyle = `rgba(100, 180, 255, ${segment.alpha * 0.7})`;
        ctx.lineWidth = segment.width * 3;
        ctx.stroke();
        
        segment.alpha *= 0.9;
      });
      
      lightningTimer--;
    }
    
    // Frequency visualization at the bottom
    if (audioData && audioData.frequencyData) {
      const barWidth = width / 64;
      
      for (let i = 0; i < 64; i++) {
        const value = audioData.frequencyData[i] / 255;
        
        ctx.fillStyle = `rgba(120, 180, 255, ${0.5 + value * 0.5})`;
        const barHeight = value * height * 0.3;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      }
    }
  };
  
  return { render };
};

/**
 * Creates a night sky-themed visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createNightSkyVisualization = (ctx, dimensions) => {
  // Generate stars
  const stars = Array(300).fill().map(() => ({
    x: Math.random() * dimensions.width,
    y: Math.random() * dimensions.height,
    radius: Math.random() * 2 + 0.5,
    brightness: Math.random(),
    twinkleSpeed: Math.random() * 0.03,
    twinkleOffset: Math.random() * Math.PI * 2
  }));
  
  // Generate a moon
  const moon = {
    x: dimensions.width * 0.8,
    y: dimensions.height * 0.2,
    radius: 60,
    craters: Array(7).fill().map(() => ({
      x: randRange(-0.6, 0.6),
      y: randRange(-0.6, 0.6),
      radius: randRange(3, 10)
    }))
  };
  
  // Constellation dots and lines
  const constellations = [
    {
      points: [
        { x: 0.3, y: 0.2 },
        { x: 0.35, y: 0.25 },
        { x: 0.4, y: 0.22 },
        { x: 0.38, y: 0.15 },
        { x: 0.32, y: 0.18 }
      ],
      connections: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 0]
      ]
    },
    {
      points: [
        { x: 0.6, y: 0.7 },
        { x: 0.65, y: 0.75 },
        { x: 0.7, y: 0.72 },
        { x: 0.67, y: 0.67 },
      ],
      connections: [
        [0, 1], [1, 2], [2, 3], [3, 0]
      ]
    },
    {
      points: [
        { x: 0.2, y: 0.6 },
        { x: 0.25, y: 0.65 },
        { x: 0.3, y: 0.58 },
        { x: 0.2, y: 0.52 },
      ],
      connections: [
        [0, 1], [1, 2], [2, 3], [3, 0]
      ]
    }
  ];
  
  // Northern Lights effect
  const northernLights = {
    waves: Array(5).fill().map((_, i) => ({
      height: 0.4 + i * 0.05,
      frequency: 0.002 + i * 0.001,
      speed: 0.0005 + i * 0.0002,
      offset: Math.random() * Math.PI * 2,
      color: `hsla(${120 + i * 15}, 100%, 70%, 0.2)`
    })),
    time: 0
  };
  
  const render = (audioData) => {
    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);
    
    // Night sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#000819');
    gradient.addColorStop(1, '#0D1F2D');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Audio reactivity
    let bassLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    let isBeat = false;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
      highLevel = audioData.bands.high / 255;
      isBeat = audioData.isBeat;
    }
    
    // Draw Northern Lights
    northernLights.time += 0.01 + midLevel * 0.05;
    
    ctx.globalCompositeOperation = 'lighter';
    northernLights.waves.forEach(wave => {
      ctx.beginPath();
      
      for (let x = 0; x < width; x += 5) {
        const normalizedX = x / width;
        const waveHeight = Math.sin(normalizedX * wave.frequency * width + wave.offset + northernLights.time * wave.speed) * 50 * (1 + midLevel * 2);
        const y = height * wave.height + waveHeight;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      // Create gradient for each wave
      const waveGradient = ctx.createLinearGradient(0, height * wave.height - 50, 0, height);
      waveGradient.addColorStop(0, wave.color);
      waveGradient.addColorStop(1, 'rgba(0, 20, 40, 0)');
      
      ctx.fillStyle = waveGradient;
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw stars with twinkling
    stars.forEach(star => {
      const time = Date.now() * star.twinkleSpeed + star.twinkleOffset;
      const twinkle = (Math.sin(time) + 1) / 2; // 0 to 1
      const brightness = 0.5 + star.brightness * 0.5 + twinkle * 0.3 + highLevel * 0.2;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * (1 + highLevel * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fill();
      
      // Add glow for brighter stars
      if (star.brightness > 0.7 || isBeat) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3 * (1 + highLevel), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${(star.brightness - 0.7) * 0.3 + 0.05 + (isBeat ? 0.1 : 0)})`;
        ctx.fill();
      }
    });
    
    // Draw moon
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius * (1 + bassLevel * 0.2), 0, Math.PI * 2);
    const moonGradient = ctx.createRadialGradient(
      moon.x - moon.radius * 0.3, moon.y - moon.radius * 0.3, 0,
      moon.x, moon.y, moon.radius
    );
    moonGradient.addColorStop(0, 'rgba(255, 255, 240, 1)');
    moonGradient.addColorStop(1, 'rgba(220, 220, 210, 0.9)');
    ctx.fillStyle = moonGradient;
    ctx.fill();
    
    // Draw moon craters
    moon.craters.forEach(crater => {
      ctx.beginPath();
      ctx.arc(
        moon.x + crater.x * moon.radius, 
        moon.y + crater.y * moon.radius, 
        crater.radius, 
        0, Math.PI * 2
      );
      ctx.fillStyle = 'rgba(180, 180, 180, 0.4)';
      ctx.fill();
    });
    
    // Add moon glow
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius * 1.5 * (1 + bassLevel * 0.3), 0, Math.PI * 2);
    const glowGradient = ctx.createRadialGradient(
      moon.x, moon.y, moon.radius,
      moon.x, moon.y, moon.radius * 1.5
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 230, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 230, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Draw constellations with audio reactivity
    constellations.forEach(constellation => {
      // Calculate absolute positions
      const points = constellation.points.map(p => ({
        x: p.x * width,
        y: p.y * height
      }));
      
      // Draw connecting lines
      ctx.beginPath();
      constellation.connections.forEach(([fromIdx, toIdx]) => {
        ctx.moveTo(points[fromIdx].x, points[fromIdx].y);
        ctx.lineTo(points[toIdx].x, points[toIdx].y);
      });
      ctx.strokeStyle = `rgba(180, 210, 255, ${0.2 + midLevel * 0.3})`;
      ctx.lineWidth = 1 + midLevel * 2;
      ctx.stroke();
      
      // Draw points
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2 + highLevel * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 240, 255, ${0.7 + highLevel * 0.3})`;
        ctx.fill();
      });
    });
    
    // Frequency visualization as mountain silhouette
    if (audioData && audioData.frequencyData) {
      ctx.beginPath();
      ctx.moveTo(0, height);
      
      const pointCount = 100;
      for (let i = 0; i < pointCount; i++) {
        const x = (i / pointCount) * width;
        const frequencyIndex = Math.floor(i / pointCount * 64);
        const value = audioData.frequencyData[frequencyIndex] / 255;
        const y = height - value * height * 0.3;
        
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(width, height);
      ctx.closePath();
      
      ctx.fillStyle = 'rgba(10, 20, 30, 0.7)';
      ctx.fill();
    }
  };
  
  return { render };
};

/**
 * Creates a concert-themed visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createConcertVisualization = (ctx, dimensions) => {
  // Light beams
  const beams = Array(8).fill().map((_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    width: randRange(0.05, 0.15),
    color: `hsl(${randRange(0, 360)}, 100%, 50%)`,
    speed: randRange(0.005, 0.02) * (Math.random() > 0.5 ? 1 : -1),
    active: false
  }));
  
  // Crowd figures
  const crowdFigures = Array(30).fill().map(() => ({
    x: randRange(0, dimensions.width),
    width: randRange(20, 40),
    height: randRange(40, 60),
    armPhase: Math.random() * Math.PI * 2,
    armSpeed: randRange(0.02, 0.05)
  }));
  
  // Instrument figures (transparent)
  const instruments = [
    { name: 'guitar', x: dimensions.width * 0.3, y: dimensions.height * 0.4, freqRange: 'midLow' },
    { name: 'drums', x: dimensions.width * 0.5, y: dimensions.height * 0.4, freqRange: 'bass' },
    { name: 'keyboard', x: dimensions.width * 0.7, y: dimensions.height * 0.4, freqRange: 'mid' },
    { name: 'vocals', x: dimensions.width * 0.5, y: dimensions.height * 0.35, freqRange: 'high' }
  ];
  
  let time = 0;
  let lastBeat = 0;
  
  const render = (audioData) => {
    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);
    
    // Concert setting background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    time += 0.03;
    
    // Audio reactivity
    let bassLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    let isBeat = false;
    
    if (audioData) {
      bassLevel = audioData.bands.bass / 255;
      midLevel = audioData.bands.mid / 255;
      highLevel = audioData.bands.high / 255;
      isBeat = audioData.isBeat;
      
      // Update beam activity based on audio
      beams.forEach((beam, i) => {
        if (i < 4) {
          beam.active = bassLevel > 0.5 || (isBeat && Math.random() > 0.5);
        } else {
          beam.active = highLevel > 0.4 || (time - lastBeat < 10 && i % 2 === 0);
        }
      });
      
      if (isBeat) {
        lastBeat = time;
      }
    }
    
    // Draw stage
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.lineTo(width, height * 0.6);
    ctx.lineTo(0, height * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Draw crowd
    const crowdHeight = height * 0.4;
    const floorY = height * 0.95;
    
    // Crowd background
    const crowdGradient = ctx.createLinearGradient(0, height - crowdHeight, 0, floorY);
    crowdGradient.addColorStop(0, 'rgba(30, 30, 40, 0.8)');
    crowdGradient.addColorStop(1, 'rgba(20, 20, 30, 0.9)');
    ctx.fillStyle = crowdGradient;
    ctx.fillRect(0, height - crowdHeight, width, crowdHeight);
    
    // Draw crowd figures
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    crowdFigures.forEach(figure => {
      figure.armPhase += figure.armSpeed * (1 + bassLevel);
      
      // Body
      ctx.beginPath();
      ctx.rect(figure.x - figure.width / 2, floorY - figure.height, figure.width, figure.height);
      ctx.fill();
      
      // Arms
      const armLength = figure.height * 0.4;
      const armX = figure.x;
      const armY = floorY - figure.height * 0.8;
      const armAngle = Math.sin(figure.armPhase) * 0.5 + 0.5; // 0 to 1
      
      ctx.beginPath();
      ctx.moveTo(armX, armY);
      ctx.lineTo(armX - armLength * Math.cos(armAngle * Math.PI), armY - armLength * Math.sin(armAngle * Math.PI));
      ctx.moveTo(armX, armY);
      ctx.lineTo(armX + armLength * Math.cos(armAngle * Math.PI), armY - armLength * Math.sin(armAngle * Math.PI));
      ctx.lineWidth = figure.width * 0.2;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.stroke();
    });
    
    // Light beams from the top of the stage
    ctx.globalCompositeOperation = 'lighter';
    
    beams.forEach(beam => {
      if (!beam.active) return;
      
      beam.angle += beam.speed;
      
      const centerX = width / 2;
      const sourceY = 0;
      
      const beamLength = height;
      const beamWidth = Math.PI * beam.width;
      
      const gradient = ctx.createConicalGradient(centerX, sourceY, beam.angle);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(beam.width / 2, beam.color);
      gradient.addColorStop(beam.width, 'transparent');
      gradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.moveTo(centerX, sourceY);
      ctx.arc(centerX, sourceY, beamLength, beam.angle - beamWidth / 2, beam.angle + beamWidth / 2);
      ctx.closePath();
      
      ctx.fillStyle = gradient;
      ctx.fill();
    });
    
    // Draw transparent instrument figures when their frequency range is active
    instruments.forEach(instrument => {
      let intensity = 0;
      
      if (audioData) {
        // Get intensity based on frequency range
        switch (instrument.freqRange) {
          case 'bass': intensity = bassLevel; break;
          case 'midLow': intensity = audioData.bands.midLow / 255; break;
          case 'mid': intensity = midLevel; break;
          case 'high': intensity = highLevel; break;
        }
      }
      
      if (intensity > 0.3) {
        // Draw simple instrument silhouette
        ctx.globalAlpha = Math.min(1, intensity) * 0.6;
        
        switch (instrument.name) {
          case 'guitar':
            // Guitar shape
            ctx.beginPath();
            ctx.moveTo(instrument.x, instrument.y);
            ctx.lineTo(instrument.x - 20, instrument.y + 40);
            ctx.lineTo(instrument.x + 20, instrument.y + 40);
            ctx.closePath();
            ctx.fillStyle = 'rgba(200, 100, 255, 0.7)';
            ctx.fill();
            break;
            
          case 'drums':
            // Drums shape
            ctx.beginPath();
            ctx.arc(instrument.x, instrument.y + 20, 30, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
            ctx.fill();
            break;
            
          case 'keyboard':
            // Keyboard shape
            ctx.fillStyle = 'rgba(100, 255, 150, 0.7)';
            ctx.fillRect(instrument.x - 40, instrument.y, 80, 25);
            
            // Keys
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < 7; i++) {
              ctx.fillRect(instrument.x - 35 + i * 10, instrument.y, 8, 20);
            }
            break;
            
          case 'vocals':
            // Vocalist silhouette
            ctx.beginPath();
            ctx.arc(instrument.x, instrument.y - 10, 15, 0, Math.PI * 2); // Head
            ctx.fillStyle = 'rgba(255, 180, 100, 0.7)';
            ctx.fill();
            
            // Body
            ctx.beginPath();
            ctx.moveTo(instrument.x, instrument.y + 5);
            ctx.lineTo(instrument.x - 15, instrument.y + 45);
            ctx.lineTo(instrument.x + 15, instrument.y + 45);
            ctx.closePath();
            ctx.fill();
            break;
        }
      }
    });
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    
    // Frequency visualization as equalizer at the bottom
    if (audioData && audioData.frequencyData) {
      const barWidth = width / 64;
      const barSpacing = 2;
      const maxBarHeight = height * 0.2;
      
      for (let i = 0; i < 64; i++) {
        const value = audioData.frequencyData[i] / 255;
        
        // Color based on frequency (red for bass, blue for high)
        const hue = i / 64 * 240;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        
        const barHeight = value * maxBarHeight;
        ctx.fillRect(
          i * (barWidth + barSpacing) + barSpacing/2, 
          height - barHeight, 
          barWidth, 
          barHeight
        );
      }
    }
    
    // Add flash effect on beats
    if (isBeat) {
      ctx.fillStyle = `rgba(255, 255, 255, ${bassLevel * 0.2})`;
      ctx.fillRect(0, 0, width, height);
    }
  };
  
  return { render };
};
