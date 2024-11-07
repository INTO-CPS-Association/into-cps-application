const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addToggleDarkModeListener: (callback) => {
    ipcRenderer.on('toggle-dark-mode', callback);
  },
  removeToggleDarkModeListener: () => {
    ipcRenderer.removeAllListeners('toggle-dark-mode');
  }
});