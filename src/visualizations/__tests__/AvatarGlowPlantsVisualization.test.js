import AvatarGlowPlantsVisualization, { Plant, Tube } from '../AvatarGlowPlantsVisualization';
import ParticleSystem from '../ParticleSystem.js'; // Required due to instantiation in createDefaultParticleSystems

// Mock canvas dimensions for setup
const mockDimensions = { width: 800, height: 600 };
const mockCtx = { 
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    createRadialGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
};

// Mock ParticleSystem if its methods are called directly by AvatarGlowPlantsVisualization beyond constructor
// For now, we are just testing if it's created.
jest.mock('../ParticleSystem.js', () => {
    return jest.fn().mockImplementation((options) => {
        return {
            options: options,
            setEmissionArea: jest.fn(),
            update: jest.fn(),
            draw: jest.fn(),
        };
    });
});


describe('AvatarGlowPlantsVisualization', () => {
    let viz;

    beforeEach(() => {
        // Reset mocks for ParticleSystem before each test
        ParticleSystem.mockClear();
        mockCtx.fillRect.mockClear();
        mockCtx.beginPath.mockClear();
        // ... clear other mockCtx functions if needed ...

        viz = new AvatarGlowPlantsVisualization();
        // Manually call init and setup as super.init calls createDefaultParticleSystems
        // and setup calls initializePlants/Tubes and setupParticleEmissionAreas
        viz.init({ ctx: mockCtx, dimensions: mockDimensions }); // Calls createDefaultParticleSystems
        viz.setup(mockCtx, mockDimensions); // Calls initializePlants/Tubes and setupParticleEmissionAreas
    });

    test('should initialize with default properties', () => {
        expect(viz.camera.y).toBe(0);
        expect(viz.camera.speed).toBe(0.5); // As per refined value
        expect(viz.config.colorPalette).toBeDefined();
        expect(viz.config.useParticles).toBe(true);
        expect(viz.particleSystems.specks).toBeDefined();
        expect(ParticleSystem).toHaveBeenCalledTimes(1);
        expect(viz.particleSystems.specks.setEmissionArea).toHaveBeenCalled();
    });

    test('should populate plants array on setup', () => {
        expect(viz.plants).toBeInstanceOf(Array);
        expect(viz.plants.length).toBe(75); // Default number of plants
        viz.plants.forEach(plant => {
            expect(plant).toBeInstanceOf(Plant);
            expect(plant.canvasHeight).toBe(mockDimensions.height);
        });
    });

    test('should populate tubes array on setup', () => {
        expect(viz.tubes).toBeInstanceOf(Array);
        expect(viz.tubes.length).toBe(30); // Default number of tubes
        viz.tubes.forEach(tube => {
            expect(tube).toBeInstanceOf(Tube);
            expect(tube.canvasHeight).toBe(mockDimensions.height);
        });
    });

    test('camera should move on updateElements', () => {
        const initialCamY = viz.camera.y;
        const deltaTime = 16; // Simulate one frame (deltaTime/16 will be 1)
        const audioData = {}; // Empty audioData
        viz.updateElements(deltaTime, audioData, {}); 
        expect(viz.camera.y).toBeGreaterThan(initialCamY);
        expect(viz.camera.y).toEqual(initialCamY + viz.camera.speed * (deltaTime / 16));
    });
});


