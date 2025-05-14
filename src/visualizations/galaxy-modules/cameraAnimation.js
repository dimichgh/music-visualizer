/**
 * Galaxy Visualization Camera Animation
 * Handles camera movement and animation for the galaxy visualization
 */

import * as THREE from 'three';

export class CameraAnimation {
  constructor(config) {
    // Create a clock for time-based animation
    this.clock = new THREE.Clock();
    
    // Set defaults for camera animation
    this.position = new THREE.Vector3(0, 0, 50);   // Increased initial distance from orb
    this.targetPosition = new THREE.Vector3(0, 0, 40); // Increased target distance
    
    // Flight path control
    this.flightRadius = config?.cameraDistance ? (config.cameraDistance * 0.75) : 45;
    this.flightHeight = 12;        // Further increased vertical movement range
    this.speedFactor = config?.cameraSpeed || 0.12;
    this.directionChangeSpeed = 0.01; // Further reduced for more gentle and slower direction changes
    
    // Current movement state
    this.pathAngle = 0;           
    this.verticalOffset = 0;       
    this.lookAtOffset = new THREE.Vector3(0, 0, 0); 
    
    // Audio reactivity
    this.currentSpeed = new THREE.Vector3(0, 0, 0);
    this.maxSpeed = 0.05;         
    this.damping = config?.cameraDamping || 0.98; 
  }

  /**
   * Update camera position based on animation parameters
   * @param {THREE.Camera} camera - The Three.js camera to animate
   * @param {number} deltaTime - Time delta for animation
   * @param {Object} audioData - Audio data for reactive animation
   */
  updateCamera(camera, deltaTime, audioData) {
    const time = this.clock.getElapsedTime();
    
    // Apply audio reactivity if available
    let pulseStrength = 0;
    if (audioData) {
      pulseStrength = audioData.bands?.bass ? (audioData.bands.bass / 255) * 0.5 : 0;
      
      // On beat, add gentle camera impulse with improved damping
      if (audioData.isBeat && audioData.bands?.bass && (audioData.bands.bass / 255) > 0.6) {
        const bassLevel = audioData.bands.bass / 255;
        // Reduced impulse strength with gradual damping
        const cameraImpulse = 0.1 + bassLevel * 0.15; // Reduced by ~50%
        
        // Apply a gentler impulse in various directions for more natural movement
        this.currentSpeed.z -= cameraImpulse * 0.8;
        this.currentSpeed.x += (Math.random() - 0.5) * cameraImpulse * 0.3;
        this.currentSpeed.y += (Math.random() - 0.5) * cameraImpulse * 0.3;
      }
    }
    
    // Update path angle for movement along a complex 3D path
    this.pathAngle += this.directionChangeSpeed * deltaTime * (1 + pulseStrength * 0.3);
    
    // Create a complex flight path through space
    // Use multiple sine waves with different frequencies to create a natural-feeling path
    const xFactor = Math.sin(this.pathAngle * 0.5) * Math.cos(this.pathAngle * 0.23);
    const yFactor = Math.cos(this.pathAngle * 0.3) * Math.sin(this.pathAngle * 0.7);
    const zFactor = Math.sin(this.pathAngle * 0.2) * Math.cos(this.pathAngle * 0.13);
    
    // Calculate new target position that moves through the scene
    const newTargetX = xFactor * this.flightRadius;
    const newTargetY = yFactor * this.flightRadius;
    const newTargetZ = zFactor * this.flightHeight;
    
    // Smoothly update target position
    this.targetPosition.set(newTargetX, newTargetY, newTargetZ);
    
    // Calculate look direction - slightly offset from our movement to create banking effect
    this.lookAtOffset.set(
      Math.sin(this.pathAngle * 0.5 + 0.2) * 5,
      Math.cos(this.pathAngle * 0.7 + 0.3) * 5,
      0
    );
    
    // Add gentle audio reactivity to camera movement
    if (pulseStrength > 0.4) {
      // Add a slight push in the direction we're moving on strong beats
      // with reduced intensity and smoother response
      const pulseIntensity = Math.min(pulseStrength * 0.5, 0.3); // Cap and reduce intensity
      this.currentSpeed.add(
        new THREE.Vector3(
          xFactor * 0.005 * pulseIntensity,
          yFactor * 0.005 * pulseIntensity, 
          zFactor * 0.005 * pulseIntensity
        )
      );
    }
    
    // Apply damping to current speed
    this.currentSpeed.multiplyScalar(this.damping);
    
    // Calculate movement direction 
    const direction = new THREE.Vector3();
    direction.subVectors(this.targetPosition, camera.position);
    direction.multiplyScalar(0.01 * this.speedFactor); // Move gradually toward target
    
    // Add direction to current speed, clamped to max speed
    this.currentSpeed.add(direction);
    if (this.currentSpeed.length() > this.maxSpeed) {
      this.currentSpeed.normalize().multiplyScalar(this.maxSpeed);
    }
    
    // Apply current speed to camera position
    camera.position.add(this.currentSpeed);
    
    // Look at a point that's slightly ahead of our movement direction
    const lookAtPoint = new THREE.Vector3().addVectors(
      new THREE.Vector3(0, 0, 0), // Center of the scene
      this.lookAtOffset    // Offset to create banking/turning effect
    );
    
    camera.lookAt(lookAtPoint);
  }
  
  /**
   * Update configuration parameters for camera animation
   * @param {Object} config - New configuration parameters
   */
  updateConfig(config) {
    if (config.cameraDistance) {
      this.flightRadius = config.cameraDistance * 0.75;
    }
    
    if (config.cameraSpeed) {
      this.speedFactor = config.cameraSpeed;
    }
    
    if (config.cameraDamping) {
      this.damping = config.cameraDamping;
    }
  }
}

export default CameraAnimation;
