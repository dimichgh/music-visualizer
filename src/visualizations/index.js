/**
 * Visualization Registry
 * Central registry for all available visualizations
 */

import VisualizationManager from './VisualizationManager';
import CosmicVisualization from './CosmicVisualization';
import FractalVisualization from './FractalVisualization';
import NightSkyVisualization from './NightSkyVisualization';
import ConcertVisualization from './ConcertVisualization';
import GalaxyVisualization from './GalaxyVisualization';
import BaseVisualization from './BaseVisualization';

// Export visualization classes for direct usage
export { 
  VisualizationManager,
  BaseVisualization,
  CosmicVisualization,
  FractalVisualization,
  NightSkyVisualization,
  ConcertVisualization,
  GalaxyVisualization
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
  
  // Register fractal visualization
  manager.registerVisualization('fractal', FractalVisualization, {
    name: '3D Fractals',
    description: 'A psychedelic 3D fractal visualization with audio-reactive geometry',
    author: 'Music Visualizer',
    tags: ['3d', 'fractal', 'psychedelic']
  });
  
  // Register galaxy visualization 
  manager.registerVisualization('galaxy', GalaxyVisualization, {
    name: 'Galaxy',
    description: 'A flowing and dynamic visualization of galaxies using Three.js',
    author: 'Music Visualizer',
    tags: ['space', 'psychedelic', '3d', 'cosmos']
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
  CosmicVisualization,
  FractalVisualization,
  GalaxyVisualization
};
