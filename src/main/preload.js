const { contextBridge, ipcRenderer } = require('electron');

/**
 * The preload script runs before the renderer process is loaded,
 * and has access to both node.js APIs and the window object.
 */

// Create a safe bi-directional communication API between the renderer process and the main process
try {
  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld(
    'api', {
      // Audio-related methods
      getAudioSources: () => ipcRenderer.invoke('get-audio-sources'),
      startSystemAudioCapture: (deviceId) => ipcRenderer.invoke('start-system-audio-capture', deviceId),
      stopSystemAudioCapture: () => ipcRenderer.invoke('stop-system-audio-capture'),
      
      // System-related methods
      platform: process.platform,
      
      // Pass IPC events from renderer to main process and vice versa
      send: (channel, data) => {
        // Whitelist channels to prevent security issues
        const validChannels = ['audio-data', 'visualization-settings'];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
      
      receive: (channel, func) => {
        const validChannels = ['audio-data', 'visualization-settings', 'audio-capture-error'];
        if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender` 
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      },
      
      // Remove all listeners for a channel
      removeAllListeners: (channel) => {
        const validChannels = ['audio-data', 'visualization-settings', 'audio-capture-error'];
        if (validChannels.includes(channel)) {
          ipcRenderer.removeAllListeners(channel);
        }
      }
    }
  );
  console.log('Preload script loaded successfully');
} catch (error) {
  console.error('Error in preload script:', error);
}
