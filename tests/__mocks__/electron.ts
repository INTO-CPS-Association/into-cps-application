 export const remote = {
    app: {
        on: jest.fn(),
        quit: jest.fn(),
      },
      BrowserWindow: jest.fn(),
      ipcMain: {
        on: jest.fn(),
        handle: jest.fn(),
      },    
};