describe('Plant', () => {
    let plant;
    const plantColor = { r: 0, g: 255, b: 0, a: 1 };
    const initialHeight = 10;
    const maxHeight = 100;

    beforeEach(() => {
        // Mock Date.now for predictable sway tests if needed, but testing for change is easier
        plant = new Plant(10, mockDimensions.height * 0.9, maxHeight, plantColor, mockDimensions.height);
        plant.currentHeight = initialHeight;
        plant.growthSpeed = 0.1; // Consistent speed for testing
        plant.swaySpeed = 0.01; // Consistent speed
        plant.maxSwayAngle = Math.PI / 30; // Consistent angle
        plant.phaseOffset = 0; // Consistent phase
    });

    test('constructor should set properties correctly', () => {
        expect(plant.x).toBe(10);
        expect(plant.baseY).toBe(mockDimensions.height * 0.9);
        expect(plant.maxHeight).toBe(maxHeight);
        expect(plant.color).toEqual(plantColor);
        expect(plant.canvasHeight).toBe(mockDimensions.height);
        expect(plant.currentHeight).toBe(initialHeight);
    });

    test('update method should grow plant height over time (non-audio part)', () => {
        const deltaTime = 1.0; // Using 1.0 for simpler calculation with deltaTime factor
        const audioData = { bands: {} }; // No audio bands
        
        // Store currentHeight before non-audio growth part
        const heightBeforeGrowth = plant.currentHeight;
        
        // Simulate growth part only (this.currentHeight += this.growthSpeed * (this.maxHeight - this.currentHeight) * 0.01 * deltaTime;)
        const expectedGrowthAmount = plant.growthSpeed * (plant.maxHeight - heightBeforeGrowth) * 0.01 * deltaTime;
        plant.update(deltaTime, audioData);

        // The update method has two parts that modify currentHeight.
        // 1. Initial growth: currentHeight += growthSpeed * (maxHeight - currentHeight) * 0.01 * deltaTime
        // 2. Smoothing towards targetHeight (which is currentHeight + bassEffect): currentHeight += (targetHeight - currentHeight) * 0.1 * deltaTime
        // For this test, targetHeight will be currentHeight (after initial growth) because bassEffect is 0.
        // So the second part effectively becomes: currentHeight += ( (heightAfterInitialGrowth) - (heightAfterInitialGrowth) ) * 0.1 * deltaTime = 0
        
        expect(plant.currentHeight).toBeCloseTo(heightBeforeGrowth + expectedGrowthAmount);
    });
    
    test('update method should react to bass in audioData for height', () => {
        const currentHeightBeforeAudio = 50;
        plant.currentHeight = currentHeightBeforeAudio;
        plant.maxHeight = 100; // Ensure maxHeight is set for the test
        plant.growthSpeed = 0.1; // Reset growth speed for predictability

        const audioData = { bands: { bass: 128, mid: 0, high: 0 } }; // Half bass
        const deltaTime = 1.0; // Small deltaTime to minimize initial growth impact
        
        // Calculate height after initial growth (first part of update)
        const initialGrowthAmount = plant.growthSpeed * (plant.maxHeight - currentHeightBeforeAudio) * 0.01 * deltaTime;
        const heightAfterInitialGrowth = currentHeightBeforeAudio + initialGrowthAmount;

        // Calculate bass effect and target height
        const bassEffect = (128 / 255) * (plant.maxHeight * 0.3);
        const expectedTargetHeight = Math.min(plant.maxHeight, heightAfterInitialGrowth + bassEffect);
        
        // Calculate smoothing towards target height (second part of update)
        const smoothingAmount = (expectedTargetHeight - heightAfterInitialGrowth) * 0.1 * deltaTime;
        const finalExpectedHeight = heightAfterInitialGrowth + smoothingAmount;

        plant.update(deltaTime, audioData);

        expect(plant.targetHeight).toBeCloseTo(expectedTargetHeight);
        expect(plant.currentHeight).toBeCloseTo(finalExpectedHeight);
    });

    test('update method should update swayAngle based on time and mid audioData', () => {
        const initialSway = plant.swayAngle;
        const audioDataNoMid = { bands: { mid: 0 } };
        const audioDataWithMid = { bands: { mid: 128 } };
        
        const now = Date.now(); // Get current time once
        jest.spyOn(Date, 'now').mockImplementation(() => now);

        plant.update(16.67, audioDataNoMid);
        const swayNoMid = plant.swayAngle;
        expect(swayNoMid).not.toBe(initialSway); // Should change due to time

        // Reset Date.now mock for next call if needed or use a different time
        jest.spyOn(Date, 'now').mockImplementation(() => now + 100); // Advance time
        plant.update(16.67, audioDataWithMid);
        const swayWithMid = plant.swayAngle;
        expect(swayWithMid).not.toBe(swayNoMid); // Mid band should further alter sway compared to no mid

        Date.now.mockRestore(); // Clean up spy
    });
});

