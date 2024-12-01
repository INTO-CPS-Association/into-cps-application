const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addToggleDarkModeListener: (callback) => ipcRenderer.on('toggle-dark-mode', callback),
  removeToggleDarkModeListener: () => ipcRenderer.removeAllListeners('toggle-dark-mode'),
  readJsonFile: (relativePath) => ipcRenderer.invoke('read-json-file', relativePath),
  startCoe: () => ipcRenderer.invoke('start-coe'),
  stopCoe: () => ipcRenderer.invoke('stop-coe'),
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
