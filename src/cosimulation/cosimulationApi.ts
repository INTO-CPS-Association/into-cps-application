import { contextBridge, ipcRenderer } from 'electron';

export interface CosimulationAPI {
  startMaestro: () => Promise<void>;
  stopMaestro: () => Promise<void>;
  startSimulation: () => Promise<void>;
  onSimulationStatus: (callback: (event: unknown, status: string) => void) => void;
  removeSimulationStatusListener: (callback: (event: unknown, status: string) => void) => void;
  addCoeErrorListener: (callback: (event: unknown, errorMessage: string) => void) => void;
  removeCoeErrorListener: () => void;
  getConfig: () => Promise<{ maestroJarPath: string; simulationConfigPath: string }>;
  getSessionId: () => Promise<string | null>;
  getSimulationResult: (sessionId: string) => Promise<string>;
  addCoeResetListener: (callback: () => void) => void;
  removeCoeResetListener: () => void;
}

export const cosimulationAPI: CosimulationAPI = {
  startMaestro: () => ipcRenderer.invoke('start-maestro'),
  stopMaestro: () => ipcRenderer.invoke('stop-maestro'),
  startSimulation: () => ipcRenderer.invoke('start-simulation'),
  onSimulationStatus: (callback) => ipcRenderer.on('simulation-status', callback),
  removeSimulationStatusListener: (callback) => ipcRenderer.off('simulation-status', callback),
  addCoeErrorListener: (callback) => ipcRenderer.on('coe-error', (event, errorMessage) => callback(event, errorMessage)),
  removeCoeErrorListener: () => ipcRenderer.removeAllListeners('coe-error'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  getSessionId: () => ipcRenderer.invoke('get-session-id'),
  getSimulationResult: (sessionId) => ipcRenderer.invoke('get-simulation-result', sessionId),
  addCoeResetListener: (callback) => ipcRenderer.on('coe-reset', callback),
  removeCoeResetListener: () => ipcRenderer.removeAllListeners('coe-reset'),
};

contextBridge.exposeInMainWorld('cosimulationAPI', cosimulationAPI);
