/**
 * Galaxy Visualization Shaders
 * Custom shaders used in the Galaxy visualization
 */

import * as THREE from 'three';

// Custom shader for chromatic aberration effect
export const ChromaticAberrationShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'resolution': { value: new THREE.Vector2(1, 1) },
    'power': { value: 0.05 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float power;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 direction = normalize(uv - center);
      float distance = length(uv - center);
      
      vec2 distortion = direction * power * distance;
      
      vec4 r = texture2D(tDiffuse, uv - distortion);
      vec4 g = texture2D(tDiffuse, uv);
      vec4 b = texture2D(tDiffuse, uv + distortion);
      
      gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
    }
  `
};

// Shader utility functions for reuse across visualization components
export const ShaderUtils = {
  // Simplex noise function used in nebula shader
  simplexNoiseFunction: `
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      // First corner
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      // Permutations
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
              
      // Gradients
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }
  `
};

// Material creators
export const createGalaxyParticleMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      baseRotationSpeed: { value: 0.5 },
      pulseStrength: { value: 0 },
      colorShift: { value: 0 }
    },
    vertexShader: `
      attribute vec2 customData;
      attribute float size;
      attribute vec3 color;
      
      uniform float time;
      uniform float baseRotationSpeed;
      uniform float pulseStrength;
      uniform float colorShift;
      
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        // Extract radius and base angle
        float radius = customData.x;
        float baseAngle = customData.y;
        
        // Calculate rotation speed (inner particles rotate faster)
        float rotationSpeed = baseRotationSpeed * (1.0 - pow(radius/25.0, 0.5));
        
        // Calculate new angle with time-based rotation
        float angle = baseAngle + time * rotationSpeed;
        
        // Recalculate position with new angle (maintaining z-height)
        float x = cos(angle) * radius;
        float y = sin(angle) * radius;
        float z = position.z;
        
        // Position with slight pulsation
        float pulseFactor = sin(time * 2.0 + radius * 0.2) * pulseStrength;
        vec3 newPosition = vec3(
          x * (1.0 + pulseFactor * 0.05),
          y * (1.0 + pulseFactor * 0.05),
          z
        );
        
        // Pass to fragment shader
        vColor = color;
        
        // Color shift effect based on position and audio
        if (colorShift > 0.0) {
          float shift = colorShift * sin(radius * 0.2 + time);
          vColor.r = color.r + shift * 0.1;
          vColor.g = color.g + shift * 0.05;
          vColor.b = color.b - shift * 0.1;
        }
        
        // Alpha based on radius (fade out at very edge)
        vAlpha = 1.0 - smoothstep(15.0, 20.0, radius);
        
        // Calculate final position and size
        vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        // Create a circular point with soft edge
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
        
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false
  });
};

export const createStarFieldMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      audioIntensity: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      uniform float time;
      uniform float audioIntensity;
      varying vec3 vColor;
      
      void main() {
        vColor = color;
        // Calculate twinkle effect
        float twinkle = sin(time * 2.0 + position.x * 10.0) * 0.5 + 0.5;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float sizeModifier = size * (1.0 + twinkle * 0.5 + audioIntensity * 0.5);
        gl_PointSize = sizeModifier * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        // Create a circular point
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        float alpha = smoothstep(0.5, 0.2, dist);
        
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false
  });
};

export const createNebulaMaterial = (color, intensity) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: color },
      intensity: { value: intensity }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      uniform float intensity;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      ${ShaderUtils.simplexNoiseFunction}
      
      void main() {
        // Calculate position-based noise
        vec3 noisePos = vPosition * 0.5;
        noisePos.x += time * 0.1;
        noisePos.y += time * 0.08;
        
        float noise1 = snoise(noisePos);
        float noise2 = snoise(noisePos * 2.0 + vec3(100.0));
        
        // Combine noise patterns
        float combinedNoise = noise1 * 0.6 + noise2 * 0.4;
        
        // Soften the edges
        float edgeFade = length(vUv - 0.5) * 2.0;
        edgeFade = smoothstep(0.0, 1.0, 1.0 - edgeFade);
        
        // Create cloud-like density variations
        float alpha = smoothstep(0.0, 0.7, combinedNoise) * edgeFade * intensity;
        
        // More intense in the center
        float centerIntensity = 1.0 - length(vUv - 0.5) * 1.5;
        centerIntensity = max(0.0, centerIntensity);
        
        // Pulsing effect
        float pulse = sin(time * 0.5) * 0.1 + 0.9;
        
        gl_FragColor = vec4(color * (0.4 + centerIntensity), alpha * pulse);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
};

export const createDustMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      deltaTime: { value: 0 },
      audioIntensity: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec4 particleData;
      
      uniform float time;
      uniform float deltaTime;
      uniform float audioIntensity;
      
      varying float vAlpha;
      
      void main() {
        // Extract velocity and variant
        vec3 velocity = vec3(particleData.xyz);
        float variant = particleData.w;
        
        // Update position based on velocity
        vec3 newPosition = position + velocity * 60.0 * deltaTime;
        
        // Add some swirling motion
        float swirl = sin(time * 0.5 + variant * 10.0) * 0.2;
        newPosition.x += swirl * velocity.y;
        newPosition.y -= swirl * velocity.x;
        
        // Add audio reactivity
        newPosition += velocity * audioIntensity * 2.0;
        
        // Alpha based on position - fade in distance
        float dist = length(newPosition);
        vAlpha = 1.0 - smoothstep(15.0, 25.0, dist);
        vAlpha *= 0.4 + audioIntensity * 0.2;
        
        // Calculate final position and size
        vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
        gl_PointSize = size * (100.0 / -mvPosition.z) * (1.0 + audioIntensity * 0.5);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      
      void main() {
        // Soft dust particle
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
        
        gl_FragColor = vec4(0.9, 0.95, 1.0, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
};