describe('Tube', () => {
    let tube;
    const tubeColor = { r: 255, g: 0, b: 0, a: 1 };

    beforeEach(() => {
        tube = new Tube(0, 500, 10, 400, tubeColor, 2, mockDimensions.height);
        tube.growthSpeed = 1.0; // Consistent for testing (original value was 0.5 + Math.random()*0.5)
        tube.baseGlowIntensity = 5; // Consistent for testing
        tube.baseThickness = 2; // Consistent for testing
    });

    test('constructor should set properties correctly', () => {
        expect(tube.x1).toBe(0);
        expect(tube.maxLength).toBeCloseTo(Math.sqrt(Math.pow(10-0,2) + Math.pow(400-500,2)));
        expect(tube.color).toEqual(tubeColor);
        expect(tube.baseThickness).toBe(2);
        expect(tube.thickness).toBe(2);
        expect(tube.glowIntensity).toBe(tube.baseGlowIntensity);
    });

    test('update method should increase currentLength over time (no audio)', () => {
        const initialLength = tube.currentLength;
        const deltaTime = 16; // deltaTime/16 = 1
        const audioData = { bands: {} }; // No audio bands
        tube.update(deltaTime, audioData);
        
        const expectedGrowthFactor = 1.0; // No midLow band
        expect(tube.currentLength).toBe(initialLength + tube.growthSpeed * expectedGrowthFactor * (deltaTime / 16));
    });

    test('update method currentLength growth should react to midLow audioData', () => {
        const initialLength = tube.currentLength;
        const deltaTime = 16; // deltaTime/16 = 1
        const audioData = { bands: { midLow: 127.5 } }; // midLow at 0.5 effect (127.5 / 255)
        tube.update(deltaTime, audioData);

        const expectedMidLowFactor = 1.0 + (127.5 / 255) * 2.0; // 1.0 + 0.5 * 2.0 = 2.0
        expect(tube.currentLength).toBe(initialLength + tube.growthSpeed * expectedMidLowFactor * (deltaTime / 16));
    });


    test('update method should react to high audioData and beat for glow and thickness', () => {
        const audioData = { bands: { high: 200 }, isBeat: true }; // No midLow specified, so growthFactor is 1
        
        tube.update(16.67, audioData);

        const highEffect = (200 / 255);
        let expectedGlow = tube.baseGlowIntensity + highEffect * 5; 
        let expectedThickness = tube.baseThickness + highEffect * 2;
        expectedGlow *= 1.3; // Beat effect
        expectedThickness *= 1.2; // Beat effect

        expect(tube.glowIntensity).toBeCloseTo(expectedGlow);
        expect(tube.thickness).toBeCloseTo(expectedThickness);
    });

    test('update method should reset glow and thickness if no audioData.bands.high', () => {
        // First, set a non-base value with audio
        const audioDataWithHigh = { bands: { high: 200 }, isBeat: true };
        tube.update(16.67, audioDataWithHigh);
        expect(tube.glowIntensity).not.toBe(tube.baseGlowIntensity);
        expect(tube.thickness).not.toBe(tube.baseThickness);

        // Then, update without high band
        const audioDataNoHigh = { bands: {} }; // No high band
        tube.update(16.67, audioDataNoHigh);
        expect(tube.glowIntensity).toBe(tube.baseGlowIntensity);
        expect(tube.thickness).toBe(tube.baseThickness);
    });
});

// Ensure Math.random is predictable for tests relying on its output during construction, if necessary.
// For now, specific random values are overridden in beforeEach where needed (e.g. growthSpeed).
// Date.now() is mocked for sway test.
