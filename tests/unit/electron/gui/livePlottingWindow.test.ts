import type { BrowserWindow as ElectronBrowserWindow } from 'electron';

jest.mock('electron', () => {
  const original = jest.requireActual('electron');
  return {
    ...original,
    nativeTheme: {
      shouldUseDarkColors: false,
      on: jest.fn(),
    },
    app: {
      getAppPath: jest.fn(() => '/mock/app/path'),
      on: jest.fn(),
      once: jest.fn(),
    },
    ipcMain: {
      on: jest.fn(),
      handle: jest.fn(),
    },
    BrowserWindow: jest.fn(),
  };
});

jest.mock('execa', () => ({
  execa: jest.fn().mockResolvedValue({ stdout: '' }),
}));

let BrowserWindow: unknown;

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
}));


type MockBrowserWindow = {
  isDestroyed: jest.Mock<boolean, []>;
  isMinimized: jest.Mock<boolean, []>;
  restore: jest.Mock<void, []>;
  focus: jest.Mock<void, []>;
  once: jest.Mock<void, [string, () => void]>;
  loadURL: jest.Mock<void, [string]>;
  on: jest.Mock<void, [string, () => void]>;
  show: jest.Mock<void, []>;
  webContents?: {
    send: jest.Mock<void, [string, unknown]>;
    on: jest.Mock<void, [string, () => void]>;
    once: jest.Mock<void, [string, () => void]>;
  };
};

