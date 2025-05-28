import BaseVisualization from './BaseVisualization.js';
import ParticleSystem from './ParticleSystem.js'; // Added import

// Define Plant class outside or as a static member if preferred
class Plant {
  constructor(x, y, maxHeight, color, canvasHeight) {
    this.x = x;
    // this.y = y; // Base y-coordinate on the "ground" - replaced by baseY
    this.maxHeight = maxHeight;
    this.currentHeight = 5; // Start small
    this.color = color;
    this.segments = 5; // Example: number of segments in the plant stalk
    this.segmentHeight = this.currentHeight / this.segments;
    this.growthSpeed = (0.5 + Math.random() * 0.5); // Increased base growth speed
    this.phaseOffset = Math.random() * Math.PI * 2; // For varied animation later
    this.canvasHeight = canvasHeight; // Store canvas height for reference

    // New properties for sway and audio reactivity:
    this.baseY = y; // Store original y for ground reference
    this.swayAngle = 0;
    this.swaySpeed = 0.01 + Math.random() * 0.02; // Speed of sway oscillation
    this.maxSwayAngle = Math.PI / 30 + Math.random() * (Math.PI / 30); // Max sway 3-6 degrees
    this.audioHeightInfluence = 0; // How much audio is currently boosting height (not directly used, targetHeight is)
    this.targetHeight = this.currentHeight; // For smoother height transitions
  }

  update(deltaTime, audioData) {
    // Height Reactivity
    // Basic growth towards maxHeight
    if (this.currentHeight < this.maxHeight) {
        // The factor (this.maxHeight - this.currentHeight) creates a natural slowdown as it approaches maxHeight
        // The 0.01 is a damping factor, adjust as needed. deltaTime makes it frame-rate independent.
        this.currentHeight += this.growthSpeed * (this.maxHeight - this.currentHeight) * 0.01 * deltaTime; // Added 0.01
    }
    this.currentHeight = Math.min(this.currentHeight, this.maxHeight);
            
    let bassEffect = 0;
    if (audioData && audioData.bands && typeof audioData.bands.bass !== 'undefined') {
        bassEffect = (audioData.bands.bass / 255) * (this.maxHeight * 0.3); // Bass boosts height by up to 30% of maxHeight
    }
    // Target height includes the base current height (from growth) plus the bass effect
    this.targetHeight = Math.min(this.maxHeight, this.currentHeight + bassEffect);

    // Smoothly adjust current height towards target height
    // The 0.1 factor here determines how quickly it reacts to the bass pulse. deltaTime for frame-rate independence.
    this.currentHeight += (this.targetHeight - this.currentHeight) * 0.1 * deltaTime;
    this.currentHeight = Math.max(5, this.currentHeight); // Ensure minimum height

    // Sway Animation
    let midSwayFactor = 1.0;
    if (audioData && audioData.bands && typeof audioData.bands.mid !== 'undefined') {
        midSwayFactor = 1.0 + (audioData.bands.mid / 255) * 1.5; // Mid frequencies increase sway speed/amplitude
    }
    // Date.now() * 0.001 gives time in seconds. swaySpeed determines oscillation frequency. phaseOffset gives variety.
    this.swayAngle = Math.sin(Date.now() * 0.001 * this.swaySpeed * midSwayFactor + this.phaseOffset) * this.maxSwayAngle;
    
    this.segmentHeight = this.currentHeight / this.segments; // Update segmentHeight
  }

