# Music Visualizer

A dynamic music visualization application that transforms audio into stunning visual experiences.

![Music Visualizer Demo](https://via.placeholder.com/800x450.png?text=Music+Visualizer+Demo)

## Features

- **Audio Input Options**: 
  - Capture system audio from macOS output
  - Analyze audio files (WAV, MP3)
  
- **Immersive Visualizations**:
  - Ethereal cosmic-themed visuals that respond to music
  - Multiple visualization themes including:
    - Cosmic Visualization
    - Night Sky Visualization
    - Concert Visualization
    - Weather Visualization
  
- **Real-time Performance**:
  - Optimized for smooth animations and transitions
  - Performance monitoring for consistent frame rates
  
- **Interactive Controls**:
  - Select visualizations
  - Adjust sensitivity and parameters
  - Toggle between audio sources

## Installation

### Prerequisites

- Node.js (v14.0 or higher)
- npm (v6.0 or higher)

### Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/music-visualizer.git
   cd music-visualizer
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Build the application
   ```
   npm run build
   ```

## Usage

### Starting the Application

```
npm start
```

### Using System Audio (macOS)

The application can capture and visualize system audio output on macOS. See [README-SYSTEM-AUDIO.md](README-SYSTEM-AUDIO.md) for detailed setup instructions.

### Audio File Analysis

1. Click the "Load Audio File" button in the interface
2. Select a supported audio file (WAV, MP3, OGG, FLAC)
3. The visualization will automatically begin once the file is loaded

### Controls

- **Visualization Selector**: Switch between different visual themes
- **Sensitivity**: Adjust how responsive the visuals are to audio changes
- **Detail Level**: Control the complexity of the visualization (affects performance)
- **Color Themes**: Choose from preset color palettes or create custom themes

## Project Structure

```
music-visualizer/
├── src/
│   ├── audio/           # Audio processing and analysis
│   ├── main/            # Electron main process
│   ├── renderer/        # Electron renderer process
│   ├── utils/           # Utility functions
│   ├── visualizations/  # Visualization implementations
│   └── themes/          # Color themes and styles
├── plans/               # Development plans and documentation
└── ...
```

## Architecture

The application follows a modular architecture:

1. **Audio Analysis**: Extracts frequency data, beats, and other audio features
2. **Visualization Engine**: Renders visuals based on audio analysis data
3. **Transition Manager**: Handles smooth transitions between visual states
4. **Performance Monitor**: Ensures optimal performance and frame rates

## Development

### Running in Development Mode

```
npm run dev
```

### Building for Production

```
npm run build
```

### Available Scripts

- `npm start` - Start the application
- `npm run dev` - Run in development mode with hot reloading
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Electron](https://www.electronjs.org/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
