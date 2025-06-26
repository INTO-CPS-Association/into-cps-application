import { createWindow, getMainWindow } from '../../../../src/electron/gui/window';

const mockLoadURL = jest.fn().mockResolvedValue(undefined);
const mockOn = jest.fn();

jest.mock('electron', () => {
  const actual = jest.requireActual('electron');
  return {
    ...actual,
    BrowserWindow: jest.fn().mockImplementation(() => ({
      loadURL: mockLoadURL,
      on: mockOn,
    })),
    app: {
      getAppPath: jest.fn().mockReturnValue('/mock/app/path'),
    },
  };
});

jest.mock('../../../../src/utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

describe('window.ts', () => {
  it('should create a browser window and load URL', async () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();

    const { createWindow } = await import('../../../../src/electron/gui/window');
    createWindow();
    expect(mockLoadURL).toHaveBeenCalledWith('http://localhost:3000');
  });
  
  it('should return the current main window', () => {
    const win = createWindow();
    expect(getMainWindow()).toBe(win);
  });

  it('should log error if loadURL fails', async () => {
    const { logError } = await import('../../../../src/utils/logger');
    mockLoadURL.mockRejectedValueOnce(new Error('Load failed'));
  
    const { createWindow } = await import('../../../../src/electron/gui/window');
    await createWindow();
  
    expect(logError).toHaveBeenCalledWith('Failed to load URL: Error: Load failed');
  });
  
  it('should reset mainWindow to null when closed', async () => {
    let closedCallback: () => void;
  
    mockOn.mockImplementation((event, cb) => {
      if (event === 'closed') closedCallback = cb;
    });
  
    const { createWindow, getMainWindow } = await import('../../../../src/electron/gui/window');
    const win = createWindow();
    expect(getMainWindow()).toBe(win);
  
    closedCallback!();
    expect(getMainWindow()).toBeNull();
  });
    
});
