const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addToggleDarkModeListener: (callback) => {
    ipcRenderer.on('toggle-dark-mode', callback);
  },
  removeToggleDarkModeListener: () => {
    ipcRenderer.removeAllListeners('toggle-dark-mode');
  },
  showError: (callback) => {
    ipcRenderer.on('show-error', (event, message) => callback(message));
  },
  startMaestro: () => ipcRenderer.invoke('start-maestro'),
  stopMaestro: () => ipcRenderer.invoke('stop-maestro'), 
});