/**
 * Fractal Visualization Renderer
 * Handles Three.js renderer initialization, camera setup, and scene creation
 */

import * as THREE from 'three';

/**
 * Initialize Three.js renderer
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {THREE.WebGLRenderer} The initialized WebGL renderer
 */
export function initRenderer(dimensions) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(dimensions.width, dimensions.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  return renderer;
}

/**
 * Initialize camera for the fractal visualization
 * @param {Object} dimensions - Canvas dimensions {width, height}
 * @returns {THREE.PerspectiveCamera} The initialized camera
 */
export function initCamera(dimensions) {
  const camera = new THREE.PerspectiveCamera(
    70, // Field of view
    dimensions.width / dimensions.height, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  camera.position.z = 5;
  
  return camera;
}

/**
 * Initialize Three.js scene
 * @returns {THREE.Scene} The initialized scene
 */
export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  return scene;
}

/**
 * Update dimensions for renderer and camera
 * @param {THREE.WebGLRenderer} renderer - The Three.js renderer
 * @param {THREE.PerspectiveCamera} camera - The Three.js camera
 * @param {Object} dimensions - New dimensions {width, height}
 */
export function updateDimensions(renderer, camera, dimensions) {
  renderer.setSize(dimensions.width, dimensions.height);
  camera.aspect = dimensions.width / dimensions.height;
  camera.updateProjectionMatrix();
}

/**
 * Create shared geometries for use in the visualization
 * @returns {Object} Object containing shared geometries
 */
export function createSharedGeometries() {
  return {
    sphereGeometry: new THREE.SphereGeometry(1, 32, 32),
    orbGeometry: new THREE.SphereGeometry(1, 16, 16),
    innerSphereGeometry: new THREE.SphereGeometry(1, 16, 16)
  };
}

/**
 * Create materials with glass-like properties
 * @param {THREE.WebGLCubeRenderTarget} envMap - Environment cube map for reflections
 * @returns {Object} Object containing materials
 */
export function createMaterials(envMap) {
  const materials = {
    regular: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.95, // High transmission for glass effect
      thickness: 0.5,     // Glass thickness
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.7,
      clearcoat: 1.0,     // Add clearcoat for reflective shine
      clearcoatRoughness: 0.1
    }),
    
    highlight: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      emissive: new THREE.Color(0x88ccff),
      emissiveIntensity: 0.1,
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.97,
      thickness: 0.2,
      envMapIntensity: 2.0,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0
    }),
    
    secondary: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xeeffff),
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.9,
      thickness: 0.7,
      envMapIntensity: 1.2,
      transparent: true,
      opacity: 0.75,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05
    }),

    // Inner glow material for particles inside glass spheres
    innerGlow: new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x77aaff),
      transparent: true,
      opacity: 0.7
    })
  };
  
  // Apply environment map to all materials
  if (envMap) {
    for (const material of Object.values(materials)) {
      material.envMap = envMap;
    }
  }
  
  return materials;
}

/**
 * Create environment cube map for reflections
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} Object containing cube camera and render target
 */
export function createEnvironmentMap(scene) {
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
  cubeRenderTarget.texture.type = THREE.HalfFloatType;
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  scene.add(cubeCamera);
  
  return {
    cubeCamera,
    cubeRenderTarget
  };
}

/**
 * Update environment map for reflections
 * @param {THREE.WebGLRenderer} renderer - The Three.js renderer
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Group} particleGroup - Group containing particles to hide during update
 * @param {THREE.CubeCamera} cubeCamera - The cube camera for environment mapping
 */
export function updateEnvironmentMap(renderer, scene, particleGroup, cubeCamera) {
  if (particleGroup && cubeCamera) {
    // Hide the particle group temporarily to capture environment
    particleGroup.visible = false;
    cubeCamera.update(renderer, scene);
    particleGroup.visible = true;
  }
}

/**
 * Dispose of renderer and associated resources
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
          object.material.forEach(material => disposeMaterial(material));
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
  if (!material) return;
  
  material.dispose();
  
  // Dispose textures
  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && typeof value === 'object' && value.isTexture) {
      value.dispose();
    }
  }
}
