import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  addToggleDarkModeListener: (callback: () => void) => ipcRenderer.on('toggle-dark-mode', callback),
  removeToggleDarkModeListener: () => ipcRenderer.removeAllListeners('toggle-dark-mode'),
  addErrorListener: (callback?: (message: string) => void) => {
    if (callback && typeof callback === 'function') {
      ipcRenderer.on('show-error', (_, message: string) => {
        callback(message);
      });
    }
  },
  removeErrorListener: () => {
    ipcRenderer.removeAllListeners('show-error');
  },
  on: (event: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(event, (_, ...args) => callback(...args));
  },
  off: (event: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.off(event, callback);
  },
  addNotificationListener: (callback?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void) => {
    if (callback && typeof callback === 'function') {
      ipcRenderer.on('show-notification', (_, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        console.log(`[Renderer] Received notification: ${message} (${type})`);
        callback(message, type);
      });
    }
    else {
      console.warn('[Renderer] addNotificationListener called without a valid callback!');
    }
  },
  removeNotificationListener: () => {
    ipcRenderer.removeAllListeners('show-notification');
  },
  sendNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    ipcRenderer.send('show-notification', message, type);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);