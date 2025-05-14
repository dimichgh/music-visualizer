/**
 * Visualization Bridge
 * This module bridges the new visualization system with the existing renderer components
 * It maintains backward compatibility while providing access to the enhanced features
 */

import { 
  VisualizationManager, 
  BaseVisualization, 
  CosmicVisualization,
  FractalVisualization,
  NightSkyVisualization,
  ConcertVisualization,
  GalaxyVisualization
} from '../visualizations';

// Singleton instance of the visualization manager
let visualizationManager = null;

/**
 * Get or create a visualization manager instance
 * @param {HTMLElement} container - Container element for visualizations
 * @param {Object} options - Configuration options
 * @returns {VisualizationManager} Visualization manager instance
 */
export function getVisualizationManager(container, options = {}) {
  if (!visualizationManager) {
    visualizationManager = new VisualizationManager(options);
    visualizationManager.initialize(container, options);
  }
  return visualizationManager;
}

/**
 * Creates a cosmic-themed visualization (compatible with existing code)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createCosmicVisualization = (ctx, dimensions) => {
  const visualization = new CosmicVisualization();
  
  visualization.setup(ctx, dimensions);
  
  // Return compatible render interface
  return {
    render: (audioData) => {
      visualization.render(ctx, dimensions, audioData);
    }
  };
};

/**
 * Creates a 3D fractal visualization (compatible with existing code)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createFractalVisualization = (ctx, dimensions) => {
  const visualization = new FractalVisualization();
  
  visualization.setup(ctx, dimensions);
  
  // Return compatible render interface
  return {
    render: (audioData) => {
      visualization.render(ctx, dimensions, audioData);
    }
  };
};

/**
 * Creates a night sky-themed visualization (compatible with existing code)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createNightSkyVisualization = (ctx, dimensions) => {
  const visualization = new NightSkyVisualization();
  
  visualization.setup(ctx, dimensions);
  
  // Return compatible render interface
  return {
    render: (audioData) => {
      visualization.render(ctx, dimensions, audioData);
    }
  };
};

/**
 * Creates a concert-themed visualization (compatible with existing code)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createConcertVisualization = (ctx, dimensions) => {
  const visualization = new ConcertVisualization();
  
  visualization.setup(ctx, dimensions);
  
  // Return compatible render interface
  return {
    render: (audioData) => {
      visualization.render(ctx, dimensions, audioData);
    }
  };
};

/**
 * Store reference to current galaxy visualization instance
 */
let currentGalaxyVisualization = null;

// Debug logging
console.log('visualizationBridge.js loaded, currentGalaxyVisualization is', currentGalaxyVisualization);

/**
 * Update the active Galaxy visualization with new configuration values
 * @param {string} parameter - Parameter name to update
 * @param {any} value - New value for the parameter
 */
export const updateGalaxyConfig = (parameter, value) => {
  console.log(`Updating Galaxy config: ${parameter} = ${value}`);
  
  if (currentGalaxyVisualization && typeof currentGalaxyVisualization.updateConfig === 'function') {
    console.log('Galaxy visualization found, calling updateConfig');
    currentGalaxyVisualization.updateConfig(parameter, value);
    
    // Verify if the value was applied correctly by reading back the config
    const currentConfig = currentGalaxyVisualization.getConfig();
    console.log(`After update, ${parameter} = ${currentConfig[parameter]}`);
  } else {
    console.warn('No active Galaxy visualization found to update configuration');
    console.log('currentGalaxyVisualization:', currentGalaxyVisualization);
  }
};

/**
 * Creates a galaxy visualization using Three.js (compatible with existing code)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createGalaxyVisualization = (ctx, dimensions) => {
  console.log('Creating new Galaxy visualization');
  const visualization = new GalaxyVisualization();
  
  // Log initial config to verify it's being initialized correctly
  console.log('Initial Galaxy config:', visualization.getConfig());
  
  visualization.setup(ctx, dimensions);
  
  // Store reference to the galaxy visualization for config updates
  currentGalaxyVisualization = visualization;
  console.log('Stored Galaxy visualization reference:', !!currentGalaxyVisualization);
  
  // Create a wrapper that exposes both the render method and updateConfig
  const visualizationWrapper = {
    render: (audioData) => {
      visualization.render(ctx, dimensions, audioData);
    },
    // Add direct access to the updateConfig method
    updateConfig: (parameter, value) => {
      console.log(`Direct updateConfig called: ${parameter} = ${value}`);
      visualization.updateConfig(parameter, value);
    }
  };
  
  return visualizationWrapper;
};

// Make methods available globally for UI controls
if (typeof window !== 'undefined') {
  // Create or extend the existing window.visualizationBridge object
  window.visualizationBridge = window.visualizationBridge || {};
  
  // Add the updateGalaxyConfig method
  window.visualizationBridge.updateGalaxyConfig = updateGalaxyConfig;
  
  // Add a direct method to access the current visualization
  window.visualizationBridge.getCurrentGalaxy = () => currentGalaxyVisualization;
  
  // Add a debug method to check if the bridge is working
  window.visualizationBridge.debug = () => {
    console.log('Visualization Bridge Debug:');
    console.log('- Galaxy visualization exists:', !!currentGalaxyVisualization);
    if (currentGalaxyVisualization) {
      console.log('- Current config:', currentGalaxyVisualization.getConfig());
    }
    return 'Bridge is active';
  };
  
  // Log that we've set up the global bridge
  console.log('Visualization Bridge initialized on window:', Object.keys(window.visualizationBridge));
}

/**
 * Default export - all visualization creators
 */
export default {
  createCosmicVisualization,
  createFractalVisualization,
  createNightSkyVisualization,
  createConcertVisualization,
  createGalaxyVisualization,
  updateGalaxyConfig,
  getVisualizationManager
};
