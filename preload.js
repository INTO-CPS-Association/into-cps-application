const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addToggleDarkModeListener: (callback) => {
    ipcRenderer.on('toggle-dark-mode', callback);
  },
  removeToggleDarkModeListener: () => {
    ipcRenderer.removeAllListeners('toggle-dark-mode');
  },
  readJsonFile: (relativePath) => {
    return ipcRenderer.invoke('read-json-file', relativePath)
  },
  startCoe: () => ipcRenderer.invoke('start-coe'),
  stopCoe: () => ipcRenderer.invoke('stop-coe'),
});