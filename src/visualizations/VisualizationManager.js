/**
 * VisualizationManager
 * Manages visualization components, handles switching between visualizations with smooth transitions,
 * and coordinates with CanvasManager and AudioAnalyzer
 */

import CanvasManager from '../utils/CanvasManager';
import EnhancedAudioAnalyzer from '../audio/EnhancedAudioAnalyzer';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import TransitionManager from '../utils/TransitionManager';

class VisualizationManager {
  constructor(options = {}) {
    // Registered visualizations
    this.visualizations = {};
    this.visualizationList = [];
    this.currentVisualization = null;
    
    // Managers
    this.canvasManager = options.canvasManager || null;
    this.audioAnalyzer = options.audioAnalyzer || null;
    this.performanceMonitor = options.performanceMonitor || null;
    
    // Transition manager
    this.transitionManager = new TransitionManager({
      duration: options.transitionDuration || 1500,
      transitionType: options.transitionType || 'crossfade',
      audioReactivityFactor: options.audioReactivity || 0.3
    });
    
    // Settings
    this.autoRotation = options.autoRotation || false;
    this.autoRotationInterval = options.autoRotationInterval || 30000;
    this.lastRotationTime = 0;
    
    // Animation state
    this.isRunning = false;
    this.animationFrameId = null;
    this.isTransitioning = false;
    
    // Configuration
    this.config = {
      defaultVisualization: options.defaultVisualization || 'cosmic',
      adaptiveQuality: options.adaptiveQuality !== undefined ? options.adaptiveQuality : true,
      showFps: options.showFps !== undefined ? options.showFps : true
    };
  }
  
  /**
   * Initializes the visualization manager
   * @param {HTMLElement} container - Container element for visualizations
   * @param {Object} options - Initialization options
   */
  initialize(container, options = {}) {
    // Create performance monitor if not provided
    if (!this.performanceMonitor) {
      this.performanceMonitor = new PerformanceMonitor({
        targetFPS: 60,
        autoAdjust: this.config.adaptiveQuality
      });
    }
    
      // Create canvas manager if not provided
      if (!this.canvasManager) {
        const containerRect = container.getBoundingClientRect();
        this.canvasManager = new CanvasManager({
          width: containerRect.width,
          height: containerRect.height,
          parentElement: container,
          performanceMonitor: this.performanceMonitor,
          useBuffering: true
        });
      }
      
      // Initialize transition manager
      this.transitionManager.initialize(
        this.canvasManager.width, 
        this.canvasManager.height
      );
    
    // Create audio analyzer if not provided
    if (!this.audioAnalyzer) {
      this.audioAnalyzer = new EnhancedAudioAnalyzer({
        fftSize: 2048,
        smoothingTimeConstant: 0.8
      });
      
      // Initialize with system audio if possible, otherwise use the oscillator fallback
      this.audioAnalyzer.initialize('system')
        .catch(error => {
          console.warn('Could not initialize system audio, using fallback:', error);
        });
    }
    
    // Connect audio analyzer to canvas manager
    if (this.audioAnalyzer && this.canvasManager) {
      this.audioAnalyzer.onAudioData(audioData => {
        if (this.currentVisualization && this.isRunning) {
          this.canvasManager.render(audioData);
        }
      });
    }
    
    // Set default visualization if available
    if (this.visualizationList.length > 0) {
      const defaultVis = this.config.defaultVisualization;
      if (this.visualizations[defaultVis]) {
        this.setVisualization(defaultVis);
      } else {
        this.setVisualization(this.visualizationList[0].id);
      }
    }
    
    console.log('VisualizationManager initialized with', this.visualizationList.length, 'visualizations');
    
    return this;
  }
  
  /**
   * Registers a visualization with the manager
   * @param {string} id - Unique visualization identifier
   * @param {BaseVisualization|Function} visualization - Visualization instance or class
   * @param {Object} metadata - Visualization metadata
   */
  registerVisualization(id, visualization, metadata = {}) {
    if (this.visualizations[id]) {
      console.warn(`Visualization with id "${id}" already exists and will be overwritten`);
    }
    
    this.visualizations[id] = {
      id,
      instance: null,
      visualization,
      metadata: {
        name: metadata.name || id,
        description: metadata.description || '',
        author: metadata.author || 'Unknown',
        tags: metadata.tags || [],
        thumbnail: metadata.thumbnail || null,
        ...metadata
      }
    };
    
    // Update visualization list
    this.visualizationList = Object.values(this.visualizations);
    
    return this;
  }
  
