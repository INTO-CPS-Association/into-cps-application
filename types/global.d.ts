export interface IElectronAPI {
  addToggleDarkModeListener: (listener: () => void) => void;
  removeToggleDarkModeListener: () => void;
  readJsonFile: (filePath: string) => Promise<any>;
  startSimulation: () => void;
  addCoeErrorListener: (callback: (event: any, error: string) => void) => void;
  removeCoeErrorListener: () => void;
  onSimulationStatus: (callback: (event: any, status: string) => void) => void;
  removeSimulationStatusListener: (callback: (event: any, status: string) => void) => void;
  getConfig: () => { coeJarPath: string; simulationConfigPath: string };
  getSessionId: () => string | null;
  getSimulationResult: (sessionId: string) => Promise<string>;
  addCoeResetListener: (callback: () => void) => void;
  removeCoeResetListener: () => void;
  startMaestro: () => Promise<void>;
  stopMaestro: () => Promise<void>;
  showError: (message) => void,
}

export interface ConfigMaestro {
  coeJarPath: string;
  simulationConfigPath: string;
  fmusPath: string;
  multiModels: string;
  outputPath: string;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
    ConfigMaestro?: ConfigMaestro;
  }
}
