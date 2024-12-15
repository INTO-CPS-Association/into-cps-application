const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addToggleDarkModeListener: (callback) => ipcRenderer.on('toggle-dark-mode', callback),
  removeToggleDarkModeListener: () => ipcRenderer.removeAllListeners('toggle-dark-mode'),
  readJsonFile: (relativePath) => ipcRenderer.invoke('read-json-file', relativePath),
  startMaestro: () => ipcRenderer.invoke('start-maestro'),
  stopMaestro: () => ipcRenderer.invoke('stop-maestro'), 
  showError: (callback) => {
    ipcRenderer.on('show-error', (event, message) => callback(message));
  },
  addCoeErrorListener: (callback) => ipcRenderer.on('coe-error', (event, errorMessage) => callback(event, errorMessage)),
  removeCoeErrorListener: () => ipcRenderer.removeAllListeners('coe-error'),
  startSimulation: () => ipcRenderer.invoke('start-simulation'),
  onSimulationStatus: (callback) => ipcRenderer.on('simulation-status', callback),
  removeSimulationStatusListener: (callback) => ipcRenderer.off('simulation-status', callback), 
  getConfig: () => ipcRenderer.invoke('get-config'),
  getSessionId: () => ipcRenderer.invoke('get-session-id'),
  getSimulationResult: (sessionId) => ipcRenderer.invoke('get-simulation-result', sessionId),
  addCoeResetListener: (callback) => ipcRenderer.on('coe-reset', callback),
  removeCoeResetListener: () => ipcRenderer.removeAllListeners('coe-reset'),
});