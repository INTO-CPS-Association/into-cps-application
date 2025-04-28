export interface IElectronAPI {
  dispatchActionToMain: (action: unknown) => void;
  addToggleDarkModeListener: (callback: () => void) => void;
  removeToggleDarkModeListener: () => void;
  addErrorListener: (callback?: (message: string) => void) => void;
  removeErrorListener: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  addNotificationListener: (callback?: (message: string, type: NotificationType) => void) => void;
  removeNotificationListener: () => void;
  sendNotification: (message: string, type: NotificationType) => void;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
}

export interface ICosimulationAPI {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  maestro: (args: { type: string; data?: unknown }) => Promise<{ success: boolean; message?: string; resultPath?: string; error?: string }>;
  onSimulationStatus: (callback: (event: unknown, status: string) => void) => void;
  removeSimulationStatusListener: (callback: (event: unknown, status: string) => void) => void;
  addCoeErrorListener: (callback: (event: unknown, errorMessage: string) => void) => void;
  removeCoeErrorListener: () => void;
  addCoeResetListener: (callback: () => void) => void;
  removeCoeResetListener: () => void;
  getConfig: () => Promise<ConfigMaestro | null>;
  addListener: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  getLatestResultFolder: () => Promise<string | null>;
}


export interface ConfigMaestro {
  cosimulationPath: string;
  defaultPath: string;
  maestroJarPath: string;
  tempMaestroJarPath: string;
  simulationConfigPath: string;
  fmusPath: string;
  multiModels: string;
  logDirectory: string;
  outputPath: string;
  livePlotting: string;
}

export interface SimulationResult {
  success: boolean;
  error?: string;
  status: string;
}

export interface SimulationResult {
  success: boolean;
  error?: string;
  status: string;
}

export interface MaestroResponse {
  success: boolean;
  message?: string;
  resultPath?: string;
  error?: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    cosimulationAPI: ICosimulationAPI;
    ConfigMaestro?: ConfigMaestro;
    MaestroResponse: MaestroResponse;
  }
}

declare namespace NodeJS {
  interface Process {
    type?: 'browser' | 'renderer';
  }
}