  draw(ctx, camera) {
    const apparentY = this.baseY - camera.y; // Use baseY for stable ground position

    // Cull plants that are off-screen due to camera movement
    if (apparentY < -this.currentHeight || apparentY - this.currentHeight > this.canvasHeight + this.currentHeight) { // Adjusted culling
        return;
    }

    ctx.save();
    // Translate to the base of the plant for rotation
    ctx.translate(this.x, apparentY);
    ctx.rotate(this.swayAngle);

    // Subtle Glow for plants
    const glowAlpha = this.color.a * 0.4;
    ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${glowAlpha})`;
    ctx.shadowBlur = 6; // Subtle glow

    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
    // Draw from new (0,0) after translate, upwards
    ctx.fillRect(-2, -this.currentHeight, 4, this.currentHeight); 
    
    ctx.shadowBlur = 0; // Reset shadow for other elements
    ctx.shadowColor = 'transparent';
        
    ctx.restore(); // Restore context to undo translate and rotate
  }
}

class Tube {
  constructor(x1, y1, x2, y2, color, thickness, canvasHeight) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.color = color;
    // this.thickness = thickness; // Replaced by baseThickness
    // this.glowIntensity = 5 + Math.random() * 10; // Replaced by baseGlowIntensity
    this.currentLength = 0; // For animating growth
    this.maxLength = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
    this.growthSpeed = 0.5 + Math.random() * 0.5; // Adjusted back, will use with deltaTime / 16
    this.canvasHeight = canvasHeight; // Store canvas height

    // New properties for audio reactivity:
    this.baseThickness = thickness;
    this.thickness = thickness; // Current thickness
    this.baseGlowIntensity = 5 + Math.random() * 10;
    this.glowIntensity = this.baseGlowIntensity; // Current glow intensity
  }

  update(deltaTime, audioData) {
    // Growth/Length Reactivity
    let growthFactor = 1.0;
    if (audioData && audioData.bands && typeof audioData.bands.midLow !== 'undefined') {
        growthFactor = 1.0 + (audioData.bands.midLow / 255) * 2.0; // midLow affects growth speed
    }
    if (this.currentLength < this.maxLength) {
      this.currentLength += this.growthSpeed * growthFactor * (deltaTime / 16); // Using deltaTime / 16
    }
    this.currentLength = Math.min(this.currentLength, this.maxLength);

    // Glow/Thickness Reactivity
    if (audioData && audioData.bands && typeof audioData.bands.high !== 'undefined') {
        const highEffect = (audioData.bands.high / 255);
        // Reduced highEffect impact on glow, and beat multiplier
        this.glowIntensity = this.baseGlowIntensity + highEffect * 5; // Reduced from 10
        this.thickness = this.baseThickness + highEffect * 2; // Kept highEffect on thickness
        
        if (audioData.isBeat) {
            this.glowIntensity *= 1.3; // Reduced from 1.5
            this.thickness *= 1.2;    // Kept beat on thickness
        }
    } else {
        // Directly reset to base values if no audio data, as per subtask example
        this.glowIntensity = this.baseGlowIntensity;
        this.thickness = this.baseThickness;
    }
    // Clamp values
    this.glowIntensity = Math.max(0, this.glowIntensity);
    this.thickness = Math.max(0.5, this.thickness); // Ensure minimum thickness
  }

  draw(ctx, camera) {
    if (this.currentLength <= 0) return;

    const apparentY1 = this.y1 - camera.y;
    // Note: this.y2 is the original target, not necessarily where it visually ends due to growth
    // const apparentY2_target = this.y2 - camera.y; 

    // Cull tubes that are off-screen
    // This culling is basic: checks if the segment's original y-range (before growth) translated by camera is off-screen.
    // A more accurate culling would involve the current, grown segment.
    const currentMaxY = Math.max(this.y1, this.y2) - camera.y; // Highest point of the fully grown tube's original position, camera adjusted
    const currentMinY = Math.min(this.y1, this.y2) - camera.y; // Lowest point of the fully grown tube's original position, camera adjusted
    
    if (currentMaxY < 0 || currentMinY > this.canvasHeight) {
        return;
    }

    const progress = this.currentLength / this.maxLength;
    const currentX2_orig = this.x1 + (this.x2 - this.x1) * progress;
    const currentY2_orig = this.y1 + (this.y2 - this.y1) * progress;
    const apparentCurrentY2 = currentY2_orig - camera.y;


    ctx.beginPath();
    ctx.moveTo(this.x1, apparentY1); // x1 is not changed by this simple camera Y model
    ctx.lineTo(currentX2_orig, apparentCurrentY2);

    // Basic Glow
    ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a * 0.7})`;
    ctx.lineWidth = this.thickness + this.glowIntensity / 2; // Outer glow
    ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
    ctx.shadowBlur = this.glowIntensity;
    ctx.stroke();

