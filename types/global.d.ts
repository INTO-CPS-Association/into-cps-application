export interface IElectronAPI {
  addToggleDarkModeListener: (listener: () => void) => void;
  removeToggleDarkModeListener: () => void;
  readJsonFile: (filePath: string) => Promise<any>;
  stopCoe: () => void;
  startCoe: () => void;
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
}

export interface ConfigCoe {
  coeJarPath: string;
  simulationConfigPath: string;
  fmusPath: string;
  multiModels: string;
  outputPath: string;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
    ConfigCoe?: ConfigCoe;
  }
}
