# System Audio Capture for Music Visualizer

This document explains how the system audio capture feature works in the Music Visualizer application.

## Overview

The application now supports capturing and visualizing system audio output on macOS through a native module integration. This allows users to visualize audio from any application playing on their system.

## Implementation Details

The system uses a multi-process architecture leveraging Electron's main and renderer processes:

1. **Main Process (src/main/systemAudioCapture.js)**:
   - Uses `node-audiorecorder` to capture system audio through SoX
   - Performs real-time analysis on audio chunks
   - Extracts frequency data and identifies audio features
   - Sends the processed data to the renderer process via IPC

2. **Preload Script (src/main/preload.js)**:
   - Creates a secure bridge between the renderer and main processes
   - Exposes methods for starting and stopping system audio capture
   - Provides channels for audio data communication

3. **Renderer Process (src/audio/AudioAnalyzer.js)**:
   - Handles audio source selection between microphone and system audio
   - Communicates with the main process for system audio data
   - Processes and normalizes audio data for visualization
   - Provides a unified API for different audio sources

## Prerequisites

To use system audio capture on macOS, you need:

1. **SoX (Sound eXchange)**: A command-line utility for audio processing.
   - Install via Homebrew: `brew install sox`

2. **OR BlackHole**: A virtual audio driver that can route system audio.
   - Download from: https://existential.audio/blackhole/
   - Configure in System Preferences > Sound

## How It Works

1. The application detects available system audio devices
2. When the user selects a system audio source and starts playback:
   - The main process starts recording audio through SoX/BlackHole
   - Audio is captured in real-time and processed into frequency data
   - The data is analyzed to extract frequency bands and beat information
   - This information is sent to the renderer process to drive visualizations

3. The processed audio data powers the visualization:
   - Frequency bands drive different visual elements
   - Beat detection triggers special effects
   - Overall audio energy influences animation intensity

## Limitations

- System audio capture requires proper permissions
- Performance may vary based on system specifications
- Some macOS versions may require additional setup for audio routing

## Future Improvements

- Add support for Windows and Linux
- Implement more sophisticated audio analysis algorithms
- Add support for audio device selection UI
- Optimize performance for high-resolution audio processing
