import { contextBridge, ipcRenderer } from 'electron';
import type { NotificationType } from '../types/global';

export const electronAPI = {
  updateDarkMode: (isDark: boolean) => ipcRenderer.send('update-dark-mode', isDark),
  addToggleDarkModeListener: (callback: () => void) => ipcRenderer.on('toggle-dark-mode', callback),
  removeToggleDarkModeListener: () => ipcRenderer.removeAllListeners('toggle-dark-mode'),
  toggleDarkMode: () => ipcRenderer.send('toggle-dark-mode'),
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
  addErrorListener: (callback?: (message: string) => void) => {
    if (callback && typeof callback === 'function') {
      ipcRenderer.on('show-error', (_, message: string) => {
        callback(message);
      });
    } else {
      console.warn("[ElectronAPI] addErrorListener called without a valid callback");
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
  addNotificationListener: (callback?: (message: string, type: NotificationType) => void) => {
    if (callback && typeof callback === 'function') {
      ipcRenderer.on('show-notification', (_, message: string, type: NotificationType) => {
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
  sendNotification: (message: string, type: NotificationType) => {
    ipcRenderer.send('show-notification', message, type);
  },
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', { path, content }),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);