import { contextBridge, ipcRenderer } from 'electron';

export interface CosimulationAPI {
  maestro: (type: string, data?: any) => Promise<any>;
  onSimulationStatus: (callback: (event: unknown, status: string) => void) => void;
  removeSimulationStatusListener: (callback: (event: unknown, status: string) => void) => void;
  addCoeErrorListener: (callback: (event: unknown, errorMessage: string) => void) => void;
  removeCoeErrorListener: () => void;
  addCoeResetListener: (callback: () => void) => void;
  removeCoeResetListener: () => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}


export const cosimulationAPI: CosimulationAPI = {
  maestro: (type: string, data?: any) => ipcRenderer.invoke('maestro', { type, data }),
  onSimulationStatus: (callback) => ipcRenderer.on('simulation-status', callback),
  removeSimulationStatusListener: (callback) => ipcRenderer.off('simulation-status', callback),
  addCoeErrorListener: (callback) => ipcRenderer.on('coe-error', (event, errorMessage) => callback(event, errorMessage)),
  removeCoeErrorListener: () => ipcRenderer.removeAllListeners('coe-error'),
  addCoeResetListener: (callback: () => void) => ipcRenderer.on('coe-reset', callback),
  removeCoeResetListener: () => ipcRenderer.removeAllListeners('coe-reset'),
  on: (event, callback) => ipcRenderer.on(event, (_, ...args) => callback(...args)),
  off: (event, callback) => ipcRenderer.off(event, callback),
};

contextBridge.exposeInMainWorld('cosimulationAPI', cosimulationAPI);
