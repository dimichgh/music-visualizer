/**
 * Galaxy Visualization Renderer
 * Handles Three.js renderer initialization and post-processing effects
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { ChromaticAberrationShader } from './shaders';

/**
 * Initialize the renderer for the galaxy visualization
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {THREE.WebGLRenderer} The initialized renderer
 */
export function initRenderer(dimensions) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  
  renderer.setSize(dimensions.width, dimensions.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  return renderer;
}

/**
 * Initialize camera for the galaxy visualization
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {THREE.PerspectiveCamera} The initialized camera
 */
export function initCamera(dimensions) {
  const aspectRatio = dimensions.width / dimensions.height;
  const camera = new THREE.PerspectiveCamera(55, aspectRatio, 0.1, 1000);
  camera.position.z = 60; // Significantly increased distance for more zoomed out view
  
  return camera;
}

/**
 * Set up post-processing effects
 * @param {THREE.WebGLRenderer} renderer - The THREE.js renderer
 * @param {THREE.Scene} scene - The THREE.js scene
 * @param {THREE.Camera} camera - The THREE.js camera
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @param {Object} config - Post-processing configuration
 * @returns {Object} Object containing composer and effect references
 */
export function setupPostProcessing(renderer, scene, camera, dimensions, config) {
  // Create composer
  const composer = new EffectComposer(renderer);
  
  // Add base render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  // Add bloom pass for glow effects
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(dimensions.width, dimensions.height),
    config?.bloomStrength || 0.5,  // strength
    0.7,  // radius - increased for even softer glow
    config?.bloomThreshold || 0.85  // threshold
  );
  composer.addPass(bloomPass);
  
  // Add chromatic aberration
  const chromaticAberration = new ShaderPass(ChromaticAberrationShader);
  chromaticAberration.uniforms.resolution.value.set(dimensions.width, dimensions.height);
  composer.addPass(chromaticAberration);
  
  return {
    composer,
    bloomPass,
    chromaticPass: chromaticAberration
  };
}

/**
 * Update renderer and post-processing dimensions
 * @param {THREE.WebGLRenderer} renderer - The THREE.js renderer
 * @param {THREE.Camera} camera - The THREE.js camera
 * @param {EffectComposer} composer - The post-processing composer
 * @param {Object} dimensions - New dimensions {width, height}
 */
export function updateDimensions(renderer, camera, composer, dimensions) {
  renderer.setSize(dimensions.width, dimensions.height);
  camera.aspect = dimensions.width / dimensions.height;
  camera.updateProjectionMatrix();
  
  if (composer) {
    composer.setSize(dimensions.width, dimensions.height);
  }
}

/**
 * Dispose of renderer resources
 * @param {THREE.WebGLRenderer} renderer - The renderer to dispose
 * @param {THREE.Scene} scene - The scene containing objects to dispose
 */
export function disposeRenderer(renderer, scene) {
  if (renderer) {
    renderer.dispose();
  }
  
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          for (const material of object.material) {
            disposeMaterial(material);
          }
        } else {
          disposeMaterial(object.material);
        }
      }
    });
  }
}

/**
 * Helper function to dispose material resources
 * @param {THREE.Material} material - The material to dispose
 */
function disposeMaterial(material) {
  material.dispose();
  
  // Dispose textures
  for (const key in material) {
    const value = material[key];
    if (value && typeof value === 'object' && 'minFilter' in value) {
      value.dispose();
    }
  }
}
