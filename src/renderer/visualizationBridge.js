/**
 * Visualization Bridge
 * This module bridges the new visualization system with the existing renderer components
 * It maintains backward compatibility while providing access to the enhanced features
 */

import { 
  VisualizationManager, 
  BaseVisualization, 
  CosmicVisualization,
  WeatherVisualization,
  NightSkyVisualization,
  ConcertVisualization
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
 * Creates a weather-themed visualization (compatible with existing code)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {Object} Visualization object with render method
 */
export const createWeatherVisualization = (ctx, dimensions) => {
  const visualization = new WeatherVisualization();
  
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
 * Default export - all visualization creators
 */
export default {
  createCosmicVisualization,
  createWeatherVisualization,
  createNightSkyVisualization,
  createConcertVisualization,
  getVisualizationManager
};
