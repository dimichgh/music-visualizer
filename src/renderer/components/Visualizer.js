import React, { useRef, useEffect, useState } from 'react';
import '../styles/Visualizer.css';
import { createCosmicVisualization, createWeatherVisualization, createNightSkyVisualization, createConcertVisualization } from '../visualizationBridge';

const Visualizer = ({ audioData, theme, isPlaying }) => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef(null);
  const visualizationRef = useRef(null);

  // Set up canvas dimensions and resize handler
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Initialize visualization based on selected theme
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    
    switch (theme) {
      case 'cosmic':
        visualizationRef.current = createCosmicVisualization(ctx, dimensions);
        break;
      case 'weather':
        visualizationRef.current = createWeatherVisualization(ctx, dimensions);
        break;
      case 'nightsky':
        visualizationRef.current = createNightSkyVisualization(ctx, dimensions);
        break;
      case 'concert':
        visualizationRef.current = createConcertVisualization(ctx, dimensions);
        break;
      default:
        visualizationRef.current = createCosmicVisualization(ctx, dimensions);
    }

    // Initial render
    if (visualizationRef.current) {
      visualizationRef.current.render(null);
    }
  }, [theme, dimensions]);

  // Animation loop for rendering visualizations
  useEffect(() => {
    if (!canvasRef.current || !visualizationRef.current) return;

    // Only render when playing AND we have valid audio data
    // Define a more comprehensive detection for real audio data
    const hasRealAudioData = audioData && (
      // Check frequency data for any non-zero values
      (audioData.frequencyData && audioData.frequencyData.some(value => value > 0)) ||
      // Check energy levels directly if available
      (audioData.energy && audioData.energy > 0) ||
      // Check if any frequency band has non-zero values
      (audioData.bands && Object.values(audioData.bands).some(value => value > 0))
    );

    console.log("Audio data check:", {
      hasAudioData: !!audioData,
      isPlaying,
      hasRealAudioData,
      energy: audioData?.energy || 0,
      frequencyDataPresent: audioData?.frequencyData ? 'Yes' : 'No',
      anyNonZeroFreq: audioData?.frequencyData?.some(v => v > 0) || false,
      bands: audioData?.bands || 'None'
    });

    if (isPlaying && hasRealAudioData) {
      // Start animation loop for real audio data
      const renderFrame = () => {
        if (visualizationRef.current) {
          visualizationRef.current.render(audioData);
        }
        animationRef.current = requestAnimationFrame(renderFrame);
      };
      renderFrame();
    } else {
      // Create a completely static visualization
      if (visualizationRef.current) {
        // Create silent data - all zeros
        const silentData = {
          frequencyData: new Array(64).fill(0),
          bands: {
            bass: 0,
            midLow: 0,
            mid: 0,
            highMid: 0,
            high: 0
          },
          isBeat: false,
          timestamp: Date.now()
        };
        
        // Render once with silent data - this will be static
        visualizationRef.current.render(silentData);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [audioData, isPlaying]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="visualizer-canvas" />
      {!isPlaying && (
        <div className="visualizer-overlay">
          <div className="play-message">
            <i className="fa fa-play-circle"></i>
            <p>Press Start to Begin Visualization</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualizer;
