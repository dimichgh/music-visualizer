/**
 * Visualization Registry
 * Central registry for all available visualizations
 */

import VisualizationManager from './VisualizationManager';
import CosmicVisualization from './CosmicVisualization';
import WeatherVisualization from './WeatherVisualization';
import NightSkyVisualization from './NightSkyVisualization';
import ConcertVisualization from './ConcertVisualization';
import BaseVisualization from './BaseVisualization';

// Export visualization classes for direct usage
export { 
  VisualizationManager,
  BaseVisualization,
  CosmicVisualization,
  WeatherVisualization,
  NightSkyVisualization,
  ConcertVisualization
};

/**
 * Creates and configures a visualization manager with all available visualizations
 * @param {HTMLElement} container - Container element for visualizations
 * @param {Object} options - Configuration options
 * @returns {VisualizationManager} Configured visualization manager
 */
export function createVisualizationManager(container, options = {}) {
  // Create visualization manager
  const manager = new VisualizationManager(options);
  
  // Register all available visualizations
  registerVisualizations(manager);
  
  // Initialize manager with container
  manager.initialize(container, options);
  
  return manager;
}

/**
 * Registers all available visualizations with the manager
 * @param {VisualizationManager} manager - Visualization manager instance
 */
function registerVisualizations(manager) {
  // Register cosmic visualization
  manager.registerVisualization('cosmic', CosmicVisualization, {
    name: 'Cosmic',
    description: 'A cosmic-themed visualization with galaxies, nebulae, and stars',
    author: 'Music Visualizer',
    tags: ['space', 'psychedelic', 'particles']
  });
  
  // Register weather visualization
  manager.registerVisualization('weather', WeatherVisualization, {
    name: 'Weather Storm',
    description: 'A weather-themed visualization with clouds, rain, and lightning',
    author: 'Music Visualizer',
    tags: ['weather', 'atmospheric', 'particles']
  });
  
  // Register night sky visualization
  manager.registerVisualization('nightsky', NightSkyVisualization, {
    name: 'Night Sky',
    description: 'A serene night sky with stars, moon, and northern lights',
    author: 'Music Visualizer',
    tags: ['night', 'calm', 'stars']
  });
  
  // Register concert visualization
  manager.registerVisualization('concert', ConcertVisualization, {
    name: 'Concert',
    description: 'A concert-themed visualization with stage lights and crowd',
    author: 'Music Visualizer',
    tags: ['concert', 'lights', 'crowd']
  });
}

/**
 * Default export for backward compatibility
 */
export default {
  createVisualizationManager,
  VisualizationManager,
  BaseVisualization,
  CosmicVisualization
};