  /**
   * Sets the active visualization with transition
   * @param {string} id - Visualization identifier
   * @param {Object} transitionOptions - Options for transition
   * @returns {boolean} Success status
   */
  setVisualization(id, transitionOptions = {}) {
    if (!this.visualizations[id]) {
      console.error(`Visualization "${id}" not found`);
      return false;
    }
    
    // Get visualization info
    const visInfo = this.visualizations[id];
    
    // Create instance if needed
    if (!visInfo.instance) {
      if (typeof visInfo.visualization === 'function') {
        // It's a class, instantiate it
        visInfo.instance = new visInfo.visualization();
      } else {
        // It's already an instance
        visInfo.instance = visInfo.visualization;
      }
    }
    
    // If this is the first visualization or transitions are disabled, set immediately
    if (!this.currentVisualization || transitionOptions.skipTransition) {
      this.currentVisualization = visInfo.instance;
      
      // Update canvas manager
      if (this.canvasManager) {
        this.canvasManager.setVisualization(this.currentVisualization);
      }
      
      console.log(`Set visualization to "${id}" (immediate)`);
      return true;
    }
    
    // Otherwise, transition to the new visualization
    const sourceVisualization = this.currentVisualization;
    const targetVisualization = visInfo.instance;
    
    // Start transition
    this.isTransitioning = true;
    this.transitionManager.startTransition(
      sourceVisualization, 
      targetVisualization,
      {
        duration: transitionOptions.duration,
        transitionType: transitionOptions.type,
        easing: transitionOptions.easing
      }
    );
    
    // Set canvas manager to render through the transition manager
    if (this.canvasManager) {
      // During transition, visualization render will be handled by the transition manager
      this.canvasManager.setCustomRenderer((ctx, dimensions, audioData) => {
        return this.transitionManager.render(ctx, dimensions, audioData);
      });
    }
    
    // Set the target as current after transition is complete
    setTimeout(() => {
      // Set the new visualization as current
      this.currentVisualization = targetVisualization;
      
      // Update canvas manager back to direct visualization rendering
      if (this.canvasManager) {
        this.canvasManager.clearCustomRenderer();
        this.canvasManager.setVisualization(this.currentVisualization);
      }
      
      this.isTransitioning = false;
      console.log(`Completed transition to "${id}"`);
    }, transitionOptions.duration || this.transitionManager.duration);
    
    console.log(`Started transition to "${id}"`);
    return true;
  }
  
  /**
   * Gets the active visualization
   * @returns {Object} Current visualization instance
   */
  getCurrentVisualization() {
    return this.currentVisualization;
  }
  
  /**
   * Gets a list of available visualizations
   * @returns {Array} List of visualization info objects
   */
  getVisualizationList() {
    return this.visualizationList.map(vis => ({
      id: vis.id,
      name: vis.metadata.name,
      description: vis.metadata.description,
      author: vis.metadata.author,
      tags: vis.metadata.tags,
      thumbnail: vis.metadata.thumbnail
    }));
  }
  
  /**
   * Starts the visualization loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastRotationTime = Date.now();
    
    // Start the update loop
    this.update();
    
    return this;
  }
  
  /**
   * Stops the visualization loop
   */
  stop() {
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    return this;
  }
  
  /**
   * Main update loop
   */
  update() {
    if (!this.isRunning) return;
    
    // Handle auto-rotation
    if (this.autoRotation && this.visualizationList.length > 1 && !this.isTransitioning) {
      const now = Date.now();
      if (now - this.lastRotationTime > this.autoRotationInterval) {
        this.nextVisualization(this.autoRotationTransitionOptions || { fromAutoRotation: true });
        this.lastRotationTime = now;
      }
    }
    
    // Continue the animation loop
    this.animationFrameId = requestAnimationFrame(() => this.update());
  }
  
