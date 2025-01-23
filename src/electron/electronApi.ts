import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  addToggleDarkModeListener: (callback: () => void) => ipcRenderer.on('toggle-dark-mode', callback),
  removeToggleDarkModeListener: () => ipcRenderer.removeAllListeners('toggle-dark-mode'),
  addErrorListener: (callback?: (message: string) => void) => {
    if (callback && typeof callback === 'function') {
      ipcRenderer.on('show-error', (_, message: string) => {
        callback(message);
      });
    } else {
      console.warn('[ElectronAPI] addErrorListener called without a valid callback');
    }
  },
  removeErrorListener: () => {
    ipcRenderer.removeAllListeners('show-error');
  },
  on: (event: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(event, (_, ...args) => callback(...args));
  },
  off: (event: string, callback: (...args: any[]) => void) => {
    ipcRenderer.off(event, callback);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);