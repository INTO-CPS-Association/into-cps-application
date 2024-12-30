import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  dispatchActionToMain: (action: unknown) => {
    ipcRenderer.send('dispatch-action', action);
  },
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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);