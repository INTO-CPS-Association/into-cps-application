import { contextBridge, ipcRenderer } from 'electron';

export interface CosimulationAPI {
  maestro: (args: { type: string; data?: unknown }) => Promise<unknown>;
  onSimulationStatus: (callback: (event: unknown, status: string) => void) => void;
  removeSimulationStatusListener: (callback: (event: unknown, status: string) => void) => void;
  addCoeErrorListener: (callback: (event: unknown, errorMessage: string) => void) => void;
  removeCoeErrorListener: () => void;
  addCoeResetListener: (callback: () => void) => void;
  removeCoeResetListener: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  getConfig: () => Promise<{ maestroJarPath: string; simulationConfigPath: string; cosimulationPath: string } | null>;
  getSessionId: () => Promise<string | null>;
  addMultiModelPathListener: (callback: (path: string) => void) => void;
  removeMultiModelPathListener: (callback: (path: string) => void) => void;
}


export const cosimulationAPI: CosimulationAPI = {
  maestro: (args: { type: string; data?: unknown }) => ipcRenderer.invoke('maestro', args),
  onSimulationStatus: (callback) => ipcRenderer.on('simulation-status', callback),
  removeSimulationStatusListener: (callback) => ipcRenderer.off('simulation-status', callback),
  addCoeErrorListener: (callback) => ipcRenderer.on('coe-error', (event, errorMessage) => callback(event, errorMessage)),
  removeCoeErrorListener: () => ipcRenderer.removeAllListeners('coe-error'),
  addCoeResetListener: (callback: () => void) => ipcRenderer.on('coe-reset', callback),
  removeCoeResetListener: () => ipcRenderer.removeAllListeners('coe-reset'),
  on: (event, callback) => ipcRenderer.on(event, (_, ...args) => callback(...args)),
  off: (event, callback) => ipcRenderer.off(event, callback),
  getSessionId: () => ipcRenderer.invoke('get-session-id'),
  getConfig: async () => ipcRenderer.invoke('get-config'),
  addMultiModelPathListener: (callback) => ipcRenderer.on('multi-model-path', (_, path) => callback(path)),
  removeMultiModelPathListener: (callback) => ipcRenderer.off('multi-model-path', (_, path) => callback(path)),
};

contextBridge.exposeInMainWorld('cosimulationAPI', cosimulationAPI);
