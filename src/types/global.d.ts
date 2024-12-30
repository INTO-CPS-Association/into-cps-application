export interface IElectronAPI {
  dispatchActionToMain: (action: unknown) => void;
  addToggleDarkModeListener: (callback: () => void) => void;
  removeToggleDarkModeListener: () => void;
  addErrorListener: (callback?: (message: string) => void) => void;
  removeErrorListener: () => void;
}

export interface ICosimulationAPI {
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

export interface ConfigMaestro {
  maestroJarPath: string;
  simulationConfigPath: string;
  fmusPath: string;
  multiModels: string;
  outputPath: string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    cosimulationAPI: ICosimulationAPI;
    ConfigMaestro?: ConfigMaestro;
    store: Store<RootState>;
  }
}