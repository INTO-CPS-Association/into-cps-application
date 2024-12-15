export interface IElectronAPI {
  addToggleDarkModeListener: (listener: () => void) => void,
  removeToggleDarkModeListener: () => void,
  startMaestro: () => Promise<void>;
  stopMaestro: () => Promise<void>;
  }
  
  declare global {
    interface Window {
      electronAPI?: IElectronAPI
    }
  }