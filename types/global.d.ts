export interface IElectronAPI {
  addToggleDarkModeListener: (listener: () => void) => void;
  removeToggleDarkModeListener: () => void;
  readJsonFile: (filePath: string) => Promise<any>;
  stopCoe: () => void;
  startCoe: () => void;
  startSimulation: () => void;
  onSimulationStatus: (callback: (event: any, status: string) => void) => void;
  removeSimulationStatusListener: (callback: (event: any, status: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
