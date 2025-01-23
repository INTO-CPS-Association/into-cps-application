export interface IElectronAPI {
  dispatchActionToMain: (action: unknown) => void;
  addToggleDarkModeListener: (callback: () => void) => void;
  removeToggleDarkModeListener: () => void;
  addErrorListener: (callback?: (message: string) => void) => void;
  removeErrorListener: () => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}

export interface ICosimulationAPI {
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  maestro: (type: string, data?: any) => Promise<{ success: boolean; message?: string; resultPath?: string; error?: string }>;
  onSimulationStatus: (callback: (event: unknown, status: string) => void) => void;
  removeSimulationStatusListener: (callback: (event: unknown, status: string) => void) => void;
  addCoeErrorListener: (callback: (event: unknown, errorMessage: string) => void) => void;
  removeCoeErrorListener: () => void;
  addCoeResetListener: (callback: () => void) => void;
  removeCoeResetListener: () => void;
  getConfig: () => Promise<{ maestroJarPath: string; simulationConfigPath: string }>;
  getSessionId: () => Promise<string | null>;
  getSimulationResult: (sessionId: string) => Promise<string>;
  addListener: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}


export interface ConfigMaestro {
  maestroJarPath: string;
  simulationConfigPath: string;
  fmusPath: string;
  multiModels: string;
  outputPath: string;
}

export interface MaestroResponse {
  success: boolean;
  message?: string;
  resultPath?: string;
  error?: string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    cosimulationAPI: ICosimulationAPI;
    ConfigMaestro?: ConfigMaestro;
    MaestroResponse: MaestroResponse;
  }
}