    // Inner Core Line
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.color.a * 0.8})`; // Brighter core
    ctx.lineWidth = this.thickness;
    ctx.shadowBlur = 0; // No shadow for the core line itself
    ctx.stroke();

    ctx.shadowColor = 'transparent'; // Reset shadow
    ctx.shadowBlur = 0;
  }
}

class AvatarGlowPlantsVisualization extends BaseVisualization {
    constructor() {
        super({
            name: 'AvatarGlowPlants',
            description: 'A visualizer with glowing musical plants and a flying drone perspective, inspired by Avatar.',
            author: 'Music Visualizer AI',
            useParticles: true,
            colorPalette: {
                primary: { r: 50, g: 200, b: 250, a: 1 }, // Glowing cyan/blue
                secondary: { r: 150, g: 50, b: 250, a: 1 }, // Bioluminescent purple
                accent: { r: 100, g: 250, b: 150, a: 1 }, // Vibrant green
                background: { r: 10, g: 20, b: 40, a: 1 } // Deep dark blue/purple
            }
        });
    }

    init(options) {
        super.init(options);
        this.plants = [];
        this.tubes = [];
        this.camera = {
          y: 0, 
          speed: 0.5 // Speed of camera movement (pixels per "frame" if deltaTime/16)
        };
        console.log('AvatarGlowPlantsVisualization initialized, plants, tubes, and camera created.');
    }

    initializePlants() {
        this.plants = []; // Clear if re-initializing
        if (!this.dimensions || this.dimensions.width === 0 || this.dimensions.height === 0) {
            console.warn('Plant initialization skipped: Dimensions not ready.', this.dimensions);
            return;
        }

        const numberOfPlants = 75; // Increased number of plants
        const groundLevel = 0.95; // Closer to the bottom
        const groundY = this.dimensions.height * groundLevel;
        const canvasWidth = this.dimensions.width;

        for (let i = 0; i < numberOfPlants; i++) {
            const x = Math.random() * canvasWidth;
            // Max height relative to canvas height, ensuring variety
            const maxHeight = (0.1 + Math.random() * 0.4) * this.dimensions.height; 
            
            let plantColor;
            const colorRoll = Math.random();
            if (colorRoll < 0.4) {
                plantColor = this.config.colorPalette.primary;
            } else if (colorRoll < 0.7) {
                plantColor = this.config.colorPalette.secondary;
            } else {
                plantColor = this.config.colorPalette.accent;
            }
            
            this.plants.push(new Plant(x, groundY, maxHeight, plantColor, this.dimensions.height));
        }
        console.log(`Initialized ${this.plants.length} plants with dimensions: ${this.dimensions.width}x${this.dimensions.height}. GroundY: ${groundY}`);
    }

        console.log(`Initialized ${this.plants.length} plants with dimensions: ${this.dimensions.width}x${this.dimensions.height}. GroundY: ${groundY}`);
    }

    initializeTubes() {
      this.tubes = [];
      if (!this.dimensions || this.dimensions.width === 0) return;

      const numberOfTubes = 30;
      const canvasWidth = this.dimensions.width;
      const canvasHeight = this.dimensions.height;
      const groundY = canvasHeight * 0.95;

      for (let i = 0; i < numberOfTubes; i++) {
        const x1 = Math.random() * canvasWidth;
        const y1 = groundY - (Math.random() * canvasHeight * 0.2); // Start a bit above ground or on ground
        
        // Tubes can go upwards, or arch
        const x2 = x1 + (Math.random() - 0.5) * (canvasWidth * 0.3); // Spread out
        const y2 = y1 - (canvasHeight * 0.2 + Math.random() * canvasHeight * 0.4); // Generally upwards

        const tubeColor = Math.random() > 0.5 ? this.config.colorPalette.secondary : this.config.colorPalette.accent;
        const thickness = 2 + Math.random() * 3;
        
        this.tubes.push(new Tube(x1, y1, x2, y2, tubeColor, thickness, this.dimensions.height));
      }
      console.log(`Initialized ${this.tubes.length} tubes.`);
    }

    setup(ctx, dimensions) {
        super.setup(ctx, dimensions);
        // It's important that dimensions are set before initializing elements that depend on them
        this.camera.horizonLine = this.dimensions.height * 0.4; // Example if we were using it

        this.initializePlants(); 
        this.initializeTubes(); 
        console.log('AvatarGlowPlantsVisualization setup complete, plants and tubes initialized.');
    }

    updateElements(deltaTime, audioData, qualitySettings) {
        // Update camera position
        this.camera.y += this.camera.speed * (deltaTime / 16); // Adjusted to match subtask example
        
        // Optional: Reset camera or change direction to create a loop
        // if (this.camera.y > this.dimensions.height * 1.5) { // Example reset condition
        //    this.camera.y = -this.dimensions.height * 0.5; // Reset to appear from "below"
        // }


        if (this.plants && this.plants.length > 0) {
            this.plants.forEach(plant => {
                plant.update(deltaTime, audioData);
            });
        }

        if (this.tubes && this.tubes.length > 0) {
            this.tubes.forEach(tube => {
                tube.update(deltaTime, audioData);
            });
        }
    }

    drawBackground(ctx, dimensions, audioData, qualitySettings) {
        // Fill with the dark background color
        ctx.fillStyle = `rgba(${this.config.colorPalette.background.r}, ${this.config.colorPalette.background.g}, ${this.config.colorPalette.background.b}, ${this.config.colorPalette.background.a})`;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        // super.drawBackground(ctx, dimensions, audioData, qualitySettings); // Optional: if base class has effects
    }

    drawElements(ctx, dimensions, audioData, qualitySettings) {
        // Draw Plants
        if (this.plants && this.plants.length > 0) {
            this.plants.forEach(plant => {
                plant.draw(ctx, this.camera); // Pass camera
            });
        }

        // Draw Tubes
        if (this.tubes && this.tubes.length > 0) {
          this.tubes.forEach(tube => {
            tube.draw(ctx, this.camera); // Pass camera
          });
        }
    }

    drawForeground(ctx, dimensions, audioData, qualitySettings) {
        // console.log('AvatarGlowPlantsVisualization drawForeground called');
        // Note: Particles are typically drawn by the BaseVisualization's main render loop
        // if this.config.useParticles is true, by calling this.drawParticles()
    }

    // Override to define specific particle systems for this visualization
    createDefaultParticleSystems() {
      this.particleSystems = {}; // Start fresh for this visualization's specific particles

      this.particleSystems.specks = new ParticleSystem({
        maxParticles: 300, 
        emissionRate: 2, 
        particleSize: { min: 0.5, max: 2 }, 
        particleLifespan: { min: 150, max: 300 }, // Frames (assuming ~60fps, this is 2.5 to 5 seconds)
        color: { r: 200, g: 220, b: 255, a: 0.6 }, // Faint white/blue specks
        gravity: { x: 0, y: -0.01 }, 
        friction: 0.99, // Slight slowdown
        turbulence: 0.02, 
        behavior: 'drift', 
        behaviorOptions: {
            driftSpeed: { x: 0.05, y: 0.05 } // Gentle drift
        },
        audioBehavior: {
          emissionRate: { band: 'mid', min: 1, max: 5 }, 
          size: { band: 'high', factor: 1.2 },
          beatBurst: { count: 5, speedFactor: 1 } // speedFactor instead of speed, assuming it modifies velocity
        }
      });
      console.log("Created 'specks' particle system in AvatarGlowPlantsVisualization.");
    }

    // Override to set up emission areas for the custom particle systems
    setupParticleEmissionAreas() {
      // Do NOT call super.setupParticleEmissionAreas() if we cleared this.particleSystems
      // as it would try to access this.particleSystems.main which no longer exists.
      // super.setupParticleEmissionAreas(); 

      if (!this.dimensions || this.dimensions.width === 0 || this.dimensions.height === 0) {
        console.warn('setupParticleEmissionAreas skipped: Dimensions not ready.', this.dimensions);
        return;
      }

      if (this.particleSystems.specks) {
        this.particleSystems.specks.setEmissionArea({
          x: 0,
          y: 0, 
          width: this.dimensions.width,
          height: this.dimensions.height
        });
        console.log("Set emission area for 'specks' particle system in AvatarGlowPlantsVisualization.");
      }
    }
}

export default AvatarGlowPlantsVisualization;
export { Plant, Tube }; // Export for testing
