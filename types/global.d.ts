export interface IElectronAPI {
  addToggleDarkModeListener: (listener: () => void) => void,
  removeToggleDarkModeListener: () => void,
  }
  
  declare global {
    interface Window {
      electronAPI?: IElectronAPI
    }
  }