const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const SystemAudioCapture = require('./systemAudioCapture');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let systemAudioCapture;

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Allow preload script to access system APIs
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Music Visualizer',
  });

  // Set up environment variables
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  
  // Load the index.html from webpack dev server in development
  // or the local file in production
  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:9000'
    : url.format({
        pathname: path.join(__dirname, '../../dist/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when the dock icon is clicked and no other windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for audio-related operations
ipcMain.handle('get-audio-sources', async () => {
  try {
    // Initialize the system audio capture if not done yet
    if (!systemAudioCapture) {
      systemAudioCapture = new SystemAudioCapture();
    }
    
    // Get system audio devices
    const systemDevices = await systemAudioCapture.getSystemAudioDevices();
    
    // Add microphone option
    const sources = [
      ...systemDevices.map(device => ({
        id: device.id,
        name: `System: ${device.name}`,
        type: 'system'
      })),
      { id: 'microphone', name: 'Microphone', type: 'microphone' }
    ];
    
    return sources;
  } catch (error) {
    console.error('Error getting audio sources:', error);
    // Fallback to basic options
    return [
      { id: 'system', name: 'System Audio', type: 'system' },
      { id: 'microphone', name: 'Microphone', type: 'microphone' }
    ];
  }
});

// Start audio capture from system audio
ipcMain.handle('start-system-audio-capture', async (event, deviceId) => {
  try {
    // Initialize the system audio capture if not done yet
    if (!systemAudioCapture) {
      systemAudioCapture = new SystemAudioCapture();
    }
    
    // Start capturing audio
    const success = systemAudioCapture.startCapture(deviceId);
    
    if (success) {
      // Set up data forwarding to renderer
      systemAudioCapture.on('audioData', (audioData) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('audio-data', audioData);
        }
      });
      
      // Handle errors
      systemAudioCapture.on('error', (error) => {
        console.error('System audio capture error:', error);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('audio-capture-error', { message: error.message });
        }
      });
      
      return { success: true };
    } else {
      return { success: false, error: 'Failed to start audio capture' };
    }
  } catch (error) {
    console.error('Error starting system audio capture:', error);
    return { success: false, error: error.message };
  }
});

// Stop audio capture
ipcMain.handle('stop-system-audio-capture', async () => {
  if (systemAudioCapture) {
    systemAudioCapture.stopCapture();
    return { success: true };
  }
  return { success: false, error: 'No active audio capture' };
});
