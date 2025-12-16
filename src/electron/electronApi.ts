import { contextBridge, ipcRenderer } from 'electron';
import { IS_DEV } from "../utils/constants/appShared";
import type { NotificationType } from '../types/global';

const MAIN_START_URL = IS_DEV ? "http://localhost:3000" : "file://app";
const GRAPH_START_URL = IS_DEV ? "http://localhost:3000/#/live-plotting" : "file://app/#/live-plotting";

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
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
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
  onProjectSelected: (callback: (projectPath: string) => void) =>
    ipcRenderer.on("project-selected", (_, projectPath: unknown) =>
      callback(projectPath as string)
    ),
  onProjectCreated: (callback: (projectPath: string) => void) =>
    ipcRenderer.on("project-created", (_, projectPath: unknown) =>
      callback(projectPath as string)
    ),
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),
}

contextBridge.exposeInMainWorld('electronAPI', {
  ...electronAPI,
  IS_DEV,
  MAIN_START_URL,
  GRAPH_START_URL,
});