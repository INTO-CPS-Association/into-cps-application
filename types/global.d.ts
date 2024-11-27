export interface IElectronAPI {
  addToggleDarkModeListener: (listener: () => void) => void,
  removeToggleDarkModeListener: () => void,
  readJsonFile: (filePath:string) => void,
  stopCoe: () => void,
  startCoe: () => void,
  }
  
  declare global {
    interface Window {
      electronAPI?: IElectronAPI
    }
  }