describe('openGraphHtmlWindow', () => {
  let mockBrowserWindowInstance: MockBrowserWindow;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockBrowserWindowInstance = {
      isDestroyed: jest.fn(),
      isMinimized: jest.fn(),
      restore: jest.fn(),
      focus: jest.fn(),
      once: jest.fn(),
      loadURL: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      webContents: {
        send: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
      },
      show: jest.fn(),
    };
    // import electron after jest.mock above so we get the mocked module
  const electron = await import('electron');
  BrowserWindow = (electron as unknown as { BrowserWindow?: unknown }).BrowserWindow;
    const BrowserWindowMock = BrowserWindow as unknown as jest.Mock;
    BrowserWindowMock.mockImplementation(() => mockBrowserWindowInstance);
  });

  it('should focus existing window if not destroyed and not minimized', async () => {
    mockBrowserWindowInstance.isDestroyed.mockReturnValue(false);
    mockBrowserWindowInstance.isMinimized.mockReturnValue(false);

  const lp = await import('../../../../src/electron/gui/livePlottingWindow');
  lp.graphWindowManager.graphWindow = mockBrowserWindowInstance as unknown as ElectronBrowserWindow;

  lp.graphWindowManager.openGraphHtmlWindow();

    expect(mockBrowserWindowInstance.focus).toHaveBeenCalled();
    expect(mockBrowserWindowInstance.restore).not.toHaveBeenCalled();
    expect(BrowserWindow).not.toHaveBeenCalled();
  });

  it('should restore and focus existing minimized window', async () => {
    mockBrowserWindowInstance.isDestroyed.mockReturnValue(false);
    mockBrowserWindowInstance.isMinimized.mockReturnValue(true);

  const lp = await import('../../../../src/electron/gui/livePlottingWindow');
  lp.graphWindowManager.graphWindow = mockBrowserWindowInstance as unknown as ElectronBrowserWindow;

  lp.graphWindowManager.openGraphHtmlWindow();

    expect(mockBrowserWindowInstance.restore).toHaveBeenCalled();
    expect(mockBrowserWindowInstance.focus).toHaveBeenCalled();
    expect(BrowserWindow).not.toHaveBeenCalled();
  });

  it('should create a new BrowserWindow if none exists or destroyed', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    jest.doMock('../../../../src/main', () => ({
      GRAPH_START_URL: 'http://localhost:3000/#/live-plotting'
    }));

  const { BrowserWindow: ReBrowserWindow } = (await import('electron')) as unknown as { BrowserWindow: unknown };
  (ReBrowserWindow as unknown as jest.Mock).mockImplementation(() => mockBrowserWindowInstance);

  const { graphWindowManager: gw } = await import('../../../../src/electron/gui/livePlottingWindow');
  gw.graphWindow = null;
  gw.openGraphHtmlWindow();
  
    expect(gw.graphWindow).toBeDefined();
    expect(mockBrowserWindowInstance.loadURL).toHaveBeenCalledWith('http://localhost:3000/#/live-plotting');
    expect(mockBrowserWindowInstance.once).toHaveBeenCalledWith('ready-to-show', expect.any(Function));
    expect(mockBrowserWindowInstance.on).toHaveBeenCalledWith('closed', expect.any(Function));
  });
  
  it('should load file URL in production mode', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    jest.doMock('../../../../src/main', () => ({
      GRAPH_START_URL: `file:///mock/app/path/dist/index.html#/live-plotting`
    }));

  const { BrowserWindow: ReBrowserWindow } = (await import('electron')) as unknown as { BrowserWindow: unknown };
  (ReBrowserWindow as unknown as jest.Mock).mockImplementation(() => mockBrowserWindowInstance);

  const { graphWindowManager: gw } = await import('../../../../src/electron/gui/livePlottingWindow');
  gw.graphWindow = null;
  gw.openGraphHtmlWindow();

    const expectedUrl = `file:///mock/app/path/dist/index.html#/live-plotting`;
    expect(mockBrowserWindowInstance.loadURL).toHaveBeenCalledWith(expectedUrl);
  });

  it('should set graphWindow to null on close event', async () => {
  const lp = await import('../../../../src/electron/gui/livePlottingWindow');
  lp.graphWindowManager.graphWindow = null;

  lp.graphWindowManager.openGraphHtmlWindow();

    const closedHandler = mockBrowserWindowInstance.on.mock.calls.find(
      (call: [string, () => void]) => call[0] === 'closed'
    )?.[1];

    expect(closedHandler).toBeDefined();

    closedHandler?.();

  const mod = await import('../../../../src/electron/gui/livePlottingWindow');
  expect(mod.graphWindowManager.graphWindow).toBeNull();
  });

  it('should show window on ready-to-show', async () => {
  const lp = await import('../../../../src/electron/gui/livePlottingWindow');
  lp.graphWindowManager.graphWindow = null;

  lp.graphWindowManager.openGraphHtmlWindow();

    const readyToShowHandler = mockBrowserWindowInstance.once.mock.calls.find(
      (call: [string, () => void]) => call[0] === 'ready-to-show'
    )?.[1];

    expect(readyToShowHandler).toBeDefined();

    readyToShowHandler?.();

    expect(mockBrowserWindowInstance.show).toHaveBeenCalled();
  });

  it('should send dark-mode-update when window already exists', async () => {
    const mockSend = jest.fn();
    mockBrowserWindowInstance.webContents = {
      send: mockSend,
      on: jest.fn(),
      once: jest.fn(),
    };
    mockBrowserWindowInstance.isDestroyed.mockReturnValue(false);
    mockBrowserWindowInstance.isMinimized.mockReturnValue(false);
  
  const lp = await import('../../../../src/electron/gui/livePlottingWindow');
  lp.graphWindowManager.graphWindow = mockBrowserWindowInstance as unknown as ElectronBrowserWindow;

  jest.useFakeTimers();
  lp.graphWindowManager.openGraphHtmlWindow(true);
  
    expect(mockSend).toHaveBeenCalledWith('dark-mode-update', true);
  
    jest.advanceTimersByTime(100);
    expect(mockSend).toHaveBeenCalledTimes(2);
  
    jest.useRealTimers();
  });

  it('should send dark-mode-update after ready-to-show timeout', async () => {
    const mockSend = jest.fn();
    mockBrowserWindowInstance.webContents = {
      send: mockSend,
      on: jest.fn(),
      once: jest.fn(),
    };
  const lp = await import('../../../../src/electron/gui/livePlottingWindow');
  lp.graphWindowManager.graphWindow = null;

  jest.useFakeTimers();
  lp.graphWindowManager.openGraphHtmlWindow(true);
  
    const readyToShowHandler = mockBrowserWindowInstance.once.mock.calls.find(
      (call) => call[0] === 'ready-to-show'
    )?.[1];
    readyToShowHandler?.();
  
    jest.advanceTimersByTime(300);
    expect(mockSend).toHaveBeenCalledWith('dark-mode-update', true);
  
    jest.useRealTimers();
  });
  
  
});