  /**
   * Switches to the next visualization with transition
   * @param {Object} transitionOptions - Options for transition
   */
  nextVisualization(transitionOptions = {}) {
    if (this.visualizationList.length <= 1) return;
    if (this.isTransitioning) return; // Don't allow transitions during transition
    
    // Find current index
    const currentId = this.currentVisualization?.name || '';
    const currentIndex = this.visualizationList.findIndex(v => v.id === currentId);
    
    // Calculate next index
    const nextIndex = (currentIndex + 1) % this.visualizationList.length;
    const nextId = this.visualizationList[nextIndex].id;
    
    // Use audio-reactive transition for auto-rotation
    if (transitionOptions.fromAutoRotation) {
      transitionOptions.type = this.getRandomTransitionType();
    }
    
    this.setVisualization(nextId, transitionOptions);
    
    return this;
  }
  
  /**
   * Switches to the previous visualization with transition
   * @param {Object} transitionOptions - Options for transition
   */
  previousVisualization(transitionOptions = {}) {
    if (this.visualizationList.length <= 1) return;
    if (this.isTransitioning) return; // Don't allow transitions during transition
    
    // Find current index
    const currentId = this.currentVisualization?.name || '';
    const currentIndex = this.visualizationList.findIndex(v => v.id === currentId);
    
    // Calculate previous index
    const prevIndex = (currentIndex - 1 + this.visualizationList.length) % this.visualizationList.length;
    const prevId = this.visualizationList[prevIndex].id;
    
    // Use audio-reactive transition type
    if (transitionOptions.fromAutoRotation) {
      transitionOptions.type = this.getRandomTransitionType();
    }
    
    this.setVisualization(prevId, transitionOptions);
    
    return this;
  }
  
  /**
   * Get a random transition type based on available types
   * @returns {string} Transition type
   */
  getRandomTransitionType() {
    const transitionTypes = [
      'crossfade',
      'wipe',
      'zoom',
      'particles',
      'morphing'
    ];
    
    const randomIndex = Math.floor(Math.random() * transitionTypes.length);
    return transitionTypes[randomIndex];
  }
  
  /**
   * Resizes the visualization canvas
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (this.canvasManager) {
      this.canvasManager.resize(width, height);
    }
    
    return this;
  }
  
  /**
   * Toggles auto-rotation of visualizations
   * @param {boolean} enabled - Whether auto-rotation is enabled
   * @param {number} interval - Interval in milliseconds
   * @param {Object} transitionOptions - Options for transitions during rotation
   */
  setAutoRotation(enabled, interval = null, transitionOptions = {}) {
    this.autoRotation = enabled;
    
    if (interval !== null) {
      this.autoRotationInterval = interval;
    }
    
    if (enabled) {
      this.lastRotationTime = Date.now();
    }
    
    // Store transition options for auto-rotation
    this.autoRotationTransitionOptions = {
      duration: transitionOptions.duration || 1500,
      type: transitionOptions.type || 'random',
      audioReactivity: transitionOptions.audioReactivity !== undefined ? 
        transitionOptions.audioReactivity : 0.3,
      fromAutoRotation: true,
      ...transitionOptions
    };
    
    return this;
  }
  
  /**
   * Sets audio source for visualizations
   * @param {string} sourceType - Type of audio source ('system', 'microphone', 'file')
   * @param {*} source - Audio source (e.g., HTMLAudioElement for 'file' type)
   */
  setAudioSource(sourceType, source = null) {
    if (!this.audioAnalyzer) return this;
    
    if (sourceType === 'file' && source) {
      // Connect to audio element
      this.audioAnalyzer.setupAudioElementSource(source);
    } else {
      // Initialize with system or microphone
      this.audioAnalyzer.initialize(sourceType)
        .catch(error => {
          console.error(`Could not initialize ${sourceType} audio:`, error);
        });
    }
    
    return this;
  }
  
  /**
   * Gets performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    if (this.performanceMonitor) {
      return this.performanceMonitor.getMetrics();
    }
    return null;
  }
  
  /**
   * Cleanup and release resources
   */
  dispose() {
    this.stop();
    
    // Dispose visualizations
    for (const id in this.visualizations) {
      if (this.visualizations[id].instance && typeof this.visualizations[id].instance.dispose === 'function') {
        this.visualizations[id].instance.dispose();
      }
      this.visualizations[id].instance = null;
    }
    
    // Dispose audio analyzer
    if (this.audioAnalyzer && typeof this.audioAnalyzer.stop === 'function') {
      this.audioAnalyzer.stop();
    }
    
    this.currentVisualization = null;
    this.canvasManager = null;
    this.audioAnalyzer = null;
    this.performanceMonitor = null;
  }
}

export default VisualizationManager;
