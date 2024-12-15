export interface IElectronAPI {
  addToggleDarkModeListener: (listener: () => void) => void,
  removeToggleDarkModeListener: () => void,
  startMaestro: () => Promise<void>;
  stopMaestro: () => Promise<void>;
  showError: (message) => void,
  }
  
  declare global {
    interface Window {
      electronAPI?: IElectronAPI
